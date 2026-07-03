import { redisConnection as redis } from "../redis";

const NOMBA_BASE_URL = process.env.NOMBA_BASE_URL || "https://sandbox.nomba.com";

// ─── Amount helper ───────────────────────────────────────────────────────────
// Nomba amounts are decimal Naira strings e.g. "5000.00" — NOT kobo integers
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
      accountId: process.env.NOMBA_ACCOUNT_ID!,
    },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: process.env.NOMBA_CLIENT_ID,
      client_secret: process.env.NOMBA_CLIENT_SECRET,
    }),
  });

  const json = (await res.json()) as any;
  const token = json?.data?.access_token;
  if (!token) throw new Error(`Nomba auth failed: ${JSON.stringify(json)}`);

  // Token lives 60 min — cache for 55 to give a buffer
  await redis.setex("nomba:access_token", 3300, token);
  return token;
}

// ─── Base request ─────────────────────────────────────────────────────────────
export async function nombaRequest(
  method: string,
  path: string,
  body?: object
): Promise<any> {
  const token = await getAccessToken();

  const res = await fetch(`${NOMBA_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      accountId: process.env.NOMBA_ACCOUNT_ID!,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return res.json();
}

// ─── Checkout ─────────────────────────────────────────────────────────────────
export async function createCheckoutOrder(params: {
  orderReference: string;
  customerId: string;
  customerEmail: string;
  amount: number;
  callbackUrl: string;
}) {
  return nombaRequest("POST", "/v1/checkout/order", {
    order: {
      orderReference: params.orderReference,
      customerId: params.customerId,
      customerEmail: params.customerEmail,
      amount: toNombaAmount(params.amount),
      currency: "NGN",
      callbackUrl: params.callbackUrl,
      tokenizeCard: true, // critical — this is what saves the card for recurring use
    },
  });
}

// ─── Tokenized card charge ────────────────────────────────────────────────────
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
    },
    tokenKey: params.tokenKey,
  });
}

// ─── Transaction verification ─────────────────────────────────────────────────
export async function verifyTransaction(params: {
  orderReference?: string;
  transactionRef?: string;
}) {
  const query = params.orderReference
    ? `orderReference=${params.orderReference}`
    : `transactionRef=${params.transactionRef}`;
  return nombaRequest("GET", `/v1/transactions/accounts/single?${query}`);
}

// ─── Get saved card token for a customer ─────────────────────────────────────
export async function getLatestTokenForCustomer(
  customerEmail: string
): Promise<string | null> {
  const result = await nombaRequest(
    "GET",
    `/v1/checkout/tokenized-card-data?customerEmail=${encodeURIComponent(customerEmail)}`
  );
  const list = result?.data?.tokenizedCardDataList;
  return Array.isArray(list) && list.length > 0 ? list[0].tokenKey : null;
}

// ─── Virtual account ──────────────────────────────────────────────────────────
export async function createVirtualAccount(params: {
  accountRef: string;   // 16-64 chars
  accountName: string;  // 8-64 chars
  expectedAmount: number;
  expiryDate: Date;
}) {
  // Nomba expects "YYYY-MM-DD HH:mm:ss" format
  const formattedExpiry = params.expiryDate
    .toISOString()
    .replace("T", " ")
    .replace(/\.\d+Z$/, "");

  return nombaRequest("POST", "/v1/accounts/virtual", {
    accountRef: params.accountRef,
    accountName: params.accountName,
    expectedAmount: toNombaAmount(params.expectedAmount),
    expiryDate: formattedExpiry,
  });
}
