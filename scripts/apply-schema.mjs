import { readFile } from "node:fs/promises";
import pg from "pg";

const PASSWORD = process.env.SUPABASE_DB_PASSWORD;
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;
if (!PASSWORD || !PROJECT_REF) {
  console.error("SUPABASE_DB_PASSWORD y SUPABASE_PROJECT_REF requeridos");
  process.exit(1);
}

const sql = await readFile("supabase/schema.sql", "utf8");

// Probamos en orden: directo IPv6 → pooler IPv4
const candidates = [
  {
    label: "direct (5432)",
    cs: `postgres://postgres:${encodeURIComponent(PASSWORD)}@db.${PROJECT_REF}.supabase.co:5432/postgres`,
  },
  {
    label: "pooler sa-east-1 (6543)",
    cs: `postgres://postgres.${PROJECT_REF}:${encodeURIComponent(PASSWORD)}@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`,
  },
  {
    label: "pooler us-east-1 (6543)",
    cs: `postgres://postgres.${PROJECT_REF}:${encodeURIComponent(PASSWORD)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
  },
  {
    label: "pooler us-west-1 (6543)",
    cs: `postgres://postgres.${PROJECT_REF}:${encodeURIComponent(PASSWORD)}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`,
  },
  {
    label: "pooler eu-central-1 (6543)",
    cs: `postgres://postgres.${PROJECT_REF}:${encodeURIComponent(PASSWORD)}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`,
  },
];

let last;
for (const c of candidates) {
  console.log(`Trying ${c.label}...`);
  const client = new pg.Client({
    connectionString: c.cs,
    ssl: { rejectUnauthorized: false },
    statement_timeout: 60000,
    connectionTimeoutMillis: 4000,
  });
  try {
    await client.connect();
    console.log(`✅ Connected via ${c.label}`);
    await client.query(sql);
    console.log("✅ Schema applied successfully.");
    await client.end();
    process.exit(0);
  } catch (e) {
    last = e;
    console.log(`❌ ${c.label}: ${e.code || ""} ${e.message}`);
    try {
      await client.end();
    } catch {}
  }
}

console.error("Could not connect to any candidate. Last error:", last?.message);
process.exit(2);
