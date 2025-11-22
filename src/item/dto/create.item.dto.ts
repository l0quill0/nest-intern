import { OmitType } from '@nestjs/mapped-types';
import { BaseItemDto } from './base.item.dto';
import { IsArray, IsOptional } from 'class-validator';

export class CreateItemDto extends OmitType(BaseItemDto, ['image']) {
  @IsArray()
  @IsOptional()
  categories?: string[];
}
