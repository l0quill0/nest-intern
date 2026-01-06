import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostCacheService } from 'src/post-cache/post-cache.service';
import { PostController } from './post.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [PostController],
  providers: [PostService, PostCacheService, PrismaService],
  exports: [PostService],
})
export class PostModule {}
