import { Test, TestingModule } from '@nestjs/testing';
import { ItemCacheService } from './item-cache.service';

describe('ItemCacheService', () => {
  let service: ItemCacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ItemCacheService],
    }).compile();

    service = module.get<ItemCacheService>(ItemCacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
