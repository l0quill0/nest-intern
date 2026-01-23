import { Injectable } from '@nestjs/common';
import { ImageStorage } from 'src/bucket/image.storage';

@Injectable()
export class CategoryImageStorage extends ImageStorage {
  constructor() {
    super('categories');
  }
}
