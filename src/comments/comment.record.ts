import { prisma } from 'src/prisma.activeRecord';
import {
  TCommentAuthorParams,
  TCommentColletionParams,
  TCommentQuery,
  TCommentParams,
  TCreateComment,
} from './types/comment.record.type';

export class CommentAuthor {
  id: number;
  name: string;

  constructor(params: TCommentAuthorParams) {
    this.id = params.id;
    this.name = params.name;
  }
}

export class CommentView {
  items: Comment[];
  totalPages: number;
  currentPage: number;
  constructor(params: TCommentColletionParams) {
    this.items = params.items;
    this.totalPages = params.totalPages;
    this.currentPage = params.currentPage;
  }
}

export class Comment {
  id: number;
  text: string;
  score: number;
  author: CommentAuthor;

  constructor(params: TCommentParams) {
    this.id = params.id;
    this.text = params.text;
    this.score = params.score;
    this.author = params.author;
  }

  static async create(data: TCreateComment) {
    const res = await prisma.comment.create({
      data,
      include: { user: { select: { name: true, id: true } } },
    });
    return new Comment({
      ...res,
      author: new CommentAuthor(res.user),
      score: res.score.toNumber(),
    });
  }

  static async getById(id: number) {
    const res = await prisma.comment.findUnique({
      where: { id },
      include: { user: { select: { name: true, id: true } } },
    });

    if (!res) return undefined;

    return new Comment({
      ...res,
      score: res.score.toNumber(),
      author: res.user,
    });
  }

  static async getByQuery(productId: number, query: TCommentQuery) {
    const { page, pageSize } = query;

    const skip = pageSize * (page - 1);

    const [totalItems, items] = await prisma.$transaction(async (tx) => {
      const totalItems = await tx.comment.count({
        where: { itemId: productId },
      });
      const items = await tx.comment.findMany({
        where: { itemId: productId },
        include: {
          user: {
            select: { name: true, id: true },
          },
        },
        omit: {
          itemId: true,
        },
        take: pageSize,
        skip,
        orderBy: { id: 'desc' },
      });
      return [totalItems, items];
    });
    const totalPages = Math.ceil(totalItems / pageSize);

    return new CommentView({
      items: items.map(
        (item) =>
          new Comment({
            ...item,
            score: item.score.toNumber(),
            author: item.user,
          }),
      ),
      currentPage: page,
      totalPages,
    });
  }

  async delete() {
    return await prisma.comment.delete({ where: { id: this.id } });
  }
}
