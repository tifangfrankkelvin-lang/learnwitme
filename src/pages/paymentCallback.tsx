// src/pages/paymentCallback.tsx
// Notchpay redirects here after a payment attempt.
// We verify the payment status and update the UI accordingly.
// The actual subscription upgrade happens via webhook (server-side).

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function PaymentCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')

  useEffect(() => {
    async function verifyPayment() {
      // Notchpay appends ?reference=xxx&status=xxx to the callback URL
      const params = new URLSearchParams(window.location.search)
      const reference = params.get('reference')
      const paymentStatus = params.get('status')

      if (!reference) {
        setStatus('failed')
        return
      }

      if (paymentStatus === 'complete' || paymentStatus === 'success') {
        // Update the payment record to success
        await supabase
          .from('payments')
          .update({ status: 'success', notchpay_reference: reference })
          .eq('id', reference)

        setStatus('success')

        // Redirect to dashboard after 3 seconds
        setTimeout(() => navigate('/dashboard'), 3000)
      } else {
        // Payment failed or was cancelled
        await supabase
          .from('payments')
          .update({ status: 'failed' })
          .eq('id', reference)

        setStatus('failed')

        // Redirect to pricing after 3 seconds
        setTimeout(() => navigate('/pricing'), 3000)
      }
    }

    verifyPayment()
  }, [navigate])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center max-w-sm w-full shadow-sm">

        {status === 'loading' && (
          <>
            <Loader className="text-indigo-600 animate-spin mx-auto mb-4" size={40} />
            <h2 className="text-lg font-bold text-gray-900 mb-1">Verifying payment...</h2>
            <p className="text-gray-400 text-sm">Please wait a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="text-green-500 mx-auto mb-4" size={40} />
            <h2 className="text-lg font-bold text-gray-900 mb-1">Payment Successful! 🎉</h2>
            <p className="text-gray-400 text-sm">Your subscription is being activated. Redirecting to dashboard...</p>
          </>
        )}

        {status === 'failed' && (
          <>
            <XCircle className="text-red-500 mx-auto mb-4" size={40} />
            <h2 className="text-lg font-bold text-gray-900 mb-1">Payment Failed</h2>
            <p className="text-gray-400 text-sm">Something went wrong. Redirecting back to pricing...</p>
          </>
        )}

      </div>
    </div>
  )
}