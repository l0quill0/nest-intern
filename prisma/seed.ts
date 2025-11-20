import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function main() {
  await prisma.category.upsert({
    where: { name: 'uncategorized' },
    update: {},
    create: {
      name: 'uncategorized',
    },
  });

  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(
    process.env.ADMIN_PASS as string,
    salt,
  );

  await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {},
    create: {
      email: 'admin@gmail.com',
      password: hashedPassword,
      name: 'Alexander',
      role: 'ADMIN',
    },
  });
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
