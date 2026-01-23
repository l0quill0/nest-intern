import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class SuggestionQueryDto {
  @IsNumber()
  @Type(() => Number)
  readonly productId: number;

  @IsNumber()
  @Type(() => Number)
  readonly productCount: number;
}
