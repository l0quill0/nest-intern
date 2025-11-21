import { OmitType } from '@nestjs/mapped-types';
import { BaseItemDto } from './base.item.dto';

export class CreateItemDto extends OmitType(BaseItemDto, ['image']) {
  categories: string[];
}
