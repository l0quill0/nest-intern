import { IsNumber, IsOptional, Min } from 'class-validator';

export class OrderRemoveItemDto {
  @IsNumber()
  itemId: number;
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;
}
