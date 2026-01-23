import { Injectable } from '@nestjs/common';
import { ImageStorage } from 'src/bucket/image.storage';

@Injectable()
export class ProductImageStorage extends ImageStorage {
  constructor() {
    super('products');
  }
}
