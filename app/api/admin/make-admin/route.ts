import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = session.user as { id: string; email: string }
    const userId = parseInt(currentUser.id)

    // Update the user's role to admin
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: 'admin' }
    })

    return NextResponse.json({
      message: 'You are now an admin!',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role
      }
    })
  } catch (error) {
    console.error('Error making user admin:', error)
    return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 })
  }
}
