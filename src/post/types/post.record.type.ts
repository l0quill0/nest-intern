import { Region, Settlement } from '../post.record';

export type TRegionParams = {
  id: number;
  name: string;
};

export type TSettlementParams = {
  id: number;
  name: string;
  region: Region;
};

export type TPostParams = {
  id: number;
  name: string;
  status: string;
  settlement: Settlement;
};
