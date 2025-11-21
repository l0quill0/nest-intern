import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CATEGORY_NOT_FOUND } from './category.constants';

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
