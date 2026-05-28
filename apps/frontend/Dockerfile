# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

# ---------- deps ----------
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json tsconfig.base.json ./
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/
RUN pnpm install --frozen-lockfile --filter frontend...

# ---------- build ----------
FROM deps AS build
COPY apps/frontend ./apps/frontend
COPY packages/shared ./packages/shared
COPY packages/ui ./packages/ui

# Baked into the client bundle — must point at a URL reachable from the user's
# browser, not from another container.
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm --filter frontend build

# ---------- runner ----------
FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/package.json /repo/pnpm-workspace.yaml /repo/pnpm-lock.yaml ./
COPY --from=build /repo/packages/shared ./packages/shared
COPY --from=build /repo/packages/ui ./packages/ui
COPY --from=build /repo/apps/frontend/package.json ./apps/frontend/
COPY --from=build /repo/apps/frontend/node_modules ./apps/frontend/node_modules
COPY --from=build /repo/apps/frontend/.next ./apps/frontend/.next
COPY --from=build /repo/apps/frontend/next.config.ts ./apps/frontend/

WORKDIR /repo/apps/frontend
EXPOSE 3000
CMD ["pnpm", "start"]
