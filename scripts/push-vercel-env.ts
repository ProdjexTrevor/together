/**
 * Push required env vars from local .env to Vercel (production + preview).
 * Usage: pnpm exec tsx scripts/push-vercel-env.ts
 */
import "dotenv/config";
import { spawnSync } from "child_process";

const REQUIRED = [
  "USE_MYSQL",
  "DATABASE_URL",
  "MYSQL_HOST",
  "MYSQL_PORT",
  "MYSQL_USER",
  "MYSQL_PASSWORD",
  "MYSQL_DATABASE",
  "ENCRYPTION_KEY",
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "VAPID_SUBJECT",
  "CRON_SECRET",
] as const;

const SENSITIVE = new Set([
  "DATABASE_URL",
  "MYSQL_PASSWORD",
  "ENCRYPTION_KEY",
  "VAPID_PRIVATE_KEY",
  "CRON_SECRET",
]);

const targets = ["production", "preview"] as const;

function addEnv(name: string, value: string, target: string) {
  const args = ["vercel", "env", "add", name, target, "--force"];
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
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name} in local .env — aborting.`);
    process.exit(1);
  }
  for (const target of targets) {
    addEnv(name, value, target);
  }
}

console.log("Done. Redeploy for changes to take effect.");
