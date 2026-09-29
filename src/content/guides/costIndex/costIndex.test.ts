import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { countWords } from '@/content/guides/wordCount';
import { costIndexRows, costIndexMeta } from './costIndexData';
import { title, description, directAnswer, faqs, PATH } from './content';
import { costIndexDatasetJsonLd, costIndexArticleJsonLd } from './schema';

describe('Gravel Driveway Cost Index content', () => {
  it('has a 40-60 word direct answer', () => {
    const words = countWords(directAnswer);
    expect(words).toBeGreaterThanOrEqual(40);
    expect(words).toBeLessThanOrEqual(60);
  });

  it('has a title <=60 characters', () => {
    expect(title.length).toBeLessThanOrEqual(60);
  });

  it('has a meta description <=155 characters', () => {
    expect(description.length).toBeLessThanOrEqual(155);
  });

  it('has at least 5 FAQs and at most 8', () => {
    expect(faqs.length).toBeGreaterThanOrEqual(5);
    expect(faqs.length).toBeLessThanOrEqual(8);
  });

  it('path starts with /gravel-driveways', () => {
    expect(PATH.startsWith('/gravel-driveways')).toBe(true);
  });
});

describe('Cost index data rows', () => {
  it('has 22 materials', () => {
    expect(costIndexRows.length).toBe(22);
  });

  it('every row has a unique slug', () => {
    const slugs = costIndexRows.map(row => row.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('every row with yard stats has n >= 1 and min <= median <= max', () => {
    for (const row of costIndexRows) {
      if (!row.yard) continue;
      expect(row.yard.n).toBeGreaterThanOrEqual(1);
      expect(row.yard.min).toBeLessThanOrEqual(row.yard.median);
      expect(row.yard.median).toBeLessThanOrEqual(row.yard.max);
    }
  });

  it('every row with broker-delivered stats has n >= 1 and min <= median <= max', () => {
    for (const row of costIndexRows) {
      if (!row.brokerDelivered) continue;
      expect(row.brokerDelivered.n).toBeGreaterThanOrEqual(1);
      expect(row.brokerDelivered.min).toBeLessThanOrEqual(row.brokerDelivered.median);
      expect(row.brokerDelivered.median).toBeLessThanOrEqual(row.brokerDelivered.max);
    }
  });

  it('every row has at least one of yard or brokerDelivered populated', () => {
    for (const row of costIndexRows) {
      expect(row.yard !== null || row.brokerDelivered !== null).toBe(true);
    }
  });

  it('meta has a real (non-placeholder) sample date range and seller count', () => {
    expect(costIndexMeta.sampleStartDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(costIndexMeta.sampleEndDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(costIndexMeta.totalSellers).toBeGreaterThanOrEqual(20);
  });
});

describe('CSV distribution', () => {
  const csvPath = join(process.cwd(), 'public', 'data', 'gravel-driveway-cost-index-dfw-2026-q3.csv');

  it('exists at the path referenced by costIndexMeta.csvUrl', () => {
    expect(costIndexMeta.csvUrl).toBe('/data/gravel-driveway-cost-index-dfw-2026-q3.csv');
    expect(existsSync(csvPath)).toBe(true);
  });

  it('row count matches the data module (header + 22 rows)', () => {
    const raw = readFileSync(csvPath, 'utf8');
    const lines = raw.trim().split('\n');
    expect(lines.length).toBe(costIndexRows.length + 1);
  });
});

describe('Dataset JSON-LD', () => {
  const dataset = costIndexDatasetJsonLd(costIndexRows);

  it('has the required Google Dataset fields: name and description (50-5000 chars)', () => {
    expect(dataset.name.length).toBeGreaterThan(0);
    expect(dataset.description.length).toBeGreaterThanOrEqual(50);
    expect(dataset.description.length).toBeLessThanOrEqual(5000);
  });

  it('has the recommended fields populated', () => {
    expect(dataset.url).toContain('/gravel-driveways/cost-index');
    expect(dataset.creator).toBeTruthy();
    expect(dataset.license).toContain('creativecommons.org');
    expect(dataset.temporalCoverage).toMatch(/^\d{4}-\d{2}-\d{2}\/\d{4}-\d{2}-\d{2}$/);
    expect(dataset.spatialCoverage).toEqual({ '@type': 'Place', name: 'Dallas–Fort Worth, TX' });
    expect(dataset.variableMeasured.length).toBe(costIndexRows.length);
    expect(dataset.distribution.contentUrl).toContain('gravel-driveway-cost-index-dfw-2026-q3.csv');
    expect(dataset.distribution.encodingFormat).toBe('text/csv');
    expect(dataset.dateModified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('Article JSON-LD has a real headline, author and dateModified', () => {
    const article = costIndexArticleJsonLd();
    expect(article.headline.length).toBeGreaterThan(0);
    expect(article.author).toBeTruthy();
    expect(article.dateModified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
