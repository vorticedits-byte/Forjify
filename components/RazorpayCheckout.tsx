'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { ShoppingCart, CheckCircle, XCircle, Loader } from 'lucide-react'

interface RazorpayCheckoutProps {
  productId: number
  productTitle: string
  price: number
  onSuccess?: () => void
}

interface RazorpayWindow extends Window {
  Razorpay?: any
}

export default function RazorpayCheckout({
  productId,
  productTitle,
  price,
  onSuccess
}: RazorpayCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const { data: session } = useSession()

  // Load Razorpay script when component mounts
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
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
      // Step 1: Create Razorpay order
      const orderResponse = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      })

      if (!orderResponse.ok) {
        const error = await orderResponse.json()
        throw new Error(error.error || 'Failed to create order')
      }

      const orderData = await orderResponse.json()
      const { orderId, amount, currency, key } = orderData

      // Step 2: Open Razorpay Checkout
      const options = {
        key,
        amount,
        currency,
        name: 'Forjify',
        description: `Purchase: ${productTitle}`,
        order_id: orderId,
        handler: async (response: any) => {
          // Step 3: Verify payment on backend
          await verifyPayment(response)
        },
        prefill: {
          email: session.user.email,
          name: session.user.name
        },
        theme: {
          color: '#9333ea'
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false)
            setPaymentStatus('idle')
            setErrorMessage('Payment cancelled')
          }
        }
      }

      const razorpayWindow = window as RazorpayWindow
      if (razorpayWindow.Razorpay) {
        const razorpay = new razorpayWindow.Razorpay(options)
        razorpay.open()
      } else {
        throw new Error('Razorpay SDK failed to load')
      }
    } catch (error: any) {
      setIsLoading(false)
      setPaymentStatus('error')
      setErrorMessage(error.message || 'Payment initialization failed')
      console.error('Payment error:', error)
    }
  }

  const verifyPayment = async (response: any) => {
    try {
      const verifyResponse = await fetch('/api/razorpay/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: response.razorpay_order_id,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
          productId
        })
      })

      if (!verifyResponse.ok) {
        const error = await verifyResponse.json()
        throw new Error(error.error || 'Payment verification failed')
      }

      const result = await verifyResponse.json()
      setIsLoading(false)
      setPaymentStatus('success')

      // Call onSuccess callback after brief delay
      setTimeout(() => {
        if (onSuccess) {
          onSuccess()
        }
      }, 2000)
    } catch (error: any) {
      setIsLoading(false)
      setPaymentStatus('error')
      setErrorMessage(error.message || 'Payment verification failed. Please contact support.')
      console.error('Verification error:', error)
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
      disabled={isLoading || !session?.user}
      className="btn-primary w-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <Loader className="w-4 h-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <ShoppingCart className="w-5 h-5 mr-2" />
          Pay ₹{price} with Razorpay
        </>
      )}
    </button>
  )
}
