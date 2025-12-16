import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CategoryPaginationOptionsDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  readonly page: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  readonly pageSize: number = 6;

  @IsOptional()
  @IsString()
  readonly search: string;
}
