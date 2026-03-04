# Dockerfile otimizado para aplicações Next.js no Monorepo
FROM node:18-alpine AS base

# 1. Instalar dependências
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN npm install

# 2. Build da aplicação
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Comando de build (ajustar conforme o nome da app no monorepo)
RUN npm run build --workspace=apps/consumer

# 3. Runner para produção
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

ENV PORT 3000
CMD ["npm", "start"]