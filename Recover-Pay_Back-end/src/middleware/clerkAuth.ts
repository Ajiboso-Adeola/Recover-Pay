import { Request, Response, NextFunction } from "express";
import { createClerkClient } from "@clerk/backend";

export interface ClerkAuthRequest extends Request {
  clerkUser?: {
    clerkUserId: string;
    email: string;
    name: string;
  };
}

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

export async function requireClerkAuth(
  req: ClerkAuthRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.header("Authorization")?.replace("Bearer ", "").trim();

  if (!token) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  try {
    const payload = await clerk.verifyToken(token);
    const clerkUserId = payload.sub;

    // Get user details from Clerk
    const user = await clerk.users.getUser(clerkUserId);
    const email = user.emailAddresses[0]?.emailAddress || "";
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || email;

    req.clerkUser = { clerkUserId, email, name };
    next();
  } catch (err) {
    console.error("[clerkAuth] Token verification failed:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
