'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Package, Upload, User, LogOut, BarChart3, Settings } from 'lucide-react'

export default function Navigation() {
  const { data: session, status } = useSession()
  const role = (session?.user as { role?: string } | undefined)?.role

  if (status === 'loading') {
    return null // Don't show navigation while loading
  }

  return (
    <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Forjify
            </Link>
          </div>

          <div className="flex items-center space-x-6">
            <Link
              href="/"
              className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition-colors duration-200"
            >
              Marketplace
            </Link>

            {session?.user ? (
              <>
                {role === 'admin' && (
                  <Link
                    href="/admin"
                    className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 font-medium transition-colors duration-200 flex items-center"
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Admin
                  </Link>
                )}

                {role === 'seller' && (
                  <>
                    <Link
                      href="/upload"
                      className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition-colors duration-200 flex items-center"
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      Upload
                    </Link>
                    <Link
                      href="/dashboard/seller"
                      className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition-colors duration-200 flex items-center"
                    >
                      <BarChart3 className="w-4 h-4 mr-1" />
                      Analytics
                    </Link>
                  </>
                )}

                <Link
                  href="/dashboard"
                  className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition-colors duration-200 flex items-center"
                >
                  <Package className="w-4 h-4 mr-1" />
                  My Downloads
                </Link>

                <Link
                  href="/api/auth/signout"
                  className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 font-medium transition-colors duration-200 flex items-center"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Sign Out
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition-colors duration-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="btn-primary text-sm"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}