import { Type } from 'class-transformer';
import {
  IsArray,
  IsString,
  IsNumber,
  ValidateNested,
  IsPhoneNumber,
} from 'class-validator';

export class OrderUnauthDto {
  @IsString()
  @IsPhoneNumber()
  phone: string;

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
