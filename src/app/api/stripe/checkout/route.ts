import { auth } from "@/lib/auth"
import { stripe } from "@/lib/stripe"
import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"

export const POST = async (req: NextRequest) => {
  const reqHeaders = await headers()
  const session = await auth.api.getSession({ headers: reqHeaders })

  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const { tier } = await req.json()

  if (!tier || tier === "free") {
    return new NextResponse("Invalid tier", { status: 400 })
  }

  const priceMap: Record<string, string | undefined> = {
    pro: process.env.STRIPE_PRO_PRICE_ID,
    developer: process.env.STRIPE_DEVELOPER_PRICE_ID,
    business: process.env.STRIPE_BUSINESS_PRICE_ID,
    unlimited: process.env.STRIPE_UNLIMITED_PRICE_ID,
    chrome_extension: process.env.STRIPE_CHROME_EXTENSION_PRICE_ID,
  }

  const priceId = priceMap[tier]

  if (!priceId || priceId.includes("your_")) {
    return NextResponse.json({ 
      detail: `Stripe Price ID for '${tier}' is not configured in .env.local` 
    }, { status: 500 })
  }

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: session.user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?status=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/pricing?status=cancelled`,
      metadata: {
        userId: session.user.id,
        tier: tier,
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (err) {
    console.error("Checkout error:", err)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
