"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { creditService } from "@/lib/supabase/services";
import { CREDIT_RULES } from "@/constants/config";
import { Coins, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreditBalanceProps {
  balance?: number;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "chip" | "badge" | "card" | "plain";
  showLabel?: boolean;
  showEquivalent?: boolean;
  asLink?: boolean;
  className?: string;
}

export function CreditBalance({
  balance: passedBalance,
  size = "md",
  variant = "chip",
  showLabel = true,
  showEquivalent = false,
  asLink = false,
  className,
}: CreditBalanceProps) {
  const { user } = useAuth();
  const [fetchedBalance, setFetchedBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(passedBalance === undefined);

  useEffect(() => {
    if (passedBalance !== undefined) return;

    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    async function loadBalance() {
      try {
        const res = await creditService.getUserCreditBalance(user!.id);
        if (isMounted && res.data) {
          setFetchedBalance(res.data.balance);
        }
      } catch {
        if (isMounted) setFetchedBalance(CREDIT_RULES.welcomeBonus);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadBalance();

    return () => {
      isMounted = false;
    };
  }, [user, passedBalance]);

  const displayVal =
    passedBalance !== undefined
      ? passedBalance
      : fetchedBalance ?? CREDIT_RULES.welcomeBonus;
  const learningMinutes = displayVal * CREDIT_RULES.sessionDurationMinutes;

  const content = (
    <div
      className={cn(
        "inline-flex items-center select-none font-bold transition-all",
        variant === "chip" && [
          "px-3 py-1 rounded-full border border-indigo-200/80 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100/80 hover:border-indigo-300 shadow-2xs",
          size === "sm" && "text-xs px-2.5 py-0.5 gap-1.5",
          size === "md" && "text-xs px-3 py-1 gap-2",
          size === "lg" && "text-sm px-4 py-1.5 gap-2.5",
        ],
        variant === "badge" && [
          "px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-xs gap-1",
        ],
        variant === "plain" && [
          "gap-1.5 text-indigo-600",
          size === "sm" && "text-xs",
          size === "md" && "text-sm",
          size === "lg" && "text-base",
          size === "xl" && "text-3xl font-black text-slate-900",
        ],
        variant === "card" && [
          "p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col items-start gap-1 w-full",
        ],
        className
      )}
    >
      <div className="flex items-center gap-1.5">
        <Coins
          className={cn(
            "text-amber-500 fill-amber-400 shrink-0",
            size === "sm" && "h-3.5 w-3.5",
            size === "md" && "h-4 w-4",
            size === "lg" && "h-5 w-5",
            size === "xl" && "h-7 w-7 text-amber-500 fill-amber-400"
          )}
        />
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
        ) : (
          <span className="tabular-nums font-black">{displayVal}</span>
        )}
        {showLabel && (
          <span className="text-slate-500 font-semibold font-sans">
            {displayVal === 1 ? "Credit" : "Credits"}
          </span>
        )}
      </div>

      {showEquivalent && !isLoading && (
        <span className="text-[11px] font-medium text-slate-400 block mt-0.5">
          ≈ {learningMinutes} mins of learning time
        </span>
      )}
    </div>
  );

  if (asLink) {
    return (
      <Link href="/dashboard/credits" title="View Wallet & Transactions">
        {content}
      </Link>
    );
  }

  return content;
}
