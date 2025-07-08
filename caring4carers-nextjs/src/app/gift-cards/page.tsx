"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function GiftCardPage() {
  const router = useRouter();
  const [amount, setAmount] = useState<number>(20);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      console.log("Submitting gift card purchase:", { amount, email });

      const response = await fetch("/api/stripe/gift-cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount, email }),
      });

      console.log("Response status:", response.status);

      // Check if the response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error response:", errorText);
        try {
          // Try to parse the error as JSON
          const errorData = JSON.parse(errorText);
          throw new Error(
            errorData.error ||
              errorData.message ||
              "Failed to purchase gift card"
          );
        } catch (parseError) {
          // If parsing fails, use the raw error text
          throw new Error(errorText || "Failed to purchase gift card");
        }
      }

      const data = await response.json();
      console.log("Response data:", data);

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No payment URL received");
      }
    } catch (err) {
      console.error("Gift card purchase error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong with the purchase. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="gift-card-page">
      <div className="gift-card-container">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Give the Gift of Wellness
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our gift cards make the perfect present for someone who deserves a
            day of relaxation and self-care.
          </p>
        </div>

        <div className="gift-card-grid">
          <div className="gift-card-preview">
            <h3>Preview Your Gift Card</h3>
            <div className="relative rounded-lg overflow-hidden mb-4">
              <Image
                src="/images/hero-retreat-setting.jpg"
                alt="Wellness retreat setting"
                width={600}
                height={300}
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>
            <div className="gift-card-amount">€{amount.toFixed(2)}</div>
            <div className="gift-card-features">
              <h4>Gift Card Benefits</h4>
              <ul className="feature-list">
                <li>
                  <i className="fas fa-check-circle"></i>
                  <span>Valid for 12 months from purchase</span>
                </li>
                <li>
                  <i className="fas fa-check-circle"></i>
                  <span>Can be used for any wellness day retreat</span>
                </li>
                <li>
                  <i className="fas fa-check-circle"></i>
                  <span>Instant digital delivery</span>
                </li>
                <li>
                  <i className="fas fa-check-circle"></i>
                  <span>Can be used as full or partial payment</span>
                </li>
                <li>
                  <i className="fas fa-check-circle"></i>
                  <span>Includes all retreat activities and lunch</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="gift-card-form">
            <h3>Purchase Your Gift Card</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Amount
                </label>
                <div className="amount-selector">
                  {[20, 25, 30, 35, 40, 45, 50].map((value) => (
                    <div
                      key={value}
                      className={`amount-option ${
                        amount === value ? "selected" : ""
                      }`}
                      onClick={() => setAmount(value)}
                    >
                      €{value}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Your Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
                <p className="mt-2 text-sm text-gray-500">
                  The gift card code will be sent to this email address.
                </p>
              </div>

              {error && (
                <div className="mb-4 text-red-600 text-sm bg-red-50 p-3 rounded">
                  {error}
                </div>
              )}

              <button type="submit" disabled={isLoading}>
                <i
                  className={`fas ${
                    isLoading ? "fa-spinner fa-spin" : "fa-gift"
                  }`}
                ></i>
                {isLoading ? "Processing..." : "Purchase Gift Card"}
              </button>

              <div className="security-info">
                <h4>Secure Payment</h4>
                <div className="security-badges">
                  <div className="security-badge">
                    <i className="fas fa-lock"></i>
                    <span>SSL Secured</span>
                  </div>
                  <div className="security-badge">
                    <i className="fab fa-stripe"></i>
                    <span>Stripe Protected</span>
                  </div>
                  <div className="security-badge">
                    <i className="fas fa-shield-alt"></i>
                    <span>100% Safe</span>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
