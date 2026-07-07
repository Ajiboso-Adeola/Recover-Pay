"use client";

import { useState } from "react";
import {
  Copy,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Key,
  ExternalLink,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

// This reads from your .env.local — update after deployment
const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://YOUR_BACKEND_URL.onrender.com";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Endpoint {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  summary: string;
  description: string;
  auth: "api_key" | "none";
  requestBody?: object;
  responseExample?: object;
  params?: { name: string; in: string; required: boolean; desc: string }[];
}

interface Group {
  label: string;
  color: string;
  endpoints: Endpoint[];
}

// ─── Endpoint definitions ─────────────────────────────────────────────────────
const groups: Group[] = [
  {
    label: "Plans",
    color: "bg-blue-100 text-blue-700",
    endpoints: [
      {
        method: "POST",
        path: "/v1/plans",
        summary: "Create a plan",
        description:
          "Creates a new subscription plan. Plans define what you charge customers and how often. Once created, use the plan ID to start checkouts.",
        auth: "api_key",
        requestBody: {
          name: "Pro Monthly",
          amount: 5000,
          interval: "monthly",
          trialDays: 7,
          currency: "NGN",
        },
        responseExample: {
          id: "clxxxxxxxxxxx",
          name: "Pro Monthly",
          amount: "5000",
          currency: "NGN",
          interval: "monthly",
          trialDays: 7,
          archived: false,
          createdAt: "2026-07-04T10:00:00.000Z",
        },
      },
      {
        method: "GET",
        path: "/v1/plans",
        summary: "List all plans",
        description:
          "Returns all active (non-archived) plans for your account, ordered by creation date descending.",
        auth: "api_key",
        responseExample: [
          {
            id: "clxxxxxxxxxxx",
            name: "Pro Monthly",
            amount: "5000",
            interval: "monthly",
          },
        ],
      },
      {
        method: "GET",
        path: "/v1/plans/:id",
        summary: "Get a plan",
        description: "Fetches a single plan by its ID.",
        auth: "api_key",
        params: [{ name: "id", in: "path", required: true, desc: "Plan ID" }],
        responseExample: {
          id: "clxxxxxxxxxxx",
          name: "Pro Monthly",
          amount: "5000",
          interval: "monthly",
        },
      },
      {
        method: "PATCH",
        path: "/v1/plans/:id",
        summary: "Update a plan",
        description:
          "Updates the plan name, amount, or trial days. Interval and currency cannot be changed after creation — they would corrupt existing subscriptions.",
        auth: "api_key",
        params: [{ name: "id", in: "path", required: true, desc: "Plan ID" }],
        requestBody: { name: "Pro Monthly (New Price)", amount: 6000 },
        responseExample: { id: "clxxxxxxxxxxx", name: "Pro Monthly (New Price)", amount: "6000" },
      },
      {
        method: "DELETE",
        path: "/v1/plans/:id",
        summary: "Archive a plan",
        description:
          "Soft-deletes a plan. It disappears from the list but existing subscriptions on that plan continue to work. Returns 204 with no body.",
        auth: "api_key",
        params: [{ name: "id", in: "path", required: true, desc: "Plan ID" }],
      },
    ],
  },
  {
    label: "Checkout",
    color: "bg-amber-100 text-amber-700",
    endpoints: [
      {
        method: "POST",
        path: "/v1/checkout/start",
        summary: "Start a subscription checkout",
        description:
          "Creates a customer, subscription, and first invoice, then returns a Nomba-hosted checkout URL. Redirect your customer to this URL to complete payment. The card is tokenised after successful payment for future recurring charges.",
        auth: "api_key",
        requestBody: {
          customerEmail: "customer@example.com",
          planId: "clxxxxxxxxxxx",
          callbackUrl: "https://yourapp.com/payment/success",
        },
        responseExample: {
          checkoutUrl: "https://checkout.nomba.com/sandbox/xxxx",
          subscriptionId: "clxxxxxxxxxxx",
          invoiceId: "clxxxxxxxxxxx",
        },
      },
      {
        method: "GET",
        path: "/v1/checkout/complete",
        summary: "Payment return URL (Nomba redirect)",
        description:
          "Nomba redirects the customer's browser here after payment. You do not call this directly — Nomba calls it. It verifies the payment, activates the subscription, and saves the card token.",
        auth: "none",
        params: [
          {
            name: "orderReference",
            in: "query",
            required: true,
            desc: "Order reference from the checkout session",
          },
        ],
        responseExample: {
          success: true,
          message: "Payment confirmed. Subscription is active.",
        },
      },
      {
        method: "GET",
        path: "/v1/checkout/status",
        summary: "Check payment status",
        description:
          "Call this from your frontend after the customer lands on your callbackUrl to confirm whether their payment succeeded. Useful when building your own success/failure pages.",
        auth: "api_key",
        params: [
          {
            name: "orderReference",
            in: "query",
            required: true,
            desc: "From the checkoutUrl response",
          },
        ],
        responseExample: {
          orderReference: "inv_clxxx_uuid",
          paid: true,
          invoiceStatus: "paid",
          subscriptionStatus: "active",
          subscriptionId: "clxxxxxxxxxxx",
        },
      },
    ],
  },
  {
    label: "Subscriptions",
    color: "bg-emerald-100 text-emerald-700",
    endpoints: [
      {
        method: "GET",
        path: "/v1/subscriptions",
        summary: "List subscriptions",
        description:
          "Returns all subscriptions across all your plans. Filter by status using the optional query parameter.",
        auth: "api_key",
        params: [
          {
            name: "status",
            in: "query",
            required: false,
            desc: "active | trialing | past_due | paused | cancelled",
          },
        ],
        responseExample: [
          {
            id: "clxxxxxxxxxxx",
            status: "active",
            dunningAttempt: 0,
            customer: { email: "customer@example.com" },
            plan: { name: "Pro Monthly", amount: "5000" },
          },
        ],
      },
      {
        method: "GET",
        path: "/v1/subscriptions/:id",
        summary: "Get a subscription",
        description:
          "Returns full subscription details including customer, plan, and all invoices.",
        auth: "api_key",
        params: [
          { name: "id", in: "path", required: true, desc: "Subscription ID" },
        ],
        responseExample: {
          id: "clxxxxxxxxxxx",
          status: "active",
          dunningAttempt: 0,
          nextBillingDate: "2026-08-04T10:00:00.000Z",
          customer: {
            email: "customer@example.com",
            tokenKey: "tok_xxxxx",
          },
          plan: { name: "Pro Monthly", amount: "5000" },
          invoices: [{ status: "paid", amountDue: "5000", amountPaid: "5000" }],
        },
      },
      {
        method: "POST",
        path: "/v1/subscriptions/:id/charge",
        summary: "Trigger billing cycle",
        description:
          "Manually triggers a billing cycle for a subscription. The scheduler calls this automatically — use this endpoint to trigger billing immediately without waiting.",
        auth: "api_key",
        params: [
          { name: "id", in: "path", required: true, desc: "Subscription ID" },
        ],
        responseExample: {
          invoice: { status: "paid", amountDue: "5000", amountPaid: "5000" },
          charged: true,
        },
      },
    ],
  },
  {
    label: "Customer Portal",
    color: "bg-purple-100 text-purple-700",
    endpoints: [
      {
        method: "GET",
        path: "/v1/portal/:customerId",
        summary: "Customer overview",
        description:
          "Returns a customer's profile and all their subscriptions. No API key required — safe to call from your frontend.",
        auth: "none",
        params: [
          { name: "customerId", in: "path", required: true, desc: "Customer ID" },
        ],
        responseExample: {
          id: "clxxxxxxxxxxx",
          email: "customer@example.com",
          hasCard: true,
          subscriptions: [{ status: "active", plan: { name: "Pro Monthly" } }],
        },
      },
      {
        method: "GET",
        path: "/v1/portal/:customerId/invoices",
        summary: "Invoice history",
        description: "Returns all invoices for a customer, ordered newest first.",
        auth: "none",
        params: [
          { name: "customerId", in: "path", required: true, desc: "Customer ID" },
        ],
        responseExample: [
          { id: "clxxxxxxxxxxx", status: "paid", amountDue: "5000", amountPaid: "5000" },
        ],
      },
      {
        method: "POST",
        path: "/v1/portal/:customerId/subscriptions/:subId/pause",
        summary: "Pause a subscription",
        description:
          "Pauses an active subscription. No charges are made while paused. Can only pause active subscriptions.",
        auth: "none",
        params: [
          { name: "customerId", in: "path", required: true, desc: "Customer ID" },
          { name: "subId", in: "path", required: true, desc: "Subscription ID" },
        ],
        responseExample: { status: "paused" },
      },
      {
        method: "POST",
        path: "/v1/portal/:customerId/subscriptions/:subId/resume",
        summary: "Resume a subscription",
        description:
          "Resumes a paused subscription. The next billing date is set to one full cycle from now — no charge for time spent paused.",
        auth: "none",
        params: [
          { name: "customerId", in: "path", required: true, desc: "Customer ID" },
          { name: "subId", in: "path", required: true, desc: "Subscription ID" },
        ],
        responseExample: { status: "active" },
      },
      {
        method: "POST",
        path: "/v1/portal/:customerId/subscriptions/:subId/cancel",
        summary: "Cancel a subscription",
        description:
          "Cancels a subscription. This action is irreversible. The customer retains access until the end of the current period.",
        auth: "none",
        params: [
          { name: "customerId", in: "path", required: true, desc: "Customer ID" },
          { name: "subId", in: "path", required: true, desc: "Subscription ID" },
        ],
        responseExample: { status: "cancelled" },
      },
    ],
  },
  {
    label: "Webhooks",
    color: "bg-slate-100 text-slate-600",
    endpoints: [
      {
        method: "POST",
        path: "/v1/webhooks/nomba",
        summary: "Nomba webhook receiver",
        description:
          "This endpoint is called by Nomba, not by you. Nomba sends payment events here after a card is charged or a virtual account is funded. Your webhook URL has already been registered with Nomba. You do not need to call this.",
        auth: "none",
        responseExample: { received: true },
      },
    ],
  },
];

// ─── Helper components ────────────────────────────────────────────────────────
function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "bg-emerald-100 text-emerald-700",
    POST: "bg-blue-100 text-blue-700",
    PATCH: "bg-amber-100 text-amber-700",
    DELETE: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${colors[method] || "bg-slate-100 text-slate-600"}`}
    >
      {method}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-all"
    >
      {copied ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="relative bg-[#0B1426] rounded-lg overflow-hidden">
      <div className="absolute top-2 right-2">
        <CopyButton text={code} />
      </div>
      <pre className="text-xs font-mono text-slate-300 p-4 pr-10 overflow-x-auto whitespace-pre">
        {code}
      </pre>
    </div>
  );
}

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const [open, setOpen] = useState(false);

  const curlExample = buildCurl(endpoint);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 bg-white hover:bg-slate-50 transition-colors text-left"
      >
        <MethodBadge method={endpoint.method} />
        <code className="text-sm font-mono text-slate-700 flex-1">
          {endpoint.path}
        </code>
        <span className="text-sm text-slate-500 hidden md:block flex-1">
          {endpoint.summary}
        </span>
        {endpoint.auth === "api_key" ? (
          <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded font-medium">
            API KEY
          </span>
        ) : (
          <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
            PUBLIC
          </span>
        )}
        {open ? (
          <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
        )}
      </button>

      {/* Expanded content */}
      {open && (
        <div className="border-t border-slate-100 p-5 space-y-5 bg-slate-50">
          {/* Description */}
          <p className="text-sm text-slate-600 leading-relaxed">
            {endpoint.description}
          </p>

          {/* Path params */}
          {endpoint.params && endpoint.params.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Parameters
              </p>
              <div className="space-y-2">
                {endpoint.params.map((p) => (
                  <div
                    key={p.name}
                    className="flex items-start gap-3 text-sm bg-white border border-slate-200 rounded-lg px-3 py-2"
                  >
                    <code className="font-mono text-amber-600 flex-shrink-0">
                      {p.name}
                    </code>
                    <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded flex-shrink-0">
                      {p.in}
                    </span>
                    {p.required && (
                      <span className="text-xs text-red-500 flex-shrink-0">required</span>
                    )}
                    <span className="text-slate-500 text-xs">{p.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Request body */}
          {endpoint.requestBody && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Request Body
              </p>
              <CodeBlock
                code={JSON.stringify(endpoint.requestBody, null, 2)}
              />
            </div>
          )}

          {/* Response */}
          {endpoint.responseExample && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Response
              </p>
              <CodeBlock
                code={JSON.stringify(endpoint.responseExample, null, 2)}
              />
            </div>
          )}

          {/* cURL example */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              cURL Example
            </p>
            <CodeBlock code={curlExample} />
          </div>
        </div>
      )}
    </div>
  );
}

function buildCurl(endpoint: Endpoint): string {
  const url = `${BASE_URL}${endpoint.path
    .replace(":id", "REPLACE_WITH_ID")
    .replace(":customerId", "REPLACE_WITH_CUSTOMER_ID")
    .replace(":subId", "REPLACE_WITH_SUB_ID")}`;

  const authHeader =
    endpoint.auth === "api_key"
      ? `  -H "Authorization: Bearer YOUR_API_KEY" \\\n`
      : "";

  const bodyPart = endpoint.requestBody
    ? `  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(endpoint.requestBody, null, 2).replace(/'/g, '"')}'`
    : "";

  return `curl -X ${endpoint.method} "${url}" \\
${authHeader}${bodyPart}`.trim();
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DocsPage() {
  const [copiedUrl, setCopiedUrl] = useState(false);

  function copyBaseUrl() {
    navigator.clipboard.writeText(BASE_URL);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  }

  return (
    <div className="animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">API Reference</h1>
        <p className="text-slate-500 mt-1">
          Complete reference for all RecoverPay endpoints. Use your API key
          from the Settings page to authenticate.
        </p>
      </div>

      {/* Base URL card */}
      <div className="bg-[#0B1426] rounded-xl p-5 mb-8">
        <p className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-3">
          Base URL
        </p>
        <div className="flex items-center gap-3">
          <code className="text-amber-400 font-mono text-sm flex-1 truncate">
            {BASE_URL}
          </code>
          <button
            onClick={copyBaseUrl}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            {copiedUrl ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            Copy
          </button>
        </div>
        {BASE_URL.includes("YOUR_BACKEND_URL") && (
          <p className="text-xs text-amber-500 mt-3 flex items-center gap-1.5">
            <Zap className="w-3 h-3" />
            Placeholder — update NEXT_PUBLIC_API_URL in .env.local after deployment
          </p>
        )}
      </div>

      {/* Authentication */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Key className="w-4 h-4 text-amber-500" />
          <h2 className="font-semibold text-slate-900">Authentication</h2>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          All protected endpoints require your API key in the{" "}
          <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono text-xs">
            Authorization
          </code>{" "}
          header. Get your key from the{" "}
          <a href="/dashboard/settings" className="text-amber-600 hover:underline">
            Settings page
          </a>
          .
        </p>
        <CodeBlock
          code={`Authorization: Bearer YOUR_API_KEY

# Example
Authorization: Bearer rp_sk_a1b2c3d4e5f6...`}
        />

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-amber-700 mb-1">
              API KEY (rp_sk_...)
            </p>
            <p className="text-xs text-amber-600">
              For developer API calls from your server or Bruno. Starts with{" "}
              <code className="font-mono">rp_sk_</code>
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-slate-700 mb-1">
              PUBLIC endpoints
            </p>
            <p className="text-xs text-slate-500">
              Portal endpoints and webhook receiver require no authentication —
              safe to call from a browser.
            </p>
          </div>
        </div>
      </div>

      {/* Endpoint groups */}
      <div className="space-y-8">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="flex items-center gap-3 mb-4">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${group.color}`}
              >
                {group.label}
              </span>
              <span className="text-xs text-slate-400">
                {group.endpoints.length} endpoint
                {group.endpoints.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="space-y-2">
              {group.endpoints.map((ep) => (
                <EndpointCard
                  key={`${ep.method}-${ep.path}`}
                  endpoint={ep}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Swagger link footer */}
      <div className="mt-10 bg-slate-50 border border-slate-200 rounded-xl p-5 flex items-center justify-between">
        <div>
          <p className="font-medium text-slate-900 text-sm">
            Full Swagger documentation
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive API explorer with try-it-out for every endpoint
          </p>
        </div>
        <a
          href={`${BASE_URL}/docs`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-[#0B1426] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#1A2E4A] transition-colors"
        >
          Open Swagger
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
