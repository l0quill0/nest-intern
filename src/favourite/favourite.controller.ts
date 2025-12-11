import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { FavouriteService } from './favourite.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { Me } from 'src/user/decorators/me.decorator';
import * as roleGuard from 'src/auth/guards/role.guard';

@Controller('favourite')
export class FavouriteController {
  constructor(private readonly favouriteService: FavouriteService) {}

  @UseGuards(JwtGuard)
  @Get('')
  async getFavourite(@Me() user: roleGuard.IUserJWT) {
    return await this.favouriteService.getFavourites(user.sub);
  }

  @UseGuards(JwtGuard)
  @Post(':itemId')
  async addFavourite(
    @Me() user: roleGuard.IUserJWT,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return await this.favouriteService.addToFavourite(user.sub, itemId);
  }

  @UseGuards(JwtGuard)
  @Delete(':itemId')
  async removeFavourite(
    @Me() user: roleGuard.IUserJWT,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return await this.favouriteService.removeFavourite(user.sub, itemId);
  }
}
