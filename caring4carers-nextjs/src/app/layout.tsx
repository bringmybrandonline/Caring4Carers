import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";

export const metadata: Metadata = {
  title:
    "Caring4Carers - Caring 4 Carers Wellness Day Retreat | Mindfulness & Self-Care",
  description:
    "Join Caring4Carers wellness day retreats. Mindfulness, movement, and relaxation designed specifically for carers. Book your rejuvenating day retreat today.",
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
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className="bg-gray-50">
        <main className="min-h-screen">{children}</main>
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/js/all.min.js"
          strategy="lazyOnload"
          crossOrigin="anonymous"
        />
      </body>
    </html>
  );
}
