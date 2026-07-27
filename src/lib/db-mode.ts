/** True when Prisma should talk to a real database (MySQL or Supabase Postgres). */
export function usePrismaDatabase(): boolean {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return false;
  return (
    process.env.USE_SUPABASE === "true" || process.env.USE_MYSQL === "true"
  );
}
