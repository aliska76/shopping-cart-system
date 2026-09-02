#!/usr/bin/env node
//
// Downloads the product photos listed in
// src/Catalog.Infrastructure/Persistence/Seed/catalog-demo-data.json (each product's
// "imageUrl") into src/Catalog.Api/wwwroot/images/, under the filename its own "imagePath"
// already names (e.g. imagePath "/images/apples.jpg" -> saved as "apples.jpg"). That JSON
// file is the single source of truth for product data (see CatalogDemoData.cs) — this
// script does NOT keep its own separate list of URLs/filenames, so there's nothing here
// that could drift out of sync with it. Run it once from server-catalog/ whenever
// catalog-demo-data.json changes, then commit the downloaded files — after that the app has
// zero runtime dependency on any external image host.
//
//   node scripts/download-product-images.mjs
//
// Cross-platform Node script (not a .ps1/.sh pair) for the same reason as
// setup-local-secrets.mjs: one file instead of two that could drift apart.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(scriptDir); // server-catalog/
const dataFile = join(repoRoot, 'src', 'Catalog.Infrastructure', 'Persistence', 'Seed', 'catalog-demo-data.json');
const outDir = join(repoRoot, 'src', 'Catalog.Api', 'wwwroot', 'images');

async function loadImageEntries() {
  const raw = await readFile(dataFile, 'utf8');
  const categories = JSON.parse(raw);

  const entries = [];
  for (const category of categories) {
    for (const product of category.products) {
      if (!product.imageUrl || !product.imagePath) {
        continue; // no confirmed photo for this product (see ADR #9) — nothing to download
      }
      entries.push({ filename: basename(product.imagePath), url: product.imageUrl, product: product.nameEn });
    }
  }
  return entries;
}

async function downloadOne(filename, url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (shopping-cart-system seed script)' },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(join(outDir, filename), buffer);

  return { bytes: buffer.length, contentType: response.headers.get('content-type') };
}

async function main() {
  await mkdir(outDir, { recursive: true });

  const entries = await loadImageEntries();
  const results = await Promise.allSettled(entries.map((e) => downloadOne(e.filename, e.url)));

  let failed = 0;
  results.forEach((result, i) => {
    const { filename, product } = entries[i];
    if (result.status === 'fulfilled') {
      const { bytes, contentType } = result.value;
      const warn = bytes < 5000 ? '  <- suspiciously small, double-check it' : '';
      console.log(`OK   ${filename.padEnd(22)} (${product}) ${String(bytes).padStart(8)} bytes  ${contentType ?? 'unknown type'}${warn}`);
    } else {
      failed += 1;
      console.error(`FAIL ${filename.padEnd(22)} (${product}) ${result.reason?.message ?? result.reason}`);
    }
  });

  console.log(`\n${entries.length - failed}/${entries.length} images saved to ${outDir}`);
  if (failed > 0) {
    console.error(`${failed} download(s) failed — see FAIL lines above. Those products will keep the local-fallback image on the client instead.`);
    process.exitCode = 1;
  }
}

main();
