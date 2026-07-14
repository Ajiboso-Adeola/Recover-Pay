"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, SignOutButton } from "@clerk/nextjs";
import {
  LayoutDashboard, CreditCard, Users, Settings,
  RefreshCw, BookOpen, Code2, LogOut, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/plans", icon: CreditCard, label: "Plans" },
  { href: "/dashboard/subscriptions", icon: Users, label: "Subscriptions" },
  { href: "/dashboard/transactions", icon: BarChart3, label: "Transactions" },
  { href: "/dashboard/docs", icon: Code2, label: "API Reference" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings & API" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#0F1E35] border-r border-slate-800 flex flex-col z-40">
      <div className="px-6 py-5 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
            <RefreshCw className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-sm block leading-none">RecoverPay</span>
            <span className="text-slate-500 text-[10px] font-mono">Dashboard</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map((item) => {
          const isActive = item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-3 mt-3 border-t border-slate-800">
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all"
          >
            <BookOpen className="w-4 h-4 flex-shrink-0" />
            <span>Swagger Docs</span>
            <span className="ml-auto text-[10px] text-slate-600 font-mono">↗</span>
          </a>
        </div>
      </nav>

      <div className="px-4 py-4 border-t border-slate-800 space-y-2">
        <div className="flex items-center gap-3 px-1">
          <UserButton appearance={{ elements: { avatarBox: "w-7 h-7" } }} />
          <p className="text-xs text-slate-400">My account</p>
        </div>
        <SignOutButton redirectUrl="/">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all">
            <LogOut className="w-4 h-4 flex-shrink-0" />
            Sign out
          </button>
        </SignOutButton>
      </div>
    </aside>
  );
}
