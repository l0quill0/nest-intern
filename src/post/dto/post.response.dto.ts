import { Expose, Type } from 'class-transformer';

export class RegionResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;
}

export class SettlementResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  @Type(() => RegionResponseDto)
  region: RegionResponseDto;
}

export class PostResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  status: string;

  @Expose()
  @Type(() => SettlementResponseDto)
  settlement: SettlementResponseDto;
}
