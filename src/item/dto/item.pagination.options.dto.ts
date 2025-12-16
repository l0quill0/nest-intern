import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

const sortFields = ['title', 'price', 'createdAt'];

export class ItemPaginationOptionsDto {
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
  readonly search?: string;

  @IsOptional()
  @Transform(({ value }) => {
    return Number(value);
  })
  @IsNumber()
  @Min(0)
  readonly priceMin?: number;

  @IsOptional()
  @Transform(({ value }) => {
    return Number(value);
  })
  @IsNumber()
  @Min(1)
  readonly priceMax?: number;

  @IsOptional()
  @IsString()
  @IsIn(sortFields, {
    message: `sortBy must be one of the following values: ${sortFields.join(', ')}`,
  })
  readonly sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  @Type(() => String)
  readonly sortOrder?: 'asc' | 'desc' = 'asc';

  @IsOptional()
  @Transform(({ value }) => {
    if (value == null) return [];

    if (Array.isArray(value)) return value as string[];
    if (typeof value === 'string') return [value];

    return [];
  })
  @IsArray()
  readonly category?: string[];

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  readonly showRemoved?: boolean;
}
