// Emits the list of metro routes (home / category / town pages) as JSON on stdout.
//
// Why this file exists: src/metro/config/** is plain TypeScript (no JSX, only relative
// imports — verified before writing this) that the rest of the metro-pivot work owns.
// generate-prerender-routes.mjs is a plain Node ESM script and can't import .ts files
// directly, so it spawns `npx tsx` against this tiny file instead of duplicating the
// metro/category/town route-building logic in JS. Keep this file import-only — it must
// never diverge from METROS' actual shape, since the whole point is reusing the same
// source of truth src/App.tsx renders routes from.
//
// Run standalone: npx tsx scripts/prerender/routes/metro-routes.ts

import { CATEGORY_ROUTE_SUFFIX, METROS } from '../../../src/metro/config';

const routes: string[] = [];

for (const metro of METROS) {
  routes.push(`/${metro.slug}`);

  for (const category of metro.categories) {
    routes.push(`/${metro.slug}/${category.slug}${CATEGORY_ROUTE_SUFFIX}`);
  }

  for (const town of metro.towns) {
    routes.push(`/${metro.slug}/towns/${town.slug}`);
  }
}

process.stdout.write(JSON.stringify(routes));
