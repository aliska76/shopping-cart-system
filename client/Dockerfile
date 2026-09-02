# Multi-stage build -- devDependencies (typescript, vite, vitest, ...) and the whole Node
# toolchain are only needed to produce the static bundle; the final image ships nginx plus
# that bundle, nothing else. Same shape as the two backends' Dockerfiles (build stage with
# the full SDK/toolchain, slim runtime stage with just the published output).
FROM node:22-alpine AS build
WORKDIR /app

# package.json/package-lock.json copied (and installed) before the rest of the source, so
# Docker's layer cache only re-runs "npm ci" when a dependency actually changed, not on
# every source edit.
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts index.html ./
COPY public/ public/
COPY src/ src/

# Vite inlines import.meta.env.VITE_* at build time (it's a static string replacement, not
# a runtime lookup) -- these two ARGs/ENVs are what src/api/catalogApi.ts and ordersApi.ts
# actually get baked in as their baseUrl. Defaults match client/.env.example: the browser
# (not this container) is what calls these URLs, and both APIs are published on these same
# host ports whether they're run locally or via docker-compose's catalog-api/orders-api
# (see docker-compose.yml) -- so "localhost" is correct here even though this build itself
# runs inside a container with no access to those services.
ARG VITE_CATALOG_API_URL=http://localhost:5080
ARG VITE_ORDERS_API_URL=http://localhost:3001
ENV VITE_CATALOG_API_URL=$VITE_CATALOG_API_URL
ENV VITE_ORDERS_API_URL=$VITE_ORDERS_API_URL

RUN npm run build

FROM nginx:1.31.4-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
