import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { PrismaService } from 'src/prisma.service';
import { fetchPage } from './fetchPage';
import { PostCacheService } from 'src/post-cache/post-cache.service';

@Injectable()
export class PostService {
  logger = new Logger(PostService.name);
  constructor(
    private readonly prismaService: PrismaService,
    private readonly postCacheService: PostCacheService,
  ) {}

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
          return this.prismaService.postOffice.update({
            where: { id: item.id },
            data: { status: item.status },
          });
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

    const regions = await this.prismaService.region.findMany();
    await this.postCacheService.setRegionCache(regions);

    return regions;
  }

  async getSettlements(regionId: number) {
    const region = await this.prismaService.region.findUnique({
      where: { id: regionId },
    });

    if (!region) {
      throw new HttpException('REGION NOT FOUND', HttpStatus.NOT_FOUND);
    }

    const cached = await this.postCacheService.getSettlementCache(region.name);
    if (cached) return cached;

    const settlements = await this.prismaService.settlement.findMany({
      where: { regionId },
    });
    await this.postCacheService.setSettlementCache(settlements, region.name);

    return settlements;
  }

  async getPostOffices(settlementId: number) {
    const settlement = await this.prismaService.settlement.findUnique({
      where: { id: settlementId },
    });
    if (!settlement) {
      throw new HttpException('SETTLEMENT NOT FOUND', HttpStatus.NOT_FOUND);
    }

    const cached = await this.postCacheService.getPostOfficeCache(
      settlement.name,
    );
    if (cached) return cached;

    const postOffices = await this.prismaService.postOffice.findMany({
      where: { AND: [{ settlementId: settlementId }, { status: 'Working' }] },
    });
    await this.postCacheService.setPostOfficeCache(
      postOffices,
      settlement.name,
    );

    return postOffices;
  }
}
