import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { Product, ProductsView } from './product.record';
import { ISerializedView } from './types/product.serialized.type';
import { Category } from 'src/category/category.record';

@Injectable()
export class ProductCacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async addShowcase(category: string, products: ProductsView) {
    await this.cacheManager.set(
      `showcase_${category}`,
      this.formatProducts(products),
    );
  }

  async getShowcase(category: string) {
    const cached = await this.cacheManager.get<string>(`showcase_${category}`);
    if (!cached) return undefined;
    return this.restoreProducts(cached);
  }

  async deleteShowcase(category?: string) {
    if (!category) category = 'other';
    await this.cacheManager.del(`showcase_${category}`);
  }

  private formatProduct(product: Product) {
    return {
      id: product.id,
      title: product.title,
      image: product.image,
      price: product.price,
      category: {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
        image: product.category.image,
      },
      createdAt: product.createdAt,
      isRemoved: product.isRemoved,
      description: product.description,
    };
  }

  private formatProducts(products: ProductsView) {
    return JSON.stringify({
      items: products.items.map((item) => this.formatProduct(item)),
      currentPage: products.currentPage,
      totalPages: products.totalPages,
    });
  }

  protected restoreProducts(products: string) {
    const prodView = JSON.parse(products) as ISerializedView;
    return new ProductsView({
      ...prodView,
      items: prodView.items.map(
        (item) =>
          new Product({ ...item, category: new Category(item.category) }),
      ),
    });
  }
}
