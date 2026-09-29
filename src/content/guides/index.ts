import type { GuideContent } from './types';
import { hub } from './pages/hub';
import { cost } from './pages/cost';
import { bestGravel } from './pages/bestGravel';
import { howMuchGravel } from './pages/howMuchGravel';
import { depthAndLayers } from './pages/depthAndLayers';
import { crusherRunVs57VsFlexBase } from './pages/crusherRunVs57VsFlexBase';
import { maintenance } from './pages/maintenance';
import { dallasFortWorth } from './pages/dallasFortWorth';
import { gravelVsAsphaltCost } from './pages/gravelVsAsphaltCost';
import { installationSteps } from './pages/installationSteps';
import { gravelDrivewayDrainage } from './pages/gravelDrivewayDrainage';
import { stone57Vs8 } from './pages/stone57Vs8';
import { peaGravelProsCons } from './pages/peaGravelProsCons';
import { howLongGravelDrivewayLasts } from './pages/howLongGravelDrivewayLasts';
import { weedsAndErosionControl } from './pages/weedsAndErosionControl';
import { decomposedGraniteDriveways } from './pages/decomposedGraniteDriveways';
import { recycledConcreteAndMillings } from './pages/recycledConcreteAndMillings';
import { gravelParkingPadRvPad } from './pages/gravelParkingPadRvPad';
import { snowIcePlowingGravelDriveway } from './pages/snowIcePlowingGravelDriveway';
import { permitsAndHoaGravelDriveway } from './pages/permitsAndHoaGravelDriveway';
import { truckloadCoverageAndDeliveryMinimums } from './pages/truckloadCoverageAndDeliveryMinimums';
import { diyVsHireGravelDelivery } from './pages/diyVsHireGravelDelivery';

export type { GuideContent, GuideFaq, GuideHowToStep } from './types';
export {
  hub,
  cost,
  bestGravel,
  howMuchGravel,
  depthAndLayers,
  crusherRunVs57VsFlexBase,
  maintenance,
  dallasFortWorth,
  gravelVsAsphaltCost,
  installationSteps,
  gravelDrivewayDrainage,
  stone57Vs8,
  peaGravelProsCons,
  howLongGravelDrivewayLasts,
  weedsAndErosionControl,
  decomposedGraniteDriveways,
  recycledConcreteAndMillings,
  gravelParkingPadRvPad,
  snowIcePlowingGravelDriveway,
  permitsAndHoaGravelDriveway,
  truckloadCoverageAndDeliveryMinimums,
  diyVsHireGravelDelivery,
};

/** Wave 1 spokes (7), in original build order. */
export const WAVE_1_SPOKES: GuideContent[] = [
  cost,
  bestGravel,
  howMuchGravel,
  depthAndLayers,
  crusherRunVs57VsFlexBase,
  maintenance,
  dallasFortWorth,
];

/** Wave 2 spokes (13), in build order. See docs/metro/research/hub-wave2-plan.md. */
export const WAVE_2_SPOKES: GuideContent[] = [
  gravelVsAsphaltCost,
  installationSteps,
  gravelDrivewayDrainage,
  stone57Vs8,
  peaGravelProsCons,
  howLongGravelDrivewayLasts,
  weedsAndErosionControl,
  decomposedGraniteDriveways,
  recycledConcreteAndMillings,
  gravelParkingPadRvPad,
  snowIcePlowingGravelDriveway,
  permitsAndHoaGravelDriveway,
  truckloadCoverageAndDeliveryMinimums,
  diyVsHireGravelDelivery,
];

/** Every spoke (hub excluded). Used for tests, sitemaps and sibling-nav lists. */
export const GUIDE_SPOKES: GuideContent[] = [...WAVE_1_SPOKES, ...WAVE_2_SPOKES];

/** Every Gravel Driveway Hub page, hub first. Used for tests, sitemaps and sibling-nav lists. */
export const ALL_GUIDE_PAGES: GuideContent[] = [hub, ...GUIDE_SPOKES];

/** Spokes grouped for the hub page display, in a fixed, sensible display order. */
export const GUIDE_GROUPS: { name: string; spokes: GuideContent[] }[] = [
  { name: 'Cost & Planning', spokes: GUIDE_SPOKES.filter(s => s.group === 'Cost & Planning') },
  { name: 'Materials & Comparisons', spokes: GUIDE_SPOKES.filter(s => s.group === 'Materials & Comparisons') },
  { name: 'Build, Maintain & Fix', spokes: GUIDE_SPOKES.filter(s => s.group === 'Build, Maintain & Fix') },
  { name: 'Special Situations', spokes: GUIDE_SPOKES.filter(s => s.group === 'Special Situations') },
  { name: 'Metro Guides', spokes: GUIDE_SPOKES.filter(s => s.group === 'Metro Guides') },
  { name: 'More Guides', spokes: GUIDE_SPOKES.filter(s => !s.group) },
].filter(g => g.spokes.length > 0);
