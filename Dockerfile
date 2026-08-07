# Stage 1: Install dependencies
FROM node:22-slim AS dependencies

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci

# Stage 2: Build the application
FROM node:22-slim AS build
WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Stage 3: Run the application
FROM node:22-slim AS run

WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set correct permissions for Next.js image optimization features
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Leverage standalone output build
COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/drizzle ./drizzle

USER nextjs
ENV PORT=8000
ENV HOSTNAME="0.0.0.0"
EXPOSE $PORT

CMD ["node", "server.js"]