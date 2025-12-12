import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Prisma } from 'generated/prisma';
import { UpdateItemDto } from './dto/update.item.dto';
import { ITEM_NOT_FOUND } from './item.constants';
import { ItemPaginationOptionsDto } from './dto/item.pagination.options.dto';
import { BucketService } from 'src/bucket/bucket.service';
import { CreateItemDto } from './dto/create.item.dto';
import { NON_EXISTANT_CATEGORY } from 'src/category/category.constants';
import 'multer';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { CacheKeys } from 'src/cache.keys';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class ItemService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly prismaService: PrismaService,
    private readonly bucketService: BucketService,
    private readonly redisService: RedisService,
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

    const cacheKey = CacheKeys.ITEMLISTPAGINATION(
      page,
      pageSize,
      search,
      priceMin,
      priceMax,
      sortBy,
      sortOrder,
      category,
      showRemoved,
    );

    const cachedData = await this.cacheManager.get(cacheKey);

    if (cachedData) return cachedData;

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
        name: {
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
    await this.cacheManager.set(cacheKey, returnValue);

    return returnValue;
  }

  async getItemById(id: number, userId?: number) {
    const cacheKey = CacheKeys.ITEM(id);
    const cachedData = await this.cacheManager.get(cacheKey);

    if (cachedData) return cachedData;

    const item = await this.prismaService.item.findUnique({
      where: { id },
    });

    const isFavourite = await this.prismaService.item.findUnique({
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

    if (item && !item.isRemoved)
      await this.cacheManager.set(cacheKey, {
        ...item,
        isInFavourite: !!isFavourite,
      });

    return {
      ...item,
      isInFavourite: !!isFavourite,
    };
  }

  async createItem(file: Express.Multer.File, data: CreateItemDto) {
    if (!data.category) {
      data.category = 'Інше';
    } else {
      const category = await this.prismaService.category.findUnique({
        where: {
          name: data.category,
        },
      });

      if (!category) {
        throw new HttpException(NON_EXISTANT_CATEGORY, HttpStatus.BAD_REQUEST);
      }
    }

    const image = await this.bucketService.upload(
      file.originalname,
      file.buffer,
      file.mimetype,
    );

    await this.redisService.clearByPattern(CacheKeys.ITEMLISTPATTERN());

    return await this.prismaService.item.create({
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        image,
        categoryName: data.category,
      },
    });
  }

  async updateItemInfo(
    id: number,
    data: UpdateItemDto,
    file?: Express.Multer.File,
  ) {
    const item = await this.prismaService.item.findUnique({
      where: { id },
    });
    if (!item || item.isRemoved) {
      throw new HttpException(ITEM_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    let imageName: string | undefined;

    if (data.category) {
      const category = await this.prismaService.category.findUnique({
        where: {
          name: data.category,
        },
      });

      if (!category) {
        throw new HttpException(NON_EXISTANT_CATEGORY, HttpStatus.BAD_REQUEST);
      }
    }

    if (file) {
      imageName = await this.bucketService.upload(
        file.originalname,
        file.buffer,
        file.mimetype,
      );

      await this.bucketService.deleteItem(item.image);
    }

    await this.cacheManager.del(CacheKeys.ITEM(id));
    await this.redisService.clearByPattern(CacheKeys.ITEMLISTPATTERN());
    await this.redisService.clearByPattern(CacheKeys.FAVOURITEPATTERN());

    return await this.prismaService.item.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        image: imageName,
        categoryName: data.category,
      },
    });
  }

  async deleteItem(id: number) {
    const item = await this.prismaService.item.findUnique({ where: { id } });
    if (!item) {
      throw new HttpException(ITEM_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    await this.cacheManager.del(CacheKeys.ITEM(id));
    await this.redisService.clearByPattern(CacheKeys.ITEMLISTPATTERN());
    await this.redisService.clearByPattern(CacheKeys.FAVOURITEPATTERN());
    await this.bucketService.deleteItem(item.image);

    return await this.prismaService.item.update({
      where: { id },
      data: { isRemoved: true, image: 'placeholder' },
    });
  }
}
