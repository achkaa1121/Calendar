import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Initialize the pg driver adapter with your database URL
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

// Pass the adapter into the PrismaClient constructor
export const prisma = new PrismaClient({ adapter });
