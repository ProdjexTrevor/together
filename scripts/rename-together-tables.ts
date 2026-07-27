import "dotenv/config";
import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";

const TABLES = [
  "profiles",
  "households",
  "household_members",
  "household_invitations",
  "items",
  "task_checklist_items",
  "decision_options",
  "decision_responses",
  "goal_details",
  "goal_milestones",
  "financial_details",
  "financial_contributions",
  "comments",
  "comment_reactions",
  "activity_events",
  "notifications",
  "notification_preferences",
] as const;

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    multipleStatements: true,
  });

  console.log("Connected to", process.env.MYSQL_DATABASE);

  // Rename unprefixed Together tables → together_*
  for (const table of TABLES) {
    const [oldExists] = await conn.query(
      `SELECT COUNT(*) AS c FROM information_schema.tables
       WHERE table_schema = ? AND table_name = ?`,
      [process.env.MYSQL_DATABASE, table]
    );
    const [newExists] = await conn.query(
      `SELECT COUNT(*) AS c FROM information_schema.tables
       WHERE table_schema = ? AND table_name = ?`,
      [process.env.MYSQL_DATABASE, `together_${table}`]
    );

    const hasOld = Number((oldExists as { c: number }[])[0].c) > 0;
    const hasNew = Number((newExists as { c: number }[])[0].c) > 0;

    if (hasOld && !hasNew) {
      await conn.query(`RENAME TABLE \`${table}\` TO \`together_${table}\``);
      console.log(`Renamed ${table} → together_${table}`);
    } else if (hasOld && hasNew) {
      console.log(`Both ${table} and together_${table} exist — keeping together_* and dropping old`);
      await conn.query(`DROP TABLE \`${table}\``);
    } else if (!hasOld && hasNew) {
      console.log(`together_${table} already exists`);
    } else {
      console.log(`Missing ${table} — will create from SQL`);
    }
  }

  // Create any missing together_* tables
  const sqlPath = path.join(process.cwd(), "prisma", "create-together-tables.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  await conn.query(sql);

  const [rows] = await conn.query(
    `SELECT table_name AS name FROM information_schema.tables
     WHERE table_schema = ? AND table_name LIKE 'together_%'
     ORDER BY table_name`,
    [process.env.MYSQL_DATABASE]
  );
  console.log("Together schema tables:");
  console.table(rows);

  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
