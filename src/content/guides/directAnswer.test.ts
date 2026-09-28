import { describe, expect, it } from 'vitest';
import { ALL_GUIDE_PAGES } from './index';
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

  it('every page path starts with /gravel-driveways', () => {
    for (const page of ALL_GUIDE_PAGES) {
      expect(page.path.startsWith('/gravel-driveways')).toBe(true);
    }
  });

  it('all page paths are unique', () => {
    const paths = ALL_GUIDE_PAGES.map(page => page.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('only the maintenance guide declares HowTo steps', () => {
    const withSteps = ALL_GUIDE_PAGES.filter(page => (page.howToSteps?.length ?? 0) > 0);
    expect(withSteps.map(page => page.slug)).toEqual(['maintenance']);
  });
});

describe('countWords', () => {
  it('counts whitespace-delimited words', () => {
    expect(countWords('one two three')).toBe(3);
    expect(countWords('  leading and trailing  ')).toBe(3);
    expect(countWords('')).toBe(0);
  });
});
