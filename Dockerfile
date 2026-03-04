# ── Server ──
FROM node:20-alpine AS server
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --only=production
COPY server/ .
EXPOSE 5000

# ── Client Build ──
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ .
RUN npm run build

# ── Production ──
FROM node:20-alpine
WORKDIR /app

# Copy server
COPY --from=server /app/server ./server

# Copy client build to server's public directory
COPY --from=client-build /app/client/build ./server/public

WORKDIR /app/server

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "src/index.js"]
