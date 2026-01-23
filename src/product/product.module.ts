import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { ProductCacheService } from 'src/product/product-cache.service';
import { ProductImageStorage } from './product.image.storage';

@Module({
  providers: [ProductService, ProductCacheService, ProductImageStorage],
  controllers: [ProductController],
})
export class ProductModule {}
