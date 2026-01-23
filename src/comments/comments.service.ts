import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CommentPaginationDto } from './dto/comment.pagination.dto';
import { Product } from 'src/product/product.record';
import { CommentDto } from './dto/comment.dto';
import { PRODUCT_NOT_FOUND } from 'src/product/product.service';
import { User } from 'src/user/user.record';
import { USER_NOT_FOUND } from 'src/user/user.service';

@Injectable()
export class CommentsService {
  async getByQuery(productId: number, query: CommentPaginationDto) {
    const product = await Product.getById(productId);
    if (!product)
      throw new HttpException(PRODUCT_NOT_FOUND, HttpStatus.NOT_FOUND);

    return await product.getComments(query);
  }

  async add(productId: number, userId: number, data: CommentDto) {
    const product = await Product.getById(productId);
    if (!product)
      throw new HttpException(PRODUCT_NOT_FOUND, HttpStatus.NOT_FOUND);

    const user = await User.getById(userId);
    if (!user) throw new HttpException(USER_NOT_FOUND, HttpStatus.NOT_FOUND);

    return await product.addComment(user, data);
  }

  async delete(productId: number, userId: number, commentId: number) {
    const product = await Product.getById(productId);
    if (!product)
      throw new HttpException(PRODUCT_NOT_FOUND, HttpStatus.NOT_FOUND);

    const user = await User.getById(userId);
    if (!user) throw new HttpException(USER_NOT_FOUND, HttpStatus.NOT_FOUND);

    return await product.deleteComment(commentId);
  }
}
