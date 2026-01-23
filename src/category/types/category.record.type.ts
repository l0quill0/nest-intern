import { Category } from '../category.record';

export type TCategoryParams = {
  id: number;
  name: string;
  slug: string;
  image: string;
};

export type TCategoryCreate = Omit<
  TCategoryParams,
  'id' | 'immutable' | 'slug'
>;

export type TCategoryViewParams = {
  items: Category[];
  totalPages: number;
  currentPage: number;
};

export type TCategoryQuery = {
  page: number;
  pageSize: number;
  search?: string;
};
