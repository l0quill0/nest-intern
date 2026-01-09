import { PostOffice } from './../generated/prisma/index.d';
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '../generated/prisma';
import axios from 'axios';
import { fetchPage } from '../src/post/fetchPage';
import { AuthMethod } from '../src/auth/authMethod.enum';

const prisma = new PrismaClient();

async function main() {
  await prisma.category.upsert({
    where: { slug: 'other' },
    update: {},
    create: {
      name: 'інше',
      image: '',
      slug: 'other',
      immutable: true,
    },
  });

  await prisma.authFlow.upsert({
    where: { name: AuthMethod.BASIC },
    update: {},
    create: {
      name: AuthMethod.BASIC,
    },
  });

  await prisma.authFlow.upsert({
    where: { name: AuthMethod.GOOGLE },
    update: {},
    create: {
      name: AuthMethod.GOOGLE,
    },
  });

  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASS!, salt);

  await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {},
    create: {
      email: 'admin@gmail.com',
      password: hashedPassword,
      name: 'Alexander',
      role: 'ADMIN',
      favourites: { create: {} },
      authMethod: { connect: { name: AuthMethod.BASIC } },
    },
  });

  const response = await axios.get<{ jwt: string }>(
    `${process.env.NP_BASE_URL}/clients/authorization/`,
    { params: { apiKey: process.env.NP_API_KEY } },
  );

  const novaPostJWT = response.data.jwt;

  if (!novaPostJWT) {
    throw new Error('Nova post jwt token missing');
  }

  let hasNextPage = true;
  let currentPage = 1;
  const existingRegions = new Set();
  const existingSettlements = new Set();

  while (hasNextPage) {
    const page = await fetchPage(currentPage, novaPostJWT);
    const postOffices: PostOffice[] = [];
    const regions = new Map();
    const settlements = new Map();

    page.items.forEach((item) => {
      const { settlement } = item;
      const { region } = settlement;
      const regionId = region.parent?.id || region.id;

      if (!existingRegions.has(regionId)) {
        const regionName = region.parent?.name || region.name;
        regions.set(regionId, {
          id: regionId,
          name: regionName,
        });
        existingRegions.add(regionId);
      }

      if (!existingSettlements.has(settlement.id)) {
        settlements.set(settlement.id, {
          id: settlement.id,
          name: settlement.name,
          regionId: region.parent?.id || region.id,
        });
        existingSettlements.add(settlement.id);
      }
      postOffices.push({
        id: item.id,
        name: item.name,
        status: item.status,
        settlementId: item.settlement.id,
      });
    });

    if (regions.size) {
      await prisma.region.createMany({
        data: Array.from(regions.values()),
        skipDuplicates: true,
      });
    }

    if (settlements.size) {
      await prisma.settlement.createMany({
        data: Array.from(settlements.values()),
        skipDuplicates: true,
      });
    }

    await prisma.postOffice.createMany({
      data: postOffices,
      skipDuplicates: true,
    });

    hasNextPage = page.current_page !== page.last_page;
    currentPage++;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
