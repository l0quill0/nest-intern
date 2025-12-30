import { Test, TestingModule } from '@nestjs/testing';
import { PostCacheService } from './post-cache.service';

describe('PostCacheService', () => {
  let service: PostCacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostCacheService],
    }).compile();

    service = module.get<PostCacheService>(PostCacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
