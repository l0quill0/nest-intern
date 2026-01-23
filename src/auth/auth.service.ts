import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { USER_NOT_FOUND } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { AuthDto } from './dto/auth.dto';
import { CreateUserDto } from 'src/user/dto/create.user.dto';
import { GoogleAuthDto } from './dto/google.auth.dto';
import { AuthFlow } from './authFlow.enum';
import { Password, User } from 'src/user/user.record';

export const INVALID_PASSWORD = 'INVALID_PASSWORD';
export const ALREADY_EXISTS = 'USER_ALREADY EXISTS';
export const BASIC_FLOW_INCOMPLETE = 'BASIC_FLOW_INCOMPLETE';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async register(data: CreateUserDto): Promise<User | null> {
    const user = await User.getByEmail(data.email);
    if (user) {
      throw new HttpException(ALREADY_EXISTS, HttpStatus.BAD_REQUEST);
    }

    const password = await Password.hashed(data.password);

    return await User.create({
      ...data,
      authFlow: AuthFlow.BASIC,
      password,
    });
  }

  async validateUser({ email, password }: AuthDto): Promise<boolean> {
    const user = await User.getByEmail(email);
    if (!user) {
      throw new HttpException(USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    if (!user.password) {
      throw new HttpException(BASIC_FLOW_INCOMPLETE, HttpStatus.BAD_REQUEST);
    }

    const isPasswordValid = await user.password.compare(password);
    if (!isPasswordValid) {
      throw new HttpException(INVALID_PASSWORD, HttpStatus.UNAUTHORIZED);
    }
    return true;
  }

  async login(email: string) {
    const user = await User.getByEmail(email);
    if (!user) throw new HttpException(USER_NOT_FOUND, HttpStatus.NOT_FOUND);

    return {
      access_token: this.jwtService.sign({
        email: user.email,
        sub: user.id,
        name: user.name,
        role: user.role,
      }),
    };
  }

  async authGoogle(data: GoogleAuthDto) {
    const user = await User.getByEmail(data.email);

    if (user) {
      if (!user.authFlow.find((f) => f === (AuthFlow.GOOGLE as string))) {
        user.authFlow.push(AuthFlow.GOOGLE);
        await user.update();
      }

      return await this.login(user.email);
    }

    await User.create({ ...data, authFlow: AuthFlow.GOOGLE });

    return await this.login(data.email);
  }
}
