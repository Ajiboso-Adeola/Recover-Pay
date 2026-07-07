import { Queue, Worker } from "bullmq";
import { redisConnection, bullMQConnection } from "../redis";
import {
  chargeTokenizedCard,
  verifyTransaction,
  createVirtualAccount,
} from "../nomba/nombaClient";
import { notifyCustomer } from "../services/notificationService";
import { db } from "../prisma/client";
import crypto from "crypto";

export const billingQueue = new Queue("billing", {
  connection: bullMQConnection,
});

// Called by billingService when the first charge attempt fails.
// Schedules 3 retry jobs: attempt 1 at 24h, attempt 2 at 72h, attempt 3 at 7d.
// Attempt 3 switches from card retry to virtual account fallback.
export async function scheduleDunning(invoiceId: string) {
  await billingQueue.add(
    "retry-charge",
    { invoiceId, attempt: 1 },
    { delay: 86_400_000 }    // 24 hours
  );
  await billingQueue.add(
    "retry-charge",
    { invoiceId, attempt: 2 },
    { delay: 259_200_000 }   // 72 hours
  );
  await billingQueue.add(
    "retry-charge",
    { invoiceId, attempt: 3 },
    { delay: 604_800_000 }   // 7 days → switches to virtual account
  );

  console.log(`[dunning] Scheduled 3 retry attempts for invoice ${invoiceId}`);
}

// ─── Worker ───────────────────────────────────────────────────────────────────
new Worker(
  "billing",
  async (job) => {
    const { invoiceId, attempt } = job.data;

    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        subscription: {
          include: { customer: true, plan: true },
        },
      },
    });

    if (!invoice) return;
    if (invoice.status === "paid") return; // already recovered by another path

    const sub = invoice.subscription;
    if (sub.status === "cancelled") return;

    if (attempt < 3) {
      await retryCard(invoice, sub, attempt);
    } else {
      await fallbackToVirtualAccount(invoice, sub);
    }
  },
  { connection: bullMQConnection }
);

// ─── Card retry (attempts 1 and 2) ───────────────────────────────────────────
async function retryCard(invoice: any, sub: any, attempt: number) {
  if (!sub.customer.tokenKey) {
    console.warn(`[dunning] No tokenKey for customer ${sub.customer.id} — skipping card retry`);
    return;
  }

  const orderReference = `inv_${invoice.id}_retry${attempt}_${crypto.randomUUID()}`;

  const result = await chargeTokenizedCard({
    orderReference,
    customerId: sub.customer.id,
    customerEmail: sub.customer.email,
    amount: Number(invoice.amountDue),
    tokenKey: sub.customer.tokenKey,
  });

  await db.chargeAttempt.create({
    data: {
      invoiceId: invoice.id,
      orderReference,
      status: "pending",
      message: result?.data?.message,
    },
  });

  const verified = await verifyTransaction({ orderReference });

  if (verified?.data?.status === "SUCCESS") {
    await db.chargeAttempt.update({
      where: { orderReference },
      data: { status: "success" },
    });
    await db.invoice.update({
      where: { id: invoice.id },
      data: { status: "paid", amountPaid: invoice.amountDue },
    });
    await db.subscription.update({
      where: { id: sub.id },
      data: { status: "active", dunningAttempt: 0 },
    });

    await notifyCustomer({
      email: sub.customer.email,
      subject: "Payment successful",
      message: `Your payment of ₦${Number(invoice.amountDue).toLocaleString()} was successful. Your subscription is active.`,
    });

    console.log(`[dunning] Attempt ${attempt} succeeded for invoice ${invoice.id}`);
  } else {
    await db.chargeAttempt.update({
      where: { orderReference },
      data: { status: "failed" },
    });
    await db.subscription.update({
      where: { id: sub.id },
      data: { dunningAttempt: attempt },
    });

    await notifyCustomer({
      email: sub.customer.email,
      subject: "Payment failed — we will retry",
      message: `We couldn't charge your card for ₦${Number(invoice.amountDue).toLocaleString()}. We will try again shortly. Please ensure your card has sufficient funds.`,
    });

    console.warn(`[dunning] Attempt ${attempt} failed for invoice ${invoice.id}`);
  }
}

// ─── Virtual account fallback (attempt 3) ────────────────────────────────────
async function fallbackToVirtualAccount(invoice: any, sub: any) {
  // accountRef must be 16-64 chars
  const accountRef = `rp_va_${invoice.id}`.slice(0, 64).padEnd(16, "0");

  // accountName must be 8-64 chars
  const accountName = `RecoverPay ${sub.customer.email.split("@")[0]}`
    .slice(0, 64)
    .padEnd(8, " ");

  const expiryDate = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

  const result = await createVirtualAccount({
    accountRef,
    accountName,
    expectedAmount: Number(invoice.amountDue),
    expiryDate,
  });

  if (!result?.data?.bankAccountNumber) {
    console.error("[dunning] Virtual account creation failed", {
      invoiceId: invoice.id,
      result,
    });
    return;
  }

  await db.virtualAccountAttempt.create({
    data: {
      invoiceId: invoice.id,
      accountRef,
      accountNumber: result.data.bankAccountNumber,
      bankName: result.data.bankName,
      expectedAmount: invoice.amountDue,
      expiryDate,
    },
  });

  await db.subscription.update({
    where: { id: sub.id },
    data: { status: "past_due", dunningAttempt: 3 },
  });

  await notifyCustomer({
    email: sub.customer.email,
    subject: "Action required — pay via bank transfer to keep your subscription",
    message:
      `Your card payment of ₦${Number(invoice.amountDue).toLocaleString()} failed after multiple attempts. ` +
      `Pay via bank transfer within 48 hours to keep your subscription active:\n\n` +
      `Bank: ${result.data.bankName}\n` +
      `Account Number: ${result.data.bankAccountNumber}\n` +
      `Amount: ₦${Number(invoice.amountDue).toLocaleString()}\n\n` +
      `Your subscription will be reactivated automatically once payment is received.`,
  });

  console.log(
    `[dunning] Virtual account fallback created for invoice ${invoice.id}: ${result.data.bankAccountNumber}`
  );
}
