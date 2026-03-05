# api/Dockerfile
FROM node:20-alpine AS base

# 1. Dependências
FROM base AS deps
RUN apk add --no-cache libc6-compat ca-certificates
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2. Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Compila o TypeScript usando as configurações do tsconfig.json
RUN npx tsc
# Resolve os aliases (@/) para caminhos relativos que o Node entende
RUN npx --yes tsc-alias -p tsconfig.json

# 3. Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copia apenas o necessário para rodar
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3333
CMD ["npm", "start"]