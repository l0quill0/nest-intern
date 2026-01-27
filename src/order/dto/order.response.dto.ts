import { Expose, Type } from 'class-transformer';
import { UserResponseDto } from 'src/user/dto/user.response.dto';
import { ProductResponseDto } from 'src/product/dto/product.response.dto';
import { PostResponseDto } from 'src/post/dto/post.response.dto';

class OrderProductResponseDto {
  @Expose()
  @Type(() => ProductResponseDto)
  product: ProductResponseDto;

  @Expose()
  quantity: number;
}

export class OrderResponseDto {
  @Expose()
  id: number;

  @Expose()
  @Type(() => UserResponseDto)
  user: UserResponseDto;

  @Expose()
  total: number;

  @Expose()
  status: string;

  @Expose()
  @Type(() => OrderProductResponseDto)
  items: OrderProductResponseDto;

  @Expose()
  @Type(() => PostResponseDto)
  postOffice: PostResponseDto;
}

export class OrderViewResponseDto {
  @Expose()
  @Type(() => OrderResponseDto)
  items: OrderResponseDto[];

  @Expose()
  currentPage: number;

  @Expose()
  totalPages: number;
}
