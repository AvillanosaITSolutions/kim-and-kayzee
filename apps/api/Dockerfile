# Production image for the NestJS API inside the pnpm workspace.
# IMPORTANT: build with the repository ROOT as the context so the lockfile and
# both workspace manifests are available:
#   docker build -f apps/api/Dockerfile -t wedding-api .
# On the VPS, docker compose builds it with the same root context (see
# docker-compose.yml: build.context: .).

# ---- build: install the workspace and compile the API ----
FROM node:22-slim AS build
RUN corepack enable
WORKDIR /repo
COPY . .
# Install the whole workspace from the frozen lockfile, then build the API.
# esbuild (a web-only dep) may log that its build script was skipped — harmless
# here since we only compile and run the API.
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @wedding/api build

# ---- runtime: carry over the installed workspace + compiled output ----
FROM node:22-slim AS runtime
ENV NODE_ENV=production
# corepack makes pnpm available at runtime so the seed can be run inside the
# container: `docker compose exec -w /repo/apps/api api pnpm seed` (ts-node and the
# source are already present, since the whole /repo tree is copied below).
RUN corepack enable
WORKDIR /repo
# Copy the entire installed tree so pnpm's symlinked node_modules resolve
# correctly (the API's deps are hoisted to the root store and symlinked).
COPY --from=build /repo ./
WORKDIR /repo/apps/api
# The host injects PORT; main.ts reads process.env.PORT (defaults to 3000).
EXPOSE 3000
CMD ["node", "dist/main.js"]
