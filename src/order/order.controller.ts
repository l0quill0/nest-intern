import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import * as roleGuard from 'src/auth/guards/role.guard';
import { Me } from 'src/user/decorators/me.decorator';
import { OrderQueryDto } from './dto/order.query.dto';
import { OrderUpdateDto } from './dto/order.update.dto';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(JwtGuard)
  @Get('')
  async getByQuery(
    @Me() user: roleGuard.IUserJWT,
    @Query() query: OrderQueryDto,
  ) {
    return await this.orderService.getByQuery(user.sub, query);
  }

  @UseGuards(JwtGuard)
  @Get('active')
  async getActive(@Me() user: roleGuard.IUserJWT) {
    return (
      (await this.orderService.getActive(user.sub)) ||
      (await this.orderService.create(user.sub))
    );
  }

  @UseGuards(JwtGuard)
  @Get(':orderId')
  async getById(
    @Me() user: roleGuard.IUserJWT,
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    return await this.orderService.getById(user.sub, orderId);
  }

  @UseGuards(JwtGuard)
  @Patch(':orderId')
  async update(
    @Me() user: roleGuard.IUserJWT,
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() data: OrderUpdateDto,
  ) {
    return await this.orderService.update(user.sub, orderId, data);
  }
}
