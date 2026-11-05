import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ThemeBabyHero({ storeName = "AN' NAFI Baby shop" }) {
  const slides = [
    {
      img: '/images/baby-hero-neutral-crib.jpg',
      alt: `${storeName} Cozy Nursery & Bedding Collection`,
      badge: "🌿 Certified Organic & Gentle Care",
      title: "Cozy Spaces for Sweet Dreams",
      subtitle: "Pure cotton blankets, breathable crib bedding, and natural woven storage crafted for your baby's restful sleep.",
      cta: "Shop Nursery & Bedding",
      perk1: "100% Breathable Cotton",
      perk2: "Dermatologist Tested"
    },
    {
      img: '/images/baby-hero-nursery-2.jpg',
      alt: `${storeName} Playtime & Developmental Toys`,
      badge: "✨ Non-Toxic Natural Play",
      title: "Playful Moments, Little Wonders",
      subtitle: "Natural wooden activity gyms, soft cuddly plushies, and sensory toys designed to cherish every little milestone.",
      cta: "Shop Toys & Play",
      perk1: "Child-Safe Organic Finishes",
      perk2: "Pediatrician Loved"
    }
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const minSwipeDistance = 40;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) {
      // Swiped left -> next slide
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    } else if (distance < -minSwipeDistance) {
      // Swiped right -> prev slide
      setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    }
  };

  // Auto-advance every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handlePrev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handleScrollTo = (e, targetId) => {
    e.preventDefault();
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Preload both hero images */}
      <link rel="preload" as="image" href={slides[0].img} fetchPriority="high" />
      <link rel="preload" as="image" href={slides[1].img} />

      <div className="baby-hero-container position-relative overflow-hidden">
        <div
          className="baby-hero-slider-track position-relative w-100"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Background Crossfade Slides */}
          {slides.map((slide, idx) => (
            <div
              key={idx}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: currentSlide === idx ? 1 : 0,
                transition: 'opacity 1.2s ease-in-out',
                pointerEvents: 'none',
                zIndex: currentSlide === idx ? 2 : 1
              }}
            >
              <img
                src={slide.img}
                alt={slide.alt}
                fetchPriority={idx === 0 ? "high" : "low"}
                decoding="async"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  display: 'block'
                }}
              />
            </div>
          ))}

          {/* Related Text Directly Overlaid on the Left (No White Box Card) */}
          <div
            className="baby-hero-overlay position-absolute d-flex align-items-center"
          >
            <div
              className="position-relative w-100"
              style={{
                maxWidth: '560px',
                pointerEvents: 'auto'
              }}
            >
              {slides.map((slide, idx) => (
                <div
                  key={idx}
                  className="baby-hero-text-wrap"
                  style={{
                    position: idx === 0 ? 'relative' : 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    boxShadow: 'none',
                    padding: 0,
                    opacity: currentSlide === idx ? 1 : 0,
                    transform: currentSlide === idx ? 'translateY(0)' : 'translateY(14px)',
                    transition: 'opacity 0.75s ease-in-out, transform 0.75s ease-in-out',
                    pointerEvents: currentSlide === idx ? 'auto' : 'none'
                  }}
                >
                  {/* Badge */}
                  <div
                    className="d-inline-flex align-items-center gap-2 mb-3"
                    style={{
                      background: 'rgba(255, 255, 255, 0.88)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      border: '1px solid rgba(201, 147, 59, 0.35)',
                      color: '#875B10',
                      padding: '6px 16px',
                      borderRadius: '50px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      letterSpacing: '0.3px',
                      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)'
                    }}
                  >
                    {slide.badge}
                  </div>

                  {/* Heading */}
                  <h1
                    className="baby-hero-title"
                    style={{
                      fontFamily: "'Outfit', 'Comfortaa', -apple-system, sans-serif",
                      fontSize: 'clamp(2rem, 3.8vw, 3.15rem)',
                      fontWeight: 800,
                      lineHeight: 1.15,
                      color: '#2D2A26',
                      marginBottom: '0.95rem',
                      letterSpacing: '-0.5px'
                    }}
                  >
                    {slide.title}
                  </h1>

                  {/* Subtitle */}
                  <p
                    className="baby-hero-subtitle"
                    style={{
                      fontFamily: "'Quicksand', -apple-system, sans-serif",
                      fontSize: 'clamp(0.95rem, 1.2vw, 1.1rem)',
                      lineHeight: 1.6,
                      color: '#554A42',
                      marginBottom: '1.65rem',
                      maxWidth: '480px',
                      fontWeight: 600
                    }}
                  >
                    {slide.subtitle}
                  </p>

                  {/* Action Button */}
                  <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
                    <button
                      type="button"
                      className="baby-btn-primary"
                      onClick={(e) => handleScrollTo(e, 'shop')}
                      aria-label={slide.cta}
                      style={{
                        background: 'linear-gradient(135deg, #C9933B 0%, #B07D2B 100%)',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '0.96rem',
                        padding: '13px 32px',
                        borderRadius: '50px',
                        border: 'none',
                        boxShadow: '0 10px 24px rgba(201, 147, 59, 0.35)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease'
                      }}
                    >
                      <span>{slide.cta}</span>
                      <ArrowRight size={17} />
                    </button>
                  </div>

                  {/* Trust Highlights */}
                  <div
                    className="d-flex flex-wrap align-items-center gap-3 pt-2"
                    style={{
                      fontSize: '0.84rem',
                      color: '#63564B',
                      fontWeight: 600
                    }}
                  >
                    <span className="d-inline-flex align-items-center gap-1">
                      <CheckCircle2 size={16} color="#5B8A9F" />
                      {slide.perk1}
                    </span>
                    <span className="d-inline-flex align-items-center gap-1">
                      <CheckCircle2 size={16} color="#5B8A9F" />
                      {slide.perk2}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Left Arrow Button */}
          <button
            type="button"
            aria-label="Previous image"
            className="baby-hero-nav-arrow baby-hero-nav-prev"
            onClick={handlePrev}
            style={{
              position: 'absolute',
              top: '50%',
              left: '20px',
              transform: 'translateY(-50%)',
              zIndex: 5,
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.88)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.95)',
              color: '#4A3443',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
              cursor: 'pointer',
              transition: 'all 0.25s ease'
            }}
          >
            <ChevronLeft size={22} />
          </button>

          {/* Right Arrow Button */}
          <button
            type="button"
            aria-label="Next image"
            className="baby-hero-nav-arrow baby-hero-nav-next"
            onClick={handleNext}
            style={{
              position: 'absolute',
              top: '50%',
              right: '20px',
              transform: 'translateY(-50%)',
              zIndex: 5,
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.88)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.95)',
              color: '#4A3443',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
              cursor: 'pointer',
              transition: 'all 0.25s ease'
            }}
          >
            <ChevronRight size={22} />
          </button>

          {/* Bottom Indicators */}
          <div
            className="position-absolute d-flex gap-2 justify-content-center"
            style={{
              bottom: '22px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 5,
              padding: '6px 14px',
              background: 'rgba(255, 255, 255, 0.82)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderRadius: '50px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
            }}
          >
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Image ${idx + 1}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentSlide(idx);
                }}
                style={{
                  width: currentSlide === idx ? '28px' : '10px',
                  height: '10px',
                  borderRadius: '50px',
                  backgroundColor: currentSlide === idx ? '#C9933B' : 'rgba(201, 147, 59, 0.35)',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'all 0.35s ease'
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
