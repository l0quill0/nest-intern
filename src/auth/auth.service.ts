import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { AuthDto } from './dto/auth.dto';
import {
  INVALID_PASSWORD_ERROR,
  NO_PASSWORD,
  UNKNOWN_USER_ERROR,
  USER_ALREADY_EXISTS_ERROR,
} from './auth.constants';
import bcrypt from 'node_modules/bcryptjs';
import { CreateUserDto } from 'src/user/dto/create.user.dto';
import { User } from 'generated/prisma';
import { GoogleAuthDto } from './dto/google.auth.dto';
import { AuthMethod } from './authMethod.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(data: CreateUserDto): Promise<User | null> {
    const user = await this.userService.getUserByEmail(data.email);
    if (user) {
      throw new HttpException(
        USER_ALREADY_EXISTS_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(data.password, salt);

    return await this.userService.createUser({
      ...data,
      authMethod: AuthMethod.BASIC,
      password: hashedPassword,
    });
  }

  async validateUser({ email, password }: AuthDto): Promise<boolean> {
    const user = await this.userService.getUserWithPass(email);
    if (!user) {
      throw new HttpException(UNKNOWN_USER_ERROR, HttpStatus.NOT_FOUND);
    }
    if (!user.password) {
      throw new HttpException(NO_PASSWORD, HttpStatus.BAD_REQUEST);
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

  async authGoogle(data: GoogleAuthDto) {
    const user = await this.userService.getUserByEmail(data.email);
    if (user) return await this.login(user.email);

    await this.userService.createUser({
      ...data,
      authMethod: AuthMethod.GOOGLE,
    });

    return await this.login(data.email);
  }
}
