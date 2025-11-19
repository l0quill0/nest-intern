import { OmitType, PartialType } from '@nestjs/mapped-types';
import { BaseItemDto } from './base.item.dto';

export class UpdateItemDto extends PartialType(
  OmitType(BaseItemDto, ['image']),
) {}
