import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import {
  CATEGORY_NOT_FOUND,
  ITEM_DOESNT_HAVE_CATEGORY,
  ITEM_HAS_CATEGORY,
} from './category.constants';
import { ITEM_NOT_FOUND } from 'src/item/item.constants';

@Injectable()
export class CategoryService {
  constructor(private readonly prismaService: PrismaService) {}

  async categoryGetAll() {
    return await this.prismaService.category.findMany();
  }

  async categoryAdd(name: string) {
    return await this.prismaService.category.create({ data: { name } });
  }

  async categoryRemove(categoryId: number) {
    const category = await this.prismaService.category.findUnique({
      where: { id: categoryId },
      include: {
        items: true,
      },
    });

    if (!category) {
      throw new HttpException(CATEGORY_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    //finish
  }

  async categoryAppend(categoryId: number, itemId: number) {
    const category = await this.prismaService.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      throw new HttpException(CATEGORY_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    const item = await this.prismaService.item.findUnique({
      where: { id: itemId },
      include: { categories: true },
    });

    if (!item) {
      throw new HttpException(ITEM_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (item.categories.find((cat) => cat.id === category.id)) {
      throw new HttpException(ITEM_HAS_CATEGORY, HttpStatus.BAD_REQUEST);
    }

    return await this.prismaService.category.update({
      where: { id: categoryId },
      data: { items: { connect: { id: itemId } } },
    });
  }

  async categoryUnappend(categoryId: number, itemId: number) {
    const category = await this.prismaService.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      throw new HttpException(CATEGORY_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const item = await this.prismaService.item.findUnique({
      where: { id: itemId },
      include: { categories: true },
    });

    if (!item) {
      throw new HttpException(ITEM_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (!item.categories.find((cat) => cat.id === category.id)) {
      throw new HttpException(
        ITEM_DOESNT_HAVE_CATEGORY,
        HttpStatus.BAD_REQUEST,
      );
    }

    return await this.prismaService.category.update({
      where: { id: categoryId },
      data: { items: { disconnect: { id: itemId } } },
    });
  }
}
