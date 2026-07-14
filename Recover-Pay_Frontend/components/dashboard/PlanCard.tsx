"use client";

import { useState } from "react";
import { CreditCard, Calendar, Clock, Trash2 } from "lucide-react";
import { Plan, archivePlan } from "@/lib/api";
import { formatNaira, intervalLabel, formatDate } from "@/lib/utils";

interface PlanCardProps {
  plan: Plan;
  apiKey: string;
  onArchived: (planId: string) => void;
}

export default function PlanCard({ plan, apiKey, onArchived }: PlanCardProps) {
  const [archiving, setArchiving] = useState(false);
  const [confirm, setConfirm] = useState(false);

  async function handleArchive() {
    if (!confirm) {
      setConfirm(true);
      setTimeout(() => setConfirm(false), 3000);
      return;
    }
    setArchiving(true);
    try {
      await archivePlan(apiKey, plan.id);
      onArchived(plan.id);
    } catch (err) {
      console.error("Archive failed:", err);
    } finally {
      setArchiving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-sm transition-all group relative animate-slide-up">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-[#0B1426] flex items-center justify-center flex-shrink-0">
          <CreditCard className="w-5 h-5 text-amber-400" />
        </div>
        <button
          onClick={handleArchive}
          disabled={archiving}
          className={`opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 ${confirm ? "opacity-100 text-red-500 bg-red-50" : ""}`}
          title={confirm ? "Click again to confirm" : "Archive plan"}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <h3 className="font-semibold text-slate-900 text-sm mb-1 truncate">{plan.name}</h3>
      <div className="text-2xl font-extrabold text-[#0B1426] mb-3">
        {formatNaira(plan.amount)}
        <span className="text-sm font-normal text-slate-400 ml-1">/ {intervalLabel(plan.interval).toLowerCase()}</span>
      </div>

      <div className="space-y-1.5 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Calendar className="w-3.5 h-3.5" />
          <span>{intervalLabel(plan.interval)} billing</span>
        </div>
        {plan.trialDays > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            <span>{plan.trialDays}-day free trial</span>
          </div>
        )}
        <div className="text-[10px] text-slate-400 font-mono truncate">{plan.id}</div>
      </div>

      {confirm && (
        <div className="absolute bottom-3 left-3 right-3 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 text-xs text-red-600 font-medium">
          Click again to archive
        </div>
      )}
    </div>
  );
}
