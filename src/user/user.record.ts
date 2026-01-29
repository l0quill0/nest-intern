import * as bcrypt from 'bcryptjs';
import { Role } from 'src/auth/role.enum';
import { OrderStatus } from 'src/order/order.enum';
import { prisma } from 'src/prisma.activeRecord';
import { Product } from 'src/product/product.record';
import { TCreateUser, TUserParams, TUserFrom } from './types/user.record.type';
import CategoryRepository from 'src/category/category.repository';

export class Password {
  public value: string;

  constructor(value: string) {
    this.value = value;
  }

  static async hashed(value: string) {
    const salt = await bcrypt.genSalt();
    const res = await bcrypt.hash(value, salt);
    return new Password(res);
  }

  async compare(compareVal: string) {
    return await bcrypt.compare(compareVal, this.value);
  }

  async change(newVal: string) {
    const salt = await bcrypt.genSalt();
    this.value = await bcrypt.hash(newVal, salt);
    return this.value;
  }
}

export class User {
  public readonly id: number;
  public name: string;
  public readonly role: string;
  public email: string | null;
  public phone: string | null;
  public password: Password | null;
  public readonly createdAt: Date;
  public authFlow: string[];

  constructor(params: TUserParams) {
    this.id = params.id;
    this.name = params.name;
    this.role = params.role;
    this.email = params.email;
    this.phone = params.phone;
    this.password = params.password;
    this.createdAt = params.createdAt;
    this.authFlow = params.authFlow;
  }

  static from(user: TUserFrom) {
    return new User({
      ...user,
      authFlow: user.authFlow.map((method) => method.name),
      password: user.password ? new Password(user.password) : null,
    });
  }

  static async getByPhone(phone: string) {
    const res = await prisma.user.findUnique({
      where: { phone },
      include: { authFlow: true },
    });

    if (!res) return undefined;

    return new User({
      ...res,
      authFlow: res.authFlow.map((m) => m.name),
      password: res.password ? new Password(res.password) : null,
    });
  }

  static async getByEmail(email: string) {
    const res = await prisma.user.findUnique({
      where: { email },
      include: { authFlow: true },
    });

    if (!res) return undefined;

    return new User({
      ...res,
      authFlow: res.authFlow.map((m) => m.name),
      password: res.password ? new Password(res.password) : null,
    });
  }

  static async getById(id: number) {
    const res = await prisma.user.findUnique({
      where: { id },
      include: { authFlow: true },
    });

    if (!res) return undefined;

    return new User({
      ...res,
      authFlow: res.authFlow.map((m) => m.name),
      password: res.password ? new Password(res.password) : null,
    });
  }

  static async create(data: TCreateUser) {
    if (!data.email && !data.phone) {
      throw new Error('Error creating user email or phone number expected');
    }

    const res = await prisma.user.create({
      data: {
        ...data,
        password: data.password?.value,
        favourites: { create: {} },
        authFlow: {
          connect: { name: data.authFlow },
        },
      },
      include: { authFlow: true },
    });

    return new User({
      ...res,
      authFlow: res.authFlow.map((m) => m.name),
      password: res.password ? new Password(res.password) : null,
    });
  }

  async update() {
    const data = this.getFields();

    const flows = await prisma.authFlow.findMany({
      where: { name: { in: data.authFlow } },
    });

    const nonExistantFlows = flows.filter(
      (f) => !data.authFlow.includes(f.name),
    );

    if (nonExistantFlows.length) {
      throw new Error(
        `Non existant flow ${nonExistantFlows.map((f) => f.name).join(' ')}`,
      );
    }

    return await prisma.user.update({
      where: { id: this.id },
      data: {
        ...data,
        password: this.password?.value,
        authFlow: {
          connect: data.authFlow.map((f) => ({
            name: f,
          })),
        },
      },
    });
  }

  async getCount() {
    const favCount = await prisma.userFavourites.findUnique({
      where: { userId: this.id },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    const cart = await prisma.order.findFirst({
      where: { AND: [{ userId: this.id }, { status: OrderStatus.INCOMPLETE }] },
    });

    if (!cart) {
      return { favCount: favCount?._count.items, cartCount: 0 };
    }

    const cartCount = await prisma.orderItem.count({
      where: { orderId: cart.id },
    });

    return { favCount: favCount?._count.items, cartCount };
  }

  async isInFavourites(product: Product) {
    const exists = await prisma.userFavourites.findFirst({
      where: {
        AND: [{ userId: this.id }, { items: { some: { id: product.id } } }],
      },
    });
    return !!exists;
  }

  async getFavourites() {
    const res = await prisma.userFavourites.findUnique({
      where: { userId: this.id },
      include: {
        items: {
          omit: { categoryId: true },
          include: {
            category: {
              select: {
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!res) return undefined;

    return res.items.map(
      (product) =>
        new Product({
          ...product,
          category: CategoryRepository.getBySlug(product.category.slug)!,
        }),
    );
  }

  async addFavourite(product: Product) {
    return await prisma.userFavourites.update({
      where: { userId: this.id },
      data: {
        items: {
          connect: { id: product.id },
        },
      },
    });
  }

  async removeFavourite(product: Product) {
    return await prisma.userFavourites.update({
      where: { userId: this.id },
      data: { items: { disconnect: { id: product.id } } },
    });
  }

  isAdmin() {
    return this.role === (Role.ADMIN as string);
  }

  getFields() {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      phone: this.phone,
      email: this.email,
      password: this.password,
      authFlow: this.authFlow,
    };
  }
}
