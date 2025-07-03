// Mobile Navigation Toggle
document.addEventListener("DOMContentLoaded", function () {
  const hamburger = document.querySelector(".hamburger");
  const navMenu = document.querySelector(".nav-menu");
  const navLinks = document.querySelectorAll(".nav-menu a");

  // Toggle mobile menu
  hamburger.addEventListener("click", function () {
    hamburger.classList.toggle("active");
    navMenu.classList.toggle("active");
  });

  // Close mobile menu when clicking on a link
  navLinks.forEach((link) => {
    link.addEventListener("click", function () {
      hamburger.classList.remove("active");
      navMenu.classList.remove("active");
    });
  });

  // Smooth scrolling for navigation links
  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      if (this.getAttribute("href").startsWith("#")) {
        e.preventDefault();
        const targetId = this.getAttribute("href");
        const targetSection = document.querySelector(targetId);

        if (targetSection) {
          const offsetTop = targetSection.offsetTop - 70; // Account for fixed navbar
          window.scrollTo({
            top: offsetTop,
            behavior: "smooth",
          });
        }
      }
    });
  });

  // Navbar background on scroll
  window.addEventListener("scroll", function () {
    const navbar = document.querySelector(".navbar");
    if (window.scrollY > 50) {
      navbar.style.background = "rgba(255, 255, 255, 0.98)";
      navbar.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.1)";
    } else {
      navbar.style.background = "rgba(255, 255, 255, 0.95)";
      navbar.style.boxShadow = "none";
    }
  });

  // Form submission handler
  const contactForm = document.querySelector(".contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // Get form data
      const formData = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        datePreference: document.getElementById("date-preference").value,
        requirements: document.getElementById("requirements").value,
      };

      // Basic validation
      if (
        !formData.name ||
        !formData.email ||
        !formData.phone ||
        !formData.datePreference
      ) {
        showNotification("Please fill in all required fields.", "error");
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        showNotification("Please enter a valid email address.", "error");
        return;
      }

      // Phone validation (basic)
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ""))) {
        showNotification("Please enter a valid phone number.", "error");
        return;
      }

      // Show loading state
      const submitButton = this.querySelector('button[type="submit"]');
      const originalText = submitButton.innerHTML;
      submitButton.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Processing...';
      submitButton.disabled = true;

      // Simulate form submission (replace with actual Stripe integration)
      setTimeout(() => {
        showNotification(
          "Thank you! We'll contact you soon to confirm your booking and process payment.",
          "success"
        );

        // Reset form and button
        contactForm.reset();
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;

        // Track conversion
        trackEvent("form_submission", "booking_form", formData.datePreference);
      }, 2000);

      // In a real implementation, you would:
      // 1. Send form data to your backend
      // 2. Integrate with Stripe for payment processing
      // 3. Send confirmation emails
      console.log("Form data:", formData);
    });
  }

  // Intersection Observer for animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
        entry.target.classList.add("animated");
      }
    });
  }, observerOptions);

  // Observe elements for animation
  const animatedElements = document.querySelectorAll(
    ".experience-card, .story-content, .booking-content"
  );
  animatedElements.forEach((el) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(30px)";
    el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
    observer.observe(el);
  });

  // CTA button interactions
  const ctaButtons = document.querySelectorAll(".cta-button");
  ctaButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
      // Add click animation
      this.style.transform = "scale(0.98)";
      setTimeout(() => {
        this.style.transform = "";
      }, 150);
    });
  });

  // SEO and Analytics helpers
  // Track booking button clicks for analytics
  const bookingButtons = document.querySelectorAll(
    'a[href="#booking"], .cta-button'
  );
  bookingButtons.forEach((button) => {
    button.addEventListener("click", function () {
      trackEvent("click", "booking_button", this.textContent.trim());
    });
  });

  // Performance optimization: Lazy loading for images
  lazyLoadImages();

  // Initialize other features
  initializeCounters();
  initializeParallaxEffects();
  initializeTooltips();
});

// Utility function for notifications
function showNotification(message, type = "info") {
  // Remove existing notifications
  const existingNotification = document.querySelector(".notification");
  if (existingNotification) {
    existingNotification.remove();
  }

  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${
              type === "success" ? "fa-check-circle" : "fa-exclamation-circle"
            }"></i>
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;

  // Add styles
  notification.style.cssText = `
        position: fixed;
        top: 90px;
        right: 20px;
        background: ${type === "success" ? "#38a169" : "#e53e3e"};
        color: white;
        padding: 1rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        z-index: 1001;
        min-width: 300px;
        max-width: 400px;
        animation: slideInRight 0.3s ease;
    `;

  const content = notification.querySelector(".notification-content");
  content.style.cssText = `
        display: flex;
        align-items: center;
        gap: 0.75rem;
    `;

  const closeBtn = notification.querySelector(".notification-close");
  closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        margin-left: auto;
        padding: 0;
        width: auto;
        height: auto;
    `;

  // Add to page
  document.body.appendChild(notification);

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = "slideOutRight 0.3s ease";
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);

  // Close button functionality
  closeBtn.addEventListener("click", () => {
    notification.style.animation = "slideOutRight 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  });
}

// Performance optimization: Lazy loading for images
function lazyLoadImages() {
  const images = document.querySelectorAll("img[data-src]");
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove("lazy");
        img.classList.add("loaded");
        imageObserver.unobserve(img);
      }
    });
  });

  images.forEach((img) => {
    img.classList.add("lazy");
    imageObserver.observe(img);
  });
}

// Initialize counter animations
function initializeCounters() {
  const counters = document.querySelectorAll(".counter");
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const counter = entry.target;
        const target = parseInt(counter.dataset.target);
        const duration = parseInt(counter.dataset.duration) || 2000;
        animateCounter(counter, target, duration);
        counterObserver.unobserve(counter);
      }
    });
  });

  counters.forEach((counter) => {
    counterObserver.observe(counter);
  });
}

// Animate counter function
function animateCounter(element, target, duration) {
  let start = 0;
  const increment = target / (duration / 16);

  const timer = setInterval(() => {
    start += increment;
    if (start >= target) {
      element.textContent = target;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(start);
    }
  }, 16);
}

// Initialize parallax effects
function initializeParallaxEffects() {
  const parallaxElements = document.querySelectorAll(".parallax");

  if (parallaxElements.length > 0) {
    window.addEventListener("scroll", () => {
      const scrolled = window.pageYOffset;
      const rate = scrolled * -0.5;

      parallaxElements.forEach((element) => {
        element.style.transform = `translateY(${rate}px)`;
      });
    });
  }
}

// Initialize tooltips
function initializeTooltips() {
  const tooltipElements = document.querySelectorAll("[data-tooltip]");

  tooltipElements.forEach((element) => {
    element.addEventListener("mouseenter", function () {
      const tooltip = createTooltip(this.dataset.tooltip);
      document.body.appendChild(tooltip);
      positionTooltip(tooltip, this);
    });

    element.addEventListener("mouseleave", function () {
      const tooltip = document.querySelector(".tooltip");
      if (tooltip) {
        tooltip.remove();
      }
    });
  });
}

// Create tooltip element
function createTooltip(text) {
  const tooltip = document.createElement("div");
  tooltip.className = "tooltip";
  tooltip.textContent = text;
  tooltip.style.cssText = `
        position: absolute;
        background: #1a202c;
        color: white;
        padding: 0.5rem 0.75rem;
        border-radius: 0.25rem;
        font-size: 0.875rem;
        z-index: 1000;
        white-space: nowrap;
        opacity: 0;
        transition: opacity 0.2s ease;
        pointer-events: none;
    `;

  setTimeout(() => {
    tooltip.style.opacity = "1";
  }, 10);

  return tooltip;
}

// Position tooltip
function positionTooltip(tooltip, element) {
  const rect = element.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();

  let top = rect.top - tooltipRect.height - 8;
  let left = rect.left + rect.width / 2 - tooltipRect.width / 2;

  // Adjust if tooltip goes off screen
  if (top < 0) {
    top = rect.bottom + 8;
  }

  if (left < 8) {
    left = 8;
  } else if (left + tooltipRect.width > window.innerWidth - 8) {
    left = window.innerWidth - tooltipRect.width - 8;
  }

  tooltip.style.top = `${top + window.pageYOffset}px`;
  tooltip.style.left = `${left}px`;
}

// Analytics tracking function
function trackEvent(action, category, label) {
  // Google Analytics 4
  if (typeof gtag !== "undefined") {
    gtag("event", action, {
      event_category: category,
      event_label: label,
    });
  }

  // Facebook Pixel
  if (typeof fbq !== "undefined") {
    fbq("track", "CustomEvent", {
      action: action,
      category: category,
      label: label,
    });
  }

  // Console log for development
  console.log("Event tracked:", { action, category, label });
}

// Form field enhancements
document.addEventListener("DOMContentLoaded", function () {
  // Add floating labels effect
  const formGroups = document.querySelectorAll(".form-group");
  formGroups.forEach((group) => {
    const input = group.querySelector("input, select, textarea");
    const label = group.querySelector("label");

    if (input && label) {
      input.addEventListener("focus", () => {
        label.style.transform = "translateY(-1.5rem) scale(0.875)";
        label.style.color = "#2b6cb0";
      });

      input.addEventListener("blur", () => {
        if (!input.value) {
          label.style.transform = "";
          label.style.color = "";
        }
      });
    }
  });

  // Phone number formatting
  const phoneInput = document.getElementById("phone");
  if (phoneInput) {
    phoneInput.addEventListener("input", function (e) {
      // Remove non-digit characters
      let value = e.target.value.replace(/\D/g, "");

      // Format as (XXX) XXX-XXXX
      if (value.length >= 6) {
        value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(
          6,
          10
        )}`;
      } else if (value.length >= 3) {
        value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
      }

      e.target.value = value;
    });
  }
});

// Add CSS for animations and effects
const style = document.createElement("style");
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .lazy {
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    .lazy.loaded {
        opacity: 1;
    }
    
    .hamburger.active span:nth-child(1) {
        transform: rotate(-45deg) translate(-5px, 6px);
    }
    
    .hamburger.active span:nth-child(2) {
        opacity: 0;
    }
    
    .hamburger.active span:nth-child(3) {
        transform: rotate(45deg) translate(-5px, -6px);
    }
    
    .form-group label {
        transition: all 0.2s ease;
        transform-origin: left top;
    }
    
    .tooltip {
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .tooltip::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        margin-left: -5px;
        border-width: 5px;
        border-style: solid;
        border-color: #1a202c transparent transparent transparent;
    }
`;
document.head.appendChild(style);

// Service Worker registration for PWA capabilities (optional)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("/sw.js").then(
      function (registration) {
        console.log("ServiceWorker registration successful");
      },
      function (err) {
        console.log("ServiceWorker registration failed");
      }
    );
  });
}

// Error handling for network issues
window.addEventListener("online", function () {
  showNotification("Connection restored", "success");
});

window.addEventListener("offline", function () {
  showNotification("You are currently offline", "error");
});

// Accessibility enhancements
document.addEventListener("keydown", function (e) {
  // Escape key closes mobile menu
  if (e.key === "Escape") {
    const hamburger = document.querySelector(".hamburger");
    const navMenu = document.querySelector(".nav-menu");
    if (navMenu.classList.contains("active")) {
      hamburger.classList.remove("active");
      navMenu.classList.remove("active");
    }

    // Close notifications
    const notification = document.querySelector(".notification");
    if (notification) {
      notification.remove();
    }
  }
});

// Print optimization
window.addEventListener("beforeprint", function () {
  // Hide navigation and footer for printing
  document.querySelector(".navbar").style.display = "none";
  document.querySelector(".footer").style.display = "none";
});

window.addEventListener("afterprint", function () {
  // Restore navigation and footer after printing
  document.querySelector(".navbar").style.display = "";
  document.querySelector(".footer").style.display = "";
});
