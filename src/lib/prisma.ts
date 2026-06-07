import { PrismaClient } from "@prisma/client";

declare const EdgeRuntime: string | undefined;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Pre-connect in Node.js runtime only (not Edge)
if (typeof EdgeRuntime === "undefined") {
  prisma.$connect().catch(() => {});
}

export default prisma;
