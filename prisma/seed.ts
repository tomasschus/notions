import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const TEST_EMAIL = "e2e@test.com";
const TEST_PASSWORD = "e2e-password-123";

async function main() {
  const existing = await prisma.user.findUnique({
    where: { email: TEST_EMAIL },
  });
  if (existing) {
    console.log("Usuario de prueba ya existe:", TEST_EMAIL);
    return;
  }
  const hashed = await hash(TEST_PASSWORD, 12);
  await prisma.user.create({
    data: {
      email: TEST_EMAIL,
      password: hashed,
      name: "E2E Test",
    },
  });
  console.log("Usuario de prueba creado:", TEST_EMAIL);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
