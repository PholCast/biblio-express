import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { pool } from "./db-pool.js";

// Prisma reutiliza el pool explícito para poder medirlo (métricas) y
// agotarlo de forma controlada (experimento de caos).
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
});
