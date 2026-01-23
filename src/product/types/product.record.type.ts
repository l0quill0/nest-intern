import { TCreateComment } from 'src/comments/types/comment.record.type';
import { Product } from '../product.record';
import { Category } from 'src/category/category.record';

export type TProductParameters = {
  id: number;
  title: string;
  price: number;
  image: string;
  category: Category;
  createdAt: Date;
  isRemoved: boolean;
  description: string;
};

export type TProductCreate = Omit<
  TProductParameters,
  'id' | 'isRemoved' | 'createdAt'
>;

export type TProductsViewParameters = {
  items: Product[];
  totalPages: number;
  currentPage: number;
};

export type TProductQuery = {
  page: number;
  search?: string;
  sortBy: string;
  category?: string[];
  pageSize: number;
  priceMin?: number;
  priceMax?: number;
  sortOrder: string;
  showRemoved?: boolean;
};

export type TAddComment = Omit<TCreateComment, 'itemId' | 'userId'>;
