import { Post } from 'src/post/post.record';
import { prisma } from 'src/prisma.activeRecord';
import { Product } from 'src/product/product.record';
import { User } from 'src/user/user.record';
import { OrderStatus } from './order.enum';
import { Prisma } from 'generated/prisma';
import CategoryRepository from 'src/category/category.repository';
import {
  TOrderProductParams,
  TOrderQuery,
  TOrderViewParams,
  TOrderItemFrom,
} from './types/order.record.type';

export class OrderProduct {
  product: Product;
  quantity: number;

  constructor(params: TOrderProductParams) {
    this.product = params.product;
    this.quantity = params.quantity;
  }
}

class OrderProducts extends Array<OrderProduct> {
  constructor(items: OrderProduct[] | number) {
    if (typeof items === 'number') {
      super(items);
    } else {
      super();
      if (items) this.push(...items);
    }
  }

  static from(items: TOrderItemFrom[]) {
    return new OrderProducts(
      items.map(
        (item) =>
          new OrderProduct({
            quantity: item.quantity,
            product: new Product({
              ...item,
              category: CategoryRepository.getBySlug(item.category.slug)!,
            }),
          }),
      ),
    );
  }

  async setFromIds(data: { productId: number; quantity: number }[]) {
    const res = await Promise.all(
      data.map((item) => Product.getById(item.productId)),
    );

    const filteredRes = res.filter((item) => item);

    if (data.length !== filteredRes.length)
      throw new Error(`Invalid productId passed`);

    const resMap = new Map(res.map((item) => [item!.id, item]));

    this.length = 0;

    data.map((product) =>
      this.push(
        new OrderProduct({
          product: resMap.get(product.productId)!,
          quantity: product.quantity,
        }),
      ),
    );
  }

  compare(items: OrderProducts) {
    if (this.length === 0) {
      return {
        inserted: [],
        deleted: items,
        updated: [],
      };
    }

    const targetMap = new Map(this.map((item) => [item.product.id, item]));
    const sourceMap = new Map(items.map((item) => [item.product.id, item]));
    const targetKeys = new Set(targetMap.keys());
    const sourceKeys = new Set(sourceMap.keys());

    const itemsToInsertKeys = targetKeys.difference(sourceKeys);
    const itemsToDeleteKeys = sourceKeys.difference(targetKeys);

    return {
      inserted: this.filter((item) => itemsToInsertKeys.has(item.product.id)),
      deleted: this.filter(
        (item) => itemsToDeleteKeys.has(item.product.id) || item.quantity < 1,
      ),
      updated: this.filter(
        (item) =>
          !itemsToDeleteKeys.has(item.product.id) &&
          !itemsToInsertKeys.has(item.product.id) &&
          item.quantity !== sourceMap.get(item.product.id)!.quantity,
      ),
    };
  }

  hasItem(product: Product) {
    const self = new Map(this.map((item) => [item.product.id, item]));

    return self.get(product.id);
  }
}

class OrderView {
  items: Order[];
  currentPage: number;
  totalPages: number;

  constructor(params: TOrderViewParams) {
    this.items = params.items;
    this.currentPage = params.currentPage;
    this.totalPages = params.totalPages;
  }
}

type TOrderParams = {
  id: number;
  user: User;
  total: number;
  status: string;
  items: OrderProducts;
  postOffice?: Post;
};

export class Order {
  readonly id: number;
  readonly user: User;
  total: number;
  status: string;
  items: OrderProducts;
  postOffice?: Post;

  constructor(params: TOrderParams) {
    this.id = params.id;
    this.user = params.user;
    this.total = params.total;
    this.status = params.status;
    this.items = params.items;
    this.postOffice = params.postOffice;
  }

  static async getActive(user: User) {
    const res = await prisma.order.findFirst({
      where: { AND: [{ userId: user.id }, { status: OrderStatus.INCOMPLETE }] },
      include: {
        items: {
          include: {
            item: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    if (!res) {
      return undefined;
    }

    return new Order({
      ...res,
      user,
      items: OrderProducts.from(
        res.items.map((item) => ({
          ...item.item,
          category: item.item.category,
          quantity: item.quantity,
        })),
      ),
    });
  }

  static async getByQuery(user: User, query: TOrderQuery) {
    const { page, pageSize, sortBy, sortOrder } = query;

    const skip = (page - 1) * pageSize;
    const where: Prisma.OrderWhereInput = {
      userId: user.isAdmin() ? undefined : user.id,
    };

    where.AND = { NOT: { status: OrderStatus.INCOMPLETE } };

    const orderBy: Prisma.ItemOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };
    const [totalItems, items] = await prisma.$transaction(async (tx) => {
      const totalItems = await tx.order.count({
        where,
      });
      const items = await tx.order.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        omit: { userId: true },
        include: {
          postOffice: {
            include: {
              settlement: {
                include: {
                  region: true,
                },
              },
            },
          },
          items: {
            include: {
              item: {
                include: {
                  category: true,
                },
              },
            },
          },
          user: {
            include: { authFlow: true },
          },
        },
      });
      return [totalItems, items];
    });

    const totalPages = Math.ceil(totalItems / pageSize);

    return new OrderView({
      items: items.map(
        (order) =>
          new Order({
            ...order,
            user: User.from(order.user),
            items: OrderProducts.from(
              order.items.map((item) => ({
                ...item.item,
                category: item.item.category,
                quantity: item.quantity,
              })),
            ),
            postOffice: new Post(order.postOffice!),
          }),
      ),
      currentPage: page,
      totalPages,
    });
  }

  static async getById(orderId: number) {
    const res = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          include: {
            authFlow: true,
          },
        },
        items: {
          include: {
            item: {
              include: {
                category: true,
              },
            },
          },
        },
        postOffice: {
          include: {
            settlement: {
              include: {
                region: true,
              },
            },
          },
        },
      },
    });

    if (!res) {
      return undefined;
    }

    return new Order({
      ...res,
      user: User.from(res.user),
      items: OrderProducts.from(
        res.items.map((item) => ({
          ...item.item,
          category: item.item.category,
          quantity: item.quantity,
        })),
      ),
      postOffice: res.postOffice ? new Post(res.postOffice) : undefined,
    });
  }

  static async create(user: User) {
    const res = await prisma.order.create({
      data: { userId: user.id },
      include: { items: true },
    });

    return new Order({ ...res, user, items: OrderProducts.from([]) });
  }

  async update() {
    const order = await Order.getById(this.id);
    const data = this.getFieldsToUpdate();
    const total = this.items.reduce((acc, item) => {
      return acc + item.product.price * item.quantity;
    }, 0);

    const prismaUpdateData: Prisma.OrderUpdateInput = {
      ...data,
      total: total,
      postOffice: data.postOffice
        ? {
            connect: {
              id: data.postOffice.id,
            },
          }
        : {},
    };

    const { inserted, updated, deleted } = this.items.compare(order!.items);

    return await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: this.id },
        data: prismaUpdateData,
      });

      await tx.orderItem.createMany({
        data: inserted.map((product) => ({
          orderId: this.id,
          itemId: product.product.id,
          quantity: product.quantity,
        })),
      });

      await Promise.all(
        updated.map(({ product, quantity }) =>
          tx.orderItem.update({
            where: {
              itemId_orderId: {
                itemId: product.id,
                orderId: this.id,
              },
            },
            data: { quantity: quantity },
          }),
        ),
      );

      await tx.orderItem.deleteMany({
        where: {
          orderId: this.id,
          itemId: {
            in: deleted.map((product) => product.product.id),
          },
        },
      });
    });
  }

  getFieldsToUpdate() {
    return {
      status: this.status,
      postOffice: this.postOffice,
    };
  }
}
