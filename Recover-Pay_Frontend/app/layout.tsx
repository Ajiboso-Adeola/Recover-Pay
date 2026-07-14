import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./global.css";

export const metadata: Metadata = {
  title: "RecoverPay — Recover Every Failed Payment",
  description: "Managed subscriptions engine with intelligent payment recovery for Nigerian businesses, built on Nomba.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
