FROM node:20-slim AS base

WORKDIR /app
ARG PORT=8000

FROM base AS dependencies

COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

# Build
FROM base AS build

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Run
FROM base AS run

ARG PORT=8000
RUN apt-get update -y && apt-get install -y openssl \
  && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV PORT=$PORT

# Prisma CLI + engines in a separate tree so standalone node_modules stay intact.
WORKDIR /opt/prisma-cli
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci --omit=dev

WORKDIR /app
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/src/generated ./src/generated

RUN mkdir -p .data/uploads

EXPOSE $PORT

ENV HOSTNAME="0.0.0.0"
CMD ["sh", "-c", "mkdir -p /app/.data/uploads && cd /opt/prisma-cli && node ./node_modules/prisma/build/index.js migrate deploy; cd /app && node server.js"]
