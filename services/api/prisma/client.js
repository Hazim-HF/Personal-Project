const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

// Reused across hot-reloads in dev (nodemon) so we don't exhaust the
// Postgres connection pool by creating a new client on every restart.
const globalForPrisma = globalThis;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
