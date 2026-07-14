// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// ─── Generic fetch wrapper ────────────────────────────────────────────────────
async function apiFetch(path: string, token: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

// ─── Auth / Tenant ────────────────────────────────────────────────────────────
export async function registerTenant(token: string) {
  return apiFetch("/v1/auth/register", token, { method: "POST" });
}

export async function getMe(token: string) {
  return apiFetch("/v1/auth/me", token);
}

export async function regenerateApiKey(token: string) {
  return apiFetch("/v1/auth/regenerate-key", token, { method: "POST" });
}

export async function updateProfile(token: string, name: string) {
  return apiFetch("/v1/auth/profile", token, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

// ─── Nomba Config ─────────────────────────────────────────────────────────────
export interface NombaConnectInput {
  nombaAccountId: string;
  nombaSubAccountId: string;
  nombaClientId: string;
  nombaClientSecret: string;
  nombaWebhookSecret?: string;
  baseUrl?: string;
}

export async function getNombaStatus(apiKey: string) {
  return apiFetch("/v1/nomba/status", apiKey);
}

export async function connectNomba(apiKey: string, data: NombaConnectInput) {
  return apiFetch("/v1/nomba/connect", apiKey, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function testNombaConnection(apiKey: string) {
  return apiFetch("/v1/nomba/test", apiKey, { method: "POST" });
}

export async function disconnectNomba(apiKey: string) {
  return apiFetch("/v1/nomba/disconnect", apiKey, { method: "DELETE" });
}

// ─── Plans ────────────────────────────────────────────────────────────────────
export interface Plan {
  id: string;
  name: string;
  amount: string;
  currency: string;
  interval: string;
  trialDays: number;
  archived: boolean;
  createdAt: string;
}

export interface CreatePlanInput {
  name: string;
  amount: number;
  interval: "monthly" | "annual" | "custom";
  trialDays?: number;
  currency?: string;
}

export async function getPlans(apiKey: string): Promise<Plan[]> {
  return apiFetch("/v1/plans", apiKey);
}

export async function createPlan(apiKey: string, input: CreatePlanInput): Promise<Plan> {
  return apiFetch("/v1/plans", apiKey, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function archivePlan(apiKey: string, planId: string) {
  return apiFetch(`/v1/plans/${planId}`, apiKey, { method: "DELETE" });
}

// ─── Subscriptions ────────────────────────────────────────────────────────────
export interface Subscription {
  id: string;
  status: string;
  dunningAttempt: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextBillingDate: string;
  customer: { id: string; email: string; tokenKey: string | null };
  plan: { name: string; amount: string; interval: string };
  createdAt: string;
}

export async function getSubscriptions(apiKey: string, status?: string): Promise<Subscription[]> {
  const query = status ? `?status=${status}` : "";
  return apiFetch(`/v1/subscriptions${query}`, apiKey);
}

export async function getSubscription(apiKey: string, id: string): Promise<Subscription> {
  return apiFetch(`/v1/subscriptions/${id}`, apiKey);
}

// ─── Transactions ─────────────────────────────────────────────────────────────
export interface Transaction {
  id: string;
  orderReference: string;
  status: string;
  message: string | null;
  amount: string;
  currency: string;
  customerEmail: string;
  planName: string;
  subscriptionId: string;
  invoiceId: string;
  createdAt: string;
}

export interface TransactionSummary {
  totalSuccessful: number;
  totalFailed: number;
  totalRevenue: string;
  activeSubscriptions: number;
  pastDue: number;
  recoveryRate: number;
}

export async function getTransactions(
  apiKey: string,
  status?: string,
  limit = 50
): Promise<{ transactions: Transaction[]; total: number }> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  params.set("limit", String(limit));
  return apiFetch(`/v1/transactions?${params}`, apiKey);
}

export async function getTransactionSummary(apiKey: string): Promise<TransactionSummary> {
  return apiFetch("/v1/transactions/summary", apiKey);
}
