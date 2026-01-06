import { Controller, Get, Param } from '@nestjs/common';
import { PostService } from './post.service';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get('regions')
  async getRegions() {
    return await this.postService.getRegions();
  }

  @Get('regions/:regionId')
  async getSettlements(@Param('regionId') regionId: number) {
    return await this.postService.getSettlements(regionId);
  }

  @Get(':settlementId')
  async getOffices(@Param('settlementId') settlementId: number) {
    return await this.postService.getPostOffices(settlementId);
  }
}
