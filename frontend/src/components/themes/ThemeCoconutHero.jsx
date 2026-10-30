import React, { useState, useEffect } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ThemeCoconutHero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    {
      img: '/images/coconut-thenga-hero.jpg',
      badge: '100% Organic',
      title: 'Welcome to the world of Coconut!',
      subtitle: 'Embrace pure, sustainable living with 100% natural and handcrafted coconut essentials',
      cta: 'SHOP COLLECTION',
      href: '#shop'
    },
    {
      img: '/images/coconut-kerala-culture.jpg',
      badge: 'Traditional Heritage Living',
      title: 'Rooted in Kerala Culture',
      subtitle: 'Cold-pressed virgin coconut oil, pure white coconuts and sustainable handcrafted living',
      cta: 'DISCOVER CRAFTS',
      href: '#cold-pressed-oils'
    },
    {
      img: '/images/coconut-hero-slide-1.jpg',
      badge: 'Traditional Wood Extraction',
      title: 'Pure Kerala Virgin Coconut Oil',
      subtitle: 'Harvested directly from coastal coconut groves in God\'s Own Country',
      cta: 'EXPLORE OILS',
      href: '#oils'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const active = slides[currentSlide];

  return (
    <>
      {/* Preload LCP hero image */}
      <link rel="preload" as="image" href={slides[0].img} fetchPriority="high" />

      <div className="storefront-hero-container">
        <div className="coconut-hero">
          {slides.map((s, index) => (
            <div
              key={index}
              className={`coconut-hero-slide ${currentSlide === index ? 'active' : ''}`}
              style={{
                backgroundImage: `url(${s.img})`,
                opacity: currentSlide === index ? 1 : 0,
                zIndex: 1,
              }}
            />
          ))}

          {/* Tropical Gradient Overlay */}
          <div className="coconut-hero-overlay">
            <div className="container">
              <div className="coconut-hero-content">
                <div className="coconut-hero-badge">
                  {active.badge}
                </div>

                <h1 className="coconut-hero-title">
                  {active.title}
                </h1>

                <p className="coconut-hero-subtitle">
                  {active.subtitle}
                </p>

                <div className="d-flex gap-3 justify-content-center align-items-center mt-4">
                  <a href={active.href} className="coconut-btn-thenga">
                    {active.cta} <ArrowRight size={16} />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Slider Prev / Next Arrows */}
          <button
            type="button"
            className="coconut-hero-arrow coconut-hero-prev"
            onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
            aria-label="Previous slide"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            className="coconut-hero-arrow coconut-hero-next"
            onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
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
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
