#!/usr/bin/env node
/* ==========================================================================
   Lisan · check-content.mjs — validates all lesson content
   --------------------------------------------------------------------------
     node tools/check-content.mjs
   Checks that every path unit exists, every role-play has its fields, every
   model answer passes the offline coach without a "correction" (no false
   positives) and counts as on-topic, and that topics are well formed.
   Exit code 1 on any error.
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sandbox = { window: {}, console };
vm.createContext(sandbox);
const files = ['js/coach.js', 'js/scenarios.js', ...fs.readdirSync(path.join(ROOT, 'js')).filter((f) => /^content-.*\.js$/.test(f)).sort().map((f) => 'js/' + f)];
for (const f of files) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sandbox, { filename: f });
const C = sandbox.window.LisanCoach;
const { SCENARIOS, PATHS, TOPICS, TOPIC_CATS } = sandbox.window.LisanContent;

const errors = [], warnings = [];
const err = (m) => errors.push(m), warn = (m) => warnings.push(m);
const pair = (o) => o && typeof o.en === 'string' && o.en.trim() && typeof o.ar === 'string' && o.ar.trim();
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const byId = new Map();
for (const s of SCENARIOS) {
  if (byId.has(s.id)) err(`duplicate scenario id ${s.id}`);
  byId.set(s.id, s);
}
const inPaths = new Map();
for (const p of PATHS) {
  if (!pair(p.goal)) err(`path ${p.id}: goal missing`);
  let prev = 0;
  p.units.forEach((u, i) => {
    const s = byId.get(u);
    if (!s) return err(`path ${p.id}: unit "${u}" does not exist`);
    if (inPaths.has(u)) err(`unit ${u} is in two paths`);
    inPaths.set(u, p.id);
    if (s.category !== p.id) err(`unit ${u}: category "${s.category}" but listed in path "${p.id}"`);
    const lv = LEVELS.indexOf(s.level);
    if (lv < prev) warn(`path ${p.id}: unit ${i + 1} (${u}, ${s.level}) is easier than the unit before it`);
    prev = Math.max(prev, lv);
  });
}
let turns = 0, answers = 0;
for (const s of SCENARIOS) {
  const at = `scenario ${s.id}`;
  if (!inPaths.has(s.id)) err(`${at}: not in any path`);
  if (!LEVELS.includes(s.level)) err(`${at}: bad level ${s.level}`);
  for (const k of ['title', 'titleAr', 'place', 'icon', 'tint']) if (!s[k]) err(`${at}: missing ${k}`);
  if (!s.persona || !s.persona.name || !s.persona.role || !s.persona.roleAr || !['male', 'female'].includes(s.persona.gender)) err(`${at}: persona incomplete`);
  for (const k of ['goal', 'mission', 'tip', 'outro']) if (!pair(s[k])) err(`${at}: ${k} missing en/ar`);
  if (!Array.isArray(s.vocab) || s.vocab.length < 4 || !s.vocab.every(pair)) err(`${at}: needs 4+ vocab items with en/ar`);
  if (!Array.isArray(s.turns) || s.turns.length < 3) err(`${at}: needs 3+ turns`);
  (s.turns || []).forEach((t, i) => {
    turns++;
    const tat = `${at} turn ${i + 1}`;
    if (!pair(t.ai)) err(`${tat}: ai missing en/ar`);
    if (!t.hint || !t.hint.ar) err(`${tat}: hint.ar missing`);
    if (!pair(t.model)) err(`${tat}: model missing en/ar`);
    if (!t.keys && !t.minWords) warn(`${tat}: no keys or minWords (accepts any 2+ words)`);
    for (const k of ['model', 'also']) {
      if (!t[k]) continue;
      answers++;
      const a = C.analyze(t[k].en, { tense: t.tense, register: s.register });
      if (!a.ok) err(`${tat} ${k}: coach would "correct" a model answer: "${t[k].en}" → "${a.corrected}" [${a.issues.map((r) => r.id)}]`);
      if (!C.relevant(t[k].en, t)) err(`${tat} ${k}: model answer is not recognised as on-topic: "${t[k].en}"`);
      if (a.better) warn(`${tat} ${k}: style suggestion on a model answer: "${a.better.text}"`);
    }
  });
}
const catIds = new Set(TOPIC_CATS.map((c) => c.id));
const topicIds = new Set();
for (const t of TOPICS) {
  if (topicIds.has(t.id)) err(`duplicate topic ${t.id}`);
  topicIds.add(t.id);
  if (!catIds.has(t.cat)) err(`topic ${t.id}: unknown category ${t.cat}`);
  if (!t.en || !t.ar || !t.icon || !t.angle) err(`topic ${t.id}: incomplete`);
  if (t.level && !LEVELS.includes(t.level)) err(`topic ${t.id}: bad level`);
}

const lv = (l) => SCENARIOS.filter((s) => s.level === l).length;
console.log(`Lisan content · ${PATHS.length} paths · ${SCENARIOS.length} role-plays (${lv('Beginner')} beginner, ${lv('Intermediate')} intermediate, ${lv('Advanced')} advanced) · ${turns} turns · ${answers} model answers · ${TOPICS.length} topics in ${TOPIC_CATS.length} groups`);
for (const p of PATHS) console.log(`  ${p.en.padEnd(18)} ${p.units.map((u) => u + '(' + (byId.get(u) || {}).level?.[0] + ')').join(' → ')}`);
warnings.forEach((w) => console.log('  warn: ' + w));
errors.forEach((e) => console.log('  ERROR: ' + e));
console.log(errors.length ? `✗ ${errors.length} errors` : '✓ content OK');
process.exitCode = errors.length ? 1 : 0;
