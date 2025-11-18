import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IUserJWT } from 'src/auth/guards/role.guard';

export const Me = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: IUserJWT }>();
    return request.user;
  },
);
