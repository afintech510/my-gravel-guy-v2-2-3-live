/**
 * Metro route exporter for the sitemap generator.
 *
 * Owned by AEO-FOUNDATIONS (scripts/generate-sitemap.mjs). Reads the metro
 * config that METRO-CORE/METRO-UI own (src/metro/config/**) — read-only,
 * never edits anything under src/**.
 *
 * Run via `npx tsx scripts/metro/generate-metro-routes.ts` (tsx resolves
 * the TypeScript source directly; no build step / no src changes needed).
 * Writes scripts/metro/metro-routes.json, which generate-sitemap.mjs reads.
 *
 * If this script or tsx is unavailable at sitemap-generation time,
 * generate-sitemap.mjs falls back to a small hardcoded metro-home-page
 * list so a missing/broken exporter can't take out the whole sitemap.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { METROS, CATEGORY_ROUTE_SUFFIX } from '../../src/metro/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface MetroRoute {
  path: string;
  kind: 'metro-home' | 'metro-category' | 'metro-town';
  metroSlug: string;
  /** Source file whose git history stands in for this route's lastmod */
  sourceFile: string;
}

const routes: MetroRoute[] = [];

for (const metro of METROS) {
  const sourceFile = `src/metro/config/${
    metro.slug === 'dallas-fort-worth' ? 'dallasFortWorth' : metro.slug === 'long-island' ? 'longIsland' : metro.slug
  }.ts`;

  routes.push({
    path: `/${metro.slug}`,
    kind: 'metro-home',
    metroSlug: metro.slug,
    sourceFile,
  });

  for (const category of metro.categories) {
    routes.push({
      path: `/${metro.slug}/${category.slug}${CATEGORY_ROUTE_SUFFIX}`,
      kind: 'metro-category',
      metroSlug: metro.slug,
      sourceFile,
    });
  }

  for (const town of metro.towns) {
    routes.push({
      path: `/${metro.slug}/towns/${town.slug}`,
      kind: 'metro-town',
      metroSlug: metro.slug,
      sourceFile,
    });
  }
}

const outputPath = join(__dirname, 'metro-routes.json');
writeFileSync(outputPath, JSON.stringify(routes, null, 2) + '\n');
console.log(`Wrote ${routes.length} metro routes to ${outputPath}`);
