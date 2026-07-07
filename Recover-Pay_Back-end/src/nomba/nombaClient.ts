// src/nomba/nombaClient.ts
// ─────────────────────────────────────────────────────────────────────────────
// SUB-ACCOUNT SCOPING (Nomba announcement fix):
//   - accountId HEADER = parent account ID (always)
//   - order.accountId BODY = sub-account ID (funds deposited here)
//
// NOMBA_ACCOUNT_ID     = parent account ID → goes in header
// NOMBA_SUB_ACCOUNT_ID = sub-account ID    → goes in order.accountId body
// ─────────────────────────────────────────────────────────────────────────────

import { redisConnection as redis } from "../redis";

const NOMBA_BASE_URL = process.env.NOMBA_BASE_URL || "https://sandbox.nomba.com";
const PARENT_ACCOUNT_ID = process.env.NOMBA_ACCOUNT_ID!;
const SUB_ACCOUNT_ID = process.env.NOMBA_SUB_ACCOUNT_ID!;

// Amounts are decimal Naira strings — "5000.00" = ₦5,000. Never kobo.
export function toNombaAmount(amount: number): string {
  return amount.toFixed(2);
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
async function getAccessToken(): Promise<string> {
  const cached = await redis.get("nomba:access_token");
  if (cached) return cached;

  const res = await fetch(`${NOMBA_BASE_URL}/v1/auth/token/issue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accountId: PARENT_ACCOUNT_ID,
    },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: process.env.NOMBA_CLIENT_ID,
      client_secret: process.env.NOMBA_CLIENT_SECRET,
    }),
  });

  const json = await res.json();
  const token = json?.data?.access_token;
  if (!token) throw new Error(`[nomba] Auth failed: ${JSON.stringify(json)}`);

  await redis.setex("nomba:access_token", 3300, token); // cache 55 mins
  console.log("[nomba] Access token refreshed");
  return token;
}

// ─── Base request ─────────────────────────────────────────────────────────────
export async function nombaRequest(method: string, path: string, body?: object): Promise<any> {
  const token = await getAccessToken();
  const res = await fetch(`${NOMBA_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      accountId: PARENT_ACCOUNT_ID, // always parent in header per Nomba docs
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) console.error(`[nomba] ${method} ${path} failed:`, data);
  return data;
}

// ─── Checkout order ───────────────────────────────────────────────────────────
// FIX: order.accountId = SUB_ACCOUNT_ID routes funds to sub-account
// Sandbox uses /sandbox/checkout/order path
export async function createCheckoutOrder(params: {
  orderReference: string;
  customerId: string;
  customerEmail: string;
  amount: number;
  callbackUrl: string;
}) {
  const isSandbox = NOMBA_BASE_URL.includes("sandbox");
  const path = isSandbox ? "/sandbox/checkout/order" : "/v1/checkout/order";

  return nombaRequest("POST", path, {
    order: {
      orderReference: params.orderReference,
      customerId: params.customerId,
      customerEmail: params.customerEmail,
      amount: toNombaAmount(params.amount),
      currency: "NGN",
      callbackUrl: params.callbackUrl,
      accountId: SUB_ACCOUNT_ID, // ← funds deposited to sub-account
      tokenizeCard: true,
    },
  });
}

// ─── Tokenized card charge ────────────────────────────────────────────────────
// FIX: order.accountId = SUB_ACCOUNT_ID for recurring charges too
export async function chargeTokenizedCard(params: {
  orderReference: string;
  customerId: string;
  customerEmail: string;
  amount: number;
  tokenKey: string;
}) {
  return nombaRequest("POST", "/v1/checkout/tokenized-card-payment", {
    order: {
      orderReference: params.orderReference,
      customerId: params.customerId,
      customerEmail: params.customerEmail,
      amount: toNombaAmount(params.amount),
      currency: "NGN",
      accountId: SUB_ACCOUNT_ID, // ← sub-account scoping
    },
    tokenKey: params.tokenKey,
  });
}

// ─── Transaction verification ─────────────────────────────────────────────────
// Sandbox: /sandbox/checkout/transaction  (returns data.success: true)
// Prod:    /v1/transactions/accounts/single (returns data.status: "SUCCESS")
export async function verifyTransaction(params: {
  orderReference?: string;
  transactionRef?: string;
}) {
  const isSandbox = NOMBA_BASE_URL.includes("sandbox");

  if (isSandbox) {
    const idType = params.orderReference ? "orderReference" : "orderId";
    const id = params.orderReference || params.transactionRef;
    return nombaRequest("GET", `/sandbox/checkout/transaction?idType=${idType}&id=${id}`);
  }

  const query = params.orderReference
    ? `orderReference=${params.orderReference}`
    : `transactionRef=${params.transactionRef}`;
  return nombaRequest("GET", `/v1/transactions/accounts/single?${query}`);
}

// ─── Get card token for customer ──────────────────────────────────────────────
export async function getLatestTokenForCustomer(customerEmail: string): Promise<string | null> {
  const result = await nombaRequest(
    "GET",
    `/v1/checkout/tokenized-card-data?customerEmail=${encodeURIComponent(customerEmail)}`
  );
  const list = result?.data?.tokenizedCardDataList;
  return Array.isArray(list) && list.length > 0 ? list[0].tokenKey : null;
}

// ─── Virtual account creation ─────────────────────────────────────────────────
// The header accountId stays as parent per Nomba auth rules.
// Webhook fires to APP_URL/v1/webhooks/nomba when funded.
export async function createVirtualAccount(params: {
  accountRef: string;   // 16-64 chars
  accountName: string;  // 8-64 chars
  expectedAmount: number;
  expiryDate: Date;
}) {
  // Nomba requires "YYYY-MM-DD HH:mm:ss" — not ISO 8601 T/Z format
  const formattedExpiry = params.expiryDate
    .toISOString()
    .replace("T", " ")
    .replace(/\.\d+Z$/, "");

  const result = await nombaRequest("POST", "/v1/accounts/virtual", {
    accountRef: params.accountRef,
    accountName: params.accountName,
    expectedAmount: toNombaAmount(params.expectedAmount),
    expiryDate: formattedExpiry,
    callbackUrl: process.env.APP_URL
      ? `${process.env.APP_URL}/v1/webhooks/nomba`
      : undefined,
  });

  if (result?.code !== "00") {
    console.error("[nomba] Virtual account creation failed:", result);
  }

  return result;
}

// ─── Bank lookup (before transfers) ───────────────────────────────────────────
export async function lookupBankAccount(bankCode: string, accountNumber: string) {
  return nombaRequest("POST", "/v1/transfers/bank/lookup", {
    bankCode,
    accountNumber,
  });
}
