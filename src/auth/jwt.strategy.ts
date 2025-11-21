import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { IUserJWT } from './guards/role.guard';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma.service';
import { INVALID_TOKEN } from './auth.constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prismaService: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET as string,
    });
  }

  async validate(user: IUserJWT): Promise<IUserJWT | null> {
    const userExist = await this.prismaService.user.findUnique({
      where: { id: user.sub },
    });

    if (!userExist) {
      throw new HttpException(INVALID_TOKEN, HttpStatus.BAD_REQUEST);
    }

    return user;
  }
}
