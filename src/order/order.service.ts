import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { IUserJWT } from './../auth/guards/role.guard';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { OrderStatus } from './order.enum';
import {
  NOT_OWN_ORDER,
  ORDER_EMPTY,
  ORDER_ITEM_NOT_FOUND,
  ORDER_NOT_FOUND,
} from './order.constants';
import { ITEM_NOT_FOUND } from 'src/item/item.constants';
import { OrderAddItemDto } from './dto/order.add.item.dto';
import { OrderRemoveItemDto } from './dto/order.remove.item.dto';
import { Role } from 'src/auth/role.enum';
import { OrderPaginationOptionsDto } from './dto/order.pagination.options.dto';
import { Order, Prisma, OrderItem } from 'generated/prisma';
import { RedisService } from 'src/redis/redis.service';
import { CacheKeys } from 'src/cache.keys';

@Injectable()
export class OrderService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async getPaginatedOrders(user: IUserJWT, options: OrderPaginationOptionsDto) {
    const { page, pageSize, sortBy, sortOrder } = options;

    const cacheKey = CacheKeys.ORDERLISTPAGINATION(
      page,
      pageSize,
      sortBy,
      sortOrder,
    );
    const cachedData = await this.cacheManager.get(cacheKey);

    if (cachedData) return cachedData;

    const skip = (page - 1) * pageSize;
    const where: Prisma.OrderWhereInput = {
      id: user.role === Role.ADMIN ? undefined : user.sub,
    };

    where.AND = { NOT: { status: OrderStatus.INCOMPLETE } };

    const orderBy: Prisma.ItemOrderByWithRelationInput = {
      [sortBy!]: sortOrder,
    };

    const [totalItems, items] = await this.prismaService.$transaction(
      async (tx) => {
        const totalItems = await tx.order.count({
          where,
        });
        const items = await tx.order.findMany({
          where,
          orderBy,
          skip,
          take: pageSize,
        });
        return [totalItems, items];
      },
    );

    const totalPages = Math.ceil(totalItems / pageSize);
    const paginatedOrders = {
      data: items,
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: pageSize,
        totalPages,
        currentPage: page,
      },
    };

    await this.cacheManager.set(cacheKey, paginatedOrders);

    return paginatedOrders;
  }

  async getCurrentOrder(userId: number) {
    const cacheKey = CacheKeys.CURRENTORDER(userId);
    const cachedData = await this.cacheManager.get(cacheKey);

    if (cachedData) return cachedData;

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

    await this.cacheManager.set(cacheKey, currentOrder);
    return currentOrder;
  }

  async createCurrentOrder(userId: number) {
    const currentOrdet = await this.prismaService.order.create({
      data: { userId },
      include: { items: true },
    });
    const cacheKey = CacheKeys.CURRENTORDER(userId);
    await this.cacheManager.set(cacheKey, currentOrdet);
    return currentOrdet;
  }

  async getOrderById(user: IUserJWT, orderId: number) {
    const cacheKey = CacheKeys.ORDER(orderId);
    const cachedData = await this.cacheManager.get<
      Order & { items: OrderItem[] }
    >(cacheKey);
    if (cachedData) {
      if (cachedData.userId !== user.sub || user.role !== Role.ADMIN) {
        throw new HttpException(NOT_OWN_ORDER, HttpStatus.UNAUTHORIZED);
      }
      return cachedData;
    }

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

    if (order.userId !== user.sub || user.role !== Role.ADMIN) {
      throw new HttpException(NOT_OWN_ORDER, HttpStatus.UNAUTHORIZED);
    }

    await this.cacheManager.set(cacheKey, order);

    return order;
  }

  async addOrderItem(userId: number, { itemId, quantity }: OrderAddItemDto) {
    const item = await this.prismaService.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new HttpException(ITEM_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    let currentOrder = await this.prismaService.order.findFirst({
      where: { AND: { userId }, status: OrderStatus.INCOMPLETE },
    });

    if (!currentOrder) {
      currentOrder = await this.createCurrentOrder(userId);
      if (!currentOrder) {
        throw new HttpException('BAD_REQUEST', HttpStatus.BAD_REQUEST);
      }
    }

    const itemInOrder = await this.prismaService.orderItem.findFirst({
      where: { AND: [{ itemId }, { orderId: currentOrder.id }] },
    });

    const orderTotal = currentOrder.total + item.price * quantity;

    await this.cacheManager.del(CacheKeys.CURRENTORDER(userId));

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

  async removeOrderItem(
    userId: number,
    { orderItemId, quantity }: OrderRemoveItemDto,
  ) {
    const orderItem = await this.prismaService.orderItem.findUnique({
      where: { id: orderItemId },
      include: {
        order: true,
      },
    });

    if (!orderItem) {
      throw new HttpException(ORDER_ITEM_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (orderItem.order.userId !== userId) {
      throw new HttpException(NOT_OWN_ORDER, HttpStatus.UNAUTHORIZED);
    }

    await this.cacheManager.del(CacheKeys.CURRENTORDER(userId));

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

    await this.cacheManager.del(CacheKeys.CURRENTORDER(userId));
    await this.redisService.clearByPattern(CacheKeys.ORDERLISTPATTERN());

    return await this.prismaService.order.update({
      where: { id: currentOrder.id },
      data: { status: OrderStatus.PENDING, createdAt: new Date(Date.now()) },
    });
  }

  async cancelOrder(user: IUserJWT, orderId: number) {
    const order = await this.prismaService.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new HttpException(ORDER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (order.userId !== user.sub || user.role !== Role.ADMIN) {
      throw new HttpException(NOT_OWN_ORDER, HttpStatus.UNAUTHORIZED);
    }

    await this.cacheManager.del(CacheKeys.ORDER(orderId));
    await this.redisService.clearByPattern(CacheKeys.ORDERLISTPATTERN());

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

    await this.cacheManager.del(CacheKeys.ORDER(orderId));
    await this.redisService.clearByPattern(CacheKeys.ORDERLISTPATTERN());

    return await this.prismaService.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.COMPLETE },
    });
  }
}
