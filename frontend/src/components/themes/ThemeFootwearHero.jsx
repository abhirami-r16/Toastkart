import React from 'react';

export default function ThemeFootwearHero() {
  return (
    <div className="footwear-hero-section">
      <div className="footwear-hero-content">
        <h2>
          Step Up Your <span>Sneaker</span> Game
        </h2>
        <p>
          Exclusive drops and premium comfort for the urban
          explorer.
        </p>
        <button className="footwear-btn">Shop Kicks</button>
      </div>
      <img
        src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1000&h=800&fit=crop"
        className="footwear-hero-img"
        alt="Sneaker"
        loading="eager"
        fetchpriority="high"
      />
    </div>
  );
}
