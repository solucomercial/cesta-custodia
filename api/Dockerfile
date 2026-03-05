# api/Dockerfile
FROM node:20-alpine AS base

# 1. Dependências
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
# Instala todas as dependências (incluindo dev para o build)
RUN npm ci

# 2. Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Forçamos o outDir para 'dist' para garantir que a pasta seja criada, 
# já que o tsconfig.json não possui a propriedade outDir definida.
RUN npx tsc --outDir dist

# 3. Runner
FROM base AS runner
WORKDIR /app
# Atualizado para o formato key=value para evitar avisos de legado
ENV NODE_ENV=production

# Copia apenas o necessário para rodar
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3333
CMD ["npm", "start"]