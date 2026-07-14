import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNaira(amount: string | number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(Number(amount));
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function maskApiKey(key: string): string {
  if (!key) return "";
  const prefix = key.substring(0, 10);
  return `${prefix}${"•".repeat(20)}${key.slice(-4)}`;
}

export function intervalLabel(interval: string): string {
  const map: Record<string, string> = {
    monthly: "Monthly",
    annual: "Annual",
    custom: "Custom",
  };
  return map[interval] || interval;
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    trialing: "bg-blue-100 text-blue-700",
    past_due: "bg-amber-100 text-amber-700",
    paused: "bg-slate-100 text-slate-600",
    cancelled: "bg-red-100 text-red-600",
    created: "bg-slate-100 text-slate-600",
  };
  return map[status] || "bg-slate-100 text-slate-600";
}
