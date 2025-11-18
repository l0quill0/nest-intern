import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { AuthDto } from './dto/auth.dto';
import {
  INVALID_PASSWORD_ERROR,
  UNKNOWN_USER_ERROR,
  USER_ALREADY_EXISTS_ERROR,
} from './auth.constants';
import bcrypt from 'node_modules/bcryptjs';
import { CreateUserDto } from 'src/user/dto/create.user.dto';
import { User } from 'generated/prisma';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(data: CreateUserDto): Promise<User | null> {
    const user = await this.userService.findUserByEmail(data.email);
    if (user) {
      throw new HttpException(
        USER_ALREADY_EXISTS_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(data.password, salt);

    return this.userService.createUser({
      ...data,
      password: hashedPassword,
    });
  }

  async validateUser({ email, password }: AuthDto): Promise<boolean> {
    const user = await this.userService.findUserByEmail(email);
    if (!user) {
      throw new HttpException(UNKNOWN_USER_ERROR, HttpStatus.NOT_FOUND);
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new HttpException(INVALID_PASSWORD_ERROR, HttpStatus.UNAUTHORIZED);
    }
    return true;
  }

  async login(email: string) {
    const payload = await this.userService.findUserByEmail(email);
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
