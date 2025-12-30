import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PostService } from 'src/post/post.service';
import { PostRegions } from 'src/post/post.regions.enum';
import { IPostOffice } from 'src/post/types/post.office.type';

@Injectable()
export class PostCacheService implements OnModuleInit {
  private readonly logger = new Logger(PostCacheService.name);
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly postService: PostService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cronSyncCache() {
    await this.syncCache();
  }

  async onModuleInit() {
    await this.syncCache();
  }

  async syncCache() {
    this.logger.log('Post office sync start');
    try {
      const offices = await this.postService.fetchPostOffices();
      await this.cacheManager.set('ALL_OFFICES', offices, 1000 * 60 * 60 * 24);
      this.logger.log(`Synced ${offices.length} post offices`);
    } catch (error) {
      this.logger.error('Failed to sync', error);
    }
  }

  async getCache() {
    return await this.cacheManager.get('ALL_OFFICES');
  }

  async getOfficeByRegion(regionKey: string) {
    const region = PostRegions[regionKey as keyof typeof PostRegions] as string;

    const cached = await this.cacheManager.get(`OFFICES_${region}`);
    if (!cached) {
      const allOffices =
        await this.cacheManager.get<IPostOffice[]>(`ALL_OFFICES`);
      if (!allOffices) return [];

      const filtered = allOffices.filter((office) => office.region === region);

      if (filtered.length > 0) {
        await this.cacheManager.set(`OFFICES_${region}`, filtered);
        return filtered;
      } else return [];
    }
    return cached;
  }
}
