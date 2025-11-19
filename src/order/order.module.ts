import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PrismaService } from 'src/prisma.service';
import { ItemService } from 'src/item/item.service';
import { UserService } from 'src/user/user.service';

@Module({
  providers: [OrderService, PrismaService, ItemService, UserService],
  controllers: [OrderController],
})
export class OrderModule {}
