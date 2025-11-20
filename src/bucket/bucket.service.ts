import { Bucket, Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';
import { Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class BucketService {
  private storage: Storage;
  private bucket: Bucket;

  constructor() {
    this.storage = new Storage();
    this.bucket = this.storage.bucket('nest-intern-bucket');
  }

  async upload(
    fileName: string,
    fileBuffer: Buffer,
    contentType: string,
  ): Promise<string> {
    const bucketFileName = uuidv4() + fileName;
    const file = this.bucket.file(bucketFileName);
    const writeStream = file.createWriteStream({
      metadata: {
        contentType,
      },
    });

    return new Promise((resolve, reject) => {
      writeStream.on('error', (err) => {
        console.log(err);
        reject(new InternalServerErrorException('Failed to upload file'));
      });

      writeStream.on('finish', () => {
        resolve(bucketFileName);
      });

      writeStream.end(fileBuffer);
    });
  }
}
