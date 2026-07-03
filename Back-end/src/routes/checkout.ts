import express from "express";
import crypto from "crypto";
import { db } from "../prisma/client";
import { requireTenant, AuthedRequest } from "../middleware/auth";
import { createCheckoutOrder } from "../nomba/nombaClient";
import { finalizeFirstPayment } from "../services/checkoutService";
import { addInterval } from "../utils/dates";

const router = express.Router();

// POST /v1/checkout/start
// Creates a customer, subscription, and first invoice, then returns a Nomba
// hosted checkout URL to redirect the customer to.
router.post("/start", requireTenant, async (req: AuthedRequest, res) => {
  const { customerEmail, planId } = req.body;

  if (!customerEmail || !planId) {
    return res.status(400).json({ error: "customerEmail and planId are required" });
  }

  const plan = await db.plan.findFirst({
    where: { id: planId, tenantId: req.tenantId!, archived: false },
  });
  if (!plan) return res.status(404).json({ error: "Plan not found" });

  const customer = await db.customer.upsert({
    where: { email: customerEmail },
    update: {},
    create: { email: customerEmail },
  });

  const now = new Date();
  const periodEnd = addInterval(now, plan.interval);

  const subscription = await db.subscription.create({
    data: {
      customerId: customer.id,
      planId: plan.id,
      status: "created",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      nextBillingDate: periodEnd,
    },
  });

  const invoice = await db.invoice.create({
    data: {
      subscriptionId: subscription.id,
      status: "open",
      amountDue: plan.amount,
      amountPaid: 0,
      periodStart: now,
      periodEnd,
    },
  });

  const orderReference = `inv_${invoice.id}_${crypto.randomUUID()}`;

  await db.chargeAttempt.create({
    data: { invoiceId: invoice.id, orderReference, status: "pending" },
  });

  const callbackUrl = `${process.env.APP_URL}/v1/checkout/complete?orderReference=${orderReference}`;

  const order = await createCheckoutOrder({
    orderReference,
    customerId: customer.id,
    customerEmail,
    amount: Number(plan.amount),
    callbackUrl,
  });

  if (!order?.data?.checkoutLink) {
    return res.status(502).json({
      error: "Nomba did not return a checkout URL",
      nombaResponse: order,
    });
  }

  res.json({
    checkoutUrl: order.data.checkoutLink,
    subscriptionId: subscription.id,
    invoiceId: invoice.id,
  });
});

// GET /v1/checkout/complete?orderReference=xxx
// Nomba redirects the customer here after payment.
// Verifies the payment and activates the subscription.
router.get("/complete", async (req, res) => {
  const orderReference = req.query.orderReference as string;
  if (!orderReference) {
    return res.status(400).json({ error: "Missing orderReference" });
  }

  const result = await finalizeFirstPayment(orderReference);

  if (result.ok) {
    // In production: redirect to a frontend success page
    res.json({ success: true, message: "Payment confirmed. Subscription is active." });
  } else {
    res.status(402).json({ success: false, reason: result.reason });
  }
});

export default router;
