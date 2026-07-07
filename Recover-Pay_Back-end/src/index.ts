import "dotenv/config";
import { app } from "./app";
import { startBillingScheduler } from "./workers/billingScheduler";

// Importing billingWorker is a side-effect — it registers the BullMQ Worker
// that processes retry-charge jobs. Without this import the jobs queue but
// nothing ever picks them up.
import "./workers/billingWorker";

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`\n🚀 RecoverPay running on port ${PORT}`);
  console.log(`📖 API Docs: http://localhost:${PORT}/docs`);
  console.log(`❤️  Health:   http://localhost:${PORT}/health\n`);

  startBillingScheduler();
});
