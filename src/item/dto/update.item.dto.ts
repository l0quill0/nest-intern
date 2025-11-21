import { OmitType, PartialType } from '@nestjs/mapped-types';
import { BaseItemDto } from './base.item.dto';
import { IsArray, IsOptional } from 'class-validator';

export class UpdateItemDto extends PartialType(
  OmitType(BaseItemDto, ['image']),
) {
  @IsArray()
  @IsOptional()
  categories?: string[];
}
