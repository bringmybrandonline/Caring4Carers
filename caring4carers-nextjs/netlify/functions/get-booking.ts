import { Handler } from "@netlify/functions";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const handler: Handler = async (event) => {
  // Extract session ID from query parameters
  const sessionId = event.queryStringParameters?.sessionId;

  if (!sessionId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Session ID required" }),
    };
  }

  try {
    const booking = await prisma.booking.findFirst({
      where: { stripeSessionId: sessionId },
    });

    if (!booking) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Booking not found" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(booking),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error" }),
    };
  } finally {
    await prisma.$disconnect();
  }
};
