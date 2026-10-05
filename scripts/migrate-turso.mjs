import nextEnv from "@next/env";
import { createClient } from "@libsql/client";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
nextEnv.loadEnvConfig(projectRoot);

const migrationsDirectory = path.join(projectRoot, "prisma", "migrations");
const baselineRequested = process.argv.includes("--baseline");
const unexpectedArguments = process.argv.slice(2).filter((argument) => argument !== "--baseline");

if (unexpectedArguments.length || process.argv.filter((argument) => argument === "--baseline").length > 1) {
  throw new Error("Usage: npm run db:migrate:turso [-- --baseline]");
}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  throw new Error("Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN before running migrations.");
}

const entries = await readdir(migrationsDirectory, { withFileTypes: true });
const migrations = entries
  .filter((entry) => entry.isDirectory() && /^\d{14}_[a-z0-9_-]+$/i.test(entry.name))
  .map((entry) => entry.name)
  .sort();

if (migrations.length === 0) {
  throw new Error(`No Prisma migrations found in ${migrationsDirectory}.`);
}

const client = createClient({ url, authToken });

async function getTableColumns(tableName) {
  const result = await client.execute(`PRAGMA table_info("${tableName}")`);
  return new Set(result.rows.map((row) => String(row.name)));
}

async function verifyCurrentSchema() {
  const expectedColumns = {
    Product: [
      "id",
      "slug",
      "name",
      "description",
      "category",
      "priceInMinorUnits",
      "quantity",
      "currencyCode",
      "status",
      "createdAt",
      "updatedAt",
    ],
    ProductImage: [
      "id",
      "productId",
      "cloudflareId",
      "deliveryUrl",
      "altText",
      "displayOrder",
    ],
  };

  for (const [tableName, requiredColumns] of Object.entries(expectedColumns)) {
    const columns = await getTableColumns(tableName);
    const missingColumns = requiredColumns.filter((column) => !columns.has(column));

    if (missingColumns.length) {
      throw new Error(
        `Cannot baseline: ${tableName} is missing columns: ${missingColumns.join(", ")}.`,
      );
    }
  }
}

try {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS "_aurvella_migrations" (
      "name" TEXT NOT NULL PRIMARY KEY,
      "appliedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const appliedResult = await client.execute(
    'SELECT "name" FROM "_aurvella_migrations"',
  );
  const appliedMigrations = new Set(
    appliedResult.rows.map((row) => String(row.name)),
  );
  const unknownMigrations = [...appliedMigrations].filter(
    (name) => !migrations.includes(name),
  );

  if (unknownMigrations.length) {
    throw new Error(
      `Database contains migrations not present locally: ${unknownMigrations.join(", ")}.`,
    );
  }

  if (baselineRequested) {
    if (appliedMigrations.size > 0) {
      throw new Error("Cannot baseline a database that already has migration records.");
    }

    await verifyCurrentSchema();
    for (const name of migrations) {
      await client.execute({
        sql: 'INSERT INTO "_aurvella_migrations" ("name") VALUES (?)',
        args: [name],
      });
    }
    console.log(`Recorded ${migrations.length} existing migrations without applying SQL.`);
  } else {
    let foundUnappliedMigration = false;

    for (const name of migrations) {
      if (appliedMigrations.has(name)) {
        if (foundUnappliedMigration) {
          throw new Error(`Migration history is out of order at ${name}.`);
        }
        continue;
      }

      foundUnappliedMigration = true;
      const migrationPath = path.join(migrationsDirectory, name, "migration.sql");
      const sql = await readFile(migrationPath, "utf8");
      await client.executeMultiple(sql);
      await client.execute({
        sql: 'INSERT INTO "_aurvella_migrations" ("name") VALUES (?)',
        args: [name],
      });
      console.log(`Applied ${name}`);
    }

    if (!foundUnappliedMigration) {
      console.log("Database is up to date.");
    }
  }
} finally {
  client.close();
}
