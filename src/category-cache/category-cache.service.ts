import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class CategoryCacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}
  async setCategoryCache(data: any) {
    await this.cacheManager.set('categories', data);
  }

  async getCategoryCache() {
    return await this.cacheManager.get('categories');
  }

  async clearCategoryCache() {
    await this.cacheManager.del('categories');
  }
}
