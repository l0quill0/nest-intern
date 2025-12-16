import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { PrismaService } from 'src/prisma.service';
import { BucketService } from 'src/bucket/bucket.service';
import { CategoryCacheService } from 'src/category-cache/category-cache.service';
import { ItemCacheService } from 'src/item-cache/item-cache.service';

@Module({
  providers: [
    CategoryService,
    PrismaService,
    BucketService,
    CategoryCacheService,
    ItemCacheService,
  ],
  controllers: [CategoryController],
})
export class CategoryModule {}
