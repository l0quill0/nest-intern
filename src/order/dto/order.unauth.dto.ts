import { Type } from 'class-transformer';
import { IsArray, IsEmail, IsNumber, ValidateNested } from 'class-validator';

export class OrderUnauthDto {
  @IsEmail()
  email: string;

  @IsNumber()
  postId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderProductDto)
  items: OrderProductDto[];
}

class OrderProductDto {
  @IsNumber()
  productId: number;

  @IsNumber()
  quantity: number;
}
