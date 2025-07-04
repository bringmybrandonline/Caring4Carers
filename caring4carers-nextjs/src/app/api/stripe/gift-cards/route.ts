import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";

// Validation schema for gift card purchase
const giftCardSchema = z.object({
  amount: z.number().min(20).max(50),
  email: z.string().email("Invalid email address"),
});

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

// Generate a unique gift card code
function generateGiftCardCode(): string {
  return `GC-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
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

    const body = await request.json();
    const validatedData = giftCardSchema.parse(body);

    // Generate a unique gift card code
    const giftCardCode = generateGiftCardCode();

    // Create gift card record in database
    const giftCard = await prisma.giftCard.create({
      data: {
        code: giftCardCode,
        amount: validatedData.amount,
        purchaserEmail: validatedData.email,
      },
    });

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
              name: "Caring4Carers Gift Card",
              description: `Gift Card worth €${validatedData.amount}`,
              images: [
                "https://via.placeholder.com/400x300/2b6cb0/ffffff?text=Caring4Carers+Gift+Card",
              ],
            },
            unit_amount: Math.round(validatedData.amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/gift-card-success?code=${giftCardCode}`,
      cancel_url: `${baseUrl}`,
      metadata: {
        giftCardId: giftCard.id,
        giftCardCode: giftCardCode,
        purchaserEmail: validatedData.email,
      },
      customer_email: validatedData.email,
    });

    // Update gift card with Stripe session ID
    await prisma.giftCard.update({
      where: { id: giftCard.id },
      data: { stripeSessionId: session.id },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Gift card purchase error:", error);
    return NextResponse.json(
      { error: "Failed to create gift card purchase session" },
      { status: 500 }
    );
  }
}

// Endpoint to validate a gift card code
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Gift card code is required" },
        { status: 400 }
      );
    }

    const giftCard = await prisma.giftCard.findUnique({
      where: { code: code },
    });

    if (!giftCard) {
      return NextResponse.json(
        { error: "Invalid gift card code" },
        { status: 404 }
      );
    }

    if (giftCard.status !== "active") {
      return NextResponse.json(
        { error: "Gift card has already been redeemed or is expired" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      amount: giftCard.amount,
    });
  } catch (error) {
    console.error("Gift card validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate gift card" },
      { status: 500 }
    );
  }
}
