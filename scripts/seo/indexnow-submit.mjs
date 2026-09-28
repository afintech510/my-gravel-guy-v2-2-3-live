#!/usr/bin/env node
/**
 * IndexNow submission — push changed/new URLs to Bing, Yandex, Seznam, Naver
 * via the shared IndexNow protocol (https://www.indexnow.org/documentation).
 *
 * DO NOT RUN THIS AS PART OF THIS TASK. This script is post-deploy plumbing:
 * it's meant to be run manually or from CI *after* mygravelguy.com is live
 * on the new infrastructure and the URLs below actually resolve. Submitting
 * URLs that 404 wastes IndexNow's per-key trust and does nothing useful.
 *
 * Usage (once it's safe to run, i.e. after deploy):
 *   node scripts/seo/indexnow-submit.mjs                  # submit sitemap.xml URLs
 *   node scripts/seo/indexnow-submit.mjs /a /b /c          # submit specific paths
 *
 * How it works:
 *   1. Reads public/sitemap.xml (or accepts explicit paths as CLI args).
 *   2. POSTs a batch (up to 10,000 URLs per IndexNow's own limit) to
 *      https://api.indexnow.org/indexnow, which fans out to every search
 *      engine that participates in the shared protocol (confirmed today:
 *      Bing, Yandex, Seznam.cz, Naver — not confirmed to reach ChatGPT/
 *      OpenAI directly, see docs/metro/research/aeo-plan.md §1.5).
 *
 * Key file: the key below MUST exactly match the contents of
 * public/<key>.txt, which must be reachable at
 * https://mygravelguy.com/<key>.txt — IndexNow validates the key by
 * fetching that URL before accepting submissions.
 */

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..', '..');

const HOST = 'mygravelguy.com';
const KEY = 'bc5af9e81abe27fe19870d01325fde8c'; // must match public/bc5af9e81abe27fe19870d01325fde8c.txt
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const MAX_URLS_PER_BATCH = 10000; // IndexNow's own documented limit

function readSitemapUrls() {
  const sitemapPath = join(ROOT_DIR, 'public', 'sitemap.xml');
  const xml = readFileSync(sitemapPath, 'utf8');
  const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)];
  return matches.map(m => m[1].trim());
}

function resolveUrls(argv) {
  const explicitPaths = argv.slice(2);
  if (explicitPaths.length > 0) {
    return explicitPaths.map(p => (p.startsWith('http') ? p : `https://${HOST}${p.startsWith('/') ? '' : '/'}${p}`));
  }
  return readSitemapUrls();
}

async function submitBatch(urls) {
  const body = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls,
  };

  const res = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });

  return { status: res.status, statusText: res.statusText };
}

async function main() {
  const urls = resolveUrls(process.argv);

  if (urls.length === 0) {
    console.error('No URLs to submit (empty sitemap.xml / no paths given). Aborting.');
    process.exitCode = 1;
    return;
  }

  console.log(`IndexNow: about to submit ${urls.length} URL(s) for host "${HOST}"`);
  console.log(`Key location (must resolve to the key before submission is accepted): ${KEY_LOCATION}`);
  console.log('First few URLs:', urls.slice(0, 5));

  // Real submission is intentionally not wired to run automatically here —
  // this script is meant to be invoked deliberately, post-deploy. Batch in
  // chunks of MAX_URLS_PER_BATCH in case the sitemap ever exceeds it.
  for (let i = 0; i < urls.length; i += MAX_URLS_PER_BATCH) {
    const batch = urls.slice(i, i + MAX_URLS_PER_BATCH);
    const result = await submitBatch(batch);
    console.log(`Batch ${i / MAX_URLS_PER_BATCH + 1}: HTTP ${result.status} ${result.statusText}`);
    if (result.status !== 200 && result.status !== 202) {
      console.error('  IndexNow did not return success — check key file is live at', KEY_LOCATION);
    }
  }
}

main().catch(err => {
  console.error('IndexNow submission failed:', err);
  process.exitCode = 1;
});
