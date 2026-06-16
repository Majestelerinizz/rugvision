import { prisma } from "../lib/prisma";

async function main() {
  const merchantId = process.argv[2] || "cmqgswc5a000004lanqoxc666";

  const rugs = await prisma.rug.findMany({
    where: { merchantId },
    select: { sku: true, name: true, model3dUrl: true, coverImage: true },
    orderBy: { sku: "asc" },
  });

  console.log(JSON.stringify(rugs, null, 2));
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
