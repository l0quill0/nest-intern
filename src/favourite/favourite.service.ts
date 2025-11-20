import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ITEM_NOT_FOUND } from 'src/item/item.constants';
import { PrismaService } from 'src/prisma.service';
import { ALREADY_IN_FAVOURITE, NOT_IN_FAVOURITES } from './favourite.constants';

@Injectable()
export class FavouriteService {
  constructor(private readonly prismaService: PrismaService) {}

  async getFavourites(userId: number) {
    return await this.prismaService.userFavourites.findUnique({
      where: { userId },
      include: { items: true },
    });
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

    if (!favourites || !favourites.items.find((it) => it.id === itemId)) {
      throw new HttpException(NOT_IN_FAVOURITES, HttpStatus.BAD_REQUEST);
    }

    return await this.prismaService.userFavourites.update({
      where: { userId },
      data: { items: { disconnect: { id: itemId } } },
    });
  }
}
