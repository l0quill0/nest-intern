import { Injectable } from '@nestjs/common';
import { User } from 'generated/prisma';

import { PrismaService } from 'src/prisma.service';
import { CreateUserDto } from './dto/create.user.dto';
import { UpdateUserDto } from './dto/update.user.dto';

import bcrypt from 'node_modules/bcryptjs';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async findUserByEmail(email: string): Promise<User | null> {
    return await this.prismaService.user.findUnique({ where: { email } });
  }

  async createUser(data: CreateUserDto): Promise<User> {
    return await this.prismaService.user.create({ data });
  }

  async updateUser(data: UpdateUserDto): Promise<User> {
    return await this.prismaService.user.update({
      where: { id: data.id },
      data,
    });
  }

  async updatePassword(id: number, newPassword: string): Promise<User> {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    return await this.prismaService.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }
}
