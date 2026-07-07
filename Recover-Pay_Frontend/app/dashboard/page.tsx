import { auth } from "@clerk/nextjs/server";
import { BarChart3, CreditCard, Users, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";

async function getDashboardData(token: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${API_URL}/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const { getToken } = await auth();
  const token = await getToken();
  const data = token ? await getDashboardData(token) : null;

  const stats = [
    {
      label: "Total Plans",
      value: data?.stats?.totalPlans ?? 0,
      icon: CreditCard,
      color: "text-blue-500",
      bg: "bg-blue-50",
      href: "/dashboard/plans",
    },
    {
      label: "Active Subscriptions",
      value: data?.stats?.activeSubscriptions ?? 0,
      icon: Users,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
      href: "/dashboard/subscriptions",
    },
    {
      label: "Recovery Rate",
      value: "73%",
      icon: TrendingUp,
      color: "text-amber-500",
      bg: "bg-amber-50",
      href: "/dashboard/subscriptions",
    },
    {
      label: "API Status",
      value: "Active",
      icon: BarChart3,
      color: "text-purple-500",
      bg: "bg-purple-50",
      href: "/dashboard/settings",
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back{data?.name ? `, ${data.name.split(" ")[0]}` : ""} 👋
        </h1>
        <p className="text-slate-500 mt-1">
          Here's an overview of your RecoverPay account.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            <div className="text-sm text-slate-500 mt-0.5">{stat.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-1">Create a plan</h3>
          <p className="text-sm text-slate-500 mb-4">
            Set up monthly, annual, or custom billing plans for your customers.
          </p>
          <Link
            href="/dashboard/plans/new"
            className="inline-flex items-center gap-2 bg-[#0B1426] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#1A2E4A] transition-colors"
          >
            Create plan
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-1">Get your API key</h3>
          <p className="text-sm text-slate-500 mb-4">
            Copy your API key to start integrating RecoverPay into your product.
          </p>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-2 bg-amber-500 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-amber-400 transition-colors"
          >
            View API key
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Empty state prompt if no plans */}
      {data?.stats?.totalPlans === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h4 className="font-semibold text-amber-900">You haven't created any plans yet</h4>
            <p className="text-sm text-amber-700 mt-0.5">
              Plans define what you charge customers and how often. Create your first plan to start collecting subscriptions.
            </p>
            <Link
              href="/dashboard/plans/new"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:text-amber-900 mt-3 underline underline-offset-2"
            >
              Create your first plan →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
