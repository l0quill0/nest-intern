import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { Roles } from 'src/auth/decorators/role.decorator';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import * as roleGuard from 'src/auth/guards/role.guard';
import { Role } from 'src/auth/role.enum';
import { Me } from './decorators/me.decorator';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update.user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Roles([Role.ADMIN, Role.USER])
  @UseGuards(JwtGuard, roleGuard.RolesGuard)
  @Get('me')
  async getMe(@Me() user: roleGuard.IUserJWT) {
    return await this.userService.findUserByEmail(user.email);
  }

  @UseGuards(JwtGuard)
  @Patch('update')
  async updateUser(@Body() updateData: UpdateUserDto) {
    return await this.userService.updateUser(updateData);
  }

  @UseGuards(JwtGuard)
  @Patch('update-password')
  async updatePassword(
    @Me() user: roleGuard.IUserJWT,
    @Body('newPassword') newPassword: string,
  ) {
    return await this.userService.updatePassword(user.sub, newPassword);
  }
}
