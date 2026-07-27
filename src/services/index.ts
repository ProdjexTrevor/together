import { demoRepository } from "./demo/repository";
import { mysqlRepository } from "./mysql/repository";

/**
 * Data access entry point.
 * Prefer MySQL when USE_MYSQL=true and DATABASE_URL is set.
 */
export function getRepository() {
  const useMysql =
    process.env.USE_MYSQL === "true" && Boolean(process.env.DATABASE_URL);

  if (useMysql) {
    return mysqlRepository;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const useSupabase = Boolean(url && key && process.env.USE_SUPABASE === "true");

  if (useSupabase) {
    return demoRepository;
  }

  return demoRepository;
}

export type Repository = ReturnType<typeof getRepository>;
