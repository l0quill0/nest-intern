import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CartItem, UserCart } from 'generated/prisma';
import { ITEM_NOT_FOUND } from 'src/item/item.constants';
import { PrismaService } from 'src/prisma.service';
import { CART_ITEM_NOT_FOUND } from './cart.constants';

@Injectable()
export class CartService {
  constructor(private readonly prismaService: PrismaService) {}

  async getCart(cartId: number): Promise<UserCart | null> {
    return await this.prismaService.userCart.findUnique({
      where: { id: cartId },
      include: {
        items: true,
      },
    });
  }

  async addCartItem(
    itemId: number,
    quantity: number,
    cartId: number,
  ): Promise<CartItem | null> {
    const item = await this.prismaService.item.findUnique({
      where: { id: itemId },
    });
    if (!item) {
      throw new HttpException(ITEM_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const itemInCart = await this.prismaService.cartItem.findFirst({
      where: { AND: [{ cartId }, { itemId }] },
    });

    if (itemInCart) {
      return await this.prismaService.cartItem.update({
        where: { id: itemInCart.id },
        data: { quantity },
      });
    }

    return await this.prismaService.cartItem.create({
      data: {
        itemId,
        cartId,
        quantity,
      },
    });
  }

  async removeCartItem(
    cartItemId: number,
    quantity?: number,
  ): Promise<CartItem | null> {
    const cartItem = await this.prismaService.cartItem.findUnique({
      where: { id: cartItemId },
    });

    if (!cartItem) {
      throw new HttpException(CART_ITEM_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (!quantity) {
      return await this.prismaService.cartItem.delete({
        where: { id: cartItemId },
      });
    }

    return await this.prismaService.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });
  }
}
