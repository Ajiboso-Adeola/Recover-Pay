import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const tenant = await db.tenant.upsert({
    where: { apiKey: "rp_test_demo_key_123456" },
    update: {},
    create: {
      name: "RecoverPay Demo",
      apiKey: "rp_test_demo_key_123456",
    },
  });

  console.log("✅ Demo tenant ready:", tenant.name);
  console.log("\n--- Use this in your API requests ---");
  console.log("Header: Authorization: Bearer rp_test_demo_key_123456");
  console.log("-------------------------------------\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
