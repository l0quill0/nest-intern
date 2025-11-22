import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { User } from 'generated/prisma';
import { PrismaService } from 'src/prisma.service';
import bcrypt from 'node_modules/bcryptjs';

import { USER_NOT_FOUND, WRONG_OLD_PASSWORD } from './user.constants';

import { UpdatePasswordDto } from './dto/updatePassword.dto';
import { CreateUserDto } from './dto/create.user.dto';
import { BaseUserDto } from './dto/base.user.dto';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { CacheKeys } from 'src/cache.keys';

@Injectable()
export class UserService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly prismaService: PrismaService,
  ) {}

  async getUserByEmail(email: string) {
    const cacheKey = CacheKeys.USER(email);
    const cachedData = await this.cacheManager.get<User | null>(cacheKey);

    if (cachedData) return cachedData;

    const user = await this.prismaService.user.findUnique({ where: { email } });

    if (user) await this.cacheManager.set(cacheKey, user);

    return user;
  }

  async getUserWithPass(email: string) {
    const cacheKey = CacheKeys.USERWITHPASS(email);
    const cachedData = await this.cacheManager.get<User | null>(cacheKey);

    if (cachedData) return cachedData;

    const user = await this.prismaService.user.findUnique({
      where: { email },
      omit: { password: false },
    });

    if (!user) {
      throw new HttpException(USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    await this.cacheManager.set(cacheKey, user);

    return user;
  }

  async createUser(data: CreateUserDto) {
    return await this.prismaService.user.create({
      data: { ...data, favourites: { create: {} } },
    });
  }

  async updateUser(id: number, data: BaseUserDto) {
    const user = await this.prismaService.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new HttpException(USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    await this.cacheManager.del(CacheKeys.USER(user.email));
    await this.cacheManager.del(CacheKeys.USERWITHPASS(user.email));

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

    if (!user) {
      throw new HttpException(USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (await bcrypt.compare(oldPassword, user.password)) {
      throw new HttpException(WRONG_OLD_PASSWORD, HttpStatus.BAD_REQUEST);
    }

    await this.cacheManager.del(CacheKeys.USERWITHPASS(user.email));

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    return await this.prismaService.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }
}
