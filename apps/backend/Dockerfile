# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

# ---------- deps ----------
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json tsconfig.base.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile --filter backend...

# ---------- build ----------
FROM deps AS build
COPY apps/backend ./apps/backend
COPY packages/shared ./packages/shared
RUN pnpm --filter backend build

# ---------- runner ----------
FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/package.json /repo/pnpm-workspace.yaml /repo/pnpm-lock.yaml /repo/tsconfig.base.json ./
COPY --from=build /repo/packages/shared ./packages/shared
COPY --from=build /repo/apps/backend/package.json ./apps/backend/
COPY --from=build /repo/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=build /repo/apps/backend/dist ./apps/backend/dist
COPY --from=build /repo/apps/backend/drizzle ./apps/backend/drizzle
COPY --from=build /repo/apps/backend/drizzle.config.ts ./apps/backend/
COPY --from=build /repo/apps/backend/src ./apps/backend/src

WORKDIR /repo/apps/backend
EXPOSE 3001

# Apply migrations on boot; optionally seed when SEED_ON_BOOT=true. Then serve.
CMD ["sh", "-c", "pnpm db:migrate && { [ \"$SEED_ON_BOOT\" = \"true\" ] && pnpm db:seed || true; } && node dist/index.js"]
