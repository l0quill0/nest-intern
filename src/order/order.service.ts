import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { OrderStatus } from './order.enum';
import { Order } from 'generated/prisma';
import { ORDER_NOT_FOUND } from './order.constants';

@Injectable()
export class OrderService {
  constructor(private readonly prismaService: PrismaService) {}

  async getCurrentOrder(userId: number): Promise<Order> {
    const currentOrder = await this.prismaService.order.findFirst({
      where: { AND: [{ userId }, { status: OrderStatus.INCOMPLETE }] },
      include: {
        items: true,
      },
    });

    if (!currentOrder) {
      return await this.prismaService.order.create({ data: { userId } });
    }

    return currentOrder;
  }

  async getOrderById(orderId: number): Promise<Order | null> {
    const order = await this.prismaService.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new HttpException(ORDER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    return order;
  }
}
