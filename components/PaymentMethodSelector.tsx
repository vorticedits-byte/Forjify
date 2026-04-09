'use client'

import { useState } from 'react'
import { CreditCard } from 'lucide-react'
import RazorpayCheckout from './RazorpayCheckout'
import PayPalCheckout from './PayPalCheckout'

interface PaymentMethodSelectorProps {
  productId: number
  productTitle: string
  price: number
  onSuccess?: () => void
}

export default function PaymentMethodSelector({
  productId,
  productTitle,
  price,
  onSuccess
}: PaymentMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<'razorpay' | 'paypal'>('razorpay')

  return (
    <div className="w-full space-y-4">
      {/* Payment Method Tabs */}
      <div className="flex gap-2 mb-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <button
          onClick={() => setSelectedMethod('razorpay')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            selectedMethod === 'razorpay'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Razorpay
        </button>
        <button
          onClick={() => setSelectedMethod('paypal')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            selectedMethod === 'paypal'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          PayPal
        </button>
      </div>

      {/* Payment Method Content */}
      {selectedMethod === 'razorpay' ? (
        <RazorpayCheckout
          productId={productId}
          productTitle={productTitle}
          price={price}
          onSuccess={onSuccess}
        />
      ) : (
        <PayPalCheckout
          productId={productId}
          productTitle={productTitle}
          price={price}
          onSuccess={onSuccess}
        />
      )}
    </div>
  )
}
