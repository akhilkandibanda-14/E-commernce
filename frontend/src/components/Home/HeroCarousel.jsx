import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { openBulkEnquiry } from "../../utils/events";
import { useSiteContent } from "../../context/SiteContentContext";
import { HOME_PAGE_DEFAULTS } from "../../data/homePageDefaults";
import "../../styles/carousel.css";

const HeroCarousel = () => {
  const { homePage } = useSiteContent();
  const carouselConfig = homePage.heroCarousel || HOME_PAGE_DEFAULTS.heroCarousel;
  
  // Extract and filter active slides. Fallback to default slides if none are configured/active.
  const rawSlides = Array.isArray(carouselConfig?.slides) && carouselConfig.slides.length > 0
    ? carouselConfig.slides
    : HOME_PAGE_DEFAULTS.heroCarousel.slides;
  
  const activeSlides = rawSlides.filter((s) => s.isActive !== false);
  const slides = activeSlides.length > 0 ? activeSlides : rawSlides;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const timerRef = useRef(null);

  const autoplay = carouselConfig?.autoplay !== false && slides.length > 1;
  const intervalSeconds = Math.max(2, Math.min(60, Number(carouselConfig?.interval) || 5));

  const goToSlide = useCallback((index) => {
    setCurrentIndex((index + slides.length) % slides.length);
  }, [slides.length]);

  const nextSlide = useCallback(() => {
    goToSlide(currentIndex + 1);
  }, [currentIndex, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentIndex - 1);
  }, [currentIndex, goToSlide]);

  // Autoplay effect with pause-on-hover
  useEffect(() => {
    if (!autoplay || isPaused) return;

    timerRef.current = setTimeout(() => {
      nextSlide();
    }, intervalSeconds * 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [autoplay, isPaused, currentIndex, intervalSeconds, nextSlide]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === "ArrowLeft") {
      prevSlide();
    } else if (e.key === "ArrowRight") {
      nextSlide();
    }
  };

  // Touch swipe support for mobile/tablet
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 45) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    setTouchStartX(null);
  };

  const currentSlide = slides[currentIndex] || slides[0];

  return (
    <section
      className="gw-hero gw-hero-carousel-container"
      aria-label="Featured Highlights Carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      tabIndex={0}
    >
      <div className="container gw-hero-carousel-wrapper">
        {/* Carousel Slide Track */}
        <div className="gw-carousel-slides">
          {slides.map((slide, idx) => {
            const isActive = idx === currentIndex;
            return (
              <div
                key={slide.id || idx}
                className={`gw-carousel-slide ${isActive ? "active" : ""}`}
                aria-hidden={!isActive}
              >
                <div className="gw-hero-grid">
                  {/* Left Column: Copy & Actions */}
                  <div className="gw-hero-copy">
                    {slide.badge && (
                      <div className="gw-carousel-kicker">
                        <i className="fa-solid fa-sparkles" aria-hidden="true"></i>
                        <span>{slide.badge}</span>
                      </div>
                    )}

                    <h1 className="gw-hero-title">
                      {slide.title}
                    </h1>

                    {slide.subtitle && (
                      <p className="gw-hero-lead">{slide.subtitle}</p>
                    )}

                    <div className="gw-hero-actions">
                      {slide.primaryCtaText && (
                        <Link
                          to={slide.primaryCtaLink || "/products"}
                          className="btn-luxury btn-primary"
                        >
                          {slide.primaryCtaText}
                        </Link>
                      )}
                      {slide.secondaryCtaText && (
                        <button
                          type="button"
                          className="btn-luxury btn-outline"
                          onClick={() => {
                            if (slide.secondaryCtaLink && slide.secondaryCtaLink !== "/cart") {
                              window.location.href = slide.secondaryCtaLink;
                            } else {
                              openBulkEnquiry();
                            }
                          }}
                        >
                          {slide.secondaryCtaText}
                        </button>
                      )}
                    </div>

                    <ul className="gw-hero-promises">
                      <li>
                        <i className="fa-solid fa-check" aria-hidden="true"></i>
                        Your logo printed or engraved
                      </li>
                      <li>
                        <i className="fa-solid fa-check" aria-hidden="true"></i>
                        GST 18% compliant invoice
                      </li>
                      <li>
                        <i className="fa-solid fa-check" aria-hidden="true"></i>
                        Pan-India express delivery
                      </li>
                    </ul>
                  </div>

                  {/* Right Column: Signature Luxury Arch Frame Media */}
                  <figure className="gw-hero-media">
                    <div className="gw-hero-arch">
                      <img
                        src={slide.image}
                        alt={slide.imageAlt || slide.title || "Gifting showcase"}
                        width="1100"
                        height="733"
                        loading={idx === 0 ? "eager" : "lazy"}
                      />
                    </div>
                    {(slide.tagTitle || slide.tagText) && (
                      <figcaption className="gw-hero-tag">
                        {slide.tagTitle && (
                          <span className="gw-hero-tag-title">{slide.tagTitle}</span>
                        )}
                        {slide.tagText && (
                          <span className="gw-hero-tag-text">{slide.tagText}</span>
                        )}
                      </figcaption>
                    )}
                  </figure>
                </div>
              </div>
            );
          })}
        </div>

        {/* Carousel Bottom Controls & Indicators */}
        {slides.length > 1 && (
          <div className="gw-carousel-controls">
            {/* Prev Arrow */}
            <button
              type="button"
              className="gw-carousel-arrow gw-carousel-arrow-prev"
              onClick={prevSlide}
              aria-label="Previous slide"
            >
              <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
            </button>

            {/* Pagination Dots */}
            <div className="gw-carousel-indicators" role="tablist">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  role="tab"
                  aria-selected={idx === currentIndex}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`gw-carousel-dot ${idx === currentIndex ? "active" : ""}`}
                  onClick={() => goToSlide(idx)}
                >
                  {idx === currentIndex && autoplay && !isPaused && (
                    <span
                      className="gw-carousel-progress"
                      style={{ animationDuration: `${intervalSeconds}s` }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Slide Index Counter */}
            <span className="gw-carousel-counter" aria-live="polite">
              <strong>{String(currentIndex + 1).padStart(2, "0")}</strong> / {String(slides.length).padStart(2, "0")}
            </span>

            {/* Next Arrow */}
            <button
              type="button"
              className="gw-carousel-arrow gw-carousel-arrow-next"
              onClick={nextSlide}
              aria-label="Next slide"
            >
              <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroCarousel;
