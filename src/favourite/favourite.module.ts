import { Module } from '@nestjs/common';
import { FavouriteService } from './favourite.service';
import { FavouriteController } from './favourite.controller';

@Module({
  providers: [FavouriteService],
  controllers: [FavouriteController],
})
export class FavouriteModule {}
