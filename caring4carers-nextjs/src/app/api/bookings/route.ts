import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Validation schema for booking data
const bookingSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  datePreference: z.string().min(1, "Please select a date preference"),
  // Accept undefined or null and coerce to empty string
  requirements: z
    .preprocess(
      (val) => (val === null || val === undefined ? "" : val),
      z.string()
    )
    .optional(),
  paymentMethod: z.enum(["card", "giftcard"]),
  giftCardCode: z.string().optional(),
});

export async function POST(request: NextRequest) {
  console.log("Received booking request");

  try {
    const body = await request.json();
    console.log("Request body:", body);

    // Validate the request data
    const validatedData = bookingSchema.parse(body);
    console.log("Validated data:", validatedData);

    let finalAmount = 85.0; // Default price
    let giftCard = null;

    // If using gift card, validate and apply it
    if (validatedData.paymentMethod === "giftcard") {
      console.log("Processing gift card payment");
      if (!validatedData.giftCardCode) {
        return NextResponse.json(
          { error: "Gift card code is required" },
          { status: 400 }
        );
      }

      giftCard = await prisma.giftCard.findUnique({
        where: { code: validatedData.giftCardCode },
      });
      console.log("Found gift card:", giftCard);

      if (!giftCard) {
        return NextResponse.json(
          { error: "Invalid gift card code" },
          { status: 400 }
        );
      }

      if (giftCard.status !== "active") {
        return NextResponse.json(
          { error: "Gift card has already been redeemed or is expired" },
          { status: 400 }
        );
      }

      // Apply gift card amount
      finalAmount = Math.max(0, finalAmount - giftCard.amount);
      console.log("Final amount after gift card:", finalAmount);
    }

    console.log("Creating booking record");
    // Save booking to database
    const booking = await prisma.booking.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        datePreference: validatedData.datePreference,
        requirements: validatedData.requirements,
        amount: finalAmount,
      },
    });
    console.log("Created booking:", booking);

    // If using gift card and it covers the full amount
    if (validatedData.paymentMethod === "giftcard" && finalAmount === 0) {
      console.log("Processing full gift card payment");
      // Mark the gift card as redeemed
      await prisma.giftCard.update({
        where: { id: giftCard!.id },
        data: {
          status: "redeemed",
          redeemedBy: validatedData.email,
          redeemedAt: new Date(),
        },
      });

      // Update booking status
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: "confirmed",
          paymentStatus: "paid",
        },
      });

      return NextResponse.json(
        {
          message: "Booking confirmed with gift card!",
          bookingId: booking.id,
          redirectToPayment: false,
        },
        { status: 200 }
      );
    }

    // If there's still an amount to pay, create Stripe checkout session
    try {
      console.log("Creating Stripe checkout session");
      // Get the base URL from the request
      const protocol = request.headers.get("x-forwarded-proto") || "http";
      const host = request.headers.get("host");
      const baseUrl = `${protocol}://${host}`;
      console.log("Base URL:", baseUrl);

      const stripeResponse = await fetch(`${baseUrl}/api/stripe/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingId: booking.id }),
      });
      console.log("Stripe response status:", stripeResponse.status);

      if (stripeResponse.ok) {
        const stripeData = await stripeResponse.json();
        console.log("Stripe session created:", stripeData);

        // If using gift card, mark it as redeemed
        if (validatedData.paymentMethod === "giftcard") {
          await prisma.giftCard.update({
            where: { id: giftCard!.id },
            data: {
              status: "redeemed",
              redeemedBy: validatedData.email,
              redeemedAt: new Date(),
            },
          });
        }

        return NextResponse.json(
          {
            message: "Booking created successfully",
            bookingId: booking.id,
            paymentUrl: stripeData.url,
            redirectToPayment: true,
          },
          { status: 200 }
        );
      } else if (stripeResponse.status === 503) {
        console.log("Stripe not configured");
        // Stripe not configured - this is expected during development
        return NextResponse.json(
          {
            message:
              "Booking created successfully! We'll send you payment details via email.",
            bookingId: booking.id,
            redirectToPayment: false,
            note: "Payment processing will be set up soon.",
          },
          { status: 200 }
        );
      } else {
        console.log("Other Stripe error");
        // Other Stripe errors
        return NextResponse.json(
          {
            message:
              "Booking created successfully. Payment link will be sent via email.",
            bookingId: booking.id,
            redirectToPayment: false,
          },
          { status: 200 }
        );
      }
    } catch (stripeError) {
      console.error("Stripe integration error:", stripeError);
      // Return success for booking, but payment failed
      return NextResponse.json(
        {
          message:
            "Booking created successfully. We'll contact you with payment details.",
          bookingId: booking.id,
          redirectToPayment: false,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Booking API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get all bookings for admin dashboard
    const bookings = await prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ bookings }, { status: 200 });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
