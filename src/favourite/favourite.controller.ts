import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { FavouriteService } from './favourite.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { Me } from 'src/user/decorators/me.decorator';
import * as roleGuard from 'src/auth/guards/role.guard';
import { FavouriteDto } from './dto/favourite.dto';

@Controller('favourite')
export class FavouriteController {
  constructor(private readonly favouriteService: FavouriteService) {}

  @UseGuards(JwtGuard)
  @Get('')
  async getFavourite(@Me() user: roleGuard.IUserJWT) {
    return this.favouriteService.getFavourites(user.sub);
  }

  @UseGuards(JwtGuard)
  @Patch('add')
  async addFavourite(
    @Me() user: roleGuard.IUserJWT,
    @Body() body: FavouriteDto,
  ) {
    return await this.favouriteService.addToFavourite(user.sub, body.itemId);
  }

  @UseGuards(JwtGuard)
  @Patch('remove')
  async removeFavourite(
    @Me() user: roleGuard.IUserJWT,
    @Body() body: FavouriteDto,
  ) {
    return await this.favouriteService.removeFavourite(user.sub, body.itemId);
  }
}
