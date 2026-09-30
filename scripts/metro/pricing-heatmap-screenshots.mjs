// One-off Playwright screenshot runner for the pricing heatmap. Not part of the
// generator's regular build (data + HTML come from pricing-heatmap.ts); this just
// drives the finished HTML in a real browser and saves PNGs for visual QA.
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = join(__dirname, '../../docs/metro/pricing/pricing-heatmap.html');
const url = pathToFileURL(htmlPath).toString();
const outDir = join(__dirname, '../../docs/metro/pricing/screenshots');
mkdirSync(outDir, { recursive: true });

async function setControls(page, { metro, zone, metric }) {
  if (metro) await page.selectOption('#ctl-metro', { label: metro });
  if (zone) await page.selectOption('#ctl-zone', { label: zone });
  if (metric) await page.selectOption('#ctl-metric', { label: metric });
  await page.waitForTimeout(150);
}

const browser = await chromium.launch();

// --- Desktop shots, light mode (default) ---
{
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
  await page.goto(url);

  await setControls(page, { metro: 'Dallas–Fort Worth', zone: 'DFW Core (Dallas & Tarrant) (min 3)', metric: 'vs broker median %' });
  await page.screenshot({ path: join(outDir, 'dfw-core-vs-broker.png') });

  await setControls(page, { metric: 'Gross profit $' });
  await page.screenshot({ path: join(outDir, 'dfw-core-gross-profit.png') });

  await setControls(page, { zone: 'DFW Outer (Rockwall, Kaufman, Ellis & Johnson) (min 3)', metric: 'Delivered total $' });
  await page.screenshot({ path: join(outDir, 'dfw-outer-delivered-total.png') });

  await setControls(page, { metro: 'Long Island', metric: 'Delivered total $' });
  // first LI zone is whatever loads by default after metro switch; set explicitly
  await page.selectOption('#ctl-zone', { index: 0 });
  await page.waitForTimeout(150);
  await page.screenshot({ path: join(outDir, 'li-first-zone-delivered-total.png') });

  await page.close();
}

// --- Dark mode shot ---
{
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 }, colorScheme: 'dark' });
  await page.goto(url);
  await setControls(page, { metro: 'Dallas–Fort Worth', zone: 'DFW Core (Dallas & Tarrant) (min 3)', metric: 'Gross profit $' });
  await page.screenshot({ path: join(outDir, 'dark-mode-dfw-core-gross-profit.png') });
  await page.close();
}

// --- Mobile shot ---
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(url);
  await setControls(page, { metro: 'Dallas–Fort Worth', zone: 'DFW Core (Dallas & Tarrant) (min 3)', metric: 'Delivered total $' });
  await page.screenshot({ path: join(outDir, 'mobile-dfw-core-delivered-total.png') });
  await page.screenshot({ path: join(outDir, 'mobile-dfw-core-delivered-total-fullpage.png'), fullPage: true });
  await page.close();
}

// --- QA-only shots: floor-applied metric + table view toggle (not part of the required set) ---
{
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
  await page.goto(url);
  await setControls(page, { metro: 'Dallas–Fort Worth', zone: 'DFW Core (Dallas & Tarrant) (min 3)', metric: 'Floor applied' });
  await page.screenshot({ path: join(outDir, 'qa-dfw-core-floor-applied.png') });

  await page.click('#ctl-tableview');
  await page.waitForTimeout(150);
  await page.screenshot({ path: join(outDir, 'qa-dfw-core-table-view.png') });
  await page.close();
}

await browser.close();
console.log('Screenshots written to', outDir);
