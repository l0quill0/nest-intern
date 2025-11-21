import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from '../decorators/role.decorator';
import { Role } from '../role.enum';

export interface IUserJWT {
  role: Role;
  name: string;
  email: string;
  sub: number;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>(Roles, context.getHandler());
    if (!roles) {
      return true;
    }
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: IUserJWT }>();
    const user = request.user;
    return roles.includes(user.role);
  }
}
