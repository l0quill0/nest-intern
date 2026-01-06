import { Item } from 'generated/prisma';

export interface IOrder {
  id: number;
  status: string;
  total: number;
  createdAt: Date;
  postOffice?: {
    name?: string;
    settlement?: string;
    region?: string;
  };
  items: (Item & { quantity: number })[];
}
