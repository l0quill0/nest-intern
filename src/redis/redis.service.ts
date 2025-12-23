import { createClient, RedisClientType } from '@keyv/redis';
import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class RedisService implements OnModuleInit {
  private client: RedisClientType;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL,
    });
  }

  async onModuleInit() {
    await this.client.connect();
  }

  async clearByPattern(pattern: string) {
    const keys = await this.client.keys(pattern);
    if (keys.length === 0) return 0;
    await this.client.del(keys);
    return keys.length;
  }
}
