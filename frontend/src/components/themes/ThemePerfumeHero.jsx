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
      <link rel="preload" as="image" href={slides[0]} />
      <div className="storefront-hero-container">
        <div className="storefront-hero" style={{ position: 'relative' }}>
          {slides.map((slide, index) => (
            <div
              key={index}
              className="hero-background"
              style={{
                backgroundImage: `url(${slide})`,
                opacity: currentSlide === index ? 1 : 0,
                transition: 'opacity 1.5s ease',
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                zIndex: 1,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            ></div>
          ))}


<div className="hero-overlay">
  

  </div>
        </div>
      </div>
    </>
  );
}
