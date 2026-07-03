import express from "express";
import plansRouter from "./routes/plans";
import checkoutRouter from "./routes/checkout";
import subscriptionsRouter from "./routes/subscriptions";
import portalRouter from "./routes/portal";
import webhooksRouter from "./routes/webhooks";
import { mountSwagger } from "./swagger";

export const app = express();

// Global JSON parser — webhooks.ts adds its own express.json() per-route
// so this doesn't conflict with anything
app.use(express.json());

// Health check — judges will hit this first
app.get("/health", (_req, res) => {
  res.json({ status: "ok", project: "RecoverPay", version: "1.0.0" });
});

// API routes
app.use("/v1/plans", plansRouter);
app.use("/v1/checkout", checkoutRouter);
app.use("/v1/subscriptions", subscriptionsRouter);
app.use("/v1/portal", portalRouter);
app.use("/v1/webhooks", webhooksRouter);

// Swagger docs — available at /docs
mountSwagger(app);

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});
