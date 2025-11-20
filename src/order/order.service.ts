import { ItemService } from 'src/item/item.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { OrderStatus } from './order.enum';
import {
  ORDER_EMPTY,
  ORDER_ITEM_NOT_FOUND,
  ORDER_NOT_FOUND,
} from './order.constants';
import { ITEM_NOT_FOUND } from 'src/item/item.constants';
import { OrderAddItemDto } from './dto/order.add.item.dto';
import { OrderRemoveItemDto } from './dto/order.remove.item.dto';

@Injectable()
export class OrderService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly itemService: ItemService,
  ) {}

  //pagination

  async getCurrentOrder(userId: number) {
    const currentOrder = await this.prismaService.order.findFirst({
      where: { AND: [{ userId }, { status: OrderStatus.INCOMPLETE }] },
      include: {
        items: {
          include: {
            item: true,
          },
        },
      },
    });

    if (!currentOrder) {
      return null;
    }
    return currentOrder;
  }

  async createCurrentOrder(userId: number) {
    return await this.prismaService.order.create({ data: { userId } });
  }

  async getOrderById(orderId: number) {
    const order = await this.prismaService.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            item: true,
          },
        },
      },
    });

    if (!order) {
      throw new HttpException(ORDER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    return order;
  }

  async addOrderItem(userId: number, { itemId, quantity }: OrderAddItemDto) {
    const item = await this.itemService.getItemById(itemId);

    if (!item) {
      throw new HttpException(ITEM_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    let currentOrder = await this.getCurrentOrder(userId);

    if (!currentOrder) {
      await this.createCurrentOrder(userId);
      currentOrder = await this.getCurrentOrder(userId);
      if (!currentOrder) {
        throw new HttpException('BAD_REQUEST', HttpStatus.BAD_REQUEST);
      }
    }

    const itemInOrder = await this.prismaService.orderItem.findFirst({
      where: { AND: [{ itemId }, { orderId: currentOrder?.id }] },
    });

    const orderTotal = currentOrder.total + item.price * quantity;

    if (itemInOrder) {
      return await this.prismaService.$transaction([
        this.prismaService.orderItem.update({
          where: { id: itemInOrder.id },
          data: { quantity },
        }),
        this.prismaService.order.update({
          where: { id: currentOrder.id },
          data: { total: orderTotal },
        }),
      ]);
    }

    return await this.prismaService.$transaction([
      this.prismaService.orderItem.create({
        data: { itemId, quantity, orderId: currentOrder.id },
      }),
      this.prismaService.order.update({
        where: { id: currentOrder.id },
        data: { total: orderTotal },
      }),
    ]);
  }

  async removeOrderItem({ orderItemId, quantity }: OrderRemoveItemDto) {
    const orderItem = await this.prismaService.orderItem.findUnique({
      where: { id: orderItemId },
    });

    if (!orderItem) {
      throw new HttpException(ORDER_ITEM_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (quantity) {
      return await this.prismaService.orderItem.update({
        where: { id: orderItem.id },
        data: { quantity },
      });
    }

    return await this.prismaService.orderItem.delete({
      where: { id: orderItem.id },
    });
  }

  async sendOrder(userId: number) {
    const currentOrder = await this.prismaService.order.findFirst({
      where: { AND: [{ userId }, { status: OrderStatus.INCOMPLETE }] },
      include: {
        items: true,
      },
    });
    if (!currentOrder || currentOrder.items.length < 1) {
      throw new HttpException(ORDER_EMPTY, HttpStatus.BAD_REQUEST);
    }

    return await this.prismaService.order.update({
      where: { id: currentOrder.id },
      data: { status: OrderStatus.PENDING },
    });
  }

  async cancelOrder(orderId: number) {
    const order = await this.prismaService.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new HttpException(ORDER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return await this.prismaService.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.CANCELED },
    });
  }

  async completeOrder(orderId: number) {
    const order = await this.prismaService.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new HttpException(ORDER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return await this.prismaService.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.COMPLETE },
    });
  }
}
