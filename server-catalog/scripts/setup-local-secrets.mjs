#!/usr/bin/env node
// Reads the repo-root .env and writes the Catalog.Api connection string into
// dotnet user-secrets, so the SQL Server password lives in exactly one place
// (.env, next to docker-compose.yml) instead of being retyped by hand.
//
// One script, not a .ps1/.sh pair to keep in sync: Node is already a
// required runtime for this monorepo (client + server-orders), so this adds
// no new dependency, and runs identically on Windows/macOS/Linux.
//
// Usage (from anywhere, via npm-free node):
//   node server-catalog/scripts/setup-local-secrets.mjs

import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const serverCatalogDir = dirname(scriptDir);       // server-catalog/
const repoRoot = dirname(serverCatalogDir);         // shopping-cart-system/ — where docker-compose.yml + .env live
const envFile = join(repoRoot, '.env');
const apiProject = join(serverCatalogDir, 'src', 'Catalog.Api');

if (!existsSync(envFile)) {
  console.error(`No .env found at ${envFile}. Run "cp .env.example .env" (from the repo root) first and set a password in it.`);
  process.exit(1);
}

const env = {};
for (const rawLine of readFileSync(envFile, 'utf8').split('\n')) {
  const line = rawLine.trim();
  if (!line || line.startsWith('#')) continue;
  const eq = line.indexOf('=');
  if (eq === -1) continue;
  env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
}

const password = env.MSSQL_SA_PASSWORD;
if (!password) {
  console.error('.env is missing a value for MSSQL_SA_PASSWORD.');
  process.exit(1);
}

const port = env.MSSQL_PORT || '1433';
const dbName = env.CATALOG_DB_NAME || 'CatalogDb';

const connectionString =
  `Server=localhost,${port};Database=${dbName};User Id=sa;Password=${password};TrustServerCertificate=True;`;

console.log('Writing ConnectionStrings:CatalogDb to dotnet user-secrets for Catalog.Api (value read from .env, not re-typed)...');

// execFileSync with an args array (not a shell string) — passwords with
// special characters (!, $, ", spaces...) are passed as literal argv
// entries, not parsed by any shell, so this is correct on every platform.
execFileSync(
  'dotnet',
  ['user-secrets', 'set', 'ConnectionStrings:CatalogDb', connectionString, '--project', apiProject],
  { stdio: 'inherit' }
);

console.log("Done. Verify (won't print the password) with:");
console.log('  dotnet user-secrets list --project server-catalog/src/Catalog.Api');
