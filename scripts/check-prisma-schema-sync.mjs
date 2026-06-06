#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");

const CANONICAL_SCHEMA_PATH = resolve(ROOT, "packages/db/prisma/schema.prisma");
const REQUIRED_MODELS = [
  "User",
  "Workspace",
  "Project",
  "WorkflowRun",
  "WorkflowStep",
  "ContentItem",
  "PublishJob",
  "IntegrationConnection",
  "AnalyticsRecord"
];

console.log("🔍 LiberationOS Prisma Schema Check");
console.log("Canonical location: packages/db/prisma/schema.prisma\n");

try {
  const schema = readFileSync(CANONICAL_SCHEMA_PATH, "utf-8");
  console.log("✅ Canonical Prisma schema found and readable");
  console.log(`   Size: ${(schema.length / 1024).toFixed(1)} KB`);

  if (!schema.includes("generator client")) {
    console.warn("⚠️  Schema does not appear to contain a Prisma client generator");
  }

  const missingModels = REQUIRED_MODELS.filter((modelName) => {
    const modelPattern = new RegExp(`^model\\s+${modelName}\\s+\\{`, "m");
    return !modelPattern.test(schema);
  });

  if (missingModels.length > 0) {
    throw new Error(`Missing required Prisma models: ${missingModels.join(", ")}`);
  }

  console.log(`✅ Required models present: ${REQUIRED_MODELS.join(", ")}`);
  console.log("\n✅ Prisma schema check passed");
  process.exit(0);
} catch (error) {
  console.error("❌ Prisma schema check failed:");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
