import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import CopyButton from "./CopyButton";

export default async function GiftCardSuccessPage({
  searchParams,
}: {
  searchParams: { code: string };
}) {
  const code = searchParams?.code;

  if (!code) {
    redirect("/");
  }

  const giftCard = await prisma.giftCard.findUnique({
    where: { code },
  });

  if (!giftCard) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <i className="fas fa-check text-2xl text-green-600"></i>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gift Card Purchase Successful!
          </h1>
          <p className="text-lg text-gray-600">
            Your gift card is ready to use. Keep this code safe - you'll need it
            for booking.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="relative h-48">
            <Image
              src="/images/hero-retreat-setting.jpg"
              alt="Wellness retreat setting"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            <div className="absolute bottom-4 left-6 text-white">
              <h2 className="text-2xl font-semibold">
                Caring4Carers Gift Card
              </h2>
              <p className="text-lg opacity-90">
                A gift of wellness and relaxation
              </p>
            </div>
          </div>

          <div className="p-8">
            <div className="mb-8">
              <div className="text-sm font-medium text-gray-500 mb-2">
                Gift Card Code
              </div>
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-mono font-bold text-indigo-600 tracking-wider">
                  {code}
                </div>
                <CopyButton code={code} />
              </div>
            </div>

            <div className="mb-8">
              <div className="text-sm font-medium text-gray-500 mb-2">
                Amount
              </div>
              <div className="text-3xl font-bold text-gray-900">
                €{giftCard.amount.toFixed(2)}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                How to Use Your Gift Card
              </h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                    <span className="text-sm font-medium">1</span>
                  </div>
                  <p className="ml-3 text-gray-600">
                    Visit our booking page and select your preferred retreat
                    date
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                    <span className="text-sm font-medium">2</span>
                  </div>
                  <p className="ml-3 text-gray-600">
                    Choose "Pay with Gift Card" as your payment method
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                    <span className="text-sm font-medium">3</span>
                  </div>
                  <p className="ml-3 text-gray-600">
                    Enter this gift card code to apply it to your booking
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <a
                href="/#booking"
                className="flex-1 inline-flex justify-center items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <i className="fas fa-calendar-alt mr-2"></i>
                Book Now
              </a>
              <a
                href="/"
                className="flex-1 inline-flex justify-center items-center px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <i className="fas fa-home mr-2"></i>
                Return to Home
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Questions about your gift card? Email us at{" "}
            <a
              href="mailto:hello@caring4carers.ie"
              className="text-indigo-600 hover:text-indigo-500"
            >
              hello@caring4carers.ie
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
