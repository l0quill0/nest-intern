import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CATEGORY_NOT_FOUND } from './category.constants';
import { CacheKeys } from 'src/cache.keys';

@Injectable()
export class CategoryService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly prismaService: PrismaService,
  ) {}

  async categoryGetAll() {
    const cacheKey = CacheKeys.CATEGORIES();
    const cachedData = await this.cacheManager.get(cacheKey);

    if (cachedData) return cachedData;

    const categories = await this.prismaService.category.findMany();

    await this.cacheManager.set(cacheKey, categories);

    return categories;
  }

  async categoryAdd(name: string) {
    await this.cacheManager.del(CacheKeys.CATEGORIES());

    return await this.prismaService.category.create({ data: { name } });
  }

  async categoryRemove(categoryId: number) {
    const category = await this.prismaService.category.findUnique({
      where: { id: categoryId },
      include: {
        items: true,
      },
    });

    if (!category || category.name === 'uncategorized') {
      throw new HttpException(CATEGORY_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    await this.cacheManager.del(CacheKeys.CATEGORIES());

    return await this.prismaService.$transaction(async (tx) => {
      await tx.category.delete({ where: { id: categoryId } });
      const itemsToUpdate = await tx.item.findMany({
        where: { categories: { none: {} } },
      });
      const updateItems = itemsToUpdate.map((item) => {
        return tx.item.update({
          where: { id: item.id },
          data: {
            categories: {
              connect: { name: 'uncategorized' },
            },
          },
        });
      });

      await Promise.all(updateItems);
    });
  }
}
