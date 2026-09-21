import React from 'react';

export default function ThemeDefaultHero() {
  return (
    <div className="storefront-banner-slider">
      <img
        src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=300&fit=crop"
        alt="Store Banner"
        className="storefront-banner-img"
        loading="eager"
        fetchpriority="high"
      />
    </div>
  );
}
