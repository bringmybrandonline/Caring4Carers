import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Validation schema for booking data
const bookingSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  datePreference: z.string().min(1, "Please select a date preference"),
  requirements: z.string().optional().default(""),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request data
    const validatedData = bookingSchema.parse(body);

    // Save booking to database
    const booking = await prisma.booking.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        datePreference: validatedData.datePreference,
        requirements: validatedData.requirements,
        amount: 85.0, // Default price
      },
    });

    // Create Stripe checkout session
    try {
      // Get the base URL from the request
      const protocol = request.headers.get("x-forwarded-proto") || "http";
      const host = request.headers.get("host");
      const baseUrl = `${protocol}://${host}`;

      const stripeResponse = await fetch(`${baseUrl}/api/stripe/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingId: booking.id }),
      });

      if (stripeResponse.ok) {
        const stripeData = await stripeResponse.json();
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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Booking API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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
