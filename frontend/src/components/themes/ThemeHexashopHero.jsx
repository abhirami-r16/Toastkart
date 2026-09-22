import React from 'react';

export default function ThemeHexashopHero() {
  return (
    <div className="hexashop-hero-section">
      <div className="hexashop-hero-left">
        <div className="hexashop-hero-item large">
          <img
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=800&fit=crop"
            alt="Fashion"
            loading="eager"
            fetchPriority="high"
          />

          <div className="hexashop-hero-content">
            <h2>Elara Boutique</h2>
            <span>
              Awesome, clean &amp; creative boutique fashion
            </span>

            <button className="hexashop-btn">
              Purchase Now!
            </button>
          </div>
        </div>
      </div>

      <div className="hexashop-hero-right">
        <div className="hexashop-hero-item">
          <img
            src="https://images.unsplash.com/photo-1515347619252-73a7266100b7?w=400&h=400&fit=crop"
            alt="Dresses"
            loading="lazy"
            decoding="async"
          />

          <div className="hexashop-hero-content small-content">
            <h4>Dresses</h4>
            <span>Evening & Casual</span>
          </div>
        </div>

        <div className="hexashop-hero-item">
          <img
            src="https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=400&h=400&fit=crop"
            alt="Handbags"
            loading="lazy"
            decoding="async"
          />

          <div className="hexashop-hero-content small-content">
            <h4>Handbags</h4>
            <span>Luxury & Everyday</span>
          </div>
        </div>

        <div className="hexashop-hero-item">
          <img
            src="https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=400&fit=crop"
            alt="Shoes"
            loading="lazy"
            decoding="async"
          />

          <div className="hexashop-hero-content small-content">
            <h4>Shoes</h4>
            <span>Heels & Flats</span>
          </div>
        </div>

        <div className="hexashop-hero-item">
          <img
            src="https://images.unsplash.com/photo-1509319117193-57bab727e09d?w=400&h=400&fit=crop"
            alt="Accessories"
            loading="lazy"
            decoding="async"
          />

          <div className="hexashop-hero-content small-content">
            <h4>Accessories</h4>
            <span>Jewelry & Shades</span>
          </div>
        </div>
      </div>
    </div>
  );
}
