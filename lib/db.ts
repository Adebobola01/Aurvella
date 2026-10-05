import "server-only";

import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const log: ("error" | "warn")[] =
    process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

  if (Boolean(tursoUrl) !== Boolean(tursoAuthToken)) {
    throw new Error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must both be configured.");
  }

  if (tursoUrl && tursoAuthToken) {
    return new PrismaClient({
      adapter: new PrismaLibSQL({ url: tursoUrl, authToken: tursoAuthToken }),
      log,
    });
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Configure TURSO_DATABASE_URL and TURSO_AUTH_TOKEN for production.");
  }

  return new PrismaClient({ log });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
