import { PartialType } from '@nestjs/mapped-types';
import { BaseItemDto } from './base.item.dto';
import { IsNumber } from 'class-validator';

export class UpdateItemDto extends PartialType(BaseItemDto) {
  @IsNumber()
  id: number;
}
