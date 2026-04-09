'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Star } from 'lucide-react'
import PaymentMethodSelector from './PaymentMethodSelector'

interface Product {
  id: number
  title: string
  description: string
  price: number
  category: string
  fileUrl: string
  thumbnailUrl?: string
  seller: { name: string }
}

interface ProductListProps {
  limit?: number
  viewMode?: 'grid' | 'list'
}

export default function ProductList({ limit, viewMode = 'grid' }: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const { data: session } = useSession()

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data)
        setFilteredProducts(limit ? data.slice(0, limit) : data)
      })
  }, [limit, refreshTrigger])

  useEffect(() => {
    let filtered = products
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === selectedCategory)
    }
    if (searchTerm) {
      filtered = filtered.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    }
    setFilteredProducts(limit ? filtered.slice(0, limit) : filtered)
  }, [selectedCategory, searchTerm, products, limit])

  const handlePaymentSuccess = () => {
    setRefreshTrigger(prev => prev + 1)
    window.location.reload()
  }

  const isImageUrl = (url: string) => /\.(jpe?g|png|gif|webp|avif|svg)$/i.test(url)
  const getPreviewUrl = (product: Product) => product.thumbnailUrl || (isImageUrl(product.fileUrl) ? product.fileUrl : '')

  return (
    <div>
      {!limit && (
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            >
              <option value="All">All Categories</option>
              <option value="General">General</option>
              <option value="Software">Software</option>
              <option value="Design">Design</option>
              <option value="Music">Music</option>
              <option value="Video">Video</option>
              <option value="E-books">E-books</option>
            </select>
          </div>
        </div>
      )}

      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8' : 'space-y-6'}>
        {filteredProducts.map(product => (
          <div
            key={product.id}
            className={viewMode === 'grid'
              ? 'card group hover:transform hover:scale-105 transition-all duration-300'
              : 'card overflow-hidden transition-all duration-200'}
          >
            <div className={viewMode === 'grid' ? '' : 'grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]'}>
              <div className={viewMode === 'grid' ? '' : 'rounded-3xl overflow-hidden'}>
                {product.thumbnailUrl ? (
                  <img
                    src={product.thumbnailUrl}
                    alt={`${product.title} thumbnail`}
                    className={viewMode === 'grid' ? 'h-56 w-full object-cover rounded-t-lg' : 'h-56 w-full object-cover'}
                  />
                ) : isImageUrl(product.fileUrl) ? (
                  <img
                    src={product.fileUrl}
                    alt={product.title}
                    className={viewMode === 'grid' ? 'h-56 w-full object-cover rounded-t-lg' : 'h-56 w-full object-cover'}
                  />
                ) : (
                  <div className="h-56 w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-t-lg">
                    <span className="text-sm text-gray-500 dark:text-gray-400">No preview available</span>
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200 mb-2">
                      {product.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">by {product.seller.name}</p>
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full">
                      {product.category}
                    </span>
                  </div>
                  <div className="flex items-center text-yellow-400">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">4.8</span>
                  </div>
                </div>

                <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                  {product.description}
                </p>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      ${product.price}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(product)}
                      className="btn-secondary text-sm"
                    >
                      View Details
                    </button>
                  </div>
                  {session ? (
                    <PaymentMethodSelector
                      productId={product.id}
                      productTitle={product.title}
                      price={product.price}
                      onSuccess={handlePaymentSuccess}
                    />
                  ) : (
                    <button className="btn-secondary text-sm opacity-50 cursor-not-allowed w-full">
                      Login to Buy
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedProduct ? (
        <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/10 dark:bg-gray-950 dark:ring-white/10">
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="absolute right-4 top-4 rounded-full bg-gray-100 p-2 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Close
            </button>
            <div className="grid grid-cols-1 lg:grid-cols-[440px_minmax(0,1fr)] gap-6 p-6 lg:p-8">
              <div className="rounded-3xl bg-gray-100 dark:bg-gray-900 p-4 flex items-center justify-center">
                {getPreviewUrl(selectedProduct) ? (
                  <img
                    src={getPreviewUrl(selectedProduct)}
                    alt={selectedProduct.title}
                    className="h-full w-full max-h-[520px] object-contain rounded-3xl"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-3xl bg-gray-200 text-center text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    No preview available
                  </div>
                )}
              </div>
              <div className="space-y-6">
                <div>
                  <span className="inline-block rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-900/40 dark:text-purple-200">
                    {selectedProduct.category}
                  </span>
                  <h2 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">{selectedProduct.title}</h2>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">by {selectedProduct.seller.name}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-gray-50 p-5 dark:bg-gray-900">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Price</p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">${selectedProduct.price}</p>
                  </div>
                  <div className="rounded-3xl bg-gray-50 p-5 dark:bg-gray-900">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
                    <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{selectedProduct.category}</p>
                  </div>
                </div>
                <div className="rounded-3xl bg-gray-50 p-6 text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Product Details</h3>
                  <p className="text-sm leading-7">{selectedProduct.description}</p>
                </div>
                {session ? (
                  <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-gray-950 dark:ring-white/5">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Purchase</h3>
                    <PaymentMethodSelector
                      productId={selectedProduct.id}
                      productTitle={selectedProduct.title}
                      price={selectedProduct.price}
                      onSuccess={handlePaymentSuccess}
                    />
                  </div>
                ) : (
                  <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-gray-950 dark:ring-white/5">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Please log in to purchase this product.</p>
                    <a href="/login" className="btn-primary mt-4 inline-flex">Sign in to Buy</a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">No products found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}