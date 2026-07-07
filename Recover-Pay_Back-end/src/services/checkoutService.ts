import { db } from "../prisma/client";
import { verifyTransaction, getLatestTokenForCustomer } from "../nomba/nombaClient";

// src/services/checkoutService.ts

export async function finalizeFirstPayment(orderReference: string) {
  const attempt = await db.chargeAttempt.findUnique({
    where: { orderReference },
    include: {
      invoice: {
        include: { subscription: { include: { customer: true } } },
      },
    },
  });

  if (!attempt) return { ok: false, reason: "unknown orderReference" };
  if (attempt.invoice.status === "paid") return { ok: true, alreadyProcessed: true };

  const verified = await verifyTransaction({ orderReference });

  // Sandbox returns data.success = true
  // Production returns data.status = "SUCCESS"
  const isSandbox = (process.env.NOMBA_BASE_URL || "").includes("sandbox");
  const isSuccess = isSandbox
    ? verified?.data?.success === true
    : verified?.data?.status === "SUCCESS";

  if (!isSuccess) {
    await db.chargeAttempt.update({
      where: { orderReference },
      data: { status: "failed", message: "payment not confirmed" },
    });
    return { ok: false, reason: "payment not confirmed by Nomba" };
  }

  const tokenKey = await getLatestTokenForCustomer(
    attempt.invoice.subscription.customer.email
  );

  await db.$transaction([
    db.chargeAttempt.update({ where: { orderReference }, data: { status: "success" } }),
    db.invoice.update({
      where: { id: attempt.invoice.id },
      data: { status: "paid", amountPaid: attempt.invoice.amountDue },
    }),
    db.subscription.update({
      where: { id: attempt.invoice.subscriptionId },
      data: { status: "active" },
    }),
    ...(tokenKey
      ? [db.customer.update({
          where: { id: attempt.invoice.subscription.customerId },
          data: { tokenKey },
        })]
      : []),
  ]);

  return { ok: true };
}
