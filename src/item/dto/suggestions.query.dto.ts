import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class SuggestionQueryDto {
  @IsNumber()
  @Type(() => Number)
  readonly itemId: number;

  @IsNumber()
  @Type(() => Number)
  readonly itemCount: number;
}
