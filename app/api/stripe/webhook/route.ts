import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover'
})

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PLAN_CREDITS: Record<string, number> = {
  base: 700,
  pro: 2800,
  power: 8300
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  console.log(`Processing Stripe event: ${event.type}`)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.mode === 'subscription' && session.subscription) {
          const userId = session.client_reference_id || session.metadata?.user_id
          const planName = session.metadata?.plan
          const credits = session.metadata?.credits 
            ? parseInt(session.metadata.credits) 
            : PLAN_CREDITS[planName || 'base']

          if (!userId) {
            console.error('No user_id in checkout session')
            break
          }

          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )

          const { error } = await supabaseAdmin.rpc('setup_subscriber', {
            p_user_id: userId,
            p_plan_type: planName || 'base',
            p_credits: credits,
            p_stripe_customer_id: session.customer as string,
            p_stripe_subscription_id: subscription.id
          })

          if (error) {
            console.error('Failed to setup subscriber:', error)
            throw error
          }

          console.log(`✅ User ${userId} subscribed to ${planName} with ${credits} credits`)
        }
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        
        const subscriptionId = invoice.parent?.subscription_details?.subscription
        if (subscriptionId && invoice.billing_reason === 'subscription_cycle') {
          const subscription = await stripe.subscriptions.retrieve(
            subscriptionId as string
          )
          
          const userId = subscription.metadata?.user_id
          
          if (!userId) {
            console.error('No user_id in subscription metadata')
            break
          }

          const { error } = await supabaseAdmin.rpc('reset_monthly_credits', {
            p_user_id: userId
          })

          if (error) {
            console.error('Failed to reset monthly credits:', error)
            throw error
          }

          console.log(`✅ Monthly credits reset for user ${userId}`)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        
        const subscriptionId = invoice.parent?.subscription_details?.subscription
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(
            subscriptionId as string
          )
          
          const userId = subscription.metadata?.user_id
          
          if (userId) {
            await supabaseAdmin
              .from('user_credits')
              .update({ 
                plan_type: 'past_due',
                updated_at: new Date().toISOString()
              })
              .eq('user_id', userId)

            console.log(`⚠️ Payment failed for user ${userId}`)
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.user_id

        if (userId) {
          const { error } = await supabaseAdmin.rpc('cancel_subscription', {
            p_user_id: userId
          })

          if (error) {
            console.error('Failed to cancel subscription:', error)
            throw error
          }

          console.log(`✅ Subscription canceled for user ${userId}`)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const previousAttributes = event.data.previous_attributes
        
        if (previousAttributes?.items) {
          const userId = subscription.metadata?.user_id
          const planName = subscription.metadata?.plan
          const credits = subscription.metadata?.credits
            ? parseInt(subscription.metadata.credits)
            : PLAN_CREDITS[planName || 'base']

          if (userId && planName) {
            await supabaseAdmin
              .from('user_credits')
              .update({
                plan_type: planName,
                plan_credits_monthly: credits,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', userId)

            console.log(`✅ User ${userId} upgraded to ${planName}`)
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

