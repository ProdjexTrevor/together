import { demoRepository } from "./demo/repository";
import { usePrismaDatabase } from "@/lib/db-mode";

/**
 * Data access entry point.
 * Prefer Prisma (Supabase Postgres or MySQL) when configured.
 * Prisma is loaded lazily so missing DB env cannot crash every page import.
 */
export function getRepository() {
  if (usePrismaDatabase()) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { mysqlRepository } = require("./mysql/repository") as typeof import("./mysql/repository");
    return mysqlRepository;
  }

  return demoRepository;
}

export type Repository = ReturnType<typeof getRepository>;
