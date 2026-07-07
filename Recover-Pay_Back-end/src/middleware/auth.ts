import { Request, Response, NextFunction } from "express";
import { db } from "../prisma/client";

export interface AuthedRequest extends Request {
  tenantId?: string;
}

export async function requireTenant(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  const apiKey = req.header("Authorization")?.replace("Bearer ", "").trim();

  if (!apiKey) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  // Only accept rp_sk_ prefixed API keys on this middleware
  if (!apiKey.startsWith("rp_sk_") && !apiKey.startsWith("rp_test_")) {
    return res.status(401).json({
      error: "Invalid API key format. Use your rp_sk_ key from the dashboard.",
    });
  }

  const tenant = await db.tenant.findUnique({ where: { apiKey } });
  if (!tenant) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  req.tenantId = tenant.id;
  next();
}
