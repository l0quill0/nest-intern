import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Item, Prisma } from 'generated/prisma';
import { UpdateItemDto } from './dto/update.item.dto';
import { ITEM_NOT_FOUND } from './item.constants';
import { ItemPaginationOptionsDto } from './dto/item.pagination.options.dto';
import { BucketService } from 'src/bucket/bucket.service';
import { CreateItemDto } from './dto/create.item.dto';
import { NON_EXISTANT_CATEGORY } from 'src/category/category.constants';
import 'multer';

@Injectable()
export class ItemService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly bucketService: BucketService,
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
    } = options;

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
    const orderBy: Prisma.ItemOrderByWithRelationInput = {
      [sortBy!]: sortOrder,
    };

    if (category && category.length > 0) {
      const categoryCondition: Prisma.ItemWhereInput[] = category.map(
        (name) => ({
          categories: {
            some: {
              name,
            },
          },
        }),
      );
      where.AND = categoryCondition;
    }

    const [totalItems, items] = await this.prismaService.$transaction(
      async (tx) => {
        const totalItems = await tx.item.count({ where });
        const items = await tx.item.findMany({
          where,
          orderBy,
          skip,
          take: pageSize,
        });
        return [totalItems, items];
      },
    );

    const totalPages = Math.ceil(totalItems / pageSize);
    return {
      data: items,
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: pageSize,
        totalPages,
        currentPage: page,
      },
    };
  }

  async getItemById(id: number): Promise<Item | null> {
    return await this.prismaService.item.findFirst({
      where: { id },
      include: { categories: true },
    });
  }

  async createItem(image: string, data: CreateItemDto): Promise<Item> {
    if (!data.categories || data.categories.length < 1) {
      data.categories = ['uncategorized'];
    } else {
      const existingCategories = await this.prismaService.category.findMany({
        where: {
          name: {
            in: data.categories,
          },
        },
      });

      if (existingCategories.length !== data.categories.length) {
        throw new HttpException(NON_EXISTANT_CATEGORY, HttpStatus.BAD_REQUEST);
      }
    }

    return await this.prismaService.item.create({
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        image,
        categories: {
          connect: data.categories.map((name) => ({ name })),
        },
      },
      include: { categories: true },
    });
  }

  async updateItemInfo(
    id: number,
    data: UpdateItemDto,
    file?: Express.Multer.File,
  ): Promise<Item | null> {
    const item = await this.prismaService.item.findUnique({
      where: { id },
    });
    if (!item) {
      throw new HttpException(ITEM_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    let imageName: string | undefined;

    if (data.categories) {
      if (data.categories.length < 1) {
        data.categories = ['uncategorized'];
      } else {
        const existingCategories = await this.prismaService.category.findMany({
          where: {
            name: {
              in: data.categories,
            },
          },
        });

        if (existingCategories.length !== data.categories.length) {
          throw new HttpException(
            NON_EXISTANT_CATEGORY,
            HttpStatus.BAD_REQUEST,
          );
        }
      }
    }

    if (file) {
      imageName = await this.bucketService.upload(
        file.filename,
        file.buffer,
        file.mimetype,
      );

      await this.bucketService.deleteItem(item.image);
    }

    return await this.prismaService.item.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        image: imageName,
        categories: {
          set: data.categories?.map((name) => ({ name })),
        },
      },
      include: {
        categories: true,
      },
    });
  }

  async deleteItem(id: number): Promise<Item | null> {
    const item = await this.prismaService.item.findUnique({ where: { id } });
    if (!item) {
      throw new HttpException(ITEM_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    await this.bucketService.deleteItem(item.image);

    return await this.prismaService.item.delete({ where: { id } });
  }
}
