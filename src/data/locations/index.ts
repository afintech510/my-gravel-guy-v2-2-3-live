
import { DeliveryLocation } from '@/types/location.types';
import { texasLocations } from './texas';
import { westCoastLocations } from './west-coast';
import { midwestEastLocations } from './midwest-east';
import { southeastLocations } from './southeast';
import { centralLocations } from './central';

export const deliveryLocations: DeliveryLocation[] = [
  ...texasLocations,
  ...westCoastLocations,
  ...midwestEastLocations,
  ...southeastLocations,
  ...centralLocations
];

export type { DeliveryLocation };
