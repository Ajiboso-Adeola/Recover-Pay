import { SignUp } from "@clerk/nextjs";
import { RefreshCw } from "lucide-react";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#0B1426] flex flex-col items-center justify-center px-4">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
          <RefreshCw className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-white text-lg">RecoverPay</span>
      </Link>
      <SignUp
        appearance={{
          elements: {
            rootBox: "w-full max-w-md",
            card: "bg-[#0F1E35] border border-slate-700 shadow-2xl rounded-2xl",
            headerTitle: "text-white font-bold",
            headerSubtitle: "text-slate-400",
            formButtonPrimary: "bg-amber-500 hover:bg-amber-400 text-white font-semibold transition-colors",
            formFieldInput: "bg-[#0B1426] border-slate-700 text-white placeholder-slate-500 focus:border-amber-500",
            formFieldLabel: "text-slate-300",
            footerActionLink: "text-amber-400 hover:text-amber-300",
          },
        }}
      />
    </div>
  );
}
