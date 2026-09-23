import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function ThemePerfumeHero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    '/images/perfume-hero-floral-2.png',
    '/images/perfume-hero-floral-3.png',
    '/images/perfume-freeze-in-flames.png',
    '/images/fleur-oceane.jpg'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <>
      {/* Preload only the first (LCP) hero image */}
      <link rel="preload" as="image" href={slides[0]} fetchpriority="high" />
      <div className="storefront-hero-container">
        <div className="storefront-hero" style={{ position: 'relative' }}>
          {slides.map((slide, index) => (
            <picture
              key={index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1,
                opacity: currentSlide === index ? 1 : 0,
                transition: 'opacity 1.5s ease',
                overflow: 'hidden',
              }}
            >
              <source type="image/webp" srcSet={`${slide}.webp`} />
              <img
                src={slide}
                alt="Perfume hero slide"
                loading={index === 0 ? "eager" : "lazy"}
                fetchpriority={index === 0 ? "high" : undefined}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </picture>
          ))}


<div className="hero-overlay">
  

  </div>
        </div>
      </div>
    </>
  );
}
