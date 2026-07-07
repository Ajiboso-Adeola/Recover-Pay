"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Key,
  Code2,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { getMe, regenerateApiKey, updateProfile } from "@/lib/api";
import { maskApiKey } from "@/lib/utils";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

export default function SettingsPage() {
  const { getToken } = useAuth();
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Profile editing
  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        if (!token) return;
        const me = await getMe(token);
        setTenant(me);
        setName(me.name || "");
      } catch (err: any) {
        setError(err.message || "Failed to load settings");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [getToken]);

  async function handleCopy() {
    if (!tenant?.apiKey) return;
    await navigator.clipboard.writeText(tenant.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRegenerate() {
    if (!confirmRegen) {
      setConfirmRegen(true);
      setTimeout(() => setConfirmRegen(false), 5000);
      return;
    }
    setRegenerating(true);
    setConfirmRegen(false);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await regenerateApiKey(token);
      setTenant((prev: any) => ({ ...prev, apiKey: res.apiKey }));
      setSuccess("API key regenerated. Update your integrations.");
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      setError(err.message || "Failed to regenerate key");
    } finally {
      setRegenerating(false);
    }
  }

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setSavingName(true);
    try {
      const token = await getToken();
      if (!token) return;
      await updateProfile(token, name);
      setSuccess("Profile updated.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingName(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
      </div>
    );
  }

  const exampleCurl = `curl -X POST ${API_URL}/v1/plans \\
  -H "Authorization: Bearer ${tenant?.apiKey || "rp_sk_..."}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Pro Monthly",
    "amount": 5000,
    "interval": "monthly"
  }'`;

  const startCheckoutExample = `curl -X POST ${API_URL}/v1/checkout/start \\
  -H "Authorization: Bearer ${tenant?.apiKey || "rp_sk_..."}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "customerEmail": "customer@example.com",
    "planId": "YOUR_PLAN_ID",
    "callbackUrl": "https://yourapp.com/payment/success"
  }'`;

  return (
    <div className="animate-fade-in max-w-3xl space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Settings & API</h1>
        <p className="text-slate-500 mt-1">
          Manage your account, API credentials, and integration details.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-4 text-sm flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {success}
        </div>
      )}

      {/* Profile */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Profile</h2>
        <form onSubmit={handleSaveName} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Company / display name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
              placeholder="My Company"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Email
            </label>
            <input
              type="text"
              value={tenant?.email || ""}
              disabled
              className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-400 bg-slate-50 cursor-not-allowed"
            />
            <p className="text-xs text-slate-400 mt-1">
              Email is managed by your Clerk account.
            </p>
          </div>
          <button
            type="submit"
            disabled={savingName}
            className="flex items-center gap-2 bg-[#0B1426] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#1A2E4A] transition-colors disabled:opacity-60"
          >
            {savingName && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save changes
          </button>
        </form>
      </div>

      {/* API Key */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-500" />
              <h2 className="font-semibold text-slate-900">API Key</h2>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Use this key in the Authorization header for all API requests.
            </p>
          </div>
          <span className="text-xs bg-emerald-100 text-emerald-700 font-medium px-2 py-0.5 rounded-full">
            Active
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3 mb-4">
          <Key className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <code className="flex-1 text-sm font-mono text-slate-700 truncate">
            {showKey
              ? tenant?.apiKey
              : maskApiKey(tenant?.apiKey || "")}
          </code>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowKey(!showKey)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-all"
              title={showKey ? "Hide" : "Show"}
            >
              {showKey ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-all"
              title="Copy"
            >
              {copied ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border transition-all ${
              confirmRegen
                ? "bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
                : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {regenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            {confirmRegen ? "Click again to confirm" : "Regenerate key"}
          </button>
          <p className="text-xs text-slate-400">
            Old key stops working immediately.
          </p>
        </div>
      </div>

      {/* Integration details */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Code2 className="w-4 h-4 text-amber-500" />
          <h2 className="font-semibold text-slate-900">Integration guide</h2>
        </div>

        <div className="space-y-5">
          {/* Base URL */}
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Base URL</p>
            <div className="bg-[#0B1426] rounded-lg p-3 flex items-center gap-3">
              <code className="text-sm font-mono text-amber-400 flex-1">
                {API_URL}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(API_URL)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Update this when you deploy to production.
            </p>
          </div>

          {/* Example 1 — Create plan */}
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">
              Example — Create a plan
            </p>
            <div className="bg-[#0B1426] rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs font-mono text-slate-300 whitespace-pre">
                {exampleCurl}
              </pre>
            </div>
          </div>

          {/* Example 2 — Start checkout */}
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">
              Example — Start a subscription checkout
            </p>
            <div className="bg-[#0B1426] rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs font-mono text-slate-300 whitespace-pre">
                {startCheckoutExample}
              </pre>
            </div>
          </div>

          {/* Swagger link */}
          <a
            href={`${API_URL}/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View full API documentation (Swagger UI)
          </a>
        </div>
      </div>

      {/* Tenant ID */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-1">Tenant ID</h2>
        <p className="text-sm text-slate-500 mb-3">
          Your unique account identifier in the RecoverPay system.
        </p>
        <div className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5">
          <code className="text-sm font-mono text-slate-600">
            {tenant?.id}
          </code>
        </div>
      </div>
    </div>
  );
}
