import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ItemModule } from './item/item.module';
import { OrderModule } from './order/order.module';
import { CategoryModule } from './category/category.module';
import { FavouriteModule } from './favourite/favourite.module';
import { CacheModule } from '@nestjs/cache-manager';
import { BucketModule } from './bucket/bucket.module';
import { RedisService } from './redis/redis.service';
import { RedisModule } from './redis/redis.module';
import { ItemCacheService } from './item-cache/item-cache.service';
import { CategoryCacheService } from './category-cache/category-cache.service';
import { PostModule } from './post/post.module';
import { PostCacheModule } from './post-cache/post-cache.module';
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    AuthModule,
    UserModule,
    ItemModule,
    OrderModule,
    CategoryModule,
    FavouriteModule,
    ScheduleModule.forRoot(),
    CacheModule.register({
      isGlobal: true,
      stores: [
        new Keyv(
          {
            store: new KeyvRedis(process.env.REDIS_URL),
            ttl: 1000 * 60 * 30,
          },
          { useKeyPrefix: false },
        ),
      ],
    }),
    BucketModule,
    RedisModule,
    PostModule,
    PostCacheModule,
  ],
  controllers: [AppController],
  providers: [AppService, RedisService, ItemCacheService, CategoryCacheService],
})
export class AppModule {}
