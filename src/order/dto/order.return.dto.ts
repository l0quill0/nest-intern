import { Item } from 'generated/prisma';

export interface IOrder {
  id: number;
  status: string;
  total: number;
  createdAt: Date;
  postOffice: string | null;
  items: (Item & { quantity: number })[];
}
