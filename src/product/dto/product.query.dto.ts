import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidationArguments,
} from 'class-validator';
import { IsCategory } from 'src/validators/category.validator';

export class ProductQueryDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  readonly page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  readonly pageSize?: number;

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
  @IsIn(['title', 'price', 'createdAt'])
  readonly sortBy?: 'createdAt' | 'title' | 'price';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  @Type(() => String)
  readonly sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @Transform(({ value }) => {
    if (value == null) return [];

    if (Array.isArray(value)) return value as string[];
    if (typeof value === 'string') return [value];

    return [];
  })
  @IsArray()
  @IsCategory({
    each: true,
    message: (args: ValidationArguments) => `Category ${args.value} is invalid`,
  })
  readonly category?: string[];

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  readonly showRemoved?: boolean;
}
