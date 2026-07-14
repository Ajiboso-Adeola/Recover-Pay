"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { Plus, CreditCard, Loader2, RefreshCw, WifiOff } from "lucide-react";
import PlanCard from "@/components/dashboard/PlanCard";
import { getPlans, getMe, getNombaStatus, Plan } from "@/lib/api";

export default function PlansPage() {
  const { getToken } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [nombaConnected, setNombaConnected] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const me = await getMe(token);
      setApiKey(me.apiKey);
      const [plansData, nombaStatus] = await Promise.all([
        getPlans(me.apiKey),
        getNombaStatus(me.apiKey),
      ]);
      setPlans(plansData);
      setNombaConnected(nombaStatus.connected);
    } catch (err: any) {
      setError(err.message || "Failed to load plans");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { void load(); }, [load]);

  function handleArchived(planId: string) {
    setPlans((prev) => prev.filter((p) => p.id !== planId));
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 text-amber-500 animate-spin" /></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Plans</h1>
          <p className="text-slate-500 mt-1">Manage your subscription plans and pricing.</p>
        </div>
        {nombaConnected && plans.length > 0 && (
          <Link href="/dashboard/plans/new" className="flex items-center gap-2 bg-[#0B1426] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#1A2E4A] transition-colors">
            <Plus className="w-4 h-4" />New plan
          </Link>
        )}
      </div>

      {nombaConnected === false && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6 mb-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <WifiOff className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-900">Connect your Nomba account first</h3>
            <p className="text-sm text-amber-700 mt-1">You cannot create plans until your Nomba merchant account is connected. Payments go directly to your Nomba wallet.</p>
            <Link href="/dashboard/settings" className="inline-flex items-center gap-2 mt-3 bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              Go to Settings → Connect Nomba
            </Link>
          </div>
        </div>
      )}

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">{error}</div>}

      {nombaConnected && plans.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4"><CreditCard className="w-8 h-8 text-slate-400" /></div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No plans yet</h3>
          <p className="text-slate-500 max-w-sm mb-6 text-sm">Create your first subscription plan. Define the name, price, billing interval, and trial period.</p>
          <Link href="/dashboard/plans/new" className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
            <Plus className="w-4 h-4" />Create your first plan
          </Link>
        </div>
      )}

      {nombaConnected && plans.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <Link href="/dashboard/plans/new" className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-5 flex flex-col items-center justify-center gap-3 hover:border-amber-400 hover:bg-amber-50/30 transition-all cursor-pointer min-h-[180px] group">
            <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-amber-100 flex items-center justify-center transition-colors">
              <Plus className="w-5 h-5 text-slate-400 group-hover:text-amber-500 transition-colors" />
            </div>
            <span className="text-sm font-medium text-slate-500 group-hover:text-amber-600 transition-colors">Create new plan</span>
          </Link>
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} apiKey={apiKey} onArchived={handleArchived} />
          ))}
        </div>
      )}

      {plans.length > 0 && (
        <p className="text-xs text-slate-400 mt-6 flex items-center gap-1.5">
          <RefreshCw className="w-3 h-3" />{plans.length} plan{plans.length !== 1 ? "s" : ""} — archived plans are hidden
        </p>
      )}
    </div>
  );
}
