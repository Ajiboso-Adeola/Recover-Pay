"use client";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import {
  ArrowRight,
  RefreshCw,
  Zap,
  Shield,
  Bell,
  BarChart3,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0B1426] text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
            <RefreshCw className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg">RecoverPay</span>
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

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium px-3 py-1.5 rounded-full mb-8">
          <Zap className="w-3 h-3" />
          Built for Nigerian businesses on Nomba
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-none max-w-4xl mx-auto">
          Every failed payment is{" "}
          <span className="text-amber-400">a second chance.</span>
        </h1>
        <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          RecoverPay automatically retries failed card charges, falls back to
          bank transfer, and notifies your customers — so you stop losing
          revenue to failed payments.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/sign-up"
            className="group flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-semibold px-6 py-3.5 rounded-xl transition-all"
          >
            Start building free{" "}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/sign-in"
            className="text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 px-6 py-3.5 rounded-xl transition-all text-sm font-medium"
          >
            Sign in to dashboard
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: RefreshCw,
              title: "Smart dunning",
              desc: "Retries at 24h, 72h, 7 days",
            },
            {
              icon: Bell,
              title: "Notifications",
              desc: "WhatsApp, SMS, and email",
            },
            {
              icon: Shield,
              title: "VA fallback",
              desc: "Bank transfer when card fails",
            },
            {
              icon: BarChart3,
              title: "Your Nomba wallet",
              desc: "Payments go to your account",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-[#0F1E35] border border-slate-800 rounded-xl p-5 hover:border-amber-500/30 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3">
                <f.icon className="w-4 h-4 text-amber-400" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
              <p className="text-xs text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-amber-500 rounded-2xl p-10 text-center">
          <h2 className="text-3xl font-extrabold text-[#0B1426] mb-3">
            Stop losing revenue to failed payments.
          </h2>
          <p className="text-[#0B1426]/70 mb-6 max-w-lg mx-auto text-sm">
            Connect your Nomba account, create plans, and start recovering
            payments automatically.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 bg-[#0B1426] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#1A2E4A] transition-colors"
          >
            Create free account <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-6 py-6 max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-amber-500 flex items-center justify-center">
            <RefreshCw className="w-3 h-3 text-white" />
          </div>
          <span className="font-semibold text-sm">RecoverPay</span>
        </div>
        <p className="text-slate-500 text-xs">
          Built for Nomba × DevCareer Hackathon 2026
        </p>
      </footer>
    </div>
  );
}
