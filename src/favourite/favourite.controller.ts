import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
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
  @Patch('add/:itemId')
  async addFavourite(
    @Me() user: roleGuard.IUserJWT,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return await this.favouriteService.addToFavourite(user.sub, itemId);
  }

  @UseGuards(JwtGuard)
  @Patch('remove/:itemId')
  async removeFavourite(
    @Me() user: roleGuard.IUserJWT,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return await this.favouriteService.removeFavourite(user.sub, itemId);
  }
}
