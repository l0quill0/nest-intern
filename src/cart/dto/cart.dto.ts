import { IsNumber, Min } from 'class-validator';

export class cartAddDto {
  @IsNumber()
  @Min(1)
  quantity: number;
}
