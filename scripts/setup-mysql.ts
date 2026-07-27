import "dotenv/config";
import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";

async function main() {
  const host = process.env.MYSQL_HOST;
  const port = Number(process.env.MYSQL_PORT || 3306);
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE;

  if (!host || !user || !password || !database) {
    throw new Error("Missing MYSQL_* env vars");
  }

  console.log(`Connecting to ${user}@${host}:${port}/${database} ...`);
  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    multipleStatements: true,
  });

  const [ping] = await conn.query("SELECT 1 AS ok, DATABASE() AS db");
  console.log("Connected:", ping);

  const sqlPath = path.join(process.cwd(), "prisma", "create-together-tables.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  await conn.query(sql);

  const [tables] = await conn.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = ? AND table_name IN (
       'profiles','households','household_members','items','financial_details','comments'
     )
     ORDER BY table_name`,
    [database]
  );
  console.log("Together tables ready:", tables);

  await conn.end();
  console.log("Done.");
}

main().catch((err) => {
  console.error("DB setup failed:", err.message);
  process.exit(1);
});
