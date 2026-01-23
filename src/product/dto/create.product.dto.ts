import { OmitType } from '@nestjs/mapped-types';
import { BaseProductDto } from './base.product.dto';
import { IsString } from 'class-validator';
import { IsCategory } from 'src/validators/category.validator';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CreateProductDto extends OmitType(BaseProductDto, ['image']) {
  @IsString()
  @IsCategory()
  category: string;
}
