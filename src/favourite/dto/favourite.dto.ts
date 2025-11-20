import { IsNumber } from 'class-validator';

export class FavouriteDto {
  @IsNumber()
  itemId: number;
}
