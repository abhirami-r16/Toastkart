import React from 'react';

export default function ThemeElectronicsHero() {
  return (
    <div className="tech-hero-section">
      <div className="tech-hero-grid">
        <div className="tech-hero-main">
          <div className="tech-hero-overlay">
            <h2 className="tech-hero-title">
              Next-Gen Tech
            </h2>

            <p>
              Experience the future of personal electronics.
            </p>

            <button className="tech-btn">
              Pre-Order Now
            </button>
          </div>

          <img
            src="https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1200&h=600&fit=crop"
            alt="Tech"
            loading="eager"
            fetchpriority="high"
          />
        </div>
      </div>
    </div>
  );
}
