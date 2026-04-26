# ── Étape 1 : dépendances ─────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# ── Étape 2 : build ──────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Générer le client Prisma avant le build Next.js
RUN npx prisma generate --schema=./prisma/schema.prisma

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Étape 3 : image de production ────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Standalone + assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public           ./public
COPY --from=builder --chown=nextjs:nodejs /app/generated        ./generated
COPY --from=builder --chown=nextjs:nodejs /app/prisma           ./prisma

# ← AJOUTER CES DEUX LIGNES
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Prisma CLI nécessaire pour migrate deploy au runtime
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin/prisma        ./node_modules/.bin/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma            ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma             ./node_modules/prisma

USER nextjs
EXPOSE 3000
ENV PORT=3009
ENV HOSTNAME="0.0.0.0"

# ← REMPLACER CMD
CMD ["./docker-entrypoint.sh"]