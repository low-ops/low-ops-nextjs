FROM node:20-slim AS base

WORKDIR /app
ARG PORT=8000
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS dependencies

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# Build
FROM base AS build

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Run
FROM base AS run

RUN apt-get update -y && apt-get install -y openssl
ENV NODE_ENV=production
ENV PORT=$PORT
RUN mkdir .next

COPY --from=build /app/public ./public
COPY --from=dependencies /app/prisma ./prisma
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
RUN npm install @prisma/client
RUN npx prisma generate

EXPOSE 8000

ENV HOSTNAME="0.0.0.0"
CMD ["sh", "-c", "npm run start:prod"]
