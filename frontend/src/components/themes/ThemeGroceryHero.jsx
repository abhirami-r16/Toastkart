import React from 'react';

export default function ThemeGroceryHero() {
  return (
    <div className="grocery-hero-section">
      <div className="grocery-hero-banner">
        <img
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=1600&h=500&fit=crop"
          alt="Fresh Groceries"
          loading="eager"
          fetchpriority="high"
        />

        <div className="grocery-hero-content">
          <h2>Fresh & Organic</h2>

          <p>
            Farm-fresh produce delivered straight to your
            door.
          </p>

          <button className="grocery-btn">
            Shop Fresh
          </button>
        </div>
      </div>
    </div>
  );
}
