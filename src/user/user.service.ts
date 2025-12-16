import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import bcrypt from 'node_modules/bcryptjs';

import { USER_NOT_FOUND, WRONG_OLD_PASSWORD } from './user.constants';

import { UpdatePasswordDto } from './dto/updatePassword.dto';
import { CreateUserDto } from './dto/create.user.dto';
import { BaseUserDto } from './dto/base.user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async getUserByEmail(email: string) {
    const user = await this.prismaService.user.findUnique({ where: { email } });

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

  async createUser(data: CreateUserDto) {
    return await this.prismaService.user.create({
      data: { ...data, isRegistered: true, favourites: { create: {} } },
    });
  }

  async createUserAuto(email: string) {
    const user = await this.prismaService.user.findUnique({ where: { email } });

    if (user) return user;

    return await this.prismaService.user.create({
      data: { email, favourites: { create: {} } },
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

    if (!user || !user.isRegistered || !user.password) {
      throw new HttpException(USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (await bcrypt.compare(oldPassword, user.password)) {
      throw new HttpException(WRONG_OLD_PASSWORD, HttpStatus.BAD_REQUEST);
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    return await this.prismaService.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }
}
