import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { User } from 'generated/prisma';
import { PrismaService } from 'src/prisma.service';
import bcrypt from 'node_modules/bcryptjs';

import { USER_NOT_FOUND, WRONG_OLD_PASSWORD } from './user.constants';

import { UpdatePasswordDto } from './dto/updatePassword.dto';
import { CreateUserDto } from './dto/create.user.dto';
import { UpdateUserDto } from './dto/update.user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async getUserByEmail(email: string): Promise<User | null> {
    return await this.prismaService.user.findUnique({ where: { email } });
  }

  async getUserWithPass(email: string): Promise<User | null> {
    const user = await this.prismaService.user.findUnique({ where: { email } });

    if (!user) {
      throw new HttpException(USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    return await this.prismaService.user.findUnique({
      where: { email },
      omit: { password: false },
    });
  }

  async createUser(data: CreateUserDto): Promise<User> {
    return await this.prismaService.user.create({
      data: { ...data, favourites: { create: {} } },
    });
  }

  async updateUser(data: UpdateUserDto): Promise<User | null> {
    const user = await this.prismaService.user.findUnique({
      where: { id: data.id },
    });

    if (!user) {
      throw new HttpException(USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    return await this.prismaService.user.update({
      where: { id: data.id },
      data,
    });
  }

  async updatePassword(
    id: number,
    { oldPassword, newPassword }: UpdatePasswordDto,
  ): Promise<User | null> {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      omit: { password: false },
    });

    if (!user) {
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
