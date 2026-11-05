# Build from the lisan/ folder:  docker build -f server/Dockerfile -t lisan .
FROM node:22-alpine
WORKDIR /app
COPY server/package*.json server/
RUN cd server && npm install --omit=dev
COPY . .
ENV PORT=8787
EXPOSE 8787
CMD ["node", "server/server.mjs"]
