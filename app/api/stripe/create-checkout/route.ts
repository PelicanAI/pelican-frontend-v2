import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

const getStripeClient = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY')
  }
  return new Stripe(secretKey, { apiVersion: '2025-12-15.clover' })
}

export async function POST(request: NextRequest) {
  try {
    let stripe: Stripe
    try {
      stripe = getStripeClient()
    } catch (error) {
      console.error('Stripe checkout config error:', error)
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      )
    }

    const { priceId, userId, userEmail, planName, planCredits } = await request.json()

    if (!priceId || !userId || !planName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    let customerId: string | undefined
    
    if (userEmail) {
      const existingCustomers = await stripe.customers.list({
        email: userEmail,
        limit: 1
      })
      
      if (existingCustomers.data.length > 0 && existingCustomers.data[0]) {
        customerId = existingCustomers.data[0].id
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/chat?subscribed=true&plan=${planName}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      client_reference_id: userId,
      metadata: {
        user_id: userId,
        plan: planName,
        credits: planCredits.toString()
      },
      subscription_data: {
        metadata: {
          user_id: userId,
          plan: planName,
          credits: planCredits.toString()
        }
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      // Stripe Terms of Service consent collection
      consent_collection: {
        terms_of_service: 'required'
      },
      custom_text: {
        terms_of_service_acceptance: {
          message: 'I agree to the [Terms of Service](https://pelican.ai/terms)'
        }
      }
    })

    return NextResponse.json({ url: session.url }, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

