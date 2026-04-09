import type { AuthOptions } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import path from 'path'

// Normalize DATABASE_URL for Windows compatibility
const rawDatabaseUrl = process.env.DATABASE_URL?.replace(/["']/g, '')
if (!rawDatabaseUrl || rawDatabaseUrl === 'undefined') {
  process.env.DATABASE_URL = `file:${path.join(process.cwd(), 'prisma', 'dev.db').replace(/\\/g, '/')}`
} else if (rawDatabaseUrl.startsWith('file:')) {
  const sqlitePath = rawDatabaseUrl.slice(5)
  if (path.isAbsolute(sqlitePath)) {
    process.env.DATABASE_URL = `file:${sqlitePath.replace(/\\/g, '/')}`
  } else {
    process.env.DATABASE_URL = `file:${path.join(process.cwd(), sqlitePath).replace(/\\/g, '/')}`
  }
} else {
  process.env.DATABASE_URL = rawDatabaseUrl
}

console.log('🗄️ Final DATABASE_URL:', process.env.DATABASE_URL)

// Proper Prisma client initialization for Next.js
const globalForPrisma = global as unknown as { prisma?: PrismaClient }

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = undefined
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('🔐 Authorize function called')
        if (!credentials?.email || !credentials?.password) {
          console.error('❌ Missing email or password')
          return null
        }

        try {
          const email = credentials.email.trim().toLowerCase()
          const password = credentials.password

          console.log(`🔍 Auth attempt for: ${email}`)
          console.log('🔗 Database URL:', process.env.DATABASE_URL)

          const user = await prisma.user.findUnique({
            where: { email }
          })

          console.log('👤 User query result:', user ? 'found' : 'not found')

          if (!user) {
            console.error(`❌ User not found: ${email}`)
            return null
          }

          console.log(`✅ User found: ${user.email} (ID: ${user.id})`)

          const isPasswordValid = await bcrypt.compare(password, user.password)
          if (!isPasswordValid) {
            console.error(`❌ Password mismatch for: ${email}`)
            return null
          }

          console.log(`✅ Password validated for: ${email}`)
          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role
          }
        } catch (error) {
          console.error('❌ Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id
        token.role = (user as { id: string; role?: string }).role
      }
      return token
    },
    async session({ session, token }: { session: any; token: JWT }) {
      session.user = session.user || {}
      if (token.id) {
        session.user.id = token.id as string
      }
      if (token.role) {
        session.user.role = token.role as string
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  },
  secret: process.env.NEXTAUTH_SECRET
}
