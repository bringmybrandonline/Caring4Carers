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
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const RETREAT_PRICE = 75.0;

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

    // Video play button functionality
    const handleVideoPlay = () => {
      const video = document.querySelector(".story-video") as HTMLVideoElement;
      const videoWrapper = document.querySelector(".story-video-wrapper") as HTMLElement;
      
      if (video) {
        video.play();
        setIsVideoPlaying(true);
        if (videoWrapper) {
          videoWrapper.classList.add("playing");
        }
      }
    };

    const handleVideoPause = () => {
      const videoWrapper = document.querySelector(".story-video-wrapper") as HTMLElement;
      setIsVideoPlaying(false);
      if (videoWrapper) {
        videoWrapper.classList.remove("playing");
      }
    };

    const videoOverlay = document.querySelector(".video-overlay");
    if (videoOverlay) {
      videoOverlay.addEventListener("click", handleVideoPlay);
    }

    const video = document.querySelector(".story-video") as HTMLVideoElement;
    if (video) {
      video.addEventListener("error", handleVideoError);
      video.addEventListener("pause", handleVideoPause);
      video.addEventListener("ended", handleVideoPause);
    }

    const navLinks = document.querySelectorAll(".nav-menu a");
    navLinks.forEach((link) => {
      link.addEventListener("click", handleScroll);
    });

    window.addEventListener("scroll", handleNavbarScroll);

    return () => {
      navLinks.forEach((link) => {
        link.removeEventListener("click", handleScroll);
      });
      if (video) {
        video.removeEventListener("error", handleVideoError);
        video.removeEventListener("pause", handleVideoPause);
        video.removeEventListener("ended", handleVideoPause);
      }
      if (videoOverlay) {
        videoOverlay.removeEventListener("click", handleVideoPlay);
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
            <div className="logo-container">
              <Image
                src="/images/logo.jpeg"
                alt="Caring4Carers Logo"
                width={50}
                height={50}
                className="logo-img"
                priority
              />
              <span className="logo-text">Caring 4 Carers</span>
            </div>
          </div>
          <ul className={`nav-menu ${isMenuOpen ? "active" : ""}`}>
            <li>
              <a href="#home" onClick={() => setIsMenuOpen(false)}>
                Home
              </a>
            </li>
            <li>
              <a href="#story" onClick={() => setIsMenuOpen(false)}>
                Our Story
              </a>
            </li>
            <li>
              <a href="#experience" onClick={() => setIsMenuOpen(false)}>
                What to Expect
              </a>
            </li>
            <li>
              <a href="#schedule" onClick={() => setIsMenuOpen(false)}>
                Schedule
              </a>
            </li>
            <li>
              <a
                href="/gift-cards"
                className="nav-link"
                onClick={() => setIsMenuOpen(false)}
              >
                Gift Cards
              </a>
            </li>
            <li>
              <a
                href="#booking"
                className="nav-cta"
                onClick={() => setIsMenuOpen(false)}
              >
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
            <h1 className="hero-title">Caring 4 Carers Wellness Day Retreat</h1>
            <p className="hero-subtitle">
              Rediscover yourself through mindfulness, movement, sound therapy,
              and relaxation. You dedicate your life to caring for others – now
              it&apos;s time to care for yourself.
            </p>
            <div className="hero-features">
              <div className="feature-row">
                <div className="feature">
                  <i className="fas fa-leaf"></i>
                  <span>Mindfulness</span>
                </div>
                <div className="feature">
                  <i className="fas fa-heart"></i>
                  <span>Movement</span>
                </div>
              </div>
              <div className="feature-row">
                <div className="feature">
                  <i className="fas fa-spa"></i>
                  <span>Relaxation</span>
                </div>
                <div className="feature">
                  <i className="fas fa-music"></i>
                  <span>Sound Therapy</span>
                </div>
              </div>
            </div>
            <a href="#booking" className="cta-button primary">
              Book Your Day Retreat
            </a>
            <p className="hero-note">Secure booking via Stripe</p>
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
          <div className="story-header">
            <h2>How Caring4Carers Came About</h2>
            <p className="story-subtitle">
              A personal journey that led to creating something special for those who care for others
            </p>
          </div>
          
          <div className="story-video-section">
            <div className="story-video-wrapper">
              <video
                className="story-video"
                controls
                poster="/images/story-caring-hands.jfif"
                preload="metadata"
                playsInline
              >
                <source src="/videos/story.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <div className="video-overlay" onClick={handleVideoPlay}>
                <i className="fas fa-play"></i>
              </div>
            </div>
            <div className="story-video-fallback">
              <Image
                src="/images/story-caring-hands.jfif"
                alt="Caring hands representing support and compassion for carers"
                width={800}
                height={450}
                className="story-fallback-img"
                priority
              />
            </div>
          </div>

          <div className="story-content">
            <div className="story-intro-card">
              <p className="story-intro">
                My journey to creating Caring4Carers began with a deeply
                personal realization about the hidden struggles of those who
                dedicate their lives to caring for others.
              </p>
            </div>

            <div className="story-text-content">
              <p>
                After years of witnessing the selfless dedication of carers –
                whether caring for aging parents, adults or children with
                additional needs, or family members with chronic illnesses – I
                noticed a heartbreaking pattern. These incredible individuals
                were pouring all their energy into others, leaving nothing for
                themselves.
              </p>

              <p>
                I watched carers become overwhelmed, isolated, and exhausted.
                They spoke of feeling guilty for wanting time for themselves, of
                being so focused on others&apos; needs that they forgot their
                own. Many shared how they longed for just one day where they
                could breathe, relax, and remember who they are beyond their
                caring role.
              </p>

              <div className="story-highlight-card">
                <p className="story-highlight">
                  That&apos;s when Caring4Carers was born – from the belief that
                  those who care for others deserve to be cared for too.
                </p>
              </div>

              <p>
                Our wellness day retreats aren&apos;t just about relaxation –
                they&apos;re about recognition, renewal, and connection. Every
                element is designed specifically for carers who rarely get the
                chance to put themselves first.
              </p>
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
              <h3>Mindfulness</h3>
              <p>
                Guided mindfulness and breathing exercises to help you reconnect
                with the present moment and find inner peace amidst life&apos;s
                demands.
              </p>
              <ul>
                <li>Breathing exercises</li>
                <li>Emotional regulation practices</li>
                <li>Body awareness practices</li>
              </ul>
            </div>

            <div className="experience-card">
              <div className="card-icon">
                <i className="fas fa-heart"></i>
              </div>
              <h3>Gentle Movement</h3>
              <p>
                Traditional Ancient therapeutic practices is designed to benefit
                overall health, release physical tension and boost energy,
                Suitable for all fitness levels.
              </p>
              <ul>
                <li>Gentle blowing sequence</li>
                <li>Breath focues movement</li>
                <li>Restorative poses</li>
              </ul>
            </div>

            <div className="experience-card">
              <div className="card-icon">
                <i className="fas fa-eye"></i>
              </div>
              <h3>Meditation & Visualisation</h3>
              <p>
                Experience inner stillness and clarity through gentle guided
                practises that calm the mind and soothe the soul.
              </p>
              <ul>
                <li>Breath-focused meditation</li>
                <li>Guided visualisation for emotional release</li>
                <li>Practises to carry calm into your daily life</li>
              </ul>
            </div>

            <div className="experience-card">
              <div className="card-icon">
                <i className="fas fa-music"></i>
              </div>
              <h3>Sound Therapy</h3>
              <p>
                A deeply relaxing experience using healing sounds and vibrations
                to calm the mind and restore balance to the body.
              </p>
              <ul>
                <li>Reduces stress anxiety</li>
                <li>Promotes deep rest and better sleep</li>
                <li>Support emotional release and nervous system regulation</li>
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
            </div>
          </div>
        </div>
      </section>

      {/* Schedule Section */}
      <section id="schedule" className="schedule">
        <div className="container">
          <h2 className="section-title">What the Day Looks Like</h2>
          <p className="section-subtitle">
            A carefully crafted timeline designed to nurture your mind, body,
            and spirit
          </p>

          <div className="schedule-timeline">
            <div className="schedule-item">
              <div className="schedule-time">🕙 10:00 – 10:30</div>
              <div className="schedule-content">
                <strong>Welcome & Introductions</strong>
                <p>
                  Arrive, settle in, and meet the group in a warm, relaxed
                  space. A gentle start to ease into the day.
                </p>
              </div>
            </div>
            <div className="schedule-item">
              <div className="schedule-time">🧘‍♀️ 10:30 – 11:15</div>
              <div className="schedule-content">
                <strong>Gentle Movement</strong>
                <p>
                  Slow, mindful movement to release tension and reconnect with
                  the body.
                </p>
              </div>
            </div>
            <div className="schedule-item">
              <div className="schedule-time">🎶 11:15 – 12:15</div>
              <div className="schedule-content">
                <strong>Sound Therapy</strong>
                <p>
                  Let soothing vibrations calm your nervous system and quiet the
                  mind.
                </p>
              </div>
            </div>
            <div className="schedule-item">
              <div className="schedule-time">💧 12:15 – 12:30</div>
              <div className="schedule-content">
                <strong>Hydration & Mindfulness</strong>
                <p>Sip, breathe, pause — a moment of presence and grounding.</p>
              </div>
            </div>
            <div className="schedule-item">
              <div className="schedule-time">🧘 12:30 – 13:15</div>
              <div className="schedule-content">
                <strong>Guided Meditation</strong>
                <p>
                  Drift into deep relaxation with supportive, calming guidance.
                </p>
              </div>
            </div>
            <div className="schedule-item">
              <div className="schedule-time">☕ 13:15 – 14:00</div>
              <div className="schedule-content">
                <strong>Reflection & Light Refreshments</strong>
                <p>
                  Space to share, reflect, and connect with others over tea and
                  treats.
                </p>
              </div>
            </div>
            <div className="schedule-item">
              <div className="schedule-time">👋 14:00</div>
              <div className="schedule-content">
                <strong>Goodbyes</strong>
                <p>
                  Leave feeling lighter, nourished, and reconnected — this time
                  is for you.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <section id="booking" className="booking">
        <div className="container">
          <div className="booking-content">
            <h2>Book Your Day Retreat</h2>
            <p className="booking-subtitle">
              Take the first step towards putting yourself first. You deserve
              this time to restore and rejuvenate.
            </p>

            <div className="booking-grid">
              {/* Form comes first on mobile */}
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
                      <label htmlFor="date-preference">
                        Preferred Venue & Date
                      </label>
                      <select
                        id="date-preference"
                        name="date-preference"
                        required
                        className="venue-select"
                      >
                        <option value="">Select a venue and date</option>
                        <optgroup label="Dublin">
                          <option value="ballybough-28-feb-2026">
                            Ballybough - 28 Feb 2026
                          </option>
                          <option value="saggart-21-mar-2026">
                            Saggart - 21 Mar 2026
                          </option>
                          <option value="tallaght-17-jan-2026">
                            Tallaght - 17 Jan 2026
                          </option>
                        </optgroup>
                        <optgroup label="Kildare">
                          <option value="athy-27-sep-2025">
                            Athy - 27 Sep 2025
                          </option>
                          <option value="maynooth-19-oct-2025">
                            Maynooth - 19 Oct 2025
                          </option>
                          <option value="kildare-town-15-nov-2025">
                            Kildare Town - 15 Nov 2025
                          </option>
                        </optgroup>
                        <optgroup label="Kilkenny">
                          <option value="kilkenny-city-11-jan-2026">
                            Kilkenny City - 11 Jan 2026
                          </option>
                        </optgroup>
                        <optgroup label="Laois">
                          <option value="portlaoise-07-feb-2026">
                            Portlaoise - 07 Feb 2026
                          </option>
                        </optgroup>
                        <optgroup label="Offaly">
                          <option value="tullamore-22-nov-2025">
                            Tullamore - 22 Nov 2025
                          </option>
                        </optgroup>
                        <optgroup label="Wexford">
                          <option value="new-ross-08-mar-2026">
                            New Ross - 08 Mar 2026
                          </option>
                        </optgroup>
                        <optgroup label="Wicklow">
                          <option value="bray-06-dec-2025">
                            Bray - 06 Dec 2025
                          </option>
                        </optgroup>
                      </select>
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

              {/* Details come second on mobile */}
              <div className="booking-info">
                <div className="booking-details">
                  <h3>Retreat Details</h3>
                  <div className="detail-item">
                    <i className="fas fa-clock"></i>
                    <div>
                      <strong>Duration:</strong>
                      <span>10:00 AM - 2:00 PM (unless told otherwise)</span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <i className="fas fa-map-marker-alt"></i>
                    <div>
                      <strong>Venues & Dates:</strong>
                      <div className="venues-list">
                        <div className="venue-group">
                          <strong>Dublin:</strong>
                          <ul>
                            <li>Ballybough - 28 Feb 2026</li>
                            <li>Saggart - 21 Mar 2026</li>
                            <li>Tallaght - 17 Jan 2026</li>
                          </ul>
                        </div>
                        <div className="venue-group">
                          <strong>Kildare:</strong>
                          <ul>
                            <li>Athy - 27 Sep 2025</li>
                            <li>Maynooth - 19 Oct 2025</li>
                            <li>Kildare Town - 15 Nov 2025</li>
                          </ul>
                        </div>
                        <div className="venue-group">
                          <strong>Kilkenny:</strong>
                          <ul>
                            <li>Kilkenny City - 11 Jan 2026</li>
                          </ul>
                        </div>
                        <div className="venue-group">
                          <strong>Laois:</strong>
                          <ul>
                            <li>Portlaoise - 07 Feb 2026</li>
                          </ul>
                        </div>
                        <div className="venue-group">
                          <strong>Offaly:</strong>
                          <ul>
                            <li>Tullamore - 22 Nov 2025</li>
                          </ul>
                        </div>
                        <div className="venue-group">
                          <strong>Wexford:</strong>
                          <ul>
                            <li>New Ross - 08 Mar 2026</li>
                          </ul>
                        </div>
                        <div className="venue-group">
                          <strong>Wicklow:</strong>
                          <ul>
                            <li>Bray - 06 Dec 2025</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="detail-item">
                    <i className="fas fa-users"></i>
                    <div>
                      <strong>Group Size:</strong>
                      <span>Small groups (max 15 people)</span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <i className="fas fa-euro-sign"></i>
                    <div>
                      <strong>Investment:</strong>
                      <span>€75.00</span>
                    </div>
                  </div>
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
                Wellness day retreats designed specifically for carers. Because
                those who care for others deserve to be cared for too.
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
                  <a href="#schedule">Schedule</a>
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
