import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { IUserJWT } from './guards/role.guard';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET as string,
    });
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async validate(user: IUserJWT): Promise<IUserJWT> {
    return user;
  }
}
