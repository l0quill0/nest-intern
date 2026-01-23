import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { OrderStatus } from '../order.enum';

export class OrderUpdateDto {
  @IsOptional()
  @IsNumber()
  postId?: number;

  @IsOptional()
  @IsString()
  @IsEnum(OrderStatus)
  status?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderProductDto)
  items?: OrderProductDto[];
}

class OrderProductDto {
  @IsNumber()
  productId: number;

  @IsNumber()
  quantity: number;
}
