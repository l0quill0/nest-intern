import { OmitType, PartialType } from '@nestjs/mapped-types';
import { BaseItemDto } from './base.item.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateItemDto extends PartialType(
  OmitType(BaseItemDto, ['image']),
) {
  @IsString()
  @IsOptional()
  category?: string;
}
