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
    console.log("Starting gift card purchase process");

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
    console.log("Received request body:", body);

    const validatedData = giftCardSchema.parse(body);
    console.log("Validated data:", validatedData);

    // Generate a unique gift card code
    const giftCardCode = generateGiftCardCode();
    console.log("Generated gift card code:", giftCardCode);

    try {
      // Create gift card record in database
      const giftCard = await prisma.giftCard.create({
        data: {
          code: giftCardCode,
          amount: validatedData.amount,
          purchaserEmail: validatedData.email,
        },
      });
      console.log("Created gift card in database:", giftCard);

      // Get the base URL from the request
      const protocol = request.headers.get("x-forwarded-proto") || "http";
      const host = request.headers.get("host");
      const baseUrl = `${protocol}://${host}`;
      console.log("Base URL:", baseUrl);

      try {
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
        console.log("Created Stripe session:", session.id);

        // Update gift card with Stripe session ID
        await prisma.giftCard.update({
          where: { id: giftCard.id },
          data: { stripeSessionId: session.id },
        });
        console.log("Updated gift card with session ID");

        return NextResponse.json({
          sessionId: session.id,
          url: session.url,
        });
      } catch (stripeError) {
        console.error("Stripe session creation error:", stripeError);
        // Clean up the gift card if Stripe session creation fails
        await prisma.giftCard.delete({
          where: { id: giftCard.id },
        });
        throw stripeError;
      }
    } catch (dbError) {
      console.error("Database operation error:", dbError);
      throw dbError;
    }
  } catch (error) {
    console.error("Gift card purchase error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create gift card purchase session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Endpoint to validate a gift card code
export async function GET(request: NextRequest) {
  console.log("Received gift card validation request");

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    console.log("Gift card code to validate:", code);

    if (!code) {
      return NextResponse.json(
        { error: "Gift card code is required" },
        { status: 400 }
      );
    }

    console.log("Searching for gift card in database");
    const giftCard = await prisma.giftCard.findUnique({
      where: { code: code },
    });
    console.log("Gift card found:", giftCard);

    if (!giftCard) {
      return NextResponse.json(
        { error: "Invalid gift card code" },
        { status: 404 }
      );
    }

    if (!giftCard.stripeSessionId) {
      return NextResponse.json(
        { error: "Gift card payment not completed" },
        { status: 400 }
      );
    }

    // Verify payment status with Stripe
    if (isStripeConfigured && stripe) {
      console.log("Verifying Stripe payment status");
      try {
        const session = await stripe.checkout.sessions.retrieve(
          giftCard.stripeSessionId
        );
        console.log("Stripe session status:", session.payment_status);

        if (session.payment_status !== "paid") {
          return NextResponse.json(
            { error: "Gift card payment is pending" },
            { status: 400 }
          );
        }
      } catch (stripeError) {
        console.error("Error verifying Stripe payment:", stripeError);
        return NextResponse.json(
          { error: "Could not verify gift card payment status" },
          { status: 500 }
        );
      }
    }

    if (giftCard.status !== "active") {
      console.log("Gift card status:", giftCard.status);
      return NextResponse.json(
        { error: "Gift card has already been redeemed or is expired" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      amount: giftCard.amount,
      code: giftCard.code,
      status: giftCard.status,
    });
  } catch (error) {
    console.error("Gift card validation error:", error);

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        {
          error: "Payment verification error",
          message: error.message,
          code: error.code,
        },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to validate gift card",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
