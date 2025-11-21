import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

const sortFields = ['price', 'createdAt'];

export class OrderPaginationOptionsDto {
  @IsNumber()
  @IsOptional()
  @Min(1)
  page: number = 1;

  @IsNumber()
  @IsOptional()
  @Min(10)
  pageSize: number = 10;

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
  readonly sortOrder?: 'asc' | 'desc';
}
