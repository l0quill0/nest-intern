import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class OrderQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(8)
  pageSize: number = 8;

  @IsOptional()
  @IsString()
  @IsIn(['id', 'price', 'createdAt', 'total', 'status'])
  readonly sortBy: string = 'id';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  readonly sortOrder: 'asc' | 'desc' = 'asc';
}
