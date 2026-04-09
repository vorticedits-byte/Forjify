import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import path from 'path'

const rawDatabaseUrl = process.env.DATABASE_URL?.replace(/^"(.*)"$/, '$1')
if (!rawDatabaseUrl || rawDatabaseUrl === 'undefined') {
  process.env.DATABASE_URL = `file:${path.join(process.cwd(), 'prisma', 'dev.db')}`
} else if (rawDatabaseUrl.startsWith('file:')) {
  const sqlitePath = rawDatabaseUrl.slice(5)
  const absolutePath = path.isAbsolute(sqlitePath) ? sqlitePath : path.join(process.cwd(), sqlitePath)
  process.env.DATABASE_URL = `file:${absolutePath.replace(/\\/g, '/')}`
} else {
  process.env.DATABASE_URL = rawDatabaseUrl
}

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role } = await request.json()
    const userRole = role === 'seller' ? 'seller' : 'buyer'

    // Normalize email and name
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const normalizedName = String(name || '').trim() || 'User'

    if (!normalizedEmail || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists with this email.' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name: normalizedName,
        role: userRole
      }
    })

    return NextResponse.json({ message: 'User created', user: { id: user.id, email: user.email, name: user.name, role: user.role } })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}