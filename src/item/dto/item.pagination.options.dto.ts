import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

const sortFields = ['title', 'price'];

export class ItemPaginationOptionsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  readonly page: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  readonly pageSize: number = 10;

  @IsOptional()
  @IsString()
  readonly search?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  readonly priceMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  readonly priceMax?: number;

  @IsOptional()
  @IsString()
  @IsIn(sortFields, {
    message: `sortBy must be one of the following values: ${sortFields.join(', ')}`,
  })
  readonly sortBy?: string = 'title';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  @Type(() => String)
  readonly sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsArray()
  readonly category?: string[];
}
