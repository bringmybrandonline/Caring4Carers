import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

// Check if Stripe is properly configured
const isStripeConfigured =
  process.env.STRIPE_SECRET_KEY &&
  process.env.STRIPE_SECRET_KEY !== "sk_test_placeholder_key" &&
  process.env.STRIPE_SECRET_KEY.startsWith("sk_");

console.log("Stripe configuration status:", {
  isConfigured: isStripeConfigured,
  hasKey: !!process.env.STRIPE_SECRET_KEY,
  isValidKey: process.env.STRIPE_SECRET_KEY?.startsWith("sk_"),
});

let stripe: Stripe | null = null;

if (isStripeConfigured) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2023-10-16",
  });
}

export async function POST(request: NextRequest) {
  console.log("Received Stripe checkout request");

  try {
    // Check if Stripe is configured
    if (!isStripeConfigured || !stripe) {
      console.error("Stripe not configured properly");
      return NextResponse.json(
        {
          error: "Stripe not configured",
          message:
            "Payment processing is not yet set up. Please contact us directly.",
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    console.log("Request body:", body);

    const { bookingId } = body;
    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID is required" },
        { status: 400 }
      );
    }

    // Get booking details from database
    console.log("Fetching booking details for ID:", bookingId);
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    console.log("Found booking:", booking);

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (!booking.amount) {
      return NextResponse.json(
        { error: "Booking amount is not set" },
        { status: 400 }
      );
    }

    // Get the base URL from the request
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const host = request.headers.get("host");
    const baseUrl = `${protocol}://${host}`;
    console.log("Base URL:", baseUrl);

    // Create Stripe Checkout Session
    console.log("Creating Stripe session with amount:", booking.amount);
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
            unit_amount: Math.round(booking.amount * 100), // Convert to cents
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
    console.log("Created Stripe session:", session.id);

    // Update booking with Stripe session ID
    console.log("Updating booking with Stripe session ID");
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

    // Check if it's a Stripe error
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        {
          error: "Payment processing error",
          message: error.message,
          code: error.code,
        },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
