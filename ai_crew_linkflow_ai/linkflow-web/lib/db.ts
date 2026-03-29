import { PrismaClient } from '@prisma/client'
import { neon } from '@neondatabase/serverless'

// ── Prisma (mutations, auth adapter, complex joins) ───────────────────────────
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// ── Neon HTTP SQL (read queries in Server Components) ────────────────────────
// HTTP-based — no persistent TCP connections, safe for Vercel serverless.
// Prevents exhausting Neon free-tier connection limit (10-20 max).
export const sql = neon(process.env.DATABASE_URL!)
