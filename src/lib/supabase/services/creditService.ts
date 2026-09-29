import { SupabaseClient } from "@supabase/supabase-js";
import {
  Database,
  CreditRow,
  CreditTransactionRow,
  TransactionType,
} from "@/types/database.types";
import { resolveClient, checkConfigured, ServiceResult } from "./utils";
import { CREDIT_RULES } from "@/constants/config";

export interface WalletSummary {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  transactionsCount: number;
}

export interface CreditMutationResult {
  success: boolean;
  transactionId: string;
  balance: number;
  amount: number;
}

export const creditService = {
  /**
   * Retrieves current credit balance for a user.
   * Auto-initializes with welcome credits if record is missing.
   */
  async getUserCreditBalance(
    userId: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<CreditRow>> {
    if (!checkConfigured()) {
      return {
        data: {
          id: `local-credit-${userId}`,
          user_id: userId,
          balance: CREDIT_RULES.welcomeBonus,
          updated_at: new Date().toISOString(),
        },
        error: null,
      };
    }

    try {
      const sb = resolveClient(client);
      const { data, error } = await sb
        .from("credits")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        return { data: null, error: error.message };
      }

      if (!data) {
        // Auto-initialize missing credit row with welcome bonus
        return this.initializeUserCredits(userId, client);
      }

      return { data, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : "Failed to load credit balance.",
      };
    }
  },

  /**
   * Initializes starter credits and logs the welcome bonus transaction.
   */
  async initializeUserCredits(
    userId: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<CreditRow>> {
    if (!checkConfigured()) {
      return {
        data: {
          id: `local-credit-${userId}`,
          user_id: userId,
          balance: CREDIT_RULES.welcomeBonus,
          updated_at: new Date().toISOString(),
        },
        error: null,
      };
    }

    try {
      const res = await this.executeCreditTransaction(
        userId,
        CREDIT_RULES.welcomeBonus,
        "welcome_bonus",
        "Welcome to SkillSwap! Free starter credits to begin learning.",
        undefined,
        client
      );

      if (res.error) {
        // Fallback: query if already created by signup trigger
        const sb = resolveClient(client);
        const { data: existing } = await sb
          .from("credits")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (existing) {
          return { data: existing, error: null };
        }
        return { data: null, error: res.error };
      }

      return {
        data: {
          id: res.data?.transactionId || `credit-${userId}`,
          user_id: userId,
          balance: res.data?.balance ?? CREDIT_RULES.welcomeBonus,
          updated_at: new Date().toISOString(),
        },
        error: null,
      };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : "Failed to initialize credits.",
      };
    }
  },

  /**
   * Fetches full transaction history for a user, sorted newest first.
   */
  async getUserTransactions(
    userId: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<CreditTransactionRow[]>> {
    if (!checkConfigured()) {
      return {
        data: [
          {
            id: `tx-welcome-${userId}`,
            user_id: userId,
            amount: CREDIT_RULES.welcomeBonus,
            transaction_type: "welcome_bonus",
            description: "Welcome to SkillSwap! Free starter credits to begin learning.",
            reference_id: null,
            created_at: new Date().toISOString(),
          },
        ],
        error: null,
      };
    }

    try {
      const sb = resolveClient(client);
      const { data, error } = await sb
        .from("credit_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : "Failed to load transaction history.",
      };
    }
  },

  /**
   * Executes an atomic credit mutation using the secure process_credit_transaction RPC function.
   * Guarantees negative balance prevention and duplicate reference prevention.
   */
  async executeCreditTransaction(
    userId: string,
    amount: number,
    transactionType: TransactionType,
    description: string,
    referenceId?: string | null,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<CreditMutationResult>> {
    if (!userId) {
      return { data: null, error: "User ID is required." };
    }

    if (amount === 0) {
      return { data: null, error: "Transaction amount cannot be zero." };
    }

    if (!checkConfigured()) {
      return {
        data: {
          success: true,
          transactionId: `local-tx-${Date.now()}`,
          balance: CREDIT_RULES.welcomeBonus + amount,
          amount,
        },
        error: null,
      };
    }

    try {
      const sb = resolveClient(client);

      // Invoke atomic Postgres RPC function
      const { data, error } = await sb.rpc("process_credit_transaction", {
        p_user_id: userId,
        p_amount: amount,
        p_transaction_type: transactionType,
        p_description: description,
        p_reference_id: referenceId || null,
      });

      if (error) {
        return { data: null, error: error.message };
      }

      interface RpcResponse {
        success: boolean;
        transaction_id: string;
        balance: number;
        amount: number;
      }

      const rpcResult = data as unknown as RpcResponse;

      return {
        data: {
          success: rpcResult.success,
          transactionId: rpcResult.transaction_id,
          balance: rpcResult.balance,
          amount: rpcResult.amount,
        },
        error: null,
      };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : "Credit transaction failed.",
      };
    }
  },

  /**
   * Rewards a mentor/teacher for completing a swap session.
   */
  async rewardTeacherForSession(
    teacherId: string,
    sessionId: string,
    topicName: string,
    amount: number = CREDIT_RULES.teachRewardPerSession,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<CreditMutationResult>> {
    return this.executeCreditTransaction(
      teacherId,
      amount,
      "teach_reward",
      `Completed teaching session: ${topicName}`,
      sessionId,
      client
    );
  },

  /**
   * Deducts credits from a learner for booking/attending a swap session.
   */
  async chargeLearnerForSession(
    learnerId: string,
    sessionId: string,
    topicName: string,
    amount: number = CREDIT_RULES.learnCostPerSession,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<CreditMutationResult>> {
    return this.executeCreditTransaction(
      learnerId,
      -Math.abs(amount),
      "learn_spend",
      `Booked learning session: ${topicName}`,
      sessionId,
      client
    );
  },

  /**
   * Computes a full wallet overview (current balance, total earned, total spent).
   */
  async getWalletSummary(
    userId: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<WalletSummary>> {
    try {
      const [balanceRes, txRes] = await Promise.all([
        this.getUserCreditBalance(userId, client),
        this.getUserTransactions(userId, client),
      ]);

      if (balanceRes.error) {
        return { data: null, error: balanceRes.error };
      }

      const balance = balanceRes.data?.balance ?? 0;
      const transactions = txRes.data || [];

      let totalEarned = 0;
      let totalSpent = 0;

      transactions.forEach((tx) => {
        if (tx.amount > 0) {
          totalEarned += tx.amount;
        } else {
          totalSpent += Math.abs(tx.amount);
        }
      });

      return {
        data: {
          balance,
          totalEarned,
          totalSpent,
          transactionsCount: transactions.length,
        },
        error: null,
      };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : "Failed to load wallet summary.",
      };
    }
  },
};
