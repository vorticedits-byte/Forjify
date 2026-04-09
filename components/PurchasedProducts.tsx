'use client'

import { useState, useEffect } from 'react'
import { Download, Package } from 'lucide-react'

interface PurchasedProduct {
  id: number
  productId: number
  purchasedAt: string
  paymentMethod: string
  product: {
    id: number
    title: string
    description: string
    price: number
    fileUrl: string
    seller: { name: string }
  }
}

export default function PurchasedProducts() {
  const [purchases, setPurchases] = useState<PurchasedProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const res = await fetch('/api/purchases')
        if (!res.ok) throw new Error('Failed to fetch purchases')
        const data = await res.json()
        setPurchases(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPurchases()
  }, [])

  const handleDownload = async (productId: number, productTitle: string, paymentMethod: string) => {
    try {
      const endpoint = paymentMethod === 'paypal' ? '/api/paypal/download' : '/api/razorpay/download'
      const res = await fetch(`${endpoint}?productId=${productId}`)
      if (!res.ok) {
        const error = await res.json()
        alert(`Download failed: ${error.error}`)
        return
      }

      const data = await res.json()
      
      // Convert the download URL to a blob and trigger download
      const link = document.createElement('a')
      link.href = data.downloadUrl
      link.download = `${productTitle}${getFileExtension(data.downloadUrl)}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  const getFileExtension = (url: string): string => {
    const match = url.match(/\.[\w]+$/)
    return match ? match[0] : ''
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-200">
        Error: {error}
      </div>
    )
  }

  if (purchases.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
          No Purchases Yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Start by purchasing some digital products from the marketplace
        </p>
        <a href="/marketplace" className="btn-primary">
          Browse Marketplace
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {purchases.map(purchase => (
        <div 
          key={purchase.id} 
          className="card p-6 flex items-center justify-between hover:shadow-lg transition-shadow duration-200"
        >
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {purchase.product.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              by {purchase.product.seller.name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Purchased on {new Date(purchase.purchasedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex-shrink-0 ml-4">
            <div className="flex items-center space-x-4">
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                ₹{purchase.product.price}
              </span>
              <button
                onClick={() => handleDownload(
                  purchase.product.id,
                  purchase.product.title,
                  purchase.paymentMethod
                )}
                className="btn-primary flex items-center space-x-2 px-4 py-2"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
