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
  viewport:
    "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className="bg-gray-50 w-full overflow-x-hidden">
        <main className="min-h-screen w-full">{children}</main>
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/js/all.min.js"
          strategy="lazyOnload"
          crossOrigin="anonymous"
        />
      </body>
    </html>
  );
}
