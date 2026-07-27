import { demoRepository } from "./demo/repository";

/**
 * Data access entry point.
 * Prefer MySQL when USE_MYSQL=true and DATABASE_URL is set.
 * MySQL/Prisma is loaded lazily so missing DB env cannot crash every page import.
 */
export function getRepository() {
  const useMysql =
    process.env.USE_MYSQL === "true" && Boolean(process.env.DATABASE_URL?.trim());

  if (useMysql) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { mysqlRepository } = require("./mysql/repository") as typeof import("./mysql/repository");
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
