#!/usr/bin/env node
// Builds the Google Merchant sync price book from src/metro/** + src/services/googleShopping/
// priceBookExport.ts and writes it to supabase/functions/google-merchant-sync/price-book.json,
// where the google-merchant-sync edge function reads it at sync time.
//
// Why esbuild instead of `npx tsx`: this repo's package.json (owned by another agent) has no
// `tsx` dependency and this agent may not add one. esbuild is already present in
// node_modules (a transitive Vite dependency) and has a stable Node JS API, so we use it to
// bundle+transpile priceBookExport.ts (a plain, dependency-free-of-React TS module) into a
// throwaway ESM file in the OS temp dir, import it, call buildPriceBook(), and write the result.
//
// Run manually with `node scripts/metro/export-price-book.mjs`, or before
// `supabase functions deploy google-merchant-sync` — see
// docs/metro/research/merchant-api-implementation.md for the full deploy sequence.

import { build } from 'esbuild';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');

const entry = path.join(repoRoot, 'src', 'services', 'googleShopping', 'priceBookExport.ts');
const outDir = path.join(repoRoot, 'supabase', 'functions', 'google-merchant-sync');
const outFile = path.join(outDir, 'price-book.json');

async function main() {
  const bundlePath = path.join(tmpdir(), `mgg-price-book-export-${Date.now()}.mjs`);

  await build({
    entryPoints: [entry],
    outfile: bundlePath,
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node18',
    logLevel: 'warning',
  });

  try {
    const mod = await import(pathToFileURL(bundlePath).href);
    const priceBook = mod.buildPriceBook();

    mkdirSync(outDir, { recursive: true });
    writeFileSync(outFile, JSON.stringify(priceBook, null, 2) + '\n', 'utf8');

    const productCount = priceBook.metros.reduce((n, m) => n + m.products.length, 0);
    const regionCount = priceBook.metros.reduce((n, m) => n + m.zones.length, 0);
    console.log(
      `Wrote price book: ${priceBook.metros.length} metro(s), ${regionCount} zone(s)/region(s), ` +
        `${productCount} product(s) -> ${path.relative(repoRoot, outFile)}`,
    );
  } finally {
    rmSync(bundlePath, { force: true });
  }
}

main().catch(err => {
  console.error('export-price-book failed:', err);
  process.exitCode = 1;
});
