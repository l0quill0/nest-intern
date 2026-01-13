import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Category, Prisma } from 'generated/prisma';
import { UpdateItemDto } from './dto/update.item.dto';
import { ITEM_NOT_FOUND } from './item.constants';
import { ItemPaginationOptionsDto } from './dto/item.pagination.options.dto';
import { BucketService } from 'src/bucket/bucket.service';
import { CreateItemDto } from './dto/create.item.dto';
import { NON_EXISTANT_CATEGORY } from 'src/category/category.constants';
import 'multer';
import { CategoryService } from 'src/category/category.service';
import { ItemCacheService } from 'src/item-cache/item-cache.service';
import { USER_NOT_FOUND } from 'src/user/user.constants';
import { CommentPaginationDto } from './dto/comment.pagination.dto';
import { IUserJWT } from 'src/auth/guards/role.guard';

@Injectable()
export class ItemService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly bucketService: BucketService,
    private readonly categoryService: CategoryService,
    private readonly itemCacheService: ItemCacheService,
  ) {}

  async paginateItems(options: ItemPaginationOptionsDto) {
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
    } = options;

    const cached =
      Object.keys(options).filter(
        (k) => options[k] !== undefined && options[k] !== 'category',
      ).length === 0 &&
      (category === undefined ||
        (category.length === 1 &&
          this.categoryService.validateCategories(category)));

    const cacheKey = category?.join('');

    if (cached) {
      const cachedData = await this.itemCacheService.getItemCache(cacheKey);
      if (cachedData) return cachedData;
    }

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

    const [totalItems, items] = await this.prismaService.$transaction(
      async (tx) => {
        const totalItems = await tx.item.count({ where });
        const items = await tx.item.findMany({
          where,
          orderBy,
          skip,
          take: pageSize,
          omit: { categoryId: true },
          include: {
            category: {
              select: {
                name: true,
              },
            },
          },
        });
        return [totalItems, items];
      },
    );

    const totalPages = Math.ceil(totalItems / pageSize);

    const returnValue = {
      data: items,
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: pageSize,
        totalPages,
        currentPage: page,
      },
    };

    if (cached) await this.itemCacheService.setItemCache(returnValue, cacheKey);

    return returnValue;
  }

  async getItemById(id: number, userId?: number) {
    const item = await this.prismaService.item.findUnique({
      where: { id },
      include: {
        category: { select: { name: true, slug: true } },
      },
      omit: { categoryId: true },
    });

    if (!item) {
      throw new HttpException(ITEM_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const score = await this.prismaService.comment.aggregate({
      where: { itemId: id },
      _count: {
        _all: true,
      },
      _avg: {
        score: true,
      },
    });

    const isFavourite = await this.prismaService.item.findFirst({
      where: {
        id,
        favouriteOf: {
          some: {
            userId,
          },
        },
      },
      include: { favouriteOf: true },
    });

    return {
      ...item,
      score: { count: score._count._all, avg: score._avg.score },
      isInFavourite: !!isFavourite,
    };
  }

  async createItem(file: Express.Multer.File, data: CreateItemDto) {
    const category = await this.prismaService.category.findFirst({
      where: {
        slug: data.category,
      },
    });

    if (!category) {
      throw new HttpException(NON_EXISTANT_CATEGORY, HttpStatus.BAD_REQUEST);
    }

    const image = await this.bucketService.upload(
      file.originalname,
      file.buffer,
      file.mimetype,
    );

    await this.itemCacheService.clearItemCache(data.category);

    return await this.prismaService.item.create({
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        image,
        categoryId: category.id,
      },
    });
  }

  async getSuggestions(itemId: number, itemCount: number) {
    const item = await this.prismaService.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new HttpException(ITEM_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const suggestions = await this.prismaService.item.findMany({
      where: {
        NOT: [{ id: item.id }, { isRemoved: true }],
        AND: [{ categoryId: item.categoryId }],
      },
      include: { category: true },
      omit: { categoryId: true },
      take: itemCount,
    });

    return suggestions;
  }

  async updateItemInfo(
    id: number,
    data: UpdateItemDto,
    file?: Express.Multer.File,
  ) {
    const item = await this.prismaService.item.findUnique({
      where: { id },
      include: {
        category: { select: { slug: true } },
      },
    });
    if (!item || item.isRemoved) {
      throw new HttpException(ITEM_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    let imageName: string | undefined;

    let category: Category | null = null;

    if (data.category) {
      category = await this.prismaService.category.findFirst({
        where: {
          slug: data.category,
        },
      });

      if (!category) {
        throw new HttpException(NON_EXISTANT_CATEGORY, HttpStatus.BAD_REQUEST);
      }

      await this.itemCacheService.clearItemCache(data.category);
    }

    if (file) {
      imageName = await this.bucketService.upload(
        file.originalname,
        file.buffer,
        file.mimetype,
      );

      await this.bucketService.deleteItem(item.image);
    }

    await this.itemCacheService.clearItemCache(item.category.slug);

    return await this.prismaService.item.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        image: imageName,
        categoryId: category ? category.id : undefined,
      },
    });
  }

  async restoreItem(id: number) {
    const item = await this.prismaService.item.findUnique({
      where: { id },
      include: { category: { select: { slug: true } } },
    });
    if (!item) {
      throw new HttpException(ITEM_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    await this.itemCacheService.clearItemCache(item.category.slug);

    return await this.prismaService.item.update({
      where: { id },
      data: {
        isRemoved: false,
      },
    });
  }

  async deleteItem(id: number) {
    const item = await this.prismaService.item.findUnique({
      where: { id },
      include: { category: { select: { slug: true } } },
    });
    if (!item) {
      throw new HttpException(ITEM_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    await this.itemCacheService.clearItemCache(item.category.slug);

    return await this.prismaService.item.update({
      where: { id },
      data: { isRemoved: true },
    });
  }

  async addComment(
    text: string,
    score: number,
    itemId: number,
    userId: number,
  ) {
    const item = await this.prismaService.item.findUnique({
      where: { id: itemId },
    });
    if (!item) throw new HttpException(ITEM_NOT_FOUND, HttpStatus.NOT_FOUND);
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new HttpException(USER_NOT_FOUND, HttpStatus.NOT_FOUND);

    return await this.prismaService.comment.create({
      data: { text, score, itemId, userId },
    });
  }

  async getComments(itemId: number, { page, pageSize }: CommentPaginationDto) {
    const item = await this.prismaService.item.findUnique({
      where: { id: itemId },
    });
    if (!item) throw new HttpException(ITEM_NOT_FOUND, HttpStatus.NOT_FOUND);

    const skip = pageSize * (page - 1);

    const [totalItems, items] = await this.prismaService.$transaction(
      async (tx) => {
        const totalItems = await tx.comment.count({
          where: { itemId },
        });
        const items = await tx.comment.findMany({
          where: { itemId },
          include: {
            user: {
              select: { name: true },
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
      },
    );

    const totalPages = Math.ceil(totalItems / pageSize);

    return {
      items: items.map((c) => ({ ...c, user: c.user.name })),
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: pageSize,
        totalPages,
        currentPage: page,
      },
    };
  }

  async deleteComment(id: number, userReq: IUserJWT) {
    const comment = await this.prismaService.comment.findUnique({
      where: { id },
    });
    if (!comment)
      throw new HttpException('COMMENT_NOT_FOUND', HttpStatus.NOT_FOUND);
    const user = await this.prismaService.user.findUnique({
      where: { id: userReq.sub },
    });
    if (!user) throw new HttpException('USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    if (comment.userId !== userReq.sub && user.role !== 'ADMIN')
      throw new HttpException('FORBIDDEN', HttpStatus.FORBIDDEN);

    return await this.prismaService.comment.delete({ where: { id } });
  }
}
