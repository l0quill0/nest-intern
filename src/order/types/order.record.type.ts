import { Product } from 'src/product/product.record';
import { Order } from '../order.record';

export type TOrderProductParams = {
  product: Product;
  quantity: number;
};

export type TOrderQuery = {
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: string;
};

export type TOrderItemFrom = {
  quantity: number;
  id: number;
  title: string;
  image: string;
  price: number;
  createdAt: Date;
  isRemoved: boolean;
  description: string;
  category: {
    slug: string;
  };
};

export type TOrderViewParams = {
  items: Order[];
  currentPage: number;
  totalPages: number;
};
