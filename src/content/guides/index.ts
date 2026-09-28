import type { GuideContent } from './types';
import { hub } from './pages/hub';
import { cost } from './pages/cost';
import { bestGravel } from './pages/bestGravel';
import { howMuchGravel } from './pages/howMuchGravel';
import { depthAndLayers } from './pages/depthAndLayers';
import { crusherRunVs57VsFlexBase } from './pages/crusherRunVs57VsFlexBase';
import { maintenance } from './pages/maintenance';
import { dallasFortWorth } from './pages/dallasFortWorth';

export type { GuideContent, GuideFaq, GuideHowToStep } from './types';
export { hub, cost, bestGravel, howMuchGravel, depthAndLayers, crusherRunVs57VsFlexBase, maintenance, dallasFortWorth };

/** The 7 spokes, in Wave-1 build order (excludes the hub). */
export const GUIDE_SPOKES: GuideContent[] = [
  cost,
  bestGravel,
  howMuchGravel,
  depthAndLayers,
  crusherRunVs57VsFlexBase,
  maintenance,
  dallasFortWorth,
];

/** Every Gravel Driveway Hub page, hub first. Used for tests, sitemaps and sibling-nav lists. */
export const ALL_GUIDE_PAGES: GuideContent[] = [hub, ...GUIDE_SPOKES];
