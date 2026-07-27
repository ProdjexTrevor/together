import { NextResponse } from "next/server";
import { usePrismaDatabase } from "@/lib/db-mode";

export const dynamic = "force-dynamic";

export async function GET() {
  const info: Record<string, unknown> = {
    useMysql: process.env.USE_MYSQL === "true",
    useSupabase: process.env.USE_SUPABASE === "true",
    usePrisma: usePrismaDatabase(),
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    databaseUrlLength: process.env.DATABASE_URL?.length ?? 0,
    hasEncryptionKey: Boolean(process.env.ENCRYPTION_KEY),
  };

  if (usePrismaDatabase()) {
    try {
      const { prisma } = await import("@/lib/prisma");
      await prisma.$queryRaw`SELECT 1`;
      const profiles = await prisma.profile.count();
      info.db = "ok";
      info.profiles = profiles;
    } catch (error) {
      info.db = "error";
      info.message =
        error instanceof Error ? error.message : "Unknown database error";
    }
  } else {
    info.db = "skipped";
  }

  return NextResponse.json(info);
}
