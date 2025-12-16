import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';

@Injectable()
export class ItemCacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async setItemCache(data: any, category?: string) {
    await this.cacheManager.set(`items_${category}`, data);
  }

  async getItemCache(category?: string) {
    return await this.cacheManager.get(`items_${category}`);
  }

  async clearItemCache(category?: string) {
    await this.cacheManager.del(`items_${category}`);
  }
}
