import { Item } from 'generated/prisma';

export interface IOrder {
  id: number;
  status: string;
  total: number;
  createdAt: Date;
  items: (Item & { quantity: number })[];
}
