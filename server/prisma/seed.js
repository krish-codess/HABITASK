const { PrismaClient } = require('@prisma/client');
const { INDIAN_FOODS } = require('../src/data/indianFoods');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Indian food database...');
  await prisma.foodItem.deleteMany({ where: { isCustom: false, userId: null } });
  await prisma.foodItem.createMany({ data: INDIAN_FOODS, skipDuplicates: true });
  console.log(`Seeded ${INDIAN_FOODS.length} food items`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
