import { Module } from '@nestjs/common';
import { ItemService } from './item.service';
import { ItemController } from './item.controller';
import { BucketService } from 'src/bucket/bucket.service';
import { PrismaService } from 'src/prisma.service';
import { CategoryService } from 'src/category/category.service';
import { RedisService } from 'src/redis/redis.service';
import { ItemCacheService } from 'src/item-cache/item-cache.service';
import { CategoryCacheService } from 'src/category-cache/category-cache.service';

@Module({
  providers: [
    ItemService,
    BucketService,
    PrismaService,
    CategoryService,
    RedisService,
    ItemCacheService,
    CategoryCacheService,
  ],
  controllers: [ItemController],
})
export class ItemModule {}
