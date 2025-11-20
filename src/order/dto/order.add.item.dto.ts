import { IsNumber, Min } from 'class-validator';

export class OrderAddItemDto {
  @IsNumber()
  itemId: number;
  @IsNumber()
  @Min(1)
  quantity: number;
}
