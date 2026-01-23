import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import * as roleGuard from 'src/auth/guards/role.guard';
import { Me } from './decorators/me.decorator';
import { UserService } from './user.service';
import { UserDto } from './dto/user.dto';
import { UpdatePasswordDto } from './dto/updatePassword.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtGuard)
  @Get('me')
  async getMe(@Me() user: roleGuard.IUserJWT) {
    return await this.userService.getByEmail(user.email);
  }

  @UseGuards(JwtGuard)
  @Get('count')
  async getCount(@Me() user: roleGuard.IUserJWT) {
    return await this.userService.getCount(user.sub);
  }

  @UseGuards(JwtGuard)
  @Patch('update-me')
  async updateMe(@Me() user: roleGuard.IUserJWT, @Body() body: UserDto) {
    return await this.userService.update(user.sub, body);
  }

  @UseGuards(JwtGuard)
  @Patch('update-password')
  async updatePassword(
    @Me() user: roleGuard.IUserJWT,
    @Body() body: UpdatePasswordDto,
  ) {
    return await this.userService.updatePassword(user.sub, body);
  }

  @UseGuards(JwtGuard)
  @Patch('add-password')
  async addPassword(
    @Me() user: roleGuard.IUserJWT,
    @Body() { password }: { password: string },
  ) {
    return await this.userService.addPassword(user.sub, password);
  }
}
