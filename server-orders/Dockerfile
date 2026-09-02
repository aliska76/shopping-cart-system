# Multi-stage build -- devDependencies (typescript, ts-jest, @nestjs/cli, ...) are only
# needed to compile; the final image ships just the compiled dist/ output plus production
# dependencies, not the dev toolchain.
FROM node:22-alpine AS build
WORKDIR /app

# package.json/package-lock.json copied (and installed) before the rest of the source, so
# Docker's layer cache only re-runs "npm ci" when a dependency actually changed, not on
# every source edit.
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src/ src/
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
# mapping.json isn't compiled -- OrdersRepository reads it directly off disk relative to
# process.cwd() (see orders.repository.ts), so it has to land next to package.json in the
# runtime image, not just live in the build stage/source tree.
COPY mapping.json ./

EXPOSE 3001
CMD ["node", "dist/src/main.js"]
