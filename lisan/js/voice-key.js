/* ==========================================================================
   Lisan · voice-key.js
   --------------------------------------------------------------------------
   One tiny function shared by the browser and the voice-pack build tool.

   Every spoken line is identified by (voice profile + exact text), never by
   its position in a lesson. That means you can reorder, add or edit lines and
   any pre-generated studio clip still finds the right sentence — and a line
   whose text changed simply falls back to the next voice engine until the
   pack is rebuilt.
   ========================================================================== */
(function (root) {
  'use strict';

  /** Canonical form of a line before hashing (quotes, spacing, unicode). */
  function normText(text) {
    return String(text == null ? '' : text)
      .normalize('NFC')
      .replace(/[‘’ʼ]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[–—]/g, '-')
      .replace(/…/g, '...')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** cyrb53 — fast, well-distributed 53-bit string hash. */
  function cyrb53(str, seed) {
    let h1 = 0xdeadbeef ^ (seed || 0), h2 = 0x41c6ce57 ^ (seed || 0);
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  }

  /** Stable file key for a clip: e.g. "3f9a0c1d2b7e41". */
  function clipKey(profileId, text) {
    return cyrb53(profileId + '|' + normText(text)).toString(16).padStart(14, '0');
  }

  const api = { normText: normText, clipKey: clipKey };
  root.LisanVoiceKey = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
