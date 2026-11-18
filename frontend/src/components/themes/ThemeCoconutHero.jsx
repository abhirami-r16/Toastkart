import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ThemeCoconutHero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    {
      img: '/images/cocoamiora-hero-range-v1.jpg',
      alt: 'AMIORA - Handcrafted & Organic Coconut Essentials. Complete range of Cold-Pressed Virgin Oils, Flakes & Coconut Milk.',
    },
    {
      img: '/images/cocoamiora-hero-kitchen-v1.jpg',
      alt: 'AMIORA - 100% Pure Kerala Coconut Oil for Authentic Traditional Cooking.',
    },
  ];

  // Automatically transition between the rotating hero slides every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleScrollToShop = (e) => {
    e.preventDefault();
    const shopEl =
      document.getElementById('shop') ||
      document.querySelector('.coconut-filter-container') ||
      document.querySelector('.storefront-section');
    if (shopEl) {
      shopEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Preload hero images */}
      <link rel="preload" as="image" href={slides[0].img} fetchPriority="high" />
      {slides.slice(1).map((s, idx) => (
        <link key={idx} rel="preload" as="image" href={s.img} />
      ))}

      <div className="storefront-hero-container">
        <div className="coconut-hero-slider-wrap">
          <div className="coconut-hero-slides">
            {slides.map((s, index) => (
              <a
                key={index}
                href="#shop"
                onClick={handleScrollToShop}
                className={`coconut-hero-slide-item ${currentSlide === index ? 'active' : ''}`}
                aria-label={s.alt}
              >
                <img
                  src={s.img}
                  alt={s.alt}
                  className="coconut-hero-slide-img"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                />
              </a>
            ))}
          </div>

          {/* Slider Prev / Next Controls */}
          <button
            type="button"
            className="coconut-hero-arrow coconut-hero-prev"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
            }}
            aria-label="Previous slide"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            className="coconut-hero-arrow coconut-hero-next"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCurrentSlide((prev) => (prev + 1) % slides.length);
            }}
            aria-label="Next slide"
          >
            <ChevronRight size={22} />
          </button>

          {/* Slider Indicator Dots */}
          <div className="coconut-hero-dots">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`coconut-hero-dot ${currentSlide === idx ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentSlide(idx);
                }}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
