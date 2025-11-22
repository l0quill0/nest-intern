import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ITEM_NOT_FOUND } from 'src/item/item.constants';
import { PrismaService } from 'src/prisma.service';
import { ALREADY_IN_FAVOURITE, NOT_IN_FAVOURITES } from './favourite.constants';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { CacheKeys } from 'src/cache.keys';

@Injectable()
export class FavouriteService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly prismaService: PrismaService,
  ) {}

  async getFavourites(userId: number) {
    const cacheKey = CacheKeys.USERFAVOURITE(userId);
    const cachedData = await this.cacheManager.get(cacheKey);

    if (cachedData) return cachedData;

    const favourites = await this.prismaService.userFavourites.findUnique({
      where: { userId },
      include: { items: true },
    });

    await this.cacheManager.set(cacheKey, favourites);

    return favourites;
  }

  async addToFavourite(userId: number, itemId: number) {
    const item = await this.prismaService.item.findUnique({
      where: { id: itemId },
      include: {
        favouriteOf: true,
      },
    });

    if (!item) {
      throw new HttpException(ITEM_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (item.favouriteOf.find((user) => user.userId === userId)) {
      throw new HttpException(ALREADY_IN_FAVOURITE, HttpStatus.BAD_REQUEST);
    }

    await this.cacheManager.del(CacheKeys.USERFAVOURITE(userId));

    return await this.prismaService.userFavourites.update({
      where: { userId },
      data: {
        items: {
          connect: { id: itemId },
        },
      },
    });
  }

  async removeFavourite(userId: number, itemId: number) {
    const favourites = await this.prismaService.userFavourites.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!favourites || !favourites.items.find((item) => item.id === itemId)) {
      throw new HttpException(NOT_IN_FAVOURITES, HttpStatus.BAD_REQUEST);
    }

    await this.cacheManager.del(CacheKeys.USERFAVOURITE(userId));

    return await this.prismaService.userFavourites.update({
      where: { userId },
      data: { items: { disconnect: { id: itemId } } },
    });
  }
}
