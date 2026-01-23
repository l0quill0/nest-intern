import unidecode from 'unidecode';
import {
  TCategoryViewParams,
  TCategoryParams,
} from './types/category.record.type';

export class CategoryFactory {
  static create({ name, image }: { name: string; image: string }) {
    const slug = unidecode(name).toLowerCase();
    return new Category({ id: 0, name, slug, image });
  }
}

export class Category {
  id: number;
  name: string;
  slug: string;
  image: string;

  constructor(params: TCategoryParams) {
    this.id = params.id;
    this.name = params.name;
    this.slug = params.slug;
    this.image = params.image;
  }
}

export class CategoriesView {
  items: Category[];
  totalPages: number;
  currentPage: number;

  constructor(parameters: TCategoryViewParams) {
    this.items = parameters.items;
    this.totalPages = parameters.totalPages;
    this.currentPage = parameters.currentPage;
  }
}
