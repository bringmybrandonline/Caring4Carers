import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  try {
    console.log("Initializing Prisma client");

    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL is not configured");
      throw new Error("DATABASE_URL environment variable is required");
    }

    const client = new PrismaClient({
      log: [
        { level: "query", emit: "event" },
        { level: "error", emit: "stdout" },
        { level: "info", emit: "stdout" },
        { level: "warn", emit: "stdout" },
      ],
    });

    // Log queries in development
    if (process.env.NODE_ENV !== "production") {
      client.$on("query", (e) => {
        console.log("Query:", e.query);
        console.log("Duration:", e.duration + "ms");
      });
    }

    // Test database connection
    client
      .$connect()
      .then(() => {
        console.log("Successfully connected to database");
      })
      .catch((error) => {
        console.error("Failed to connect to database:", error);
      });

    return client;
  } catch (error) {
    console.error("Failed to initialize Prisma client:", error);
    throw error;
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
