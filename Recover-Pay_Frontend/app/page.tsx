"use client";

import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import {
  ArrowRight,
  Zap,
  RefreshCw,
  Bell,
  Shield,
  BarChart3,
  CheckCircle2,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0B1426] text-white">
      {/* ─── Navbar ─────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
            <RefreshCw className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">RecoverPay</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm text-slate-300">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </div>

        <div className="flex items-center gap-3">
          <SignedOut>
            <Link
              href="/sign-in"
              className="text-sm text-slate-300 hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="text-sm bg-amber-500 hover:bg-amber-400 text-white font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Get started
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="text-sm bg-amber-500 hover:bg-amber-400 text-white font-medium px-4 py-2 rounded-lg transition-colors mr-2"
            >
              Dashboard
            </Link>
            <UserButton />
          </SignedIn>
        </div>
      </nav>

      {/* ─── Hero ───────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium px-3 py-1.5 rounded-full mb-8">
          <Zap className="w-3 h-3" />
          Built for Nigerian businesses on Nomba
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-none text-balance max-w-4xl mx-auto">
          Every failed payment is{" "}
          <span className="text-amber-400">a second chance.</span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-slate-300 max-w-2xl mx-auto text-balance leading-relaxed">
          RecoverPay automatically retries failed card charges, falls back to
          bank transfer, and notifies your customers — so you stop losing
          revenue to technical failures.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/sign-up"
            className="group flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-semibold px-6 py-3.5 rounded-xl transition-all"
          >
            Start building free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#how-it-works"
            className="flex items-center gap-2 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 px-6 py-3.5 rounded-xl transition-all text-sm font-medium"
          >
            See how it works
          </a>
        </div>

        {/* Stats strip */}
        <div className="mt-20 grid grid-cols-3 gap-8 max-w-2xl mx-auto border-t border-slate-800 pt-10">
          {[
            { label: "Recovery rate", value: "73%" },
            { label: "Avg retry attempts", value: "3×" },
            { label: "Notification channels", value: "3" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl font-extrabold text-amber-400">{stat.value}</div>
              <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Recovery Flow Visual ────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 py-10">
        <div className="bg-[#0F1E35] rounded-2xl border border-slate-800 p-8">
          <p className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-6">
            Live recovery flow
          </p>
          <div className="space-y-3">
            {[
              { icon: "💳", label: "Card charged", status: "failed", color: "text-red-400" },
              { icon: "🔄", label: "Retry attempt 1 — 24 hours", status: "failed", color: "text-red-400" },
              { icon: "🔄", label: "Retry attempt 2 — 72 hours", status: "failed", color: "text-red-400" },
              { icon: "🏦", label: "Virtual account generated", status: "created", color: "text-amber-400" },
              { icon: "📱", label: "Customer notified via WhatsApp + SMS", status: "sent", color: "text-blue-400" },
              { icon: "✅", label: "Bank transfer received — subscription restored", status: "active", color: "text-emerald-400" },
            ].map((step, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-3 rounded-lg bg-[#0B1426]/60"
              >
                <span className="text-lg">{step.icon}</span>
                <span className="text-sm text-slate-300 flex-1">{step.label}</span>
                <span className={`text-xs font-mono font-medium ${step.color}`}>
                  {step.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────────────── */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24">
        <p className="text-center text-xs text-slate-500 font-mono uppercase tracking-wider mb-4">
          What you get
        </p>
        <h2 className="text-center text-3xl md:text-4xl font-bold mb-16">
          Everything your billing needs
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: RefreshCw,
              title: "Smart dunning engine",
              desc: "Card fails? We retry at 24h, 72h, and 7 days. Each attempt is logged and auditable.",
            },
            {
              icon: Bell,
              title: "Multi-channel notifications",
              desc: "Customers get notified via WhatsApp, SMS, and email at each recovery step.",
            },
            {
              icon: BarChart3,
              title: "Virtual account fallback",
              desc: "After card exhaustion, a unique Nomba virtual account is generated so customers can pay by bank transfer.",
            },
            {
              icon: Shield,
              title: "Webhook security",
              desc: "Every Nomba event is verified with HMAC-SHA256 before processing. Duplicate events are silently ignored.",
            },
            {
              icon: Zap,
              title: "API-first design",
              desc: "Integrate with a single API key. Full OpenAPI docs included. Works with any stack.",
            },
            {
              icon: CheckCircle2,
              title: "Multi-tenant",
              desc: "Every business gets isolated plans, subscriptions, and customer data. Nothing bleeds between tenants.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-[#0F1E35] border border-slate-800 rounded-xl p-6 hover:border-amber-500/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How It Works ────────────────────────────────────────── */}
      <section id="how-it-works" className="max-w-4xl mx-auto px-6 py-16">
        <p className="text-center text-xs text-slate-500 font-mono uppercase tracking-wider mb-4">
          Integration
        </p>
        <h2 className="text-center text-3xl font-bold mb-12">
          Two steps to get started
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-[#0F1E35] border border-slate-800 rounded-xl p-6">
            <div className="text-amber-400 text-sm font-mono font-medium mb-3">Step 1 — Create a plan</div>
            <pre className="text-xs text-slate-300 bg-[#0B1426] rounded-lg p-4 overflow-x-auto">
              <code>{`curl -X POST https://api.recoverpay.io/v1/plans \\
  -H "Authorization: Bearer rp_sk_..." \\
  -d '{
    "name": "Pro Monthly",
    "amount": 5000,
    "interval": "monthly"
  }'`}</code>
            </pre>
          </div>

          <div className="bg-[#0F1E35] border border-slate-800 rounded-xl p-6">
            <div className="text-amber-400 text-sm font-mono font-medium mb-3">Step 2 — Start a subscription</div>
            <pre className="text-xs text-slate-300 bg-[#0B1426] rounded-lg p-4 overflow-x-auto">
              <code>{`curl -X POST https://api.recoverpay.io/v1/checkout/start \\
  -H "Authorization: Bearer rp_sk_..." \\
  -d '{
    "customerEmail": "customer@co.ng",
    "planId": "plan_xxx"
  }'`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="bg-amber-500 rounded-2xl p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#0B1426] mb-4">
            Stop losing revenue to failed payments.
          </h2>
          <p className="text-[#0B1426]/70 mb-8 max-w-xl mx-auto">
            Set up in minutes. Recover payments automatically. Built for Nigerian
            businesses on Nomba.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 bg-[#0B1426] text-white font-semibold px-8 py-4 rounded-xl hover:bg-navy-800 transition-colors"
          >
            Create free account
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800 px-6 py-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-amber-500 flex items-center justify-center">
              <RefreshCw className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-sm">RecoverPay</span>
          </div>
          <p className="text-slate-500 text-sm">
            Built for the Nomba × DevCareer Hackathon 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
