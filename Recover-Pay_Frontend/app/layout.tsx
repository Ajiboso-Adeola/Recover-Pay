import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "RecoverPay — Recover Every Failed Payment",
  description:
    "Managed subscriptions engine with intelligent payment recovery for Nigerian businesses. Built on Nomba.",
  keywords: "payment recovery, subscriptions, billing, Nigeria, Nomba, fintech",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
