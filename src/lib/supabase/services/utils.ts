import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";
import { createClient } from "../client";
import { isSupabaseConfigured } from "../config";

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Resolves the Supabase client to use.
 * Defaults to the browser client if none is provided.
 */
export function resolveClient(client?: SupabaseClient<Database>): SupabaseClient<Database> {
  if (client) return client;
  return createClient();
}

/**
 * Checks whether Supabase queries can safely execute.
 */
export function checkConfigured(): boolean {
  return isSupabaseConfigured();
}
