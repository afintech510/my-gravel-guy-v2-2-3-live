import type { CategorySlug, Metro } from '../types';
import { dallasFortWorth } from './dallasFortWorth';
import { longIsland } from './longIsland';

export { dallasFortWorth, longIsland };

export const METROS: Metro[] = [dallasFortWorth, longIsland];

export const getMetro = (slug: string): Metro | undefined =>
  METROS.find(m => m.slug === slug);

/** Route suffix used for category landing pages, e.g. /dallas-fort-worth/mulch-delivery */
export const CATEGORY_ROUTE_SUFFIX = '-delivery';

const CATEGORY_SLUGS: CategorySlug[] = ['gravel', 'mulch', 'sand', 'soil'];

/** 'mulch-delivery' -> 'mulch'; returns undefined for anything that isn't a known category route segment */
export const categoryFromRouteSegment = (segment: string): CategorySlug | undefined => {
  if (!segment.endsWith(CATEGORY_ROUTE_SUFFIX)) return undefined;
  const base = segment.slice(0, -CATEGORY_ROUTE_SUFFIX.length);
  return CATEGORY_SLUGS.find(slug => slug === base);
};
