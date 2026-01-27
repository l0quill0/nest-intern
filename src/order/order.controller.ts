import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  SerializeOptions,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import * as roleGuard from 'src/auth/guards/role.guard';
import { Me } from 'src/user/decorators/me.decorator';
import { OrderQueryDto } from './dto/order.query.dto';
import { OrderUpdateDto } from './dto/order.update.dto';
import { OrderUnauthDto } from './dto/order.unauth.dto';
import {
  OrderResponseDto,
  OrderViewResponseDto,
} from './dto/order.response.dto';

@Controller('order')
@UseInterceptors(ClassSerializerInterceptor)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(JwtGuard)
  @Get('')
  @SerializeOptions({ type: OrderViewResponseDto })
  async getByQuery(
    @Me() user: roleGuard.IUserJWT,
    @Query() query: OrderQueryDto,
  ) {
    return await this.orderService.getByQuery(user.sub, query);
  }

  @UseGuards(JwtGuard)
  @Get('active')
  @SerializeOptions({ type: OrderResponseDto })
  async getActive(@Me() user: roleGuard.IUserJWT) {
    return (
      (await this.orderService.getActive(user.sub)) ||
      (await this.orderService.create(user.sub))
    );
  }

  @UseGuards(JwtGuard)
  @Get(':orderId')
  @SerializeOptions({ type: OrderResponseDto })
  async getById(
    @Me() user: roleGuard.IUserJWT,
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    return await this.orderService.getById(user.sub, orderId);
  }

  @Post('unauth')
  @SerializeOptions({ type: OrderResponseDto })
  async createUnauth(@Body() body: OrderUnauthDto) {
    return await this.orderService.createWithoutAuth(body);
  }

  @UseGuards(JwtGuard)
  @Patch(':orderId')
  @SerializeOptions({ type: OrderResponseDto })
  async update(
    @Me() user: roleGuard.IUserJWT,
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() data: OrderUpdateDto,
  ) {
    return await this.orderService.update(user.sub, orderId, data);
  }
}
