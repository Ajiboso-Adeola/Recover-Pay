import express from "express";
import { db } from "../prisma/client";
import { requireTenant, AuthedRequest } from "../middleware/auth";

const router = express.Router();
router.use(requireTenant);

// POST /v1/plans — create a plan
router.post("/", async (req: AuthedRequest, res) => {
  const { name, amount, interval, trialDays, currency } = req.body;

  if (!name || amount == null || !interval) {
    return res.status(400).json({ error: "name, amount, and interval are required" });
  }
  if (!["monthly", "annual", "custom"].includes(interval)) {
    return res.status(400).json({ error: "interval must be monthly, annual, or custom" });
  }
  if (isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: "amount must be a positive number (Naira, e.g. 5000)" });
  }

  const plan = await db.plan.create({
    data: {
      tenantId: req.tenantId!,
      name,
      amount,
      currency: currency || "NGN",
      interval,
      trialDays: trialDays || 0,
    },
  });

  res.status(201).json(plan);
});

// GET /v1/plans — list all active plans for this tenant
router.get("/", async (req: AuthedRequest, res) => {
  const plans = await db.plan.findMany({
    where: { tenantId: req.tenantId!, archived: false },
    orderBy: { createdAt: "desc" },
  });
  res.json(plans);
});

// GET /v1/plans/:id — get a single plan
router.get("/:id", async (req: AuthedRequest, res) => {
  const plan = await db.plan.findFirst({
    where: { id: req.params.id, tenantId: req.tenantId! },
  });
  if (!plan) return res.status(404).json({ error: "Plan not found" });
  res.json(plan);
});

// PATCH /v1/plans/:id — update name, amount, trialDays only
// interval and currency are intentionally locked — changing them retroactively
// would corrupt billing math for subscriptions already running on this plan
router.patch("/:id", async (req: AuthedRequest, res) => {
  const plan = await db.plan.findFirst({
    where: { id: req.params.id, tenantId: req.tenantId! },
  });
  if (!plan) return res.status(404).json({ error: "Plan not found" });

  const { name, amount, trialDays } = req.body;
  const updated = await db.plan.update({
    where: { id: plan.id },
    data: {
      ...(name && { name }),
      ...(amount != null && { amount }),
      ...(trialDays != null && { trialDays }),
    },
  });
  res.json(updated);
});

// DELETE /v1/plans/:id — soft delete (archive)
router.delete("/:id", async (req: AuthedRequest, res) => {
  const plan = await db.plan.findFirst({
    where: { id: req.params.id, tenantId: req.tenantId! },
  });
  if (!plan) return res.status(404).json({ error: "Plan not found" });

  await db.plan.update({ where: { id: plan.id }, data: { archived: true } });
  res.status(204).send();
});

export default router;
