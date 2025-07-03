"use client";

import { useState, useEffect } from "react";

interface Booking {
  id: string;
  name: string;
  email: string;
  phone: string;
  datePreference: string;
  requirements: string;
  status: string;
  paymentStatus: string;
  amount: number;
  createdAt: string;
}

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch("/api/bookings");
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings);
      } else {
        setError("Failed to fetch bookings");
      }
    } catch (err) {
      setError("Error loading bookings");
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "confirmed":
        return "status-badge status-confirmed";
      case "paid":
        return "status-badge status-paid";
      case "cancelled":
        return "status-badge status-cancelled";
      default:
        return "status-badge status-pending";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-loading">
          <div className="loading-spinner"></div>
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="admin-loading">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button onClick={fetchBookings} className="admin-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="admin-title">Caring4Carers Admin</h1>
              <p className="admin-subtitle">Manage wellness retreat bookings</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Total bookings:{" "}
                <span className="font-semibold text-blue-600">
                  {bookings.length}
                </span>
              </div>
              <button onClick={fetchBookings} className="admin-button">
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {bookings.length === 0 ? (
          <div className="admin-empty-state">
            <div className="empty-icon">📋</div>
            <h3 className="empty-title">No bookings yet</h3>
            <p className="empty-description">
              Bookings will appear here when customers submit the form.
            </p>
          </div>
        ) : (
          <div className="admin-table-container">
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Contact</th>
                    <th>Date Preference</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Booked</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>
                        <div>
                          <div className="customer-name">{booking.name}</div>
                          {booking.requirements && (
                            <div className="customer-requirements">
                              Requirements: {booking.requirements}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="contact-email">{booking.email}</div>
                        <div className="contact-phone">{booking.phone}</div>
                      </td>
                      <td>
                        <span className="text-gray-900">
                          {new Date(booking.datePreference).toLocaleDateString(
                            "en-IE",
                            {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          ) ||
                            booking.datePreference
                              .replace("-", " ")
                              .replace("_", " ")}
                        </span>
                      </td>
                      <td>
                        <span className={getStatusClass(booking.status)}>
                          {booking.status}
                        </span>
                      </td>
                      <td>
                        <div className="booking-amount">€{booking.amount}</div>
                        <span className={getStatusClass(booking.paymentStatus)}>
                          {booking.paymentStatus}
                        </span>
                      </td>
                      <td>
                        <span className="booking-date">
                          {formatDate(booking.createdAt)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stats-card">
            <div className="flex items-center">
              <div className="stats-icon">📊</div>
              <div className="ml-4">
                <p className="stats-label">Total Bookings</p>
                <p className="stats-value">{bookings.length}</p>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center">
              <div className="stats-icon text-green-600">✅</div>
              <div className="ml-4">
                <p className="stats-label">Confirmed</p>
                <p className="stats-value">
                  {bookings.filter((b) => b.status === "confirmed").length}
                </p>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center">
              <div className="stats-icon text-yellow-600">⏳</div>
              <div className="ml-4">
                <p className="stats-label">Pending</p>
                <p className="stats-value">
                  {bookings.filter((b) => b.status === "pending").length}
                </p>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center">
              <div className="stats-icon text-blue-600">💰</div>
              <div className="ml-4">
                <p className="stats-label">Total Revenue</p>
                <p className="stats-value">
                  €{bookings.reduce((sum, b) => sum + (b.amount || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
