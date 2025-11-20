import { Module } from '@nestjs/common';
import { FavouriteService } from './favourite.service';
import { FavouriteController } from './favourite.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  providers: [FavouriteService, PrismaService],
  controllers: [FavouriteController],
})
export class FavouriteModule {}
