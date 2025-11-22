import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PrismaService } from 'src/prisma.service';
import { UserService } from 'src/user/user.service';
import { BucketService } from 'src/bucket/bucket.service';

@Module({
  providers: [OrderService, PrismaService, UserService, BucketService],
  controllers: [OrderController],
})
export class OrderModule {}
