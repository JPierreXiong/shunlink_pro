import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import GithubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from '@/lib/db'

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  events: {
    // Grant 1 free credit on first sign-in
    async createUser({ user }: { user: { id: string } }) {
      await prisma.user.update({
        where: { id: user.id },
        data: { creditBalance: 1 },
      })
    },
  },
  callbacks: {
    async session({ session, user }: { session: any; user: any }) {
      if (session.user) {
        session.user.id = user.id
        // Attach credit balance to session for UI display
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { creditBalance: true },
        })
        session.user.creditBalance = dbUser?.creditBalance ?? 0
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: { strategy: 'database' as const },
}

export default NextAuth(authOptions)


