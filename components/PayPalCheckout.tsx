'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { ShoppingCart, CheckCircle, XCircle, Loader } from 'lucide-react'

interface PayPalCheckoutProps {
  productId: number
  productTitle: string
  price: number
  onSuccess?: () => void
}

interface PayPalWindow extends Window {
  paypal?: any
}

export default function PayPalCheckout({
  productId,
  productTitle,
  price,
  onSuccess
}: PayPalCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const { data: session } = useSession()

  // Load PayPal script when component mounts
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
    if (!clientId) {
      console.error('PayPal client ID not configured')
      setErrorMessage('PayPal payment method is not configured')
      setPaymentStatus('error')
      return
    }

    const script = document.createElement('script')
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`
    script.async = true
    document.body.appendChild(script)
    
    return () => {
      try {
        document.body.removeChild(script)
      } catch (e) {
        // Script may have already been removed
      }
    }
  }, [])

  const handlePayment = async () => {
    if (!session?.user) {
      setErrorMessage('Please login to purchase products')
      return
    }

    setIsLoading(true)
    setPaymentStatus('processing')
    setErrorMessage('')

    try {
      // Step 1: Create PayPal order
      const orderResponse = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      })

      if (!orderResponse.ok) {
        const error = await orderResponse.json()
        throw new Error(error.error || 'Failed to create order')
      }

      const orderData = await orderResponse.json()
      const { orderId } = orderData

      // Step 2: Redirect to PayPal
      window.location.href = `/api/paypal/redirect?orderId=${orderId}&productId=${productId}`
    } catch (error: any) {
      setIsLoading(false)
      setPaymentStatus('error')
      setErrorMessage(error.message || 'Payment initialization failed')
      console.error('Payment error:', error)
    }
  }

  if (paymentStatus === 'success') {
    return (
      <div className="w-full space-y-4">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-green-900 dark:text-green-100">
              Payment Successful!
            </h3>
            <p className="text-sm text-green-700 dark:text-green-200 mt-1">
              Your purchase has been completed. Check your dashboard to download the product.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (paymentStatus === 'error') {
    return (
      <div className="w-full space-y-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start space-x-3">
          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-900 dark:text-red-100">
              Payment Failed
            </h3>
            <p className="text-sm text-red-700 dark:text-red-200 mt-1">
              {errorMessage}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setPaymentStatus('idle')
            setErrorMessage('')
            setIsLoading(false)
          }}
          className="btn-primary w-full"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handlePayment}
      disabled={isLoading}
      className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <Loader className="w-4 h-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <ShoppingCart className="w-4 h-4" />
          Pay with PayPal - ${price}
        </>
      )}
    </button>
  )
}
