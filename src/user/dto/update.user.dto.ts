import { PartialType } from '@nestjs/mapped-types';
import { BaseUserDto } from './base.user.dto';
import { IsNumber } from 'class-validator';

export class UpdateUserDto extends PartialType(BaseUserDto) {
  @IsNumber()
  id: number;
}
