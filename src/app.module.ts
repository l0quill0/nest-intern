import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ProductModule } from './product/product.module';
import { OrderModule } from './order/order.module';
import { CategoryModule } from './category/category.module';
import { FavouriteModule } from './favourite/favourite.module';
import { CacheModule } from '@nestjs/cache-manager';
import { ProductCacheService } from './product/product-cache.service';
import { PostModule } from './post/post.module';
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';
import { ScheduleModule } from '@nestjs/schedule';
import { CommentsModule } from './comments/comments.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    ProductModule,
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
    PostModule,
    CommentsModule,
  ],
  controllers: [AppController],
  providers: [AppService, ProductCacheService],
})
export class AppModule {}
