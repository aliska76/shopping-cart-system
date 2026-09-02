<p align="center">
  <img src="./Shoping cart screenshot.png" alt="Shoping cart system screenshot" />
</p>

# Shopping Cart System

Take-home assignment — full stack engineer position, אגף התקשוב ומערכות המידע, משרד הביטחון.

Three independently deployable services: `server-catalog` (.NET 10 + EF Core + SQL Server, screen 1), `server-orders` (NestJS + Elasticsearch, screen 2), `client` (React + Redux Toolkit + Vite + TypeScript, both screens). `docker-compose.yml` and `.env` live at the repo root and can bring up all three, plus both datastores — see *Running everything in Docker* below.

Each service has its own README with setup, tests and design notes — see [Services](#services) below. Everything in this repo is cross-platform (Windows / macOS / Linux); no OS-specific tooling anywhere.

The Elasticsearch mapping file the assignment asks for is server-orders/mapping.json. The order service creates the index from that exact file on first start, so the file in the repo is the mapping actually in use — not a copy that can drift.

**A note on scope.** Each service goes a bit beyond what its own two endpoints (or one page) strictly need — a rate limiter and structured logging in `server-catalog`, cart persistence and a styles/component split in `client` and etc. None of it is required by the assignment; it's there because it's what a system meant to run past a demo would actually need, and every addition is explained in that service's own *Design notes*, linked below. Where something further (a distributed cache, a message queue, auth) seemed disproportionate for this scope, it's listed instead of built — see *Possible improvements — system-wide* at the bottom of this file.

## Prerequisites

This needs the **.NET SDK 10** and **Node v20.19.5 or later** installed — `client`'s test toolchain (`jsdom`/`undici`) needs at least that Node version to run `npm test`.

| Tool | Windows | macOS | Linux |
|---|---|---|---|
| .NET 10 SDK | `winget install Microsoft.DotNet.SDK.10` | `brew install --cask dotnet-sdk` | [`dotnet-install.sh`](https://dotnet.microsoft.com/download/dotnet/10.0) (script), or your distro's package if it already carries .NET 10 |
| Node.js `v20.19.5+` | needed for the one setup script below, and to run `client`/`server-orders` (`node --version`) | same | same |
| Docker | Docker Desktop | Docker Desktop | Docker Engine (or Docker Desktop for Linux) |

Then everywhere: `dotnet tool install --global dotnet-ef`.

Verify with `dotnet --version` (should print `10.x`), `node --version` (should print `v20.19.5` or higher), and `docker compose version`.

## Services

- **[`server-catalog/`](server-catalog/README.md)** — Catalog API (.NET 10 + EF Core + SQL Server). ✅ Built — see its own README below for full setup, tests, and design notes.
- **[`server-orders/`](server-orders/README.md)** — Orders API (NestJS + Elasticsearch). ✅ Built — see its own README below for full setup, tests, and design notes.
- **[`client/`](client/README.md)** — Shopping Cart UI (React + Redux Toolkit + Vite + TypeScript, MUI, i18n en/he with RTL/LTR). ✅ Built — see its own README below for full setup, tests, and design notes.

## Running everything in Docker (optional)

Neither backend API nor `client` is containerized by default — the setup steps below run `dotnet run`/`npm run start:dev`/`npm run dev` directly against just `catalog-sql`/`orders-es` in Docker, which is faster to iterate against than rebuilding a container image on every change. `server-catalog/Dockerfile`, `server-orders/Dockerfile`, and `client/Dockerfile` (all multi-stage: SDK/Node build stage, slim ASP.NET Core/Node/nginx runtime stage) exist for the case where you want to check the whole thing runs the way it'd actually deploy — one instance each, not three long-lived local processes:

```
docker compose --profile full up -d --build
```

`catalog-api`/`orders-api`/`client` in `docker-compose.yml` are gated behind the `full` [profile](https://docs.docker.com/compose/how-tos/profiles/) specifically so a plain `docker compose up -d` (see *Running it without Docker* below) is completely unaffected by their existing — it still starts only `catalog-sql`/`orders-es`, same as before these were added. `catalog-api` waits on `catalog-sql`'s health check the same way `dotnet run` waits on it manually today (see [server-catalog/README.md](server-catalog/README.md)'s *Design notes*); `orders-api` waits on `orders-es`'s the same way `OrdersRepository.onModuleInit`'s retry-ping does; `client` just waits on the other two to start (no health check to wait on — nginx serving static files has nothing to become ready, and the app already has its own loading/error state for a not-yet-up API, see `CatalogPage.tsx`). `client`'s two `VITE_*` values are baked into its JS bundle at build time (Vite doesn't read them at runtime) as build args in `docker-compose.yml`, pointing at `catalog-api`/`orders-api`'s host-published ports — the browser calls those directly, not through the `client` container's own network.

### What comes up

| Container | Host port | What it is | Started by |
|---|---|---|---|
| `catalog-sql` | `1433` (`${MSSQL_PORT}`) | SQL Server 2022 | `docker compose up -d` |
| `orders-es` | `9200` (`${ELASTICSEARCH_PORT}`) | Elasticsearch | `docker compose up -d` |
| `catalog-api` | `5080` | Catalog API — `http://localhost:5080/swagger` | `--profile full` only |
| `orders-api` | `3001` | Orders API — `http://localhost:3001/swagger` | `--profile full` only |
| `client` | `5173` | The built client, served by nginx — `http://localhost:5173` | `--profile full` only |

## Running it without Docker

Useful while actively developing one service — faster to iterate against than rebuilding a container image on every change. You still want the two datastores in Docker:

```
docker compose up -d
```

Then, in three terminals:

```
cd server-catalog && dotnet run
```
```
cd server-orders && npm install && npm run start:dev
```
```
cd client && npm install && npm run dev
```

That's the shape of it; the actual step-by-step for each — secrets, migrations, seed data, env vars — is in that service's own README: [server-catalog/README.md](server-catalog/README.md), [server-orders/README.md](server-orders/README.md), [client/README.md](client/README.md).

## server-catalog — Catalog API

.NET 10 + EF Core + SQL Server, serving screen 1. `GET /api/v1/categories` returns the whole catalog (3 categories, 18 products) in one request; `GET /api/v1/categories/{categoryId}/products` is cursor-paginated. Beyond the bare assignment: a rate limiter and a global concurrency limiter, API versioning, structured logging with a dev/prod switch, an `IMemoryCache` decorator, and a real `/health` check — all built on ASP.NET Core's own features, no extra frameworks. Layered `Catalog.Domain` → `Catalog.Application` → `Catalog.Infrastructure` → `Catalog.Api`, with composition pulled into its own `Catalog.DependencyInjection` project so the DI story is visible in the file tree, not buried in `Program.cs`.

See **[server-catalog/README.md](server-catalog/README.md)** for setup steps, tests, and the full design notes.

## server-orders — Orders API

NestJS + Elasticsearch, serving screen 2. `POST /api/v1/orders` creates an order; `GET /api/v1/orders` lists them with `search_after` cursor pagination; `GET /health` reports Elasticsearch as up. The mapping file the assignment asks for lives at [`server-orders/mapping.json`](server-orders/mapping.json) and is what actually creates the index at startup, not a copy of it. Beyond the bare assignment: rate limiting (`@nestjs/throttler`) plus a hand-written concurrency-limit middleware, URI versioning, structured logging with the same dev/prod switch as `server-catalog`, and a unified error envelope shared across both APIs. An e2e suite (`npm run test:e2e`) runs the real app stack against an in-memory Elasticsearch-client stub — no live cluster needed to run it.

See **[server-orders/README.md](server-orders/README.md)** for setup steps, tests, and the full design notes.

## client — Shopping Cart UI

React + Redux Toolkit + Vite + TypeScript, MUI, i18n (en/he) with RTL/LTR. Screen one (`/`) lists categories/products with a quantity stepper on each card that doubles as "add to cart"; screen two (`/checkout`) shows the cart (unit price, per-line total, grand total), a 3-field form, and posts the order. The cart persists across a page reload (`localStorage`, same mechanism as the language preference), and the checkout form survives a trip back to the catalog and forward again. 33 tests (Vitest + React Testing Library).

See **[client/README.md](client/README.md)** for setup steps, tests, and the full design notes.

## Possible improvements — system-wide

Each service's own *Possible improvements* section (in its own README, linked above) lists what's scoped to that one service. A few additions cut across more than one service — or don't belong to any one specifically — so they're called out once here instead of duplicated across service READMEs:

- **Add authentication/authorization (OAuth2/OIDC via an SSO provider — Entra ID, Auth0, Keycloak, whatever the organization already runs) in front of both services.** Today neither API has an auth boundary: `server-catalog`'s only write path is the startup seeder, and `server-orders` lets anyone place an order or read the full order history, which carries PII (name/email/address). A real deployment needs scoped tokens so read access and admin/write access aren't gated by the same credential, enforced the same way across both services rather than reinvented per service.
- **Move shared state to Redis once running more than one instance of either service.** `server-catalog`'s `IMemoryCache`/rate limiter and `server-orders`' rate limiter are both in-process, per-instance state today — fine for a single instance each, but each replica behind a load balancer would cache or count independently once scaled out, so a write could serve stale data from another replica and the effective rate limit would multiply by replica count instead of staying at the configured number. Redis is the natural shared store for both: a distributed cache in front of SQL Server/Elasticsearch, a shared rate-limit counter, and — once either service has a login — a shared session store, so a request can land on any replica of either service without losing state.
- **Publish domain events to a message queue (Kafka or RabbitMQ) instead of doing everything synchronously inside the request.** `server-orders` creating an order and `server-catalog` changing a product are both places where downstream work doesn't need to block the client's response — a confirmation email, cache invalidation across replicas, a search-index rebuild, or `server-orders` learning about a renamed product. A queue decouples the two services further than they already are, and absorbs write bursts instead of every spike hitting the database/Elasticsearch directly.
- **Put NGINX (or another reverse proxy) in front of both services as a shared load balancer/TLS terminator once running multiple replicas.** It would route each request to a healthy replica of the right service and could take over cross-cutting concerns like rate limiting or TLS termination at the edge instead of — or alongside — doing them in-process per service.
- **Add a CI pipeline (GitHub Actions is the obvious choice) that builds and tests all three services on every push/PR, plus Dependabot or Renovate to flag an outdated package/NuGet/SDK version automatically.** Right now `dotnet build`/`dotnet test` (`server-catalog`) and `npm run build`/`npm test` (`server-orders`, `client`) are all run by hand, and an outdated dependency only gets noticed if someone happens to look — the same two gaps were showing up nearly word-for-word in every service's own list, so they're called out once here instead. `server-orders`' e2e suite (`npm run test:e2e`) is a specific case already CI-ready today, needing only the pipeline itself, since it runs against an in-memory Elasticsearch-client stub rather than a live cluster.
- **Paginate/lazy-load the catalog itself, not just its products-per-category endpoint.** `GET /api/v1/categories` (the single request `client`'s catalog page makes on load) returns every category with all products nested and unpaginated, deliberate at today's scale (3 categories/18 products) but not once the catalog actually grows — cursor pagination already covers `GET /api/v1/categories/{categoryId}/products`; the same pattern would need to extend to the top-level listing, with `client` switching from one eager fetch to loading categories/products incrementally instead of assuming everything fits in one response.
- **Responsive images (`srcset`/`sizes`) for product photos, layered on top of the lazy loading already implemented (`loading="lazy"` in `client/src/components/ProductImage.tsx`).** Real lazy loading already defers offscreen images; still missing is serving a size actually matched to the card's rendered dimensions instead of one fixed image regardless of viewport — natural to add once product images move off local disk to blob storage behind a CDN (see `server-catalog/README.md`'s own *Possible improvements*), since a CDN is what would actually generate/cache the multiple sizes a `srcset` needs.
