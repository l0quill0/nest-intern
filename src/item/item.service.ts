import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BaseItemDto } from './dto/base.item.dto';
import { PrismaService } from 'src/prisma.service';
import { Item, Prisma } from 'generated/prisma';
import { UpdateItemDto } from './dto/update.item.dto';
import { ITEM_NOT_FOUND } from './item.constants';
import { ItemPaginationOptionsDto } from './dto/item.pagination.options.dto';

@Injectable()
export class ItemService {
  constructor(private readonly prismaService: PrismaService) {}

  async paginateItems(options: ItemPaginationOptionsDto): Promise<any> {
    const { page, pageSize, search, priceMin, priceMax, sortBy, sortOrder } =
      options;

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
    const [totalItems, items] = await this.prismaService.$transaction([
      this.prismaService.item.count({ where }),
      this.prismaService.item.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
      }),
    ]);

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
    return await this.prismaService.item.findFirst({ where: { id } });
  }

  async createItem(data: BaseItemDto): Promise<Item> {
    return await this.prismaService.item.create({ data });
  }

  async updateItemInfo(id: number, data: UpdateItemDto): Promise<Item | null> {
    const item = await this.prismaService.item.findUnique({
      where: { id },
    });
    if (!item) {
      throw new HttpException(ITEM_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return await this.prismaService.item.update({
      where: { id },
      data,
    });
  }

  async updateItemImage(id: number, image: string): Promise<Item | null> {
    const item = await this.prismaService.item.findUnique({ where: { id } });
    if (!item) {
      throw new HttpException(ITEM_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return await this.prismaService.item.update({
      where: { id },
      data: { ...item, image },
    });
  }

  async deleteItem(id: number): Promise<Item | null> {
    const item = await this.prismaService.item.findUnique({ where: { id } });
    if (!item) {
      throw new HttpException(ITEM_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return await this.prismaService.item.delete({ where: { id } });
  }
}
