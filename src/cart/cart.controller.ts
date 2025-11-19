import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CartService } from './cart.service';
import { cartAddDto } from './dto/cart.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get(':cartId')
  async getCart(@Param('cartId') cartId: number) {
    return await this.cartService.getCart(cartId);
  }

  @Post('add/:itemId/:cartId')
  async addCartItem(
    @Param('itemId') itemId: number,
    @Param('cartId') cartId: number,
    @Body() body: cartAddDto,
  ) {
    return await this.cartService.addCartItem(itemId, body.quantity, cartId);
  }

  @Post('add/:cartItemId')
  async removeCartItem(
    @Param('cartItemId') cartItemId: number,
    @Body() body: cartAddDto,
  ) {
    return await this.cartService.removeCartItem(cartItemId, body.quantity);
  }
}
