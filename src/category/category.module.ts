import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { ProductCacheService } from 'src/product/product-cache.service';
import { CategoryImageStorage } from './category.image.storage';

@Module({
  providers: [CategoryService, ProductCacheService, CategoryImageStorage],
  controllers: [CategoryController],
})
export class CategoryModule {}
