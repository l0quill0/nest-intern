import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { OrderStatus } from './order.enum';
import { OrderUpdateDto } from './dto/order.update.dto';
import { User } from 'src/user/user.record';
import { ERROR_CREATING_USER, USER_NOT_FOUND } from 'src/user/user.service';
import { Order } from './order.record';
import { Post } from 'src/post/post.record';
import { OrderQueryDto } from './dto/order.query.dto';
import { POST_OFFICT_NOT_FOUND } from 'src/post/post.service';
import { OrderUnauthDto } from './dto/order.unauth.dto';
import { AuthFlow } from 'src/auth/authFlow.enum';

export const ORDER_NOT_FOUND = 'ORDER_NOT_FOUND';
export const ORDER_EMPTY = 'ORDER_EMPTY';
export const ORDER_ITEM_NOT_FOUND = 'ORDER_ITEM_NOT_FOUND';
export const NOT_OWN_ORDER = 'NOT_OWN_ORDER';
export const STATUS_INCORRECT = 'STATUS_INCORRECT';

@Injectable()
export class OrderService {
  async getByQuery(userId: number, options: OrderQueryDto) {
    const user = await User.getById(userId);
    if (!user) throw new HttpException(USER_NOT_FOUND, HttpStatus.NOT_FOUND);

    return await Order.getByQuery(user, options);
  }

  async getActive(userId: number) {
    const user = await User.getById(userId);
    if (!user) throw new HttpException(USER_NOT_FOUND, HttpStatus.NOT_FOUND);

    return await Order.getActive(user);
  }

  async getById(userId: number, orderId: number) {
    const user = await User.getById(userId);
    if (!user) throw new HttpException(USER_NOT_FOUND, HttpStatus.NOT_FOUND);

    const order = await Order.getById(orderId);
    if (!order) throw new HttpException(ORDER_NOT_FOUND, HttpStatus.NOT_FOUND);

    if (order.user.id !== user.id && !user.isAdmin())
      throw new HttpException(NOT_OWN_ORDER, HttpStatus.UNAUTHORIZED);

    return order;
  }

  async create(userId: number) {
    const user = await User.getById(userId);
    if (!user) throw new HttpException(USER_NOT_FOUND, HttpStatus.NOT_FOUND);

    return await Order.create(user);
  }

  async createWithoutAuth(data: OrderUnauthDto) {
    const user =
      (await User.getByPhone(data.phone)) ||
      (await User.create({
        phone: data.phone.replaceAll('+', ''),
        authFlow: AuthFlow.AUTO,
      }));

    if (!user)
      throw new HttpException(
        ERROR_CREATING_USER,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

    const postOffice = await Post.getById(data.postId);
    if (!postOffice)
      throw new HttpException(POST_OFFICT_NOT_FOUND, HttpStatus.NOT_FOUND);

    const order = await Order.create(user);

    order.postOffice = postOffice;
    order.status = OrderStatus.PENDING;
    await order.items.setFromIds(data.items);

    return await order.update();
  }

  async update(userId: number, orderId: number, data: OrderUpdateDto) {
    const user = await User.getById(userId);
    if (!user) throw new HttpException(USER_NOT_FOUND, HttpStatus.NOT_FOUND);

    const order = await Order.getById(orderId);
    if (!order) throw new HttpException(ORDER_NOT_FOUND, HttpStatus.NOT_FOUND);

    if (user.id !== order.user.id && !user.isAdmin())
      throw new HttpException(NOT_OWN_ORDER, HttpStatus.UNAUTHORIZED);

    if (data.items) {
      await order.items.setFromIds(data.items);
    }

    if (data.status) {
      order.status = data.status;
    }

    if (data.status === OrderStatus.PENDING) {
      const post = await Post.getById(data.postId!);
      if (!post)
        throw new HttpException(POST_OFFICT_NOT_FOUND, HttpStatus.NOT_FOUND);

      order.postOffice = post;
    }

    return await order.update();
  }
}
