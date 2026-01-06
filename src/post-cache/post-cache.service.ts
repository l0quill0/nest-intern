import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';

@Injectable()
export class PostCacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async setRegionCache(data: any) {
    await this.cacheManager.set('REGIONS', data, 0);
  }

  async getRegionCache() {
    return await this.cacheManager.get('REGIONS');
  }

  async setSettlementCache(data: any, regionName: string) {
    await this.cacheManager.set(`${regionName}_SETTLEMENTS`, data, 0);
  }

  async getSettlementCache(regionName: string) {
    return await this.cacheManager.get(`${regionName}_SETTLEMENTS`);
  }

  async setPostOfficeCache(data: any, settlementName: string) {
    await this.cacheManager.set(`${settlementName}_OFFICES`, data);
  }

  async getPostOfficeCache(settlementName: string) {
    return await this.cacheManager.get(`${settlementName}_OFFICES`);
  }
}
