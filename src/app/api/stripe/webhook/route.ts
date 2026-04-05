import { stripe } from "@/lib/stripe"
import { NextRequest, NextResponse } from "next/server"
import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

export const POST = async (req: NextRequest) => {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new NextResponse("Webhook signature error", { status: 400 })
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`)
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as any
        const userId = session.metadata?.userId
        const tier = session.metadata?.tier

        if (userId && tier) {
          await pool.query(
            'UPDATE "user" SET plan = $1, subscription_status = $2, stripe_subscription_id = $3 WHERE id = $4',
            [tier, "active", session.subscription, userId]
          )
        }
        break

      case "customer.subscription.deleted":
        const subscription = event.data.object as any
        const deletedUserId = subscription.metadata?.userId

        if (deletedUserId) {
          await pool.query(
            'UPDATE "user" SET plan = $1, subscription_status = $2 WHERE id = $3',
            ["free", "expired", deletedUserId]
          )
        }
        break

      default:
        console.log(`Unhandled event type ${event.type}`)
    }
  } catch (err: any) {
    console.error("Database error:", err)
    return new NextResponse("Database error", { status: 500 })
  }

  return NextResponse.json({ received: true })
}
