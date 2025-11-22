import { Module } from '@nestjs/common';
import { ItemService } from './item.service';
import { ItemController } from './item.controller';
import { BucketService } from 'src/bucket/bucket.service';
import { PrismaService } from 'src/prisma.service';
import { CategoryService } from 'src/category/category.service';
import { RedisService } from 'src/redis/redis.service';

@Module({
  providers: [
    ItemService,
    BucketService,
    PrismaService,
    CategoryService,
    RedisService,
  ],
  controllers: [ItemController],
})
export class ItemModule {}
