import { Test, TestingModule } from '@nestjs/testing';
import { CategoryCacheService } from './category-cache.service';

describe('CategoryCacheService', () => {
  let service: CategoryCacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CategoryCacheService],
    }).compile();

    service = module.get<CategoryCacheService>(CategoryCacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
