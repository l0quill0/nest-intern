import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import {
  CATEGORY_ALREADY_EXISTS,
  CATEGORY_NOT_FOUND,
} from './category.constants';
import { BucketService } from 'src/bucket/bucket.service';
import unidecode from 'unidecode';
import { CategoryPaginationOptionsDto } from './dto/category.pagination.options.dto';
import { CategoryCacheService } from 'src/category-cache/category-cache.service';
import { ItemCacheService } from 'src/item-cache/item-cache.service';

@Injectable()
export class CategoryService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly bucketService: BucketService,
    private readonly categoryCacheService: CategoryCacheService,
    private readonly itemCacheService: ItemCacheService,
  ) {}

  async categoryGetAll() {
    const categories = await this.prismaService.category.findMany();

    return categories;
  }

  async categoryGetPaginated(options: CategoryPaginationOptionsDto) {
    const { page, pageSize, search } = options;

    const cached =
      Object.keys(options).filter((k) => options[k] !== undefined).length === 0;

    if (cached) {
      const cachedData = await this.categoryCacheService.getCategoryCache();
      if (cachedData) return cachedData;
    }

    const skip = (page - 1) * pageSize;
    const [totalCategories, categories] = await this.prismaService.$transaction(
      async (tx) => {
        const totalCategories = await tx.category.count({
          where: { name: { contains: search, mode: 'insensitive' } },
        });
        const categories = await tx.category.findMany({
          where: { name: { contains: search, mode: 'insensitive' } },
          skip,
          take: pageSize,
          orderBy: { ['name']: 'asc' },
        });
        return [totalCategories, categories];
      },
    );

    const totalPages = Math.ceil(totalCategories / pageSize);

    const returnValue = {
      data: categories,
      meta: {
        totalItems: totalCategories,
        itemCount: categories.length,
        itemsPerPage: pageSize,
        totalPages,
        currentPage: page,
      },
    };

    if (cached) await this.categoryCacheService.setCategoryCache(returnValue);

    return returnValue;
  }

  async categoryAdd(file: Express.Multer.File, name: string) {
    const category = await this.prismaService.category.findUnique({
      where: { name },
    });

    if (category) {
      throw new HttpException(CATEGORY_ALREADY_EXISTS, HttpStatus.BAD_REQUEST);
    }

    const image = await this.bucketService.upload(
      file.originalname,
      file.buffer,
      file.mimetype,
    );

    const slug = unidecode(name).toLowerCase();

    await this.categoryCacheService.clearCategoryCache();

    return await this.prismaService.category.create({
      data: { name, slug, image },
    });
  }

  async categoryRemove(categoryId: number) {
    const category = await this.prismaService.category.findUnique({
      where: { id: categoryId },
      include: {
        items: true,
      },
    });

    if (!category || category.immutable) {
      throw new HttpException(CATEGORY_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    await this.categoryCacheService.clearCategoryCache();
    await this.itemCacheService.clearItemCache();
    await this.itemCacheService.clearItemCache(category.slug);

    return await this.prismaService.$transaction(async (tx) => {
      await tx.item.updateMany({
        where: { categoryId: category.id },
        data: { categoryId: 1 },
      });
      await tx.category.delete({ where: { id: categoryId } });
      await this.bucketService.deleteItem(category.image);
    });
  }

  async validateCategories(categories: string[]) {
    const categoriesDb = await this.prismaService.category.findMany({
      where: { slug: { in: categories } },
    });

    return categories.length === categoriesDb.length;
  }
}
