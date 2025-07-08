import type { Context } from "@netlify/functions";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: Request, context: Context) {
  // Extract code from query parameters
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response(JSON.stringify({ error: "Gift card code required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const giftCard = await prisma.giftCard.findUnique({
      where: { code },
    });

    if (!giftCard) {
      return new Response(JSON.stringify({ error: "Gift card not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(giftCard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  } finally {
    await prisma.$disconnect();
  }
}
