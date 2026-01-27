import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  SerializeOptions,
  UseInterceptors,
} from '@nestjs/common';
import { PostService } from './post.service';
import {
  PostResponseDto,
  RegionResponseDto,
  SettlementResponseDto,
} from './dto/post.response.dto';

@Controller('post')
@UseInterceptors(ClassSerializerInterceptor)
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get('regions')
  @SerializeOptions({ type: RegionResponseDto })
  async getRegions() {
    return await this.postService.getRegions();
  }

  @Get('regions/:regionId')
  @SerializeOptions({ type: SettlementResponseDto })
  async getSettlements(@Param('regionId') regionId: number) {
    return await this.postService.getSettlements(regionId);
  }

  @Get(':settlementId')
  @SerializeOptions({ type: PostResponseDto })
  async getOffices(@Param('settlementId') settlementId: number) {
    return await this.postService.getPostOffices(settlementId);
  }
}
