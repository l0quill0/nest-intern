import { prisma } from 'src/prisma.activeRecord';
import { CategoriesView, Category } from './category.record';
import { TCategoryQuery } from './types/category.record.type';

class CategoryRepositoryRegister extends Map<string, Category> {
  constructor(categories: [string, Category][]) {
    super(categories);
  }

  getChunk(skip: number, length: number): Category[] {
    let i = 0;
    const result: Category[] = [];
    for (const category of this.values()) {
      if (i++ >= skip) {
        result.push(category);
      }
      if (result.length >= length) {
        break;
      }
    }
    return result;
  }
}

export class CategoryRepository {
  protected register: CategoryRepositoryRegister;
  protected initialized: boolean = false;

  constructor() {
    this.register = new CategoryRepositoryRegister([]);
  }

  async init() {
    const items = await prisma.category.findMany({
      orderBy: { ['name']: 'asc' },
    });
    items.forEach((item) => this.register.set(item.slug, new Category(item)));
  }

  getAll() {
    return [...this.register.values()];
  }

  getBySlug(slug: string) {
    return this.register.get(slug);
  }

  async getByQuery(query: TCategoryQuery) {
    const { page, pageSize, search } = query;
    const skip = (page - 1) * pageSize;

    if (search) {
      const slugs = await prisma.category.findMany({
        where: { name: { contains: search, mode: 'insensitive' } },
        orderBy: { ['name']: 'asc' },
      });
      return new CategoriesView({
        items: slugs.map((category) => this.register.get(category.slug)!),
        totalPages: slugs.length / pageSize,
        currentPage: page,
      });
    }

    return new CategoriesView({
      items: this.register.getChunk(skip, pageSize),
      totalPages: this.register.size / pageSize,
      currentPage: page,
    });
  }

  async add(category: Category) {
    await prisma.category.create({ data: category });
    this.register.set(category.slug, category);
    return category;
  }

  async update(category: Category) {
    this.register.set(category.slug, category);
    return await prisma.category.update({
      where: { id: category.id },
      data: category,
    });
  }

  async delete(category: Category) {
    this.register.delete(category.slug);

    return await prisma.$transaction(async (tx) => {
      await tx.item.updateMany({
        where: { categoryId: category.id },
        data: { categoryId: 1 },
      });
      await tx.category.delete({ where: { id: category.id } });
    });
  }
}

export default new CategoryRepository();
