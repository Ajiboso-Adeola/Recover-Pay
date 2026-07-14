"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { createPlan, getMe } from "@/lib/api";

const INTERVALS = [
  { value: "monthly", label: "Monthly", desc: "Charge customers every month" },
  { value: "annual", label: "Annual", desc: "Charge customers once a year" },
  { value: "custom", label: "Custom", desc: "Define your own billing cycle" },
];

export default function NewPlanPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", amount: "", interval: "monthly", trialDays: "0" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return setError("Plan name is required");
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      return setError("Enter a valid amount in Naira (e.g. 5000)");
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const me = await getMe(token);
      await createPlan(me.apiKey, {
        name: form.name.trim(),
        amount: Number(form.amount),
        interval: form.interval as "monthly" | "annual" | "custom",
        trialDays: Number(form.trialDays) || 0,
        currency: "NGN",
      });
      setSuccess(true);
      setTimeout(() => router.push("/dashboard/plans"), 1200);
    } catch (err: any) {
      setError(err.message || "Failed to create plan");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 animate-fade-in">
        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-emerald-500" />
        </div>
        <p className="font-semibold text-slate-900">Plan created!</p>
        <p className="text-sm text-slate-500">Redirecting to plans...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-2xl">
      <Link href="/dashboard/plans" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to plans
      </Link>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Create a plan</h1>
        <p className="text-slate-500 mt-1">Define a pricing plan your customers will subscribe to.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Plan details */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">Plan details</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Plan name *</label>
            <input
              type="text" name="name" value={form.name} onChange={handleChange}
              placeholder="e.g. Pro Monthly, Starter, Premium Annual"
              className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              maxLength={60} required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount (₦) *</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₦</span>
              <input
                type="number" name="amount" value={form.amount} onChange={handleChange}
                placeholder="5000" min="1" step="1"
                className="w-full border border-slate-200 rounded-lg pl-8 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">Enter in Naira. e.g. 5000 = ₦5,000</p>
          </div>
        </div>

        {/* Interval */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Billing interval</h2>
          <div className="grid grid-cols-3 gap-3">
            {INTERVALS.map((option) => (
              <label key={option.value} className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${form.interval === option.value ? "border-amber-500 bg-amber-50" : "border-slate-200 hover:border-slate-300"}`}>
                <input type="radio" name="interval" value={option.value} checked={form.interval === option.value} onChange={handleChange} className="sr-only" />
                <div className={`text-sm font-semibold mb-1 ${form.interval === option.value ? "text-amber-700" : "text-slate-700"}`}>{option.label}</div>
                <div className="text-xs text-slate-400">{option.desc}</div>
              </label>
            ))}
          </div>
        </div>

        {/* Trial */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-1">Free trial <span className="text-xs font-normal text-slate-400 ml-1">optional</span></h2>
          <p className="text-sm text-slate-500 mb-4">Give new customers a trial before billing starts.</p>
          <div className="flex items-center gap-3">
            <input
              type="number" name="trialDays" value={form.trialDays} onChange={handleChange}
              min="0" max="90"
              className="w-20 border border-slate-200 rounded-lg px-3 py-2 text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            />
            <span className="text-sm text-slate-500">days</span>
          </div>
        </div>

        {/* Preview */}
        {form.name && form.amount && (
          <div className="bg-[#0B1426] rounded-xl p-5 animate-slide-up">
            <p className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-3">Preview</p>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">{form.name}</div>
                <div className="text-slate-400 text-sm mt-0.5">{form.interval} billing{Number(form.trialDays) > 0 ? ` · ${form.trialDays}-day trial` : ""}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-extrabold text-amber-400">₦{Number(form.amount).toLocaleString()}</div>
                <div className="text-slate-500 text-xs">per {form.interval === "annual" ? "year" : "month"}</div>
              </div>
            </div>
          </div>
        )}

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{error}</div>}

        <div className="flex items-center gap-3 pb-8">
          <button type="submit" disabled={loading} className="flex items-center gap-2 bg-[#0B1426] hover:bg-[#1A2E4A] text-white font-semibold px-6 py-3 rounded-xl transition-colors disabled:opacity-60">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Creating..." : "Create plan"}
          </button>
          <Link href="/dashboard/plans" className="text-sm text-slate-500 hover:text-slate-700 px-4 py-3">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
