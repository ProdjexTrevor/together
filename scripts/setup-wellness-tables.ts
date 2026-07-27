import "dotenv/config";
import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    multipleStatements: true,
  });

  const sql = fs.readFileSync(
    path.join(process.cwd(), "prisma", "create-wellness-tables.sql"),
    "utf8"
  );
  await conn.query(sql);
  console.log("Wellness check-in tables ready.");
  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
