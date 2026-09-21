import React from 'react';

export default function ThemeJewelryHero({ jewelrySlide }) {
  const jewelryBgs = [
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338',
    'https://images.unsplash.com/photo-1605100804763-247f67b2548e',
    'https://images.unsplash.com/photo-1611591437281-460bfbe1220a',
    'https://images.unsplash.com/photo-1599643477877-530eb83abc8e',
    'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed',
    'https://images.unsplash.com/photo-1622398925373-3f91b1e275f5',
  ];
  
  const isMobileView = typeof window !== 'undefined' && window.innerWidth < 768;
  const imgWidth = isMobileView ? '800' : '1600';

  return (
    <div className="jewelry-hero-section">
      {jewelryBgs.map((bg, idx) => (
        <div
          key={idx}
          className={`jewelry-hero-bg ${idx === jewelrySlide ? 'active' : ''
            }`}
          style={{
            backgroundImage: (idx === 0 || jewelrySlide > 0) ? `url(${bg}?w=${imgWidth}&h=800&fit=crop)` : 'none',
          }}
        />
      ))}

      <div className="jewelry-hero-content-wrapper">
        <div className="jewelry-hero-text-block">
          <span className="jewelry-hero-tag">
            Exclusive Collection
          </span>

          <h1 className="jewelry-hero-title">
            Timeless Beauty
            <br />
            <span>Crafted with Love</span>
          </h1>

          <button
            className="jewelry-btn"
            onClick={() => {
              const el =
                document.getElementById('products') ||
                document.querySelector(
                  '.storefront-section'
                );

              if (el) {
                el.scrollIntoView({
                  behavior: 'smooth',
                });
              }
            }}
          >
            Purchase Now
          </button>
        </div>
      </div>
    </div>
  );
}
