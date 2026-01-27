import { Exclude, Expose, Type } from 'class-transformer';
import { CategoryResponseDto } from 'src/category/dto/category.response.dto';

export class ProductResponseDto {
  @Expose()
  id: number;

  @Expose()
  title: string;

  @Expose()
  image: string;

  @Expose()
  price: number;

  @Expose()
  @Type(() => CategoryResponseDto)
  category: CategoryResponseDto;

  @Exclude()
  createdAt: Date;

  @Expose()
  isRemoved: boolean;

  @Expose()
  description: string;
}
