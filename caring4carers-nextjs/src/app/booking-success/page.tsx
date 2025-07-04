"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./styles.module.css";

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
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  if (!bookingDetails) {
    return (
      <div className={styles.errorContainer}>
        <p>Invalid booking session.</p>
        <a href="/" className={styles.link}>
          Return to Homepage
        </a>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.checkmark}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1>Booking Confirmed</h1>
          <p>Thank you for booking your wellness retreat</p>
        </div>

        <div className={styles.details}>
          <div className={styles.detailRow}>
            <span>Amount Paid</span>
            <strong>€{bookingDetails.amount}</strong>
          </div>
          <div className={styles.detailRow}>
            <span>Date</span>
            <strong>{bookingDetails.date}</strong>
          </div>
          <div className={styles.detailRow}>
            <span>Confirmation ID</span>
            <code>{bookingDetails.sessionId.slice(0, 8)}</code>
          </div>
        </div>

        <div className={styles.nextSteps}>
          <h2>Next Steps</h2>
          <ul>
            <li>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <span>Check your email for booking confirmation</span>
            </li>
            <li>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
              <span>Venue details will be sent shortly</span>
            </li>
            <li>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Prepare for your day of self-care</span>
            </li>
          </ul>
        </div>

        <div className={styles.actions}>
          <a href="/" className={styles.button}>
            Return to Homepage
          </a>
          <p className={styles.support}>
            Need help?{" "}
            <a href="mailto:hello@caring4carers.ie">Contact support</a>
          </p>
        </div>
      </div>
    </div>
  );
}
