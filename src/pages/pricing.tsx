// src/pages/pricing.tsx
// Shows the 3 subscription tiers and handles initiating
// a Notchpay payment when a student clicks "Subscribe".

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Zap, BookOpen, School } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

const PLANS = [
  {
    tier: 'FREE',
    name: 'Free',
    price: 0,
    priceLabel: 'Free forever',
    icon: BookOpen,
    color: 'border-gray-200',
    headerColor: 'bg-gray-50',
    buttonColor: 'bg-gray-200 text-gray-600 cursor-default',
    features: [
      'Browse all topics',
      'View up to 5 lessons/month',
      '10 AI tutor messages/month',
      'Access to revision questions',
    ],
  },
  {
    tier: 'STUDENT',
    name: 'Student',
    price: 2000,
    priceLabel: '2,000 XAF / month',
    icon: Zap,
    color: 'border-indigo-400',
    headerColor: 'bg-indigo-600',
    buttonColor: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    popular: true,
    features: [
      'Everything in Free',
      'Unlimited lessons & past papers',
      '50 AI tutor messages/month',
      'Full revision question bank',
      'Bookmark unlimited content',
      'Study plan builder',
    ],
  },
  {
    tier: 'SCHOOL',
    name: 'School',
    price: 15000,
    priceLabel: '15,000 XAF / month',
    icon: School,
    color: 'border-purple-400',
    headerColor: 'bg-purple-600',
    buttonColor: 'bg-purple-600 hover:bg-purple-700 text-white',
    features: [
      'Everything in Student',
      'Up to 30 student accounts',
      'School admin dashboard',
      'Usage analytics per student',
      'Priority support',
    ],
  },
]

export default function Pricing() {
  const navigate = useNavigate()
  const [currentTier, setCurrentTier] = useState<string>('FREE')
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [processingTier, setProcessingTier] = useState<string | null>(null)

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate('/')
        return
      }

      setUserId(session.user.id)
      setUserEmail(session.user.email || null)

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, full_name')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        setCurrentTier(profile.subscription_tier)
        setUserName(profile.full_name)
      }

      setLoading(false)
    }

    loadProfile()
  }, [navigate])

  // -------------------------------------------------------
  // Initiate a Notchpay payment
  // -------------------------------------------------------
  async function handleSubscribe(plan: typeof PLANS[0]) {
    if (plan.tier === 'FREE' || plan.tier === currentTier) return
    if (!userId || !userEmail) return

    setProcessingTier(plan.tier)

    try {
      // Step 1: Create a pending payment record in our DB
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          amount: plan.price,
          currency: 'XAF',
          subscription_tier: plan.tier,
          status: 'pending',
        })
        .select('id')
        .single()

      if (paymentError || !payment) {
        alert('Could not initiate payment. Please try again.')
        setProcessingTier(null)
        return
      }

      // Step 2: Initiate Notchpay checkout
      // Notchpay's API creates a payment session and returns a checkout URL
      const response = await fetch('https://api.notchpay.co/payments/initialize', {
        method: 'POST',
        headers: {
          'Authorization': import.meta.env.VITE_NOTCHPAY_PUBLIC_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: plan.price,
          currency: 'XAF',
          email: userEmail,
          name: userName || 'Student',
          description: `LearnWitMe ${plan.name} Plan — Monthly Subscription`,
          reference: payment.id, // Our payment UUID as the reference
          callback: `${window.location.origin}/payment/callback`,
        }),
      })

      const data = await response.json()

      if (data.transaction?.authorization_url) {
        // Step 3: Redirect the student to Notchpay's hosted payment page
        window.location.href = data.transaction.authorization_url
      } else {
        alert('Could not connect to payment provider. Please try again.')
        setProcessingTier(null)
      }
    } catch {
      alert('Payment error. Please try again.')
      setProcessingTier(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">

        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Upgrade Your Plan</h1>
            <p className="text-xs text-gray-400">
              Current plan: <span className="font-medium text-indigo-600">{currentTier}</span>
            </p>
          </div>
        </header>

        <div className="px-8 py-8">

          {/* Heading */}
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
              Choose the right plan for you
            </h2>
            <p className="text-gray-500 text-sm">
              Pay via MTN Mobile Money or Orange Money. Cancel anytime.
            </p>
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PLANS.map(plan => {
              const Icon = plan.icon
              const isCurrentPlan = plan.tier === currentTier
              const isProcessing = processingTier === plan.tier

              return (
                <div
                  key={plan.tier}
                  className={`relative bg-white rounded-2xl border-2 ${plan.color} overflow-hidden shadow-sm`}
                >
                  {/* Popular badge */}
                  {plan.popular && (
                    <div className="absolute top-3 right-3 bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      Most Popular
                    </div>
                  )}

                  {/* Plan header */}
                  <div className={`${plan.headerColor} px-5 py-4`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon size={18} className={plan.tier === 'FREE' ? 'text-gray-600' : 'text-white'} />
                      <h3 className={`font-bold text-base ${plan.tier === 'FREE' ? 'text-gray-800' : 'text-white'}`}>
                        {plan.name}
                      </h3>
                    </div>
                    <p className={`text-sm font-medium ${plan.tier === 'FREE' ? 'text-gray-500' : 'text-white/80'}`}>
                      {plan.priceLabel}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="px-5 py-4">
                    <ul className="flex flex-col gap-2 mb-5">
                      {plan.features.map(feature => (
                        <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                          <Check size={15} className="text-green-500 flex-shrink-0 mt-0.5" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {/* CTA button */}
                    {isCurrentPlan ? (
                      <div className="w-full text-center text-sm font-medium text-gray-400 bg-gray-50 py-2.5 rounded-xl">
                        ✓ Current Plan
                      </div>
                    ) : plan.tier === 'FREE' ? (
                      <div className="w-full text-center text-sm font-medium text-gray-400 bg-gray-50 py-2.5 rounded-xl">
                        Free Forever
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSubscribe(plan)}
                        disabled={isProcessing}
                        className={`w-full text-sm font-semibold py-2.5 rounded-xl transition-colors duration-200 ${plan.buttonColor} disabled:opacity-60`}
                      >
                        {isProcessing ? 'Redirecting...' : `Get ${plan.name}`}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Payment methods note */}
          <p className="text-center text-xs text-gray-400 mt-8">
            🔐 Secure payments via Notchpay · MTN Mobile Money · Orange Money · Visa & Mastercard
          </p>

        </div>
      </main>
    </div>
  )
}