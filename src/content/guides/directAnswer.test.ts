import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ALL_GUIDE_PAGES, GUIDE_SPOKES, GUIDE_GROUPS } from './index';
import { countWords } from './wordCount';

describe('Gravel Driveway Hub guide content', () => {
  it.each(ALL_GUIDE_PAGES.map(page => [page.path, page]))(
    '%s has a 40-60 word direct answer',
    (_path, page) => {
      const words = countWords(page.directAnswer);
      expect(words).toBeGreaterThanOrEqual(40);
      expect(words).toBeLessThanOrEqual(60);
    },
  );

  it.each(ALL_GUIDE_PAGES.map(page => [page.path, page]))('%s has a title <=60 characters', (_path, page) => {
    expect(page.title.length).toBeLessThanOrEqual(60);
  });

  it.each(ALL_GUIDE_PAGES.map(page => [page.path, page]))(
    '%s has a meta description <=155 characters',
    (_path, page) => {
      expect(page.description.length).toBeLessThanOrEqual(155);
    },
  );

  it.each(ALL_GUIDE_PAGES.map(page => [page.path, page]))('%s has at least 4 FAQs', (_path, page) => {
    expect(page.faqs.length).toBeGreaterThanOrEqual(4);
  });

  it.each(GUIDE_SPOKES.map(page => [page.path, page]))('%s has at most 10 FAQs', (_path, page) => {
    expect(page.faqs.length).toBeLessThanOrEqual(10);
  });

  it('every page path starts with /gravel-driveways', () => {
    for (const page of ALL_GUIDE_PAGES) {
      expect(page.path.startsWith('/gravel-driveways')).toBe(true);
    }
  });

  it('all page paths are unique', () => {
    const paths = ALL_GUIDE_PAGES.map(page => page.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('all slugs are unique', () => {
    const slugs = ALL_GUIDE_PAGES.map(page => page.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('only these guides declare HowTo steps (maintenance + Wave 2 procedural spokes)', () => {
    const withSteps = ALL_GUIDE_PAGES.filter(page => (page.howToSteps?.length ?? 0) > 0);
    expect(new Set(withSteps.map(page => page.slug))).toEqual(
      new Set(['maintenance', 'installation-steps', 'gravel-driveway-drainage', 'weeds-and-erosion-control']),
    );
  });

  it('every spoke is linked from the hub (present in GUIDE_SPOKES / GUIDE_GROUPS)', () => {
    // GravelDrivewayHub.tsx renders every entry in GUIDE_GROUPS, which is derived
    // entirely from GUIDE_SPOKES — so proving every spoke ends up in a group proves
    // the hub page links it, without needing to render the component.
    const groupedPaths = GUIDE_GROUPS.flatMap(g => g.spokes.map(s => s.path));
    const spokePaths = GUIDE_SPOKES.map(s => s.path);
    expect(new Set(groupedPaths)).toEqual(new Set(spokePaths));
  });

  it('every spoke declares a hub-page group', () => {
    for (const spoke of GUIDE_SPOKES) {
      expect(spoke.group, `${spoke.path} is missing a group`).toBeTruthy();
    }
  });

  it('every guide route (hub, spokes, and the Cost Index) is listed in scripts/prerender/extra-routes.json', () => {
    const extraRoutesPath = path.join(process.cwd(), 'scripts/prerender/extra-routes.json');
    const extraRoutes: string[] = JSON.parse(readFileSync(extraRoutesPath, 'utf8'));
    const expectedPaths = [...ALL_GUIDE_PAGES.map(page => page.path), '/gravel-driveways/cost-index'];
    for (const expectedPath of expectedPaths) {
      expect(extraRoutes, `${expectedPath} missing from extra-routes.json`).toContain(expectedPath);
    }
  });
});

describe('countWords', () => {
  it('counts whitespace-delimited words', () => {
    expect(countWords('one two three')).toBe(3);
    expect(countWords('  leading and trailing  ')).toBe(3);
    expect(countWords('')).toBe(0);
  });
});
