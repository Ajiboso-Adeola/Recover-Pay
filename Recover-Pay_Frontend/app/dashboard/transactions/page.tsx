"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Loader2, RefreshCw, TrendingUp, CheckCircle2,
  XCircle, Clock, BarChart3, ArrowUpRight,
} from "lucide-react";
import { getMe } from "@/lib/api";
import { formatNaira, formatDate, cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "success", label: "Successful" },
  { value: "failed", label: "Failed" },
  { value: "pending", label: "Pending" },
];

function statusStyle(status: string) {
  const map: Record<string, string> = {
    success: "bg-emerald-100 text-emerald-700",
    failed: "bg-red-100 text-red-600",
    pending: "bg-amber-100 text-amber-700",
  };
  return map[status] || "bg-slate-100 text-slate-500";
}

function StatusIcon({ status }: { status: string }) {
  if (status === "success") return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
  if (status === "failed") return <XCircle className="w-3.5 h-3.5 text-red-500" />;
  return <Clock className="w-3.5 h-3.5 text-amber-500" />;
}

export default function TransactionsPage() {
  const { getToken } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [apiKey, setApiKey] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const me = await getMe(token);
      setApiKey(me.apiKey);

      const headers = { Authorization: `Bearer ${me.apiKey}` };
      const query = filter ? `?status=${filter}` : "";

      const [txRes, sumRes] = await Promise.all([
        fetch(`${API_URL}/v1/transactions${query}`, { headers }),
        fetch(`${API_URL}/v1/transactions/summary`, { headers }),
      ]);

      const txData = await txRes.json();
      const sumData = await sumRes.json();

      setTransactions(txData.transactions || []);
      setSummary(sumData);
    } catch (err: any) {
      setError(err.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [filter, getToken]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
          <p className="text-slate-500 mt-1">
            All charge attempts processed through your Nomba account.
          </p>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Total Revenue",
              value: formatNaira(summary.totalRevenue || 0),
              icon: TrendingUp,
              color: "text-emerald-500",
              bg: "bg-emerald-50",
            },
            {
              label: "Successful",
              value: summary.totalSuccessful,
              icon: CheckCircle2,
              color: "text-blue-500",
              bg: "bg-blue-50",
            },
            {
              label: "Recovery Rate",
              value: `${summary.recoveryRate}%`,
              icon: BarChart3,
              color: "text-amber-500",
              bg: "bg-amber-50",
            },
            {
              label: "Past Due",
              value: summary.pastDue,
              icon: XCircle,
              color: "text-red-500",
              bg: "bg-red-50",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-slate-200 p-4"
            >
              <div
                className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}
              >
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div className="text-xl font-bold text-slate-900">{stat.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Status filters */}
      <div className="flex items-center gap-2 mb-4">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
              filter === f.value
                ? "bg-[#0B1426] text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm mb-4">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
        </div>
      )}

      {!loading && transactions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-xl border border-slate-200">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <BarChart3 className="w-7 h-7 text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">No transactions yet</h3>
          <p className="text-sm text-slate-500 max-w-sm">
            Transactions appear here once customers complete checkout and cards are charged.
          </p>
        </div>
      )}

      {!loading && transactions.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Customer", "Plan", "Amount", "Status", "Order Reference", "Date"].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-medium text-slate-500 px-4 py-3"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="text-sm text-slate-900 truncate max-w-[160px]">
                      {tx.customerEmail}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="text-sm text-slate-700">{tx.planName}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="text-sm font-semibold text-slate-900">
                      {formatNaira(tx.amount)}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <StatusIcon status={tx.status} />
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyle(tx.status)}`}
                      >
                        {tx.status}
                      </span>
                    </div>
                    {tx.message && (
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[120px]">
                        {tx.message}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <code className="text-[10px] font-mono text-slate-400 truncate block max-w-[140px]">
                      {tx.orderReference}
                    </code>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-500">
                    {formatDate(tx.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
              {filter ? ` with status "${filter}"` : ""}
            </p>
            {summary?.totalFailed > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-amber-600">
                <ArrowUpRight className="w-3 h-3" />
                {summary.totalFailed} failed — dunning engine is recovering these
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
