import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { IUserJWT } from './guards/role.guard';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from 'src/user/user.record';

const INVALID_TOKEN = 'INVALID_TOKEN';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET as string,
    });
  }

  async validate(user: IUserJWT): Promise<IUserJWT | null> {
    const userExist = await User.getById(user.sub);

    if (!userExist) {
      throw new HttpException(INVALID_TOKEN, HttpStatus.BAD_REQUEST);
    }

    return user;
  }
}
