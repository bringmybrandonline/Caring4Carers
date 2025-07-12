"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "giftcard">(
    "card"
  );
  const [giftCardCode, setGiftCardCode] = useState("");
  const [giftCardError, setGiftCardError] = useState("");
  const [isValidatingGiftCard, setIsValidatingGiftCard] = useState(false);
  const [giftCardAmount, setGiftCardAmount] = useState<number | null>(null);
  const [remainingBalance, setRemainingBalance] = useState<number | null>(null);
  const RETREAT_PRICE = 85.0;

  useEffect(() => {
    // Smooth scrolling for navigation links
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLAnchorElement;
      if (target.getAttribute("href")?.startsWith("#")) {
        e.preventDefault();
        const targetId = target.getAttribute("href");
        const targetSection = document.querySelector(targetId!);

        if (targetSection) {
          const offsetTop = (targetSection as HTMLElement).offsetTop - 70;
          window.scrollTo({
            top: offsetTop,
            behavior: "smooth",
          });
        }
      }
    };

    // Navbar background on scroll
    const handleNavbarScroll = () => {
      const navbar = document.querySelector(".navbar") as HTMLElement;
      if (window.scrollY > 50) {
        navbar.style.background = "rgba(255, 255, 255, 0.98)";
        navbar.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.1)";
      } else {
        navbar.style.background = "rgba(255, 255, 255, 0.95)";
        navbar.style.boxShadow = "none";
      }
    };

    // Video fallback handling
    const handleVideoError = () => {
      const videoContainer = document.querySelector(
        ".story-video-container"
      ) as HTMLElement;
      const imageFallback = document.querySelector(
        ".story-image-fallback"
      ) as HTMLElement;

      if (videoContainer && imageFallback) {
        videoContainer.style.display = "none";
        imageFallback.style.display = "block";
      }
    };

    const navLinks = document.querySelectorAll(".nav-menu a");
    navLinks.forEach((link) => {
      link.addEventListener("click", handleScroll);
    });

    const video = document.querySelector(".story-video") as HTMLVideoElement;
    if (video) {
      video.addEventListener("error", handleVideoError);
    }

    window.addEventListener("scroll", handleNavbarScroll);

    return () => {
      navLinks.forEach((link) => {
        link.removeEventListener("click", handleScroll);
      });
      if (video) {
        video.removeEventListener("error", handleVideoError);
      }
      window.removeEventListener("scroll", handleNavbarScroll);
    };
  }, []);

  // Auto-validate gift card when code is entered
  useEffect(() => {
    const validateTimer = setTimeout(() => {
      if (
        giftCardCode &&
        giftCardCode.length >= 8 &&
        paymentMethod === "giftcard"
      ) {
        validateGiftCard(giftCardCode);
      }
    }, 500);

    return () => clearTimeout(validateTimer);
  }, [giftCardCode, paymentMethod]);

  const validateGiftCard = async (code: string) => {
    if (!code) return;

    setIsValidatingGiftCard(true);
    setGiftCardError("");
    setGiftCardAmount(null);
    setRemainingBalance(null);

    try {
      console.log("Validating gift card:", code);
      const response = await fetch(
        `/api/stripe/gift-cards?code=${encodeURIComponent(code)}`
      );

      console.log("Gift card validation response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gift card validation error response:", errorText);
        try {
          const errorData = JSON.parse(errorText);
          setGiftCardError(errorData.error || "Failed to validate gift card");
        } catch (parseError) {
          setGiftCardError(errorText || "Failed to validate gift card");
        }
        return false;
      }

      const data = await response.json();
      console.log("Gift card validation response:", data);

      // Update gift card amount and calculate remaining balance
      setGiftCardAmount(data.amount);
      const remaining = Math.max(0, RETREAT_PRICE - data.amount);
      setRemainingBalance(remaining);

      return true;
    } catch (error) {
      console.error("Gift card validation error:", error);
      setGiftCardError("Failed to validate gift card");
      return false;
    } finally {
      setIsValidatingGiftCard(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate gift card if using one
      if (paymentMethod === "giftcard") {
        console.log("Validating gift card before submission");
        const isValid = await validateGiftCard(giftCardCode);
        if (!isValid) {
          setIsSubmitting(false);
          return;
        }
      }

      const formData = new FormData(e.currentTarget);
      const data = {
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        datePreference: formData.get("date-preference"),
        requirements: formData.get("requirements"),
        paymentMethod,
        giftCardCode: paymentMethod === "giftcard" ? giftCardCode : undefined,
      };

      console.log("Submitting booking:", data);

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      console.log("Booking response status:", response.status);

      // Get the response text first
      const responseText = await response.text();
      console.log("Booking response text:", responseText);

      let result;
      try {
        // Try to parse the response as JSON
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", parseError);
        throw new Error("Invalid response from server");
      }

      if (response.ok) {
        console.log("Booking successful:", result);
        if (result.redirectToPayment && result.paymentUrl) {
          // Redirect to Stripe Checkout
          window.location.href = result.paymentUrl;
        } else {
          // Show success message for booking without immediate payment
          alert(
            result.message || "Thank you! Your booking has been confirmed."
          );
          e.currentTarget.reset();
          setGiftCardCode("");
        }
      } else {
        console.error("Booking error:", result);
        alert(result.error || "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Booking submission error:", error);
      alert("Something went wrong with the booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <h2>Caring4Carers</h2>
          </div>
          <ul className={`nav-menu ${isMenuOpen ? "active" : ""}`}>
            <li>
              <a href="#home">Home</a>
            </li>
            <li>
              <a href="#story">Our Story</a>
            </li>
            <li>
              <a href="#experience">What to Expect</a>
            </li>
            <li>
              <a href="/gift-cards" className="nav-link">
                Gift Cards
              </a>
            </li>
            <li>
              <a href="#booking" className="nav-cta">
                Book Now
              </a>
            </li>
          </ul>
          <div
            className={`hamburger ${isMenuOpen ? "active" : ""}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Caring 4 Carers Wellness Day Retreat
            </h1>
            <p className="hero-subtitle">
              Rediscover yourself through mindfulness, movement, sound healing, and relaxation.
              You dedicate your life to caring for others – now it&apos;s time
              to care for yourself.
            </p>
            <div className="hero-features">
              <div className="feature">
                <i className="fas fa-leaf"></i>
                <span>Mindfulness</span>
              </div>
              <div className="feature">
                <i className="fas fa-heart"></i>
                <span>Movement</span>
              </div>
              <div className="feature">
                <i className="fas fa-spa"></i>
                <span>Relaxation</span>
              </div>
            </div>
            <a href="#booking" className="cta-button primary">
              Book Your Day Retreat
            </a>
            <p className="hero-note">
              Secure booking via Stripe
            </p>
          </div>
          <div className="hero-image">
            <Image
              src="/images/hero-retreat-setting.jpg"
              alt="Peaceful retreat setting in beautiful Leinster countryside"
              width={400}
              height={300}
              className="hero-img"
              priority
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
            />
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section id="story" className="story">
        <div className="container">
          <div className="story-content">
            <div className="story-text">
              <h2>How Caring4Carers Came About</h2>
              <p className="story-intro">
                My journey to creating Caring4Carers began with a deeply
                personal realization about the hidden struggles of those who
                dedicate their lives to caring for others.
              </p>

              <p>
                After years of witnessing the selfless dedication of carers –
                whether caring for aging parents, adults or children with additional needs,
                or family members with chronic illnesses – I noticed a
                heartbreaking pattern. These incredible individuals were pouring
                all their energy into others, leaving nothing for themselves.
              </p>

              <p>
                I watched carers become overwhelmed, isolated, and exhausted.
                They spoke of feeling guilty for wanting time for themselves, of
                being so focused on others&apos; needs that they forgot their
                own. Many shared how they longed for just one day where they
                could breathe, relax, and remember who they are beyond their
                caring role.
              </p>

              <p className="story-highlight">
                That&apos;s when Caring4Carers was born – from the belief that
                those who care for others deserve to be cared for too.
              </p>

              <p>
                Our wellness day retreats
                aren&apos;t just about relaxation – they&apos;re about
                recognition, renewal, and connection. Every element is designed
                specifically for carers who rarely get the chance to put
                themselves first.
              </p>
            </div>
            <div className="story-media">
              <div className="story-video-container">
                <video
                  className="story-video"
                  controls
                  poster="/images/story-caring-hands.jfif"
                  preload="metadata"
                >
                  <source src="/videos/story.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <div className="video-overlay">
                  <i className="fas fa-play video-play-icon"></i>
                </div>
              </div>
              <div className="story-image-fallback">
                <Image
                  src="/images/story-caring-hands.jfif"
                  alt="Caring hands representing support and compassion for carers"
                  width={400}
                  height={300}
                  className="story-img"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section id="experience" className="experience">
        <div className="container">
          <h2 className="section-title">
            What to Expect at Your Wellness Day Retreat
          </h2>
          <p className="section-subtitle">
            A thoughtfully curated day designed to restore your mind, body, and
            spirit
          </p>

          <div className="experience-grid">
            <div className="experience-card">
              <div className="card-icon">
                <i className="fas fa-leaf"></i>
              </div>
              <h3>Mindfulness Sessions</h3>
              <p>
                Guided meditation and breathing exercises to help you reconnect
                with the present moment and find inner peace amidst life&apos;s
                demands.
              </p>
              <ul>
                <li>Stress reduction techniques</li>
                <li>Emotional regulation practices</li>
                <li>Tools you can use at home</li>
              </ul>
            </div>

            <div className="experience-card">
              <div className="card-icon">
                <i className="fas fa-heart"></i>
              </div>
              <h3>Gentle Movement</h3>
              <p>
                Therapeutic movement sessions designed to release physical
                tension and boost your energy, suitable for all fitness levels.
              </p>
              <ul>
                <li>Yoga and stretching</li>
                <li>Nature walks</li>
                <li>Chair-based exercises</li>
              </ul>
            </div>

            <div className="experience-card">
              <div className="card-icon">
                <i className="fas fa-spa"></i>
              </div>
              <h3>Deep Relaxation</h3>
              <p>
                Experience profound rest through guided relaxation sessions,
                helping you release the weight you carry and truly unwind.
              </p>
              <ul>
                <li>Progressive muscle relaxation</li>
                <li>Sound healing sessions</li>
                <li>Quiet reflection time</li>
              </ul>
            </div>

            <div className="experience-card">
              <div className="card-icon">
                <i className="fas fa-users"></i>
              </div>
              <h3>Connection & Community</h3>
              <p>
                Connect with other carers in a supportive, understanding
                environment where you can share experiences and feel less alone.
              </p>
              <ul>
                <li>Small group discussions</li>
                <li>Peer support circles</li>
                <li>Shared lunch experience</li>
              </ul>
            </div>

            <div className="experience-card">
              <div className="card-icon">
                <i className="fas fa-utensils"></i>
              </div>
              <h3>Nourishing Lunch</h3>
              <p>
                Enjoy a carefully prepared, nutritious meal in peaceful
                surroundings – no planning, preparing, or cleaning required.
              </p>
              <ul>
                <li>Fresh, local ingredients</li>
                <li>Dietary requirements catered</li>
                <li>Mindful eating practices</li>
              </ul>
            </div>

            <div className="experience-card">
              <div className="card-icon">
                <i className="fas fa-music"></i>
              </div>
              <h3>Sound Healing</h3>
              <p>
                Experience the therapeutic power of sound through guided sound healing sessions that help restore balance and promote deep relaxation.
              </p>
              <ul>
                <li>Therapeutic sound baths</li>
                <li>Guided meditation with sound</li>
                <li>Deep healing frequencies</li>
              </ul>
            </div>
          </div>

          <div className="experience-benefits">
            <h3>You&apos;ll Leave Feeling:</h3>
            <div className="benefits-grid">
              <div className="benefit">
                <i className="fas fa-battery-full"></i>
                <span>Recharged & Energized</span>
              </div>
              <div className="benefit">
                <i className="fas fa-smile"></i>
                <span>Emotionally Balanced</span>
              </div>
              <div className="benefit">
                <i className="fas fa-users-line"></i>
                <span>Connected & Supported</span>
              </div>
              <div className="benefit">
                <i className="fas fa-toolbox"></i>
                <span>Equipped with Tools</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <section id="booking" className="booking">
        <div className="container">
          <div className="booking-content">
            <h2>Book your day retreat</h2>
            <p className="booking-subtitle">
              Take the first step towards putting yourself first. You deserve
              this time to restore and rejuvenate.
            </p>

            <div className="booking-grid">
              <div className="booking-info">
                <div className="booking-details">
                  <h3>Retreat Details</h3>
                  <div className="detail-item">
                    <i className="fas fa-clock"></i>
                    <div>
                      <strong>Duration:</strong>
                      <span>Full Day (9:30 AM - 4:30 PM)</span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <i className="fas fa-map-marker-alt"></i>
                    <div>
                      <strong>Location:</strong>
                      <span>Beautiful venues across Leinster</span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <i className="fas fa-users"></i>
                    <div>
                      <strong>Group Size:</strong>
                      <span>Small groups (max 12 people)</span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <i className="fas fa-euro-sign"></i>
                    <div>
                      <strong>Investment:</strong>
                      <span>€85 (includes everything)</span>
                    </div>
                  </div>
                </div>

                <div className="booking-features">
                  <h4>What&apos;s Included:</h4>
                  <ul>
                    <li>
                      <i className="fas fa-check"></i> All mindfulness and
                      movement sessions
                    </li>
                    <li>
                      <i className="fas fa-check"></i> Nutritious lunch and
                      refreshments
                    </li>
                    <li>
                      <i className="fas fa-check"></i> Sound healing sessions
                    </li>
                    <li>
                      <i className="fas fa-check"></i> Take-home self-care
                      toolkit
                    </li>
                    <li>
                      <i className="fas fa-check"></i> Ongoing support resources
                    </li>
                    <li>
                      <i className="fas fa-check"></i> A day dedicated entirely
                      to you
                    </li>
                  </ul>
                </div>
              </div>

              <div className="booking-form-container">
                <div className="booking-form">
                  <h3>Reserve Your Spot</h3>
                  <p>Secure online booking with Stripe-protected payments</p>

                  <form className="contact-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label htmlFor="name">Full Name</label>
                      <input type="text" id="name" name="name" required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="email">Email Address</label>
                      <input type="email" id="email" name="email" required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="phone">Phone Number</label>
                      <input type="tel" id="phone" name="phone" required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="date-preference">Preferred Date</label>
                      <input
                        type="date"
                        id="date-preference"
                        name="date-preference"
                        required
                        min={new Date().toISOString().split("T")[0]}
                        className="date-picker"
                      />
                      <small className="date-helper">
                        Select your preferred retreat date. We run retreats on
                        Saturdays.
                      </small>
                    </div>
                    <div className="form-group">
                      <label htmlFor="requirements">
                        Special Requirements (optional)
                      </label>
                      <textarea
                        id="requirements"
                        name="requirements"
                        rows={3}
                        placeholder="Dietary requirements, mobility considerations, etc."
                      ></textarea>
                    </div>
                    <div className="form-group">
                      <label>Payment Method</label>
                      <div className="payment-options">
                        <label className="radio-label">
                          <input
                            type="radio"
                            name="payment-method"
                            value="card"
                            checked={paymentMethod === "card"}
                            onChange={(e) => setPaymentMethod("card")}
                          />
                          <span>Pay by Card</span>
                        </label>
                        <label className="radio-label">
                          <input
                            type="radio"
                            name="payment-method"
                            value="giftcard"
                            checked={paymentMethod === "giftcard"}
                            onChange={(e) => setPaymentMethod("giftcard")}
                          />
                          <span>Use Gift Card</span>
                        </label>
                      </div>
                    </div>
                    {paymentMethod === "giftcard" && (
                      <div className="form-group">
                        <label htmlFor="gift-card-code">Gift Card Code</label>
                        <input
                          type="text"
                          id="gift-card-code"
                          value={giftCardCode}
                          onChange={(e) => {
                            setGiftCardCode(e.target.value);
                            setGiftCardAmount(null);
                            setRemainingBalance(null);
                          }}
                          required
                        />
                        {giftCardError && (
                          <div className="error-message">{giftCardError}</div>
                        )}
                        {giftCardAmount !== null && (
                          <div className="mt-4 space-y-2 text-sm">
                            <div className="flex justify-between items-center text-gray-700">
                              <span>Retreat Price:</span>
                              <span>€{RETREAT_PRICE.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-green-600">
                              <span>Gift Card Amount:</span>
                              <span>€{giftCardAmount.toFixed(2)}</span>
                            </div>
                            {remainingBalance! > 0 && (
                              <div className="flex justify-between items-center text-indigo-600 font-semibold border-t pt-2">
                                <span>Remaining to Pay:</span>
                                <span>€{remainingBalance!.toFixed(2)}</span>
                              </div>
                            )}
                            {remainingBalance === 0 && (
                              <div className="text-green-600 font-semibold mt-2">
                                Your gift card covers the full amount!
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    <button
                      type="submit"
                      className="cta-button primary full-width"
                      disabled={isSubmitting || isValidatingGiftCard}
                    >
                      <i
                        className={`fas ${
                          isSubmitting || isValidatingGiftCard
                            ? "fa-spinner fa-spin"
                            : paymentMethod === "card"
                            ? "fa-credit-card"
                            : "fa-gift"
                        }`}
                      ></i>
                      {isSubmitting || isValidatingGiftCard
                        ? "Processing..."
                        : paymentMethod === "card"
                        ? `Book Now - Pay €${RETREAT_PRICE.toFixed(
                            2
                          )} via Stripe`
                        : giftCardAmount === null
                        ? "Book Now - Enter Gift Card Code"
                        : remainingBalance! > 0
                        ? `Book Now - Pay Remaining €${remainingBalance!.toFixed(
                            2
                          )}`
                        : "Book Now - Gift Card Payment"}
                    </button>
                  </form>

                  <div className="security-badges">
                    <div className="badge">
                      <i className="fas fa-shield-alt"></i>
                      <span>SSL Secured</span>
                    </div>
                    <div className="badge">
                      <i className="fab fa-stripe"></i>
                      <span>Stripe Protected</span>
                    </div>
                    <div className="badge">
                      <i className="fas fa-lock"></i>
                      <span>Privacy Protected</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="testimonial">
              <div className="testimonial-content">
                <i className="fas fa-quote-left"></i>
                <p>
                  &quot;After years of caring for my mother, I had forgotten
                  what it felt like to truly relax. This day retreat gave me
                  back to myself. I left feeling renewed and with practical
                  tools I still use daily.&quot;
                </p>
                <div className="testimonial-author">
                  <strong>Sarah M.</strong>
                  <span>Family Carer, Dublin</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>Caring4Carers</h3>
              <p>
                Wellness day retreats designed specifically for carers.
                Because those who care for others deserve to be cared for too.
              </p>
            </div>
            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li>
                  <a href="#home">Home</a>
                </li>
                <li>
                  <a href="#story">Our Story</a>
                </li>
                <li>
                  <a href="#experience">What to Expect</a>
                </li>
                <li>
                  <a href="#booking">Book Now</a>
                </li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Contact Info</h4>
              <div className="contact-item">
                <i className="fas fa-envelope"></i>
                <span>hello@caring4carers.ie</span>
              </div>
              <div className="contact-item">
                <i className="fas fa-phone"></i>
                <span>+353 1 234 5678</span>
              </div>
              <div className="contact-item">
                <i className="fas fa-map-marker-alt"></i>
                <span>Serving Leinster Area</span>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>
              &copy; 2024 Caring4Carers. All rights reserved. | Privacy Policy |
              Terms of Service
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
