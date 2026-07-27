import { demoRepository } from "./demo/repository";

/**
 * Data access entry point.
 * Uses the demo adapter when Supabase env vars are missing.
 * Swap to a Supabase-backed repository once credentials are configured.
 */
export function getRepository() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const useSupabase = Boolean(url && key && process.env.USE_SUPABASE === "true");

  if (useSupabase) {
    // Real Supabase repository can be enabled after migrations + env setup.
    // Until then, keep demo as the reliable local/Vercel path.
    return demoRepository;
  }

  return demoRepository;
}

export type Repository = typeof demoRepository;
