import { Bucket, Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GacKey } from './gac.key.type';

@Injectable()
export class BucketService {
  private storage: Storage;
  private bucket: Bucket;

  constructor() {
    const raw = process.env.GAC_KEY;

    let key = {} as GacKey;

    if (raw) {
      key = JSON.parse(raw) as GacKey;
    }

    this.storage =
      new Storage(/*{ projectId: key.project_id, credentials: key }*/);
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
        reject(new InternalServerErrorException('Failed to upload file', err));
      });

      writeStream.on('finish', () => {
        resolve(bucketFileName);
      });

      writeStream.end(fileBuffer);
    });
  }

  async deleteItem(fileName: string) {
    try {
      await this.bucket.file(fileName).delete();
    } catch (error) {
      console.error(`Error deleting file: ${error}`);
    }
  }
}
