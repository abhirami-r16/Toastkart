import React from 'react';

export default function ThemeGiftHero() {
  return (
    <div className="gift-hero-section">
      <div className="gift-hero-content">
        <h2>The Perfect Gift</h2>

        <p>
          Curated surprises for every special occasion.
        </p>

        <button className="gift-btn">
          Find Gifts
        </button>
      </div>

      <img
        src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&h=600&fit=crop"
        alt="Gifts"
        className="gift-hero-img"
        loading="eager"
        fetchPriority="high"
      />
    </div>
  );
}
