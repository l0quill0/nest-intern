import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BASIC_FLOW_INCOMPLETE, USER_NOT_FOUND } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { AuthDto } from './dto/auth.dto';
import { CreateUserDto } from 'src/user/dto/create.user.dto';
import { GoogleAuthDto } from './dto/google.auth.dto';
import { AuthFlow } from './authFlow.enum';
import { Password, User } from 'src/user/user.record';

export const INVALID_PASSWORD = 'INVALID_PASSWORD';
export const USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS';
export const INVALID_LOGIN_DATA = 'INVALID_LOGIN_DATA';
export const EMAIL_TAKEN = 'EMAIL_TAKEN';
export const PHONE_TAKEN = 'PHONE_TAKEN';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async register(data: CreateUserDto) {
    const user =
      (await User.getByEmail(data.email)) ||
      (await User.getByPhone(data.phone));

    if (
      user &&
      !user.authFlow.every((flow) => flow === (AuthFlow.AUTO as string))
    ) {
      if (user.email === data.email)
        throw new HttpException(EMAIL_TAKEN, HttpStatus.BAD_REQUEST);

      throw new HttpException(PHONE_TAKEN, HttpStatus.BAD_REQUEST);
    }

    const password = await Password.hashed(data.password);

    if (!user) {
      return await User.create({
        ...data,
        authFlow: AuthFlow.BASIC,
        phone: data.phone.replaceAll('+', ''),
        password,
      });
    } else {
      user.name = data.name;
      user.phone = data.phone.replaceAll('+', '');
      user.password = password;
      user.authFlow.push(AuthFlow.BASIC);
      return await user.update();
    }
  }

  async validateUser({ identifier, password }: AuthDto) {
    const user =
      (await User.getByEmail(identifier)) ||
      (await User.getByPhone(identifier));

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

  async login(identifier: string) {
    const user =
      (await User.getByEmail(identifier)) ||
      (await User.getByPhone(identifier));
    if (!user) throw new HttpException(USER_NOT_FOUND, HttpStatus.NOT_FOUND);

    return {
      access_token: this.jwtService.sign({
        email: user.email,
        sub: user.id,
        name: user.name,
        role: user.role,
        phone: user.phone,
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

      return await this.login(user.email!);
    }

    await User.create({ ...data, authFlow: AuthFlow.GOOGLE });

    return await this.login(data.email);
  }
}
