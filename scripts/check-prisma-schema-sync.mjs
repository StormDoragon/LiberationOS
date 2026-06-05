import { readFileSync } from "node:fs";

const rootSchema = readFileSync("prisma/schema.prisma", "utf8").trim();
const packageSchema = readFileSync("packages/db/prisma/schema.prisma", "utf8").trim();

if (rootSchema !== packageSchema) {
  console.error("Root prisma/schema.prisma must stay in sync with packages/db/prisma/schema.prisma.");
  process.exit(1);
}

console.log("Prisma schemas are in sync.");
