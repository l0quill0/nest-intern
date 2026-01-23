import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostCacheService } from 'src/post/post-cache.service';
import { PostController } from './post.controller';

@Module({
  controllers: [PostController],
  providers: [PostService, PostCacheService],
  exports: [PostService],
})
export class PostModule {}
