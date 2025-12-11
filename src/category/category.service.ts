import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import {
  CATEGORY_ALREADY_EXISTS,
  CATEGORY_NOT_FOUND,
} from './category.constants';
import { CacheKeys } from 'src/cache.keys';
import { BucketService } from 'src/bucket/bucket.service';

@Injectable()
export class CategoryService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly prismaService: PrismaService,
    private readonly bucketService: BucketService,
  ) {}

  async categoryGetAll() {
    const cacheKey = CacheKeys.CATEGORIES();
    const cachedData = await this.cacheManager.get(cacheKey);

    if (cachedData) return cachedData;

    const categories = await this.prismaService.category.findMany();

    await this.cacheManager.set(cacheKey, categories);

    return categories;
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

    await this.cacheManager.del(CacheKeys.CATEGORIES());

    return await this.prismaService.category.create({ data: { name, image } });
  }

  async categoryRemove(categoryId: number) {
    const category = await this.prismaService.category.findUnique({
      where: { id: categoryId },
      include: {
        items: true,
      },
    });

    if (!category || category.name === 'Інше') {
      throw new HttpException(CATEGORY_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    await this.cacheManager.del(CacheKeys.CATEGORIES());

    return await this.prismaService.$transaction(async (tx) => {
      await tx.category.delete({ where: { id: categoryId } });
      const itemsToUpdate = await tx.item.findMany({
        where: { categoryName: category.name },
      });
      const updateItems = itemsToUpdate.map((item) => {
        return tx.item.update({
          where: { id: item.id },
          data: {
            categoryName: 'Інше',
          },
        });
      });

      await Promise.all(updateItems);
      await this.bucketService.deleteItem(category.image);
    });
  }
}
