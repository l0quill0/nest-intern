import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { AuthDto } from './dto/auth.dto';
import {
  INVALID_PASSWORD_ERROR,
  NOT_REGISTERED,
  UNKNOWN_USER_ERROR,
  USER_ALREADY_EXISTS_ERROR,
} from './auth.constants';
import bcrypt from 'node_modules/bcryptjs';
import { CreateUserDto } from 'src/user/dto/create.user.dto';
import { User } from 'generated/prisma';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(data: CreateUserDto): Promise<User | null> {
    const user = await this.userService.getUserByEmail(data.email);
    if (user && user.isRegistered) {
      throw new HttpException(
        USER_ALREADY_EXISTS_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(data.password, salt);

    if (user && !user.isRegistered) {
      return await this.prismaService.user.update({
        where: { email: data.email },
        data: { password: hashedPassword, name: data.name },
      });
    }

    return await this.userService.createUser({
      ...data,
      password: hashedPassword,
    });
  }

  async validateUser({ email, password }: AuthDto): Promise<boolean> {
    const user = await this.userService.getUserWithPass(email);
    if (!user) {
      throw new HttpException(UNKNOWN_USER_ERROR, HttpStatus.NOT_FOUND);
    }
    if (!user.password) {
      throw new HttpException(NOT_REGISTERED, HttpStatus.BAD_REQUEST);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new HttpException(INVALID_PASSWORD_ERROR, HttpStatus.UNAUTHORIZED);
    }
    return true;
  }

  async login(email: string) {
    const payload = await this.userService.getUserByEmail(email);
    return {
      access_token: this.jwtService.sign({
        email: payload?.email,
        sub: payload?.id,
        name: payload?.name,
        role: payload?.role,
      }),
    };
  }
}
