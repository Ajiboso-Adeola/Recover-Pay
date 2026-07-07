const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// ─── Generic fetch wrapper ────────────────────────────────────────────────────
async function apiFetch(
  path: string,
  token: string,
  options: RequestInit = {}
) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

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
  customer: { email: string; tokenKey: string | null };
  plan: { name: string; amount: string; interval: string };
  createdAt: string;
}

export async function getSubscriptions(
  apiKey: string,
  status?: string
): Promise<Subscription[]> {
  const query = status ? `?status=${status}` : "";
  return apiFetch(`/v1/subscriptions${query}`, apiKey);
}
