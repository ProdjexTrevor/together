/**
 * Push Supabase/runtime env vars from local .env to Vercel (production + preview).
 * Pipes exact bytes (no CRLF) so USE_* flags compare correctly at runtime.
 */
import "dotenv/config";
import { spawnSync } from "child_process";

const REQUIRED = [
  "USE_MYSQL",
  "USE_SUPABASE",
  "DATABASE_URL",
  "DIRECT_URL",
  "ENCRYPTION_KEY",
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "VAPID_SUBJECT",
  "CRON_SECRET",
  "BASECAMP_PASSCODE",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
] as const;

const SENSITIVE = new Set([
  "DATABASE_URL",
  "DIRECT_URL",
  "ENCRYPTION_KEY",
  "VAPID_PRIVATE_KEY",
  "CRON_SECRET",
  "BASECAMP_PASSCODE",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_PUBLISHABLE_KEY",
]);

const targets = ["production", "preview"] as const;

function addEnv(name: string, value: string, target: string) {
  spawnSync("npx", ["vercel", "env", "rm", name, target, "--yes"], {
    encoding: "utf8",
    shell: true,
  });
  const args = ["vercel", "env", "add", name, target];
  if (SENSITIVE.has(name)) args.push("--sensitive");
  const result = spawnSync("npx", args, {
    input: value,
    encoding: "utf8",
    shell: true,
  });
  if (result.status !== 0) {
    console.error(`Failed ${name} → ${target}`);
    console.error(result.stdout || "");
    console.error(result.stderr || "");
    process.exit(result.status ?? 1);
  }
  console.log(`Set ${name} (${target})`);
}

for (const name of REQUIRED) {
  const value = process.env[name]?.trim();
  if (value === undefined || value === "") {
    console.error(`Missing ${name} in local .env — aborting.`);
    process.exit(1);
  }
  for (const target of targets) {
    addEnv(name, value, target);
  }
}

console.log("Done. Redeploy for changes to take effect.");
