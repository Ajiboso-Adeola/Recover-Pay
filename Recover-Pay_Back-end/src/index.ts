import "dotenv/config";
import { app } from "./app";
import { startBillingScheduler } from "./workers/billingScheduler";
import { startKeepalive } from "./utils/keepalive";
import { db } from "./prisma/client";

// Side-effect import — registers the BullMQ Worker for dunning retry jobs
import "./workers/billingWorker";

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, async () => {
  console.log(`\n🚀 RecoverPay running on port ${PORT}`);
  console.log(`📖 API Docs: http://localhost:${PORT}/docs`);
  console.log(`❤️  Health:   http://localhost:${PORT}/health\n`);

  try {
    await db.$connect();
    console.log("✅ Database connected successfully!");
  } catch (error) {
    console.error("❌ Failed to connect to the database:", error);
  }

  startBillingScheduler();
  startKeepalive(); // keeps Render free tier awake so webhooks always land
});
