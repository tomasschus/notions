import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "e2e@test.com" },
  });
  if (user) {
    await prisma.note.deleteMany({ where: { userId: user.id } });
  }
}

main()
  .catch((e) => {
    console.warn("e2e-reset-notes:", e);
  })
  .finally(() => prisma.$disconnect());
