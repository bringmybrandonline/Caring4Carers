import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

// Check if Stripe is properly configured
const isStripeConfigured =
  process.env.STRIPE_SECRET_KEY &&
  process.env.STRIPE_SECRET_KEY !== "sk_test_placeholder_key" &&
  process.env.STRIPE_SECRET_KEY.startsWith("sk_");

let stripe: Stripe | null = null;

if (isStripeConfigured) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2023-10-16",
  });
}

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured || !stripe) {
      return NextResponse.json(
        {
          error: "Stripe not configured",
          message:
            "Payment processing is not yet set up. Please contact us directly.",
        },
        { status: 503 }
      );
    }

    const { bookingId } = await request.json();

    // Get booking details from database
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Get the base URL from the request
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const host = request.headers.get("host");
    const baseUrl = `${protocol}://${host}`;

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Caring4Carers Wellness Day Retreat",
              description: `Retreat booking for ${booking.name}`,
              images: [
                "https://via.placeholder.com/400x300/2b6cb0/ffffff?text=Caring4Carers",
              ],
            },
            unit_amount: Math.round(booking.amount! * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/#booking`,
      metadata: {
        bookingId: booking.id,
        customerName: booking.name,
        customerEmail: booking.email,
      },
      customer_email: booking.email,
    });

    // Update booking with Stripe session ID
    await prisma.booking.update({
      where: { id: bookingId },
      data: { stripeSessionId: session.id },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
