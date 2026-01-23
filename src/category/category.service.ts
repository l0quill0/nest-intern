import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CategoryPaginationOptionsDto } from './dto/category.pagination.options.dto';
import CategoryRepository from './category.repository';
import { CategoryImageStorage } from './category.image.storage';
import { CategoryFactory } from './category.record';

export const CATEGORY_NOT_FOUND = 'CATEGORY_NOT_FOUND';
export const CATEGORY_ALREADY_EXISTS = 'CATEGORY_ALREADY_EXISTS';

@Injectable()
export class CategoryService {
  constructor(private readonly categoryFileStorage: CategoryImageStorage) {}

  getAll() {
    return CategoryRepository.getAll();
  }

  getBySlug(slug: string) {
    return CategoryRepository.getBySlug(slug);
  }

  async getByQuery(query: CategoryPaginationOptionsDto) {
    return await CategoryRepository.getByQuery(query);
  }

  async create(file: Express.Multer.File, name: string) {
    const category = CategoryFactory.create({
      name,
      image: '',
    });

    if (CategoryRepository.getBySlug(category.slug)) {
      throw new HttpException(CATEGORY_ALREADY_EXISTS, HttpStatus.BAD_REQUEST);
    }

    const image = await this.categoryFileStorage.upload(
      file.originalname,
      file.buffer,
      file.mimetype,
    );
    category.image = image;

    return await CategoryRepository.add(category);
  }

  async update(slug: string, file: Express.Multer.File) {
    const category = CategoryRepository.getBySlug(slug);

    if (!category) {
      throw new HttpException(CATEGORY_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const image = await this.categoryFileStorage.upload(
      file.originalname,
      file.buffer,
      file.mimetype,
    );
    await this.categoryFileStorage.delete(category.image);

    category.image = image;
    await CategoryRepository.update(category);
    return category;
  }

  async delete(slug: string) {
    const category = CategoryRepository.getBySlug(slug);

    if (!category) {
      throw new HttpException(CATEGORY_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    await this.categoryFileStorage.delete(category.image);
    await CategoryRepository.delete(category);

    return category;
  }
}
