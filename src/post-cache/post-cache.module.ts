import { Module } from '@nestjs/common';
import { PostCacheService } from './post-cache.service';
import { PostModule } from 'src/post/post.module';
import { PostController } from 'src/post/post.controller';

@Module({
  imports: [PostModule],
  controllers: [PostController],
  providers: [PostCacheService],
})
export class PostCacheModule {}
