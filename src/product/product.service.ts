import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import 'multer';
import { ProductCacheService } from 'src/product/product-cache.service';
import { Product } from './product.record';
import { SuggestionQueryDto } from './dto/suggestions.query.dto';
import { ProductQueryDto } from './dto/product.query.dto';
import { CreateProductDto } from './dto/create.product.dto';
import { UpdateProductDto } from './dto/update.product.dto';
import { ProductImageStorage } from './product.image.storage';
import CategoryRepository from 'src/category/category.repository';

export const PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND';

const updateProductKeys = ['title', 'price', 'description', 'category'];

@Injectable()
export class ProductService {
  constructor(
    private readonly productCacheService: ProductCacheService,
    private readonly productImageStorage: ProductImageStorage,
  ) {}

  async getByQuery(query: ProductQueryDto) {
    const queryWithDefaults = {
      ...query,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 6,
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: query.sortOrder ?? 'asc',
    };

    return await Product.getByQuery(queryWithDefaults);
  }

  async getById(id: number, userId?: number) {
    const product = await Product.getById(id);

    if (!product)
      throw new HttpException(PRODUCT_NOT_FOUND, HttpStatus.NOT_FOUND);

    const score = await product.getScore();

    let isInFavourites = false;
    if (userId) isInFavourites = await product.isInFavourites(userId);

    return { ...product, score, isInFavourites };
  }

  async getSuggestions({ productId, productCount }: SuggestionQueryDto) {
    const product = await Product.getById(productId);

    if (!product) {
      throw new HttpException(PRODUCT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    return await product.suggestion(productCount);
  }

  async create(file: Express.Multer.File, data: CreateProductDto) {
    const image = await this.productImageStorage.upload(
      file.originalname,
      file.buffer,
      file.mimetype,
    );

    await this.productCacheService.deleteShowcase(data.category);

    return await Product.create({
      ...data,
      image,
      category: CategoryRepository.getBySlug(data.category)!,
    });
  }

  async update(id: number, data: UpdateProductDto, file?: Express.Multer.File) {
    const product = await Product.getById(id);

    if (!product) {
      throw new HttpException(PRODUCT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (file) {
      const image = await this.productImageStorage.upload(
        file.originalname,
        file.buffer,
        file.mimetype,
      );

      await this.productImageStorage.delete(product.image);

      product.image = image;
    }

    for (const key of updateProductKeys) {
      if (key === 'category' && data[key] !== undefined) {
        product[key] = CategoryRepository.getBySlug(data[key])!;
        continue;
      }

      if (data[key] !== undefined && key in product) {
        product[key] = data[key] as Product[keyof Product];
      }
    }

    await this.productCacheService.deleteShowcase(product.category.slug);

    return await product.update();
  }

  async archive(id: number) {
    const product = await Product.getById(id);

    if (!product) {
      throw new HttpException(PRODUCT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    await this.productCacheService.deleteShowcase(product.category.slug);

    return await product.archive();
  }

  async unArchive(id: number) {
    const product = await Product.getById(id);

    if (!product) {
      throw new HttpException(PRODUCT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    await this.productCacheService.deleteShowcase(product.category.slug);

    return await product.unArchive();
  }
}
