import { OmitType, PartialType } from '@nestjs/mapped-types';
import { BaseProductDto } from './base.product.dto';
import { IsOptional, IsString } from 'class-validator';
import { IsCategory } from 'src/validators/category.validator';

export class UpdateProductDto extends PartialType(
  OmitType(BaseProductDto, ['image']),
) {
  @IsString()
  @IsOptional()
  @IsCategory()
  category?: string;
}
