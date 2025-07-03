import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title:
    "Caring4Carers - Wellness Day Retreats for Carers in Leinster | Mindfulness & Self-Care",
  description:
    "Join Caring4Carers wellness day retreats in Leinster. Mindfulness, movement, and relaxation designed specifically for carers. Book your rejuvenating day retreat today.",
  keywords:
    "carer wellness Leinster, day retreat for carers, wellness retreat Leinster, carer self-care, mindfulness for carers, carer support Ireland",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
