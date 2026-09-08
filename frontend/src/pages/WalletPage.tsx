import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useWallet, useWalletTransactions } from '@/hooks/useWallet';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Info,
  Gift,
  GraduationCap,
  BookOpen,
} from 'lucide-react';
import type { CreditTransactionType } from '@/types/api';

export const WalletPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '0', 10);
  const size = 10;
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const { data: wallet, isLoading: walletLoading, isError: walletError, error: walletErr, refetch: refetchWallet } = useWallet();
  const { data: transactionsData, isLoading: txLoading, isError: txError, error: txErr, refetch: refetchTx } = useWalletTransactions({
    page,
    size,
  });

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(newPage));
      return next;
    });
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const filteredTransactions = transactionsData?.items.filter((tx) => {
    if (typeFilter === 'ALL') return true;
    return tx.type === typeFilter;
  });

  const getTypeBadge = (type: CreditTransactionType) => {
    switch (type) {
      case 'INITIAL_CREDIT':
        return (
          <Badge variant="info" className="text-[10px] gap-1">
            <Gift className="w-3 h-3 text-[#38BDF8]" />
            Welcome Bonus
          </Badge>
        );
      case 'SESSION_EARNING':
        return (
          <Badge variant="success" className="text-[10px] gap-1">
            <BookOpen className="w-3 h-3 text-[#10B981]" />
            Teaching Reward
          </Badge>
        );
      case 'SESSION_SPENDING':
        return (
          <Badge variant="warning" className="text-[10px] gap-1">
            <GraduationCap className="w-3 h-3 text-[#F59E0B]" />
            Learning Fee
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="gap-1 text-[10px]">
              <Coins className="w-3.5 h-3.5 text-[#10B981]" />
              Skill Economy
            </Badge>
            <span className="text-xs text-[#94A3B8]">• Credit Wallet</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8F5ED] mt-1.5 font-display">
            Credit Wallet & Transactions
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-0.5">
            Manage your peer knowledge balance, earn credits by teaching, and spend credits to learn new skills.
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {(walletError || txError) && (
        <Alert variant="destructive" className="text-xs">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{walletErr?.message || txErr?.message || 'Unable to load wallet information.'}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchWallet();
                refetchTx();
              }}
              className="h-7 text-xs border-red-500/40 text-red-400"
            >
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Top Section: Balance Card & How It Works */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <div className="md:col-span-2 p-6 sm:p-8 rounded-2xl bg-[#111827] border border-[rgba(212,175,106,0.30)] shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -right-8 -bottom-8 w-60 h-60 bg-emerald-500/[0.04] rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#10B981] flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-[#10B981]" />
                Available Balance
              </span>
              <Badge variant="default" className="text-[11px]">
                100% Peer-to-Peer
              </Badge>
            </div>

            <div className="flex items-baseline gap-3">
              {walletLoading ? (
                <div className="h-14 w-32 bg-[#1E293B] animate-pulse rounded-xl" />
              ) : (
                <span className="text-4xl sm:text-6xl font-black tracking-tight text-[#F8F5ED]">
                  {wallet?.balance ?? 0}
                </span>
              )}
              <span className="text-sm sm:text-base font-semibold text-[#CBD5E1]">Skill Credits</span>
            </div>

            <p className="text-xs text-[#94A3B8] max-w-md">
              Each credit grants you 1 hour of direct peer tutoring with another student.
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-800 flex flex-wrap items-center gap-3">
            <Link to="/discover">
              <Button variant="default" size="sm" className="text-xs gap-1.5 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                Find Skills to Learn
              </Button>
            </Link>
            <Link to="/requests">
              <Button variant="secondary" size="sm" className="text-xs gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#10B981]" />
                View Teaching Requests
              </Button>
            </Link>
          </div>
        </div>

        {/* How Credits Work Card */}
        <Card className="glass-card flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#1E293B] border border-slate-700/60 text-[#D4AF6A]">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-[#F8F5ED]">How Credits Work</CardTitle>
                <CardDescription className="text-[11px] text-[#94A3B8]">Fair Knowledge Bartering</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-[#94A3B8]">
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                1
              </div>
              <p>Teach a student for 1 hour to earn 1 credit.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-[#38BDF8]/15 text-[#38BDF8] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                2
              </div>
              <p>Spend 1 credit to book a session with a peer teacher.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-[#D4AF6A]/15 text-[#D4AF6A] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                3
              </div>
              <p>Escrow protects credits until session completion.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#F8F5ED] font-display">Transaction Ledger</h2>
            <p className="text-xs text-[#94A3B8]">Audit trail of all credit earnings, spendings, and escrows</p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#111827] border border-slate-800 self-start">
            {['ALL', 'SESSION_EARNING', 'SESSION_SPENDING', 'INITIAL_CREDIT'].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  typeFilter === t
                    ? 'bg-[#1E293B] text-[#F8F5ED] font-semibold border border-slate-700/60'
                    : 'text-[#94A3B8] hover:text-[#F8F5ED]'
                }`}
              >
                {t === 'ALL' ? 'All' : t === 'SESSION_EARNING' ? 'Earnings' : t === 'SESSION_SPENDING' ? 'Spendings' : 'Bonus'}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions List */}
        <div className="rounded-2xl bg-[#111827] border border-[rgba(212,175,106,0.18)] shadow-lg overflow-hidden divide-y divide-slate-800/60">
          {txLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#1E293B]" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 bg-[#1E293B] rounded w-32" />
                      <div className="h-2.5 bg-[#1E293B]/60 rounded w-24" />
                    </div>
                  </div>
                  <div className="h-5 bg-[#1E293B] rounded w-16" />
                </div>
              ))}
            </div>
          ) : filteredTransactions && filteredTransactions.length > 0 ? (
            filteredTransactions.map((tx) => {
              const isPositive = tx.direction === 'CREDIT' || (tx.direction !== 'DEBIT' && tx.type !== 'SESSION_SPENDING' && tx.amount > 0);
              const displayAmount = Math.abs(tx.amount);
              return (
                <div
                  key={tx.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#1E293B]/40 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div
                      className={`p-2.5 rounded-xl border shrink-0 ${
                        isPositive
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-[#10B981]'
                          : 'bg-red-500/10 border-red-500/20 text-red-400'
                      }`}
                    >
                      {isPositive ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs sm:text-sm font-semibold text-[#F8F5ED] truncate">{tx.description}</p>
                        {getTypeBadge(tx.type)}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#94A3B8]">
                        <Clock className="w-3 h-3 text-[#64748B]" />
                        <span>{formatDate(tx.createdAt)}</span>
                        {tx.referenceType && (
                          <span className="text-[#64748B]">
                            • Ref: {tx.referenceType.toLowerCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pl-12 sm:pl-0">
                    <span
                      className={`text-sm sm:text-base font-bold ${
                        isPositive ? 'text-[#10B981]' : 'text-red-400'
                      }`}
                    >
                      {isPositive ? `+${displayAmount}` : `-${displayAmount}`} Credits
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-10 text-center text-xs text-[#94A3B8] space-y-2">
              <Coins className="w-8 h-8 mx-auto text-[#64748B]" />
              <p className="font-semibold text-[#F8F5ED]">No credit transactions yet</p>
              <p className="text-[11px] text-[#94A3B8]">Complete teaching or learning sessions to build your ledger.</p>
            </div>
          )}
        </div>

        {/* Pagination controls */}
        {transactionsData && transactionsData.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-[#94A3B8]">
              Page {transactionsData.page + 1} of {transactionsData.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={transactionsData.page === 0}
                onClick={() => handlePageChange(transactionsData.page - 1)}
                className="h-8 text-xs gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={transactionsData.page >= transactionsData.totalPages - 1}
                onClick={() => handlePageChange(transactionsData.page + 1)}
                className="h-8 text-xs gap-1"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
