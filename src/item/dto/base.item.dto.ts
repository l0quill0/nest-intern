import { Type } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class BaseItemDto {
  @IsString()
  title: string;
  @IsString()
  description: string;
  @Type(() => Number)
  @IsNumber()
  price: number;
  @IsString()
  image: string;
}
