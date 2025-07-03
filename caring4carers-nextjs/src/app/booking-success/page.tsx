"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function BookingSuccess() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  useEffect(() => {
    if (sessionId) {
      setTimeout(() => {
        setLoading(false);
        setBookingDetails({
          sessionId,
          amount: 85,
          currency: "EUR",
          date: new Date().toLocaleDateString("en-IE", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        });
      }, 1000);
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!bookingDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-4">
          <p className="text-gray-600">Invalid booking session.</p>
          <a
            href="/"
            className="text-blue-500 hover:text-blue-600 text-sm mt-2 block"
          >
            Return to Homepage
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Header */}
          <div className="p-6 bg-green-50 border-b border-green-100">
            <div className="flex justify-center mb-4">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <svg
                  className="h-5 w-5 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-center text-lg font-medium text-gray-900">
              Booking Confirmed
            </h1>
            <p className="mt-1 text-center text-sm text-gray-600">
              Thank you for booking your wellness retreat
            </p>
          </div>

          {/* Booking Details */}
          <div className="px-6 py-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount Paid</span>
                <span className="font-medium text-gray-900">
                  €{bookingDetails.amount}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Date</span>
                <span className="text-gray-900">{bookingDetails.date}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Confirmation ID</span>
                <span className="text-gray-900 font-mono text-xs">
                  {bookingDetails.sessionId.slice(0, 8)}
                </span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="px-6 py-4 bg-gray-50">
            <h2 className="text-sm font-medium text-gray-900 mb-3">
              Next Steps
            </h2>
            <ul className="space-y-2">
              <li className="flex items-start text-sm">
                <svg
                  className="h-4 w-4 text-gray-400 mt-0.5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <span className="text-gray-600">
                  Check your email for booking confirmation
                </span>
              </li>
              <li className="flex items-start text-sm">
                <svg
                  className="h-4 w-4 text-gray-400 mt-0.5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="text-gray-600">
                  Venue details will be sent shortly
                </span>
              </li>
              <li className="flex items-start text-sm">
                <svg
                  className="h-4 w-4 text-gray-400 mt-0.5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-gray-600">
                  Prepare for your day of self-care
                </span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t border-gray-100">
            <a
              href="/"
              className="block w-full py-2 px-4 text-sm font-medium text-center text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Return to Homepage
            </a>
            <p className="mt-3 text-center text-xs text-gray-500">
              Need help?{" "}
              <a
                href="mailto:hello@caring4carers.ie"
                className="text-blue-600 hover:text-blue-700"
              >
                Contact support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
