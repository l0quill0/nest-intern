import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';

import { JwtGuard } from 'src/auth/guards/jwt.guard';
import * as roleGuard from 'src/auth/guards/role.guard';

import { Role } from 'src/auth/role.enum';

import { Me } from './decorators/me.decorator';
import { Roles } from 'src/auth/decorators/role.decorator';

import { UserService } from './user.service';

import { BaseUserDto } from './dto/base.user.dto';
import { UpdatePasswordDto } from './dto/updatePassword.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtGuard)
  @Get('me')
  async getMe(@Me() user: roleGuard.IUserJWT) {
    return await this.userService.getUserByEmail(user.email);
  }

  @Roles([Role.ADMIN])
  @UseGuards(JwtGuard, roleGuard.RolesGuard)
  @Patch('update/:id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: BaseUserDto,
  ) {
    return await this.userService.updateUser(id, updateData);
  }

  @UseGuards(JwtGuard)
  @Patch('update-me')
  async updateMe(
    @Me() user: roleGuard.IUserJWT,
    @Body() updateData: BaseUserDto,
  ) {
    return await this.userService.updateUser(user.sub, updateData);
  }

  @UseGuards(JwtGuard)
  @Patch('update-password')
  async updatePassword(
    @Me() user: roleGuard.IUserJWT,
    @Body() data: UpdatePasswordDto,
  ) {
    return await this.userService.updatePassword(user.sub, data);
  }
}
