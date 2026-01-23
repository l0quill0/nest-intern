import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { fetchPage } from './fetchPage';
import { PostCacheService } from 'src/post/post-cache.service';
import { Post, Region, Settlement } from './post.record';

export const REGION_NOT_FOUND = 'REGION_NOT_FOUND';
export const SETTLEMENT_NOT_FOUND = 'SETTLEMENT_NOT_FOUND';
export const POST_OFFICT_NOT_FOUND = 'POST_OFFICT_NOT_FOUND';

@Injectable()
export class PostService {
  logger = new Logger(PostService.name);
  constructor(private readonly postCacheService: PostCacheService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  private async syncPostOffices() {
    try {
      this.logger.log('Sync started');
      const response = await axios.get<{ jwt: string }>(
        `${process.env.NP_BASE_URL}/clients/authorization/`,
        { params: { apiKey: process.env.NP_API_KEY } },
      );

      const novaPostJWT = response.data.jwt;

      if (!novaPostJWT) {
        throw new Error('Nova post jwt token missing');
      }

      let hasNextPage = true;
      let currentPage = 1;

      while (hasNextPage) {
        const page = await fetchPage(currentPage, novaPostJWT);

        const promises = page.items.map((item) => {
          return new Post({
            ...item,
            settlement: {
              ...item.settlement,
              region: {
                ...item.settlement.region,
                name:
                  item.settlement.region.parent?.name ||
                  item.settlement.region.name,
              },
            },
          }).update();
        });

        await Promise.all(promises);

        hasNextPage = page.current_page !== page.last_page;
        currentPage++;
      }
      this.logger.log('Sync successfull');
    } catch (error) {
      this.logger.error('Failed to sync', error);
    }
  }

  async getRegions() {
    const cached = await this.postCacheService.getRegionCache();
    if (cached) return cached;

    const regions = await Region.getAll();
    await this.postCacheService.setRegionCache(regions);

    return regions;
  }

  async getSettlements(regionId: number) {
    const region = await Region.getById(regionId);
    if (!region) {
      throw new HttpException(REGION_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const cached = await this.postCacheService.getSettlementCache(region.name);
    if (cached) return cached;

    const settlements = await Settlement.getByRegion(region);
    await this.postCacheService.setSettlementCache(settlements, region.name);

    return settlements;
  }

  async getPostOffices(settlementId: number) {
    const settlement = await Settlement.getById(settlementId);
    if (!settlement) {
      throw new HttpException(SETTLEMENT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const cached = await this.postCacheService.getPostOfficeCache(
      settlement.name,
    );
    if (cached) return cached;

    const postOffices = await Post.getBySettlement(settlement);
    await this.postCacheService.setPostOfficeCache(
      postOffices,
      settlement.name,
    );

    return postOffices;
  }
}
