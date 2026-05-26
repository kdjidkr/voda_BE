import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

import { PrismaClient } from "../generated/prisma/client";

const envCandidates = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../../../.env"),
];

const envPath = envCandidates.find((candidate) => fs.existsSync(candidate));

dotenv.config(envPath ? { path: envPath } : undefined);

declare global {
  var prisma: PrismaClient | undefined;
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(`DATABASE_URL is not set (cwd: ${process.cwd()})`);
}

const adapter = new PrismaPg(databaseUrl);

export const prisma =
  globalThis.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}
