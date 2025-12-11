import { OmitType } from '@nestjs/mapped-types';
import { BaseItemDto } from './base.item.dto';
import { IsOptional, IsString } from 'class-validator';

export class CreateItemDto extends OmitType(BaseItemDto, ['image']) {
  @IsString()
  @IsOptional()
  category: string;
}
