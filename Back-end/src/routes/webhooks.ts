import express from "express";
import crypto from "crypto";
import { db } from "../prisma/client";
import { finalizeFirstPayment } from "../services/checkoutService";
import { notifyCustomer } from "../services/notificationService";

const router = express.Router();

// ─── Signature verification ───────────────────────────────────────────────────
// Nomba signs webhooks using a colon-joined string of specific payload fields.
// The signature is HMAC-SHA256, base64-encoded — NOT a raw hex digest.
function verifyNombaSignature(body: any, headers: any): boolean {
  const secret = process.env.NOMBA_WEBHOOK_SECRET!;
  const receivedSig = headers["nomba-signature"] || headers["nomba-sig-value"];
  const timestamp = headers["nomba-timestamp"];

  if (!receivedSig || !timestamp) return false;

  const merchant = body.data?.merchant || {};
  const transaction = body.data?.transaction || {};
  let responseCode = transaction.responseCode || "";
  if (responseCode === "null") responseCode = "";

  const hashingPayload = [
    body.event_type || "",
    body.requestId || "",
    merchant.userId || "",
    merchant.walletId || "",
    transaction.transactionId || "",
    transaction.type || "",
    transaction.time || "",
    responseCode,
    timestamp,
  ].join(":");

  const expected = crypto
    .createHmac("sha256", secret)
    .update(hashingPayload)
    .digest("base64");

  return expected === receivedSig;
}

// POST /v1/webhooks/nomba
router.post("/nomba", express.json(), async (req, res) => {
  // 1. Verify signature before doing anything else
  if (!verifyNombaSignature(req.body, req.headers)) {
    console.warn("[webhook] Signature mismatch — rejected");
    return res.status(401).json({ error: "Invalid signature" });
  }

  const { event_type, requestId, data } = req.body;

  // 2. Idempotency — reject duplicate events using requestId
  try {
    await db.webhookEvent.create({
      data: { requestId, type: event_type, raw: req.body },
    });
  } catch {
    // Unique constraint violation = already processed
    return res.sendStatus(200);
  }

  // 3. Always respond 200 quickly — Nomba retries on non-2xx
  res.sendStatus(200);

  // 4. Process async so the 200 is already sent
  try {
    if (event_type === "payment_success") {
     const txType = data?.transaction?.type;

  if (txType === "vact_transfer") {
    await handleVirtualAccountFunded(data);
  } else if (txType === "online_checkout") {
    // orderReference is in data.order — NOT in verifyTransaction response
    const orderReference = data?.order?.orderReference;
    if (orderReference) {
      await finalizeFirstPayment(orderReference);
    }
  }
}
    if (event_type === "payment_failed") {
      console.log("[webhook] payment_failed received", data?.transaction?.transactionId);
      // Dunning is already scheduled by billingService on synchronous failure.
      // This event is logged for audit only.
    }
  } catch (err) {
    console.error("[webhook] Processing error", err);
  }
});

// ─── Virtual account funded handler ──────────────────────────────────────────
async function handleVirtualAccountFunded(data: any) {
  const { transaction } = data;

  // Match the funded account back to our VirtualAccountAttempt record
  let va = await db.virtualAccountAttempt.findUnique({
    where: { accountRef: transaction.aliasAccountReference },
  });

  // Fallback: match by account number if accountRef lookup missed
  if (!va && transaction.aliasAccountNumber) {
    va = await db.virtualAccountAttempt.findFirst({
      where: { accountNumber: transaction.aliasAccountNumber },
    });
  }

  if (!va) {
    console.warn("[webhook] Virtual account funded but no match found", transaction);
    return;
  }

  const invoice = await db.invoice.findUnique({ where: { id: va.invoiceId } });
  if (!invoice || invoice.status === "paid") return;

  const amountReceived = Number(transaction.transactionAmount);
  const amountExpected = Number(va.expectedAmount);

  if (amountReceived < amountExpected) {
    const shortfall = amountExpected - amountReceived;
    // Short payment — notify but don't activate
    console.warn(
      `[webhook] Short payment: received ₦${amountReceived}, expected ₦${amountExpected}`
    );
      // Get the subscription and customer details for the notification
    const invoice = await db.invoice.findUnique({
    where: { id: va.invoiceId },
    include: { subscription: { include: { customer: true } } },
    });

    if (invoice) {
      // Notify the customer they need to top up
      await notifyCustomer({
        email: invoice.subscription.customer.email,
        subject: "Incomplete payment received",
        message:
          `We received ₦${amountReceived.toLocaleString()} but your subscription requires ₦${amountExpected.toLocaleString()}. ` +
          `Please transfer the remaining ₦${shortfall.toLocaleString()} to the same account:\n\n` +
          `Bank: ${va.bankName}\n` +
          `Account Number: ${va.accountNumber}\n\n` +
          `Your subscription will be activated once the full amount is received.`,
      });
    }

  return; // Don't activate the subscription yet
}

  // Full (or over) payment received — activate the subscription
  await db.virtualAccountAttempt.update({
    where: { id: va.id },
    data: { status: "funded" },
  });
  await db.invoice.update({
    where: { id: invoice.id },
    data: { status: "paid", amountPaid: invoice.amountDue },
  });
  await db.subscription.update({
    where: { id: invoice.subscriptionId },
    data: { status: "active", dunningAttempt: 0 },
  });

  console.log(
    `[webhook] Virtual account payment reconciled for invoice ${invoice.id}`
  );
}

export default router;
