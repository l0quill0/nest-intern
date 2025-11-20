import { IsNumber, IsOptional, Min } from 'class-validator';

export class OrderRemoveItemDto {
  @IsNumber()
  orderItemId: number;
  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity?: number;
}
