"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Copy, Eye, EyeOff, RefreshCw, CheckCircle2,
  AlertTriangle, Key, Code2, Loader2, ExternalLink,
  Wifi, WifiOff, Shield, ChevronDown, ChevronUp,
} from "lucide-react";
import { getMe, regenerateApiKey, updateProfile } from "@/lib/api";
import { maskApiKey } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// ─── Nomba Config API calls ───────────────────────────────────────────────────
async function getNombaStatus(apiKey: string) {
  const res = await fetch(`${API_URL}/v1/nomba/status`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  return res.json();
}

async function connectNomba(apiKey: string, data: any) {
  const res = await fetch(`${API_URL}/v1/nomba/connect`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

async function testNombaConnection(apiKey: string) {
  const res = await fetch(`${API_URL}/v1/nomba/test`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  return res.json();
}

async function disconnectNomba(apiKey: string) {
  const res = await fetch(`${API_URL}/v1/nomba/disconnect`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  return res.json();
}

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
  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);

  // Nomba config state
  const [nombaStatus, setNombaStatus] = useState<any>(null);
  const [showNombaForm, setShowNombaForm] = useState(false);
  const [nombaForm, setNombaForm] = useState({
    nombaAccountId: "",
    nombaSubAccountId: "",
    nombaClientId: "",
    nombaClientSecret: "",
    nombaWebhookSecret: "",
    baseUrl: "https://sandbox.nomba.com",
  });
  const [connectingNomba, setConnectingNomba] = useState(false);
  const [testingNomba, setTestingNomba] = useState(false);
  const [showNombaSecret, setShowNombaSecret] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const me = await getMe(token);
      setTenant(me);
      setName(me.name || "");

      const status = await getNombaStatus(me.apiKey);
      setNombaStatus(status);

      if (!status.connected) setShowNombaForm(true);
    } catch (err: any) {
      setError(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { void load(); }, [load]);

  async function handleConnectNomba(e: React.FormEvent) {
    e.preventDefault();
    setConnectingNomba(true);
    setError("");
    try {
      const result = await connectNomba(tenant.apiKey, nombaForm);
      if (result.error) {
        setError(result.error + (result.hint ? `\n${result.hint}` : ""));
      } else {
        setNombaStatus({ ...result, connected: true });
        setSuccess("Nomba account connected and verified!");
        setShowNombaForm(false);
        setNombaForm({ ...nombaForm, nombaClientSecret: "", nombaWebhookSecret: "" });
        setTimeout(() => setSuccess(""), 4000);
      }
    } catch (err: any) {
      setError(err.message || "Connection failed");
    } finally {
      setConnectingNomba(false);
    }
  }

  async function handleTestNomba() {
    setTestingNomba(true);
    setError("");
    try {
      const result = await testNombaConnection(tenant.apiKey);
      if (result.connected) {
        setSuccess("Credentials verified — connection is working!");
      } else {
        setError(result.error || "Credentials test failed");
      }
      setTimeout(() => { setSuccess(""); setError(""); }, 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTestingNomba(false);
    }
  }

  async function handleDisconnect() {
    if (!disconnecting) { setDisconnecting(true); return; }
    try {
      await disconnectNomba(tenant.apiKey);
      setNombaStatus({ connected: false });
      setShowNombaForm(true);
      setDisconnecting(false);
      setSuccess("Nomba account disconnected.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
      setDisconnecting(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(tenant?.apiKey || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRegenerate() {
    if (!confirmRegen) { setConfirmRegen(true); setTimeout(() => setConfirmRegen(false), 5000); return; }
    setRegenerating(true);
    setConfirmRegen(false);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await regenerateApiKey(token);
      setTenant((prev: any) => ({ ...prev, apiKey: res.apiKey }));
      setSuccess("API key regenerated. Update your integrations immediately.");
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      setError(err.message);
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

  return (
    <div className="animate-fade-in max-w-3xl space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Settings & API</h1>
        <p className="text-slate-500 mt-1">Manage your account, Nomba connection, and API credentials.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm flex items-start gap-2 whitespace-pre-line">
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

      {/* ── Nomba Connection ─────────────────────────────────────────────── */}
      <div className={`bg-white rounded-xl border-2 p-6 ${
        nombaStatus?.connected ? "border-emerald-200" : "border-amber-300"
      }`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {nombaStatus?.connected ? (
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <Wifi className="w-5 h-5 text-emerald-600" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <WifiOff className="w-5 h-5 text-amber-600" />
              </div>
            )}
            <div>
              <h2 className="font-semibold text-slate-900">Nomba Account</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {nombaStatus?.connected
                  ? "Your Nomba credentials are connected and verified."
                  : "Connect your Nomba merchant account to start accepting payments."}
              </p>
            </div>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            nombaStatus?.connected
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
          }`}>
            {nombaStatus?.connected ? "Connected" : "Not connected"}
          </span>
        </div>

        {/* Connected state */}
        {nombaStatus?.connected && !showNombaForm && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-lg p-4">
              {[
                { label: "Parent Account ID", value: nombaStatus.nombaAccountId },
                { label: "Sub-Account ID", value: nombaStatus.nombaSubAccountId },
                { label: "Client ID", value: nombaStatus.nombaClientId },
                { label: "Base URL", value: nombaStatus.baseUrl },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs text-slate-500 mb-0.5">{item.label}</p>
                  <p className="text-xs font-mono text-slate-700 truncate">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleTestNomba}
                disabled={testingNomba}
                className="flex items-center gap-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                {testingNomba ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                Test connection
              </button>
              <button
                onClick={() => setShowNombaForm(true)}
                className="flex items-center gap-2 text-sm font-medium text-slate-600 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Update credentials
              </button>
              <button
                onClick={handleDisconnect}
                className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg transition-colors ml-auto ${
                  disconnecting
                    ? "bg-red-50 border border-red-300 text-red-700"
                    : "text-slate-400 hover:text-red-500 hover:bg-red-50"
                }`}
              >
                {disconnecting ? "Click again to confirm" : "Disconnect"}
              </button>
            </div>
          </div>
        )}

        {/* Connect / Update form */}
        {(!nombaStatus?.connected || showNombaForm) && (
          <form onSubmit={handleConnectNomba} className="space-y-4 mt-2">
            {!nombaStatus?.connected && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                ⚠️ You cannot create plans until you connect your Nomba account.
                Every hackathon participant received credentials by email.
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Parent Account ID *
                </label>
                <input
                  type="text"
                  value={nombaForm.nombaAccountId}
                  onChange={(e) => setNombaForm({ ...nombaForm, nombaAccountId: e.target.value })}
                  placeholder="f666ef9b-888e-..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Goes in the accountId header</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Sub-Account ID *
                </label>
                <input
                  type="text"
                  value={nombaForm.nombaSubAccountId}
                  onChange={(e) => setNombaForm({ ...nombaForm, nombaSubAccountId: e.target.value })}
                  placeholder="435f41eb-53f6-..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Funds deposited here</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Client ID *
                </label>
                <input
                  type="text"
                  value={nombaForm.nombaClientId}
                  onChange={(e) => setNombaForm({ ...nombaForm, nombaClientId: e.target.value })}
                  placeholder="706df6c4-b8bb-..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Client Secret (Private Key) *
                </label>
                <div className="relative">
                  <input
                    type={showNombaSecret ? "text" : "password"}
                    value={nombaForm.nombaClientSecret}
                    onChange={(e) => setNombaForm({ ...nombaForm, nombaClientSecret: e.target.value })}
                    placeholder="k8UobYk3APgo..."
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-8 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNombaSecret(!showNombaSecret)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showNombaSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Encrypted with AES-256 before storing</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Webhook Secret <span className="text-slate-400">(optional)</span>
                </label>
                <input
                  type="password"
                  value={nombaForm.nombaWebhookSecret}
                  onChange={(e) => setNombaForm({ ...nombaForm, nombaWebhookSecret: e.target.value })}
                  placeholder="NombaHackathon2026"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Hackathon participants: NombaHackathon2026</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Environment
                </label>
                <select
                  value={nombaForm.baseUrl}
                  onChange={(e) => setNombaForm({ ...nombaForm, baseUrl: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                >
                  <option value="https://sandbox.nomba.com">Sandbox (Testing)</option>
                  <option value="https://api.nomba.com">Production (Live)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={connectingNomba}
                className="flex items-center gap-2 bg-[#0B1426] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#1A2E4A] transition-colors disabled:opacity-60"
              >
                {connectingNomba && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {connectingNomba ? "Verifying credentials..." : "Connect Nomba Account"}
              </button>
              {showNombaForm && nombaStatus?.connected && (
                <button
                  type="button"
                  onClick={() => setShowNombaForm(false)}
                  className="text-sm text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* ── Profile ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Profile</h2>
        <form onSubmit={handleSaveName} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Company / display name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
              placeholder="My Company"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input
              type="text"
              value={tenant?.email || ""}
              disabled
              className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-400 bg-slate-50 cursor-not-allowed"
            />
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

      {/* ── API Key ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold text-slate-900">API Key</h2>
          </div>
          <span className="text-xs bg-emerald-100 text-emerald-700 font-medium px-2 py-0.5 rounded-full">Active</span>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Use this in the <code className="bg-slate-100 px-1 rounded text-xs">Authorization: Bearer</code> header for all API requests.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3 mb-4">
          <Key className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <code className="flex-1 text-sm font-mono text-slate-700 truncate">
            {showKey ? tenant?.apiKey : maskApiKey(tenant?.apiKey || "")}
          </code>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowKey(!showKey)} className="p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-all">
              {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <button onClick={handleCopy} className="p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-all">
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border transition-all ${
              confirmRegen ? "bg-red-50 border-red-300 text-red-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {regenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {confirmRegen ? "Click again to confirm" : "Regenerate key"}
          </button>
          <p className="text-xs text-slate-400">Old key stops working immediately.</p>
        </div>
      </div>

      {/* ── Integration Guide ────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Code2 className="w-4 h-4 text-amber-500" />
          <h2 className="font-semibold text-slate-900">Quick start</h2>
        </div>

        <div className="bg-[#0B1426] rounded-lg p-4 mb-4 overflow-x-auto">
          <pre className="text-xs font-mono text-slate-300 whitespace-pre">{`curl -X POST ${API_URL}/v1/checkout/start \\
  -H "Authorization: Bearer ${tenant?.apiKey || "YOUR_API_KEY"}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "customerEmail": "customer@example.com",
    "planId": "YOUR_PLAN_ID"
  }'`}</pre>
        </div>

        <a
          href={`${API_URL}/docs`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700 font-medium"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View full Swagger docs
        </a>
      </div>
    </div>
  );
}
