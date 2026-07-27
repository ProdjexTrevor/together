import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const info: Record<string, unknown> = {
    useMysql: process.env.USE_MYSQL === "true",
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    databaseUrlLength: process.env.DATABASE_URL?.length ?? 0,
    hasEncryptionKey: Boolean(process.env.ENCRYPTION_KEY),
  };

  if (process.env.USE_MYSQL === "true" && process.env.DATABASE_URL) {
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
