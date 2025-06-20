########################
# Dependencies Stage   #
########################
FROM node:20-alpine AS deps
WORKDIR /app

# Installer libc6-compat pour certains paquets natifs
RUN apk add --no-cache libc6-compat

# Installer uniquement les dépendances (cache optimisé)
COPY package.json package-lock.json ./
RUN npm ci

########################
# Builder Stage        #
########################
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

########################
# Runner Stage         #
########################
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Créer l'utilisateur non-root
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Copier uniquement le strict nécessaire
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"] 