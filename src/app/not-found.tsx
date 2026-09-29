import Link from "next/link";
import { LayoutDashboard, Compass, ArrowLeft, HelpCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/buttonVariants";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Visual Icon */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm shadow-indigo-600/10">
          <HelpCircle className="w-10 h-10 stroke-[1.75]" />
        </div>

        {/* 404 Badge & Heading */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
            Error 404
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Page Not Found
          </h1>
          <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            The page you are looking for doesn&apos;t exist, may have been moved, or is temporarily unavailable.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/dashboard"
            className={buttonVariants({
              variant: "primary",
              className: "w-full sm:w-auto font-bold shadow-md shadow-indigo-600/15",
            })}
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Go to Dashboard
          </Link>

          <Link
            href="/dashboard/discover"
            className={buttonVariants({
              variant: "outline",
              className: "w-full sm:w-auto font-semibold",
            })}
          >
            <Compass className="w-4 h-4 mr-2" />
            Discover Skills
          </Link>
        </div>

        {/* Back link */}
        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
