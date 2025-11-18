import { IsNumber, IsString } from 'class-validator';

export class BaseItemDto {
  @IsString()
  title: string;
  @IsString()
  description: string;
  @IsNumber()
  price: number;
}
