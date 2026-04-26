FROM node:20-alpine AS base
RUN apk add --no-cache openssl
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.7.0 --activate

# --- deps ---
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile || pnpm install

# --- build ---
FROM deps AS build
COPY tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm --filter @data-compare/shared build || true
RUN pnpm --filter @data-compare/api prisma:generate
RUN pnpm --filter @data-compare/api build

# --- run ---
FROM node:20-alpine AS run
RUN apk add --no-cache openssl tini
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/apps/api/package.json ./apps/api/
COPY --from=build /app/packages/shared/package.json ./packages/shared/
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
EXPOSE 3001
ENTRYPOINT ["/sbin/tini","--"]
CMD ["node","apps/api/dist/apps/api/src/main.js"]
