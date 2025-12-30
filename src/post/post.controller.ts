import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Roles } from 'src/auth/decorators/role.decorator';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Role } from 'src/auth/role.enum';
import { PostCacheService } from 'src/post-cache/post-cache.service';

@Controller('post')
export class PostController {
  constructor(private readonly postCacheService: PostCacheService) {}

  @Get('')
  async getPostOfficeByRegion(@Query() data: { region: string }) {
    return await this.postCacheService.getOfficeByRegion(data.region);
  }

  @Get('all')
  @Roles([Role.ADMIN])
  @UseGuards(JwtGuard, RolesGuard)
  async getAllPostOffices() {
    return await this.postCacheService.getCache();
  }
}
