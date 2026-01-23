import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PRODUCT_NOT_FOUND } from 'src/product/product.service';
import { User } from 'src/user/user.record';
import { USER_NOT_FOUND } from 'src/user/user.service';
import { Product } from 'src/product/product.record';

export const ALREADY_IN_FAVOURITE = 'ALREADY_IN_FAVOURITE';
export const NOT_IN_FAVOURITES = 'NOT_IN_FAVOURITES';

@Injectable()
export class FavouriteService {
  async getFavourites(userId: number) {
    const user = await User.getById(userId);
    if (!user) throw new HttpException(USER_NOT_FOUND, HttpStatus.NOT_FOUND);

    return await user.getFavourites();
  }

  async addFavourite(userId: number, productId: number) {
    const user = await User.getById(userId);
    if (!user) throw new HttpException(USER_NOT_FOUND, HttpStatus.NOT_FOUND);

    const product = await Product.getById(productId);
    if (!product)
      throw new HttpException(PRODUCT_NOT_FOUND, HttpStatus.NOT_FOUND);

    const isInFavourites = await user.isInFavourites(product);
    if (isInFavourites)
      throw new HttpException(ALREADY_IN_FAVOURITE, HttpStatus.BAD_REQUEST);

    return await user.addFavourite(product);
  }

  async removeFavourite(userId: number, productId: number) {
    const user = await User.getById(userId);
    if (!user) throw new HttpException(USER_NOT_FOUND, HttpStatus.NOT_FOUND);

    const product = await Product.getById(productId);
    if (!product)
      throw new HttpException(PRODUCT_NOT_FOUND, HttpStatus.NOT_FOUND);

    const isInFavourites = await user.isInFavourites(product);
    if (!isInFavourites)
      throw new HttpException(NOT_IN_FAVOURITES, HttpStatus.BAD_REQUEST);

    return await user.removeFavourite(product);
  }
}
