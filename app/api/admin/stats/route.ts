import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = session.user as { id: string; role?: string }

    // Check if user is an admin
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 })
    }

    // Get all stats
    const totalUsers = await prisma.user.count()
    const totalSellers = await prisma.user.count({
      where: { role: 'seller' }
    })
    const totalProducts = await prisma.product.count()

    // Calculate total revenue from completed purchases
    const purchases = await prisma.purchase.findMany({
      where: { status: 'completed' }
    }) as any[]

    const totalRevenue = purchases.reduce((sum, purchase) => sum + (purchase.totalAmount ?? 0), 0)
    const totalPlatformRevenue = purchases.reduce((sum, purchase) => sum + (purchase.platformFee ?? 0), 0)
    const totalSellerRevenue = purchases.reduce((sum, purchase) => sum + (purchase.sellerEarning ?? 0), 0)

    // Get recent users
    const recentUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    const stats = {
      totalUsers,
      totalSellers,
      totalProducts,
      totalRevenue,
      totalPlatformRevenue,
      totalSellerRevenue,
      recentUsers: recentUsers.map(u => ({
        ...u,
        createdAt: u.createdAt.toISOString()
      }))
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
