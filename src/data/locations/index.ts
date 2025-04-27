
import { DeliveryLocation } from '@/types/location.types';
import { texasLocations } from './texas';
import { westCoastLocations } from './west-coast';
import { midwestEastLocations } from './midwest-east';
import { southeastLocations } from './southeast';

export const deliveryLocations: DeliveryLocation[] = [
  ...texasLocations,
  ...westCoastLocations,
  ...midwestEastLocations,
  ...southeastLocations
];

export type { DeliveryLocation };
