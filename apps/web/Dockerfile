# Build the static SPA, serve it with nginx (same pattern as the API image:
# build the whole workspace from the repo root, then ship only the output).
#   docker build -f apps/web/Dockerfile -t wedding-web .
FROM node:22-slim AS build
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile

# Baked at build time:
#  - VITE_API_URL empty  = same-origin. The browser calls /api on whatever host
#    served the app and nginx (below) proxies it to the API container. No absolute
#    API URL is compiled in, so the site works behind Traefik, a LAN IP or a tunnel
#    with no rebuild.
#  - VITE_BASE / because the app is served at the domain root (not a Pages subpath).
ENV VITE_API_URL=
ENV VITE_BASE=/
RUN pnpm --filter @wedding/web build

FROM nginx:1.27-alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 80
