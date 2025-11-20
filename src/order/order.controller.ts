import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
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
  @Get('current')
  async getCurrentOrder(@Me() user: roleGuard.IUserJWT) {
    return (
      (await this.orderService.getCurrentOrder(user.sub)) &&
      (await this.orderService.createCurrentOrder(user.sub))
    );
  }

  @UseGuards(JwtGuard)
  @Get(':id')
  async getOrderById(@Param('id') id: number) {
    return await this.orderService.getOrderById(id);
  }

  @UseGuards(JwtGuard)
  @Patch('add-item')
  async addOrderItem(
    @Me() user: roleGuard.IUserJWT,
    @Body() data: OrderAddItemDto,
  ) {
    return await this.orderService.addOrderItem(user.sub, data);
  }

  //fix
  @UseGuards(JwtGuard)
  @Patch('remove-item')
  async removeOrderItem(@Body() data: OrderRemoveItemDto) {
    return await this.orderService.removeOrderItem(data);
  }

  @UseGuards(JwtGuard)
  @Patch('send')
  async sendOrder(@Me() user: roleGuard.IUserJWT) {
    return await this.orderService.sendOrder(user.sub);
  }

  //fix
  @UseGuards(JwtGuard)
  @Patch('cancel/:id')
  async cancelOrder(@Param('id') id: number) {
    return await this.orderService.cancelOrder(id);
  }

  @Roles([Role.ADMIN])
  @Patch('complete/:id')
  async completeOrder(@Param('id') id: number) {
    return await this.orderService.completeOrder(id);
  }
}
