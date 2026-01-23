import { prisma } from 'src/prisma.activeRecord';
import {
  TPostParams,
  TRegionParams,
  TSettlementParams,
} from './types/post.record.type';

export class Region {
  id: number;
  name: string;

  constructor(params: TRegionParams) {
    this.id = params.id;
    this.name = params.name;
  }

  static async getAll() {
    const res = await prisma.region.findMany();

    return res.map((region) => new Region(region));
  }

  static async getById(regionId: number) {
    const res = await prisma.region.findUnique({ where: { id: regionId } });
    if (!res) return undefined;

    return new Region(res);
  }
}

export class Settlement {
  id: number;
  name: string;
  region: Region;

  constructor(params: TSettlementParams) {
    this.id = params.id;
    this.name = params.name;
    this.region = params.region;
  }

  static async getByRegion(region: Region) {
    const res = await prisma.settlement.findMany({
      where: { region: { name: region.name } },
      include: {
        region: true,
      },
    });

    return res.map((settlement) => new Settlement(settlement));
  }

  static async getById(settlementId: number) {
    const res = await prisma.settlement.findUnique({
      where: { id: settlementId },
      include: {
        region: true,
      },
    });
    if (!res) return undefined;

    return new Settlement(res);
  }
}

export class Post {
  readonly id: number;
  name: string;
  status: string;
  readonly settlement: Settlement;

  constructor(params: TPostParams) {
    this.id = params.id;
    this.name = params.name;
    this.status = params.status;
    this.settlement = params.settlement;
  }

  static async getBySettlement(settlement: Settlement) {
    const res = await prisma.postOffice.findMany({
      where: {
        AND: [{ settlement: { name: settlement.name } }, { status: 'Working' }],
      },
    });

    return res.map((office) => new Post({ ...office, settlement }));
  }

  static async getById(postId: number) {
    const res = await prisma.postOffice.findUnique({
      where: { id: postId },
      include: {
        settlement: {
          include: {
            region: true,
          },
        },
      },
    });
    if (!res) return undefined;

    return new Post(res);
  }

  async update() {
    return await prisma.postOffice.update({
      where: { id: this.id },
      data: this.getFields(),
    });
  }

  getFields() {
    return {
      name: this.name,
      status: this.status,
    };
  }
}
