import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ItemModule } from './item/item.module';
import { CartModule } from './cart/cart.module';
import { OrderModule } from './order/order.module';
import { CategoryModule } from './category/category.module';
import { FavouriteModule } from './favourite/favourite.module';

@Module({
  imports: [AuthModule, UserModule, ItemModule, CartModule, OrderModule, CategoryModule, FavouriteModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
