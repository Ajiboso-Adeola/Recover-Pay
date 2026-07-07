"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Loader2, Users, RefreshCw } from "lucide-react";
import { getSubscriptions, getMe, Subscription } from "@/lib/api";
import { formatNaira, formatDate, statusColor, cn } from "@/lib/utils";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "past_due", label: "Past due" },
  { value: "trialing", label: "Trialing" },
  { value: "paused", label: "Paused" },
  { value: "cancelled", label: "Cancelled" },
];

export default function SubscriptionsPage() {
  const { getToken } = useAuth();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    load();
  }, [filter]);

  async function load() {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const me = await getMe(token);
      setApiKey(me.apiKey);
      const data = await getSubscriptions(me.apiKey, filter || undefined);
      setSubs(data);
    } catch (err: any) {
      setError(err.message || "Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subscriptions</h1>
          <p className="text-slate-500 mt-1">
            All customer subscriptions across your plans.
          </p>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-all"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Status filters */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
              filter === f.value
                ? "bg-[#0B1426] text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm mb-4">
          {error}
        </div>
      )}

      {!loading && subs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Users className="w-7 h-7 text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">
            No subscriptions yet
          </h3>
          <p className="text-sm text-slate-500 max-w-sm">
            Subscriptions appear here once customers complete a checkout. Use
            the API to start a checkout session.
          </p>
        </div>
      )}

      {!loading && subs.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">
                  Customer
                </th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">
                  Plan
                </th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">
                  Amount
                </th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">
                  Next billing
                </th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">
                  Card saved
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {subs.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="text-sm font-medium text-slate-900 truncate max-w-[160px]">
                      {sub.customer.email}
                    </div>
                    <div className="text-xs text-slate-400 font-mono truncate">
                      {sub.id.slice(0, 16)}...
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="text-sm text-slate-700">{sub.plan.name}</div>
                    <div className="text-xs text-slate-400">
                      {sub.plan.interval}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(
                        sub.status
                      )}`}
                    >
                      {sub.status === "active" && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                      )}
                      {sub.status}
                    </span>
                    {sub.dunningAttempt > 0 && (
                      <div className="text-xs text-amber-600 mt-0.5">
                        Retry {sub.dunningAttempt}/3
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-sm font-medium text-slate-900">
                    {formatNaira(sub.plan.amount)}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-500">
                    {formatDate(sub.nextBillingDate)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`text-xs font-medium ${
                        sub.customer.tokenKey
                          ? "text-emerald-600"
                          : "text-slate-400"
                      }`}
                    >
                      {sub.customer.tokenKey ? "✓ Yes" : "✗ No"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-400">
              {subs.length} subscription{subs.length !== 1 ? "s" : ""}
              {filter ? ` with status "${filter}"` : " total"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
