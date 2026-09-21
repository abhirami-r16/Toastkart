import React from 'react';

export default function ThemeBeautyHero({ beautySlide }) {
  const beautyImages = [
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348",
    "https://images.unsplash.com/photo-1620916566398-39f1143ab7be",
    "https://images.unsplash.com/photo-1571781926291-c477ebfd024b",
    "https://images.unsplash.com/photo-1556228578-0d85b1a4d571",
    "https://images.unsplash.com/photo-1522337660859-02fbefca4702",
    "https://images.unsplash.com/photo-1556228578-0d85b1a4d571"
  ];
  
  const isMobileView = typeof window !== 'undefined' && window.innerWidth < 768;
  const imgWidth = isMobileView ? '800' : '1920';

  return (
    <div className="beauty-hero-section">
      {/* Full Background Slider */}
      <div className="beauty-hero-bg-container">
        {beautyImages.map((img, idx) => (
          <img
            key={idx}
            src={(idx === 0 || beautySlide > 0) ? `${img}?w=${imgWidth}&h=800&fit=crop&fm=webp&q=80` : ''}
            className="beauty-hero-bg-img"
            alt={`Cosmetics ${idx + 1}`}
            loading={idx === 0 ? "eager" : "lazy"}
            fetchpriority={idx === 0 ? "high" : "auto"}
            decoding="async"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: idx === beautySlide ? 1 : 0,
              transition: 'opacity 1.5s ease-in-out',
              zIndex: 1
            }}
          />
        ))}
        {/* Overlay for text readability */}
        <div className="beauty-hero-overlay"></div>
      </div>

      <div className="beauty-hero-text">
        <span className="beauty-tag">
          PREMIUM COLLECTION
        </span>

        <h1 className="beauty-title">
          Discover Your <br />Natural Radiance.
        </h1>

        <p className="beauty-subtitle">
          Elevate your daily skincare routine with our exclusive, dermatologist-tested organic essentials crafted for your perfect glow.
        </p>

        <button className="beauty-btn">
          Explore Collection
        </button>
      </div>

    </div>
  );
}
