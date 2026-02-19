import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ DATABASE_URL não encontrado. Configure no arquivo .env");
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const schemaPath = path.join(rootDir, "db", "schema.sql");

try {
  const schemaSql = await fs.readFile(schemaPath, "utf-8");
  const sql = neon(databaseUrl);

  const statements = schemaSql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await sql.query(statement);
  }

  console.log("✅ Schema aplicado com sucesso no Neon.");
} catch (error) {
  console.error("❌ Falha ao aplicar schema no Neon:", error);
  process.exit(1);
}