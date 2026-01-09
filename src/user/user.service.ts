import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import bcrypt from 'node_modules/bcryptjs';

import { USER_NOT_FOUND, WRONG_OLD_PASSWORD } from './user.constants';

import { UpdatePasswordDto } from './dto/updatePassword.dto';
import { BaseUserDto } from './dto/base.user.dto';
import { OrderStatus } from 'src/order/order.enum';
import { ICreateUser } from './dto/create.user.type';
import { AuthMethod } from 'src/auth/authMethod.enum';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async getUserByEmail(email: string) {
    const user = await this.prismaService.user.findUnique({
      where: { email },
      include: { authMethod: { select: { name: true } } },
    });

    return user;
  }

  async getUserWithPass(email: string) {
    const user = await this.prismaService.user.findUnique({
      where: { email },
      omit: { password: false },
    });

    if (!user) {
      throw new HttpException(USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    return user;
  }

  async getCount(id: number) {
    const user = await this.prismaService.user.findUnique({ where: { id } });

    if (!user) {
      throw new HttpException(USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const favCount = await this.prismaService.userFavourites.findUnique({
      where: { userId: id },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    const cart = await this.prismaService.order.findFirst({
      where: { AND: [{ userId: id }, { status: OrderStatus.INCOMPLETE }] },
    });

    if (!cart) {
      return { favCount: favCount?._count.items, cartCount: 0 };
    }

    const cartCount = await this.prismaService.orderItem.count({
      where: { orderId: cart.id },
    });

    return { favCount: favCount?._count.items, cartCount };
  }

  async createUser(data: ICreateUser) {
    return await this.prismaService.user.create({
      data: {
        ...data,
        favourites: { create: {} },
        authMethod: { connect: { name: data.authMethod } },
      },
    });
  }

  async updateUser(id: number, data: BaseUserDto) {
    const user = await this.prismaService.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new HttpException(USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    return await this.prismaService.user.update({
      where: { id },
      data,
    });
  }

  async updatePassword(
    id: number,
    { oldPassword, newPassword }: UpdatePasswordDto,
  ) {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      omit: { password: false },
    });

    if (!user || !user.password) {
      throw new HttpException(USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      throw new HttpException(WRONG_OLD_PASSWORD, HttpStatus.BAD_REQUEST);
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    return await this.prismaService.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async addPassword(id: number, password: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id },
    });
    if (!user) throw new HttpException(USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    if (user.password)
      throw new HttpException('USER_HAS_PASSWORD', HttpStatus.BAD_REQUEST);

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    return await this.prismaService.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        authMethod: { connect: { name: AuthMethod.BASIC } },
      },
    });
  }
}
