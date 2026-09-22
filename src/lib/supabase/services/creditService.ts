import { SupabaseClient } from "@supabase/supabase-js";
import { Database, CreditRow } from "@/types/database.types";
import { resolveClient, checkConfigured, ServiceResult } from "./utils";

export const creditService = {
  /**
   * Retrieves credit balance for a user.
   */
  async getUserCreditBalance(
    userId: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<CreditRow>> {
    if (!checkConfigured()) {
      return { data: null, error: "Supabase is not configured." };
    }

    const sb = resolveClient(client);
    const { data, error } = await sb
      .from("credits")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  },
};
