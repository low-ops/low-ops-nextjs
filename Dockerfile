FROM node:22-slim AS base

WORKDIR /app
ARG PORT=8000

FROM base AS dependencies

COPY package.json package-lock.json ./
RUN npm ci

FROM base AS build

ARG BETTER_AUTH_SECRET=build-time-secret-not-used-at-runtime-32chars
ENV BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET
ENV BETTER_AUTH_URL=http://localhost:8000
ENV APPLICATION_URL=http://localhost:8000
ENV POSTGRES_HOST=build
ENV POSTGRES_PORT=5432
ENV POSTGRES_DATABASE=build
ENV POSTGRES_USER=build
ENV POSTGRES_PASSWORD=build
ENV S3_ENDPOINT=http://build
ENV S3_BUCKET_NAME=build
ENV S3_ACCESS_KEY_ID=build
ENV S3_SECRET_ACCESS_KEY=build
ENV S3_REGION=us-east-1

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS run

ARG PORT=8000

RUN apt-get update -y && apt-get install -y openssl \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=$PORT
ENV HOSTNAME=0.0.0.0

WORKDIR /app

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/drizzle ./drizzle
COPY scripts/start.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE $PORT

CMD ["./start.sh"]
