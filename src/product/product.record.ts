import { Prisma } from 'generated/prisma';
import { prisma } from '../prisma.activeRecord';
import { Category } from 'src/category/category.record';
import { Comment } from 'src/comments/comment.record';
import {
  TAddComment,
  TProductCreate,
  TProductQuery,
  TProductParameters,
  TProductsViewParameters,
} from './types/product.record.type';
import { User } from 'src/user/user.record';
import { TCommentQuery } from 'src/comments/types/comment.record.type';
import CategoryRepository from 'src/category/category.repository';

export class ProductsView {
  items: Product[];
  totalPages: number;
  currentPage: number;

  constructor(parameters: TProductsViewParameters) {
    this.items = parameters.items;
    this.totalPages = parameters.totalPages;
    this.currentPage = parameters.currentPage;
  }
}

export class Product {
  public readonly id: number;
  public title: string;
  public image: string;
  public price: number;
  public readonly createdAt: Date;
  public category: Category;
  public isRemoved: boolean;
  public description: string;

  constructor(parameters: TProductParameters) {
    this.id = parameters.id;
    this.title = parameters.title;
    this.image = parameters.image;
    this.price = parameters.price;
    this.category = parameters.category;
    this.isRemoved = parameters.isRemoved;
    this.description = parameters.description;
  }

  static async getByQuery(query: TProductQuery) {
    const {
      page,
      pageSize,
      search,
      priceMin,
      priceMax,
      sortBy,
      sortOrder,
      category,
      showRemoved,
    } = query;

    const skip = (page - 1) * pageSize;
    const where: Prisma.ItemWhereInput = {};
    const priceConditions: { gte?: number; lte?: number } = {};
    if (priceMin !== undefined) {
      priceConditions.gte = priceMin;
    }
    if (priceMax !== undefined) {
      priceConditions.lte = priceMax;
    }
    if (Object.keys(priceConditions).length > 0) {
      where.price = priceConditions;
    }
    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }
    let orderBy: Prisma.ItemOrderByWithRelationInput | undefined = undefined;

    if (sortBy && typeof sortBy === 'string') {
      orderBy = { [sortBy]: sortOrder ?? 'asc' };
    }

    where.isRemoved = showRemoved ? undefined : false;

    if (category && category.length > 0) {
      where.category = {
        slug: {
          in: category,
        },
      };
    }

    const [totalItems, items] = await prisma.$transaction(async (tx) => {
      const totalItems = await tx.item.count({ where });
      const items = await tx.item.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          category: true,
        },
      });
      return [totalItems, items];
    });

    const totalPages = Math.ceil(totalItems / pageSize);

    return new ProductsView({
      items: items.map(
        (item) =>
          new Product({
            ...item,
            category: CategoryRepository.getBySlug(item.category.slug)!,
          }),
      ),
      totalPages,
      currentPage: page,
    });
  }

  static async create(data: TProductCreate) {
    const res = await prisma.item.create({
      data: {
        ...data,
        category: {
          connect: {
            id: data.category.id,
          },
        },
      },
      include: { category: true },
    });

    return new Product({
      ...res,
      category: CategoryRepository.getBySlug(res.category.slug)!,
    });
  }

  static async getById(id: number) {
    const res = await prisma.item.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!res) return undefined;

    return new Product({
      ...res,
      category: CategoryRepository.getBySlug(res.category.slug)!,
    });
  }

  async update() {
    const data = this.getFields();

    await prisma.item.update({
      where: { id: this.id },
      data: {
        ...data,
        category: {
          connect: {
            id: data.category.id,
          },
        },
      },
    });
    return this;
  }

  async getScore() {
    const score = await prisma.comment.aggregate({
      where: { itemId: this.id },
      _count: {
        _all: true,
      },
      _avg: {
        score: true,
      },
    });
    return { count: score._count._all, avg: score._avg.score };
  }

  async isInFavourites(userId: number) {
    const isFavourite = await prisma.item.findFirst({
      where: {
        id: this.id,
        favouriteOf: {
          some: {
            userId,
          },
        },
      },
      include: { favouriteOf: true },
    });

    return !!isFavourite;
  }

  async suggestion(itemCount: number) {
    const suggestions = await prisma.item.findMany({
      where: {
        NOT: [{ id: this.id }, { isRemoved: true }],
        AND: [{ categoryId: this.category.id }],
      },
      include: { category: true },
      omit: { categoryId: true },
      take: itemCount,
    });

    return suggestions.map(
      (item) =>
        new Product({
          ...item,
          category: CategoryRepository.getBySlug(item.category.slug)!,
        }),
    );
  }

  async archive() {
    await prisma.item.update({
      where: { id: this.id },
      data: { isRemoved: true },
    });
    return this;
  }

  async unArchive() {
    await prisma.item.update({
      where: { id: this.id },
      data: { isRemoved: false },
    });
    return this;
  }

  async getComments(query: TCommentQuery) {
    return await Comment.getByQuery(this.id, query);
  }

  async addComment(user: User, data: TAddComment) {
    return await Comment.create({ itemId: this.id, userId: user.id, ...data });
  }

  async deleteComment(id: number) {
    const comment = await Comment.getById(id);
    if (!comment) throw new Error(`Comment not found ${id}`);
    await comment.delete();
    return this;
  }

  private getFields() {
    return {
      title: this.title,
      price: this.price,
      image: this.image,
      category: this.category,
      description: this.description,
    };
  }
}
