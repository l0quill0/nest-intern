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
import { OrderAddItemDto } from './dto/order.add.item.dto';
import { OrderRemoveItemDto } from './dto/order.remove.item.dto';
import { Roles } from 'src/auth/decorators/role.decorator';
import { Role } from 'src/auth/role.enum';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(JwtGuard)
  @Get('')
  async getPaginatedOrders(
    @Me() user: roleGuard.IUserJWT,
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return await this.orderService.getPaginatedOrders(user, {
      page,
      pageSize,
      sortBy,
      sortOrder,
    });
  }

  @UseGuards(JwtGuard)
  @Get('current')
  async getCurrentOrder(@Me() user: roleGuard.IUserJWT) {
    return (
      (await this.orderService.getCurrentOrder(user.sub)) ||
      (await this.orderService.createCurrentOrder(user.sub))
    );
  }

  @UseGuards(JwtGuard)
  @Get(':id')
  async getOrderById(
    @Me() user: roleGuard.IUserJWT,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.orderService.getOrderById(user, id);
  }

  @UseGuards(JwtGuard)
  @Patch('add-item')
  async addOrderItem(
    @Me() user: roleGuard.IUserJWT,
    @Body() data: OrderAddItemDto,
  ) {
    return await this.orderService.addOrderItem(user.sub, data);
  }

  @UseGuards(JwtGuard)
  @Patch('remove-item')
  async removeOrderItem(
    @Me() user: roleGuard.IUserJWT,
    @Body() data: OrderRemoveItemDto,
  ) {
    return await this.orderService.removeOrderItem(user.sub, data);
  }

  @UseGuards(JwtGuard)
  @Patch('send')
  async sendOrder(@Me() user: roleGuard.IUserJWT) {
    return await this.orderService.sendOrder(user.sub);
  }

  @UseGuards(JwtGuard)
  @Patch('cancel/:id')
  async cancelOrder(
    @Me() user: roleGuard.IUserJWT,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.orderService.cancelOrder(user, id);
  }

  @Roles([Role.ADMIN])
  @Patch('complete/:id')
  async completeOrder(@Param('id', ParseIntPipe) id: number) {
    return await this.orderService.completeOrder(id);
  }
}
