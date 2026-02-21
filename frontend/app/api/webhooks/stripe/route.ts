import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session   = event.data.object as Stripe.Checkout.Session
      const userId    = session.metadata?.supabase_user_id
      const subId     = session.subscription as string
      if (userId) {
        await supabase.from('profiles').update({
          plan:                    'pro',
          minutes_limit:           null,
          stripe_subscription_id:  subId,
        }).eq('id', userId)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub      = event.data.object as Stripe.Subscription
      const customer = sub.customer as string
      await supabase.from('profiles').update({
        plan:                    'free',
        minutes_limit:           5,
        stripe_subscription_id:  null,
      }).eq('stripe_customer_id', customer)
      break
    }

    case 'invoice.payment_failed': {
      // 必要に応じてユーザーにメール通知など
      break
    }
  }

  return NextResponse.json({ received: true })
}
