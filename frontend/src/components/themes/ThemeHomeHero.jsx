import React from 'react';

export default function ThemeHomeHero({ aranozSlide }) {
  const aranozSlides = [
    {
      title: 'Wood & Cloth<br/>Sofa',
      subtitle:
        'Incididunt ut labore et dolore magna aliqua quis ipsum suspendisse ultrices gravida. Risus commodo viverra',
      img: 'https://raw.githubusercontent.com/themewagon/aranoz/master/img/banner_img.png',
    },
    {
      title: 'Premium Quality<br/>Furniture',
      subtitle:
        'Discover our new collection of comfortable and stylish living room furniture designed for modern homes.',
      img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=600&fit=crop',
    },
    {
      title: 'Minimalist<br/>Living',
      subtitle:
        'Transform your space with our curated selection of minimalist decor and functional pieces.',
      img: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=600&fit=crop',
    },
  ];

  const currentSlide = aranozSlides[aranozSlide] || aranozSlides[0];

  return (
    <div className="aranoz-hero-section">
      <div
        className="aranoz-hero-container"
        key={aranozSlide}
      >
        <div className="aranoz-hero-text animated">
          <h1
            dangerouslySetInnerHTML={{
              __html: currentSlide.title,
            }}
          />

          <p>{currentSlide.subtitle}</p>

          <button
            className="btn_2"
            onClick={() => {
              const el =
                document.getElementById('products');

              if (el) {
                el.scrollIntoView({
                  behavior: 'smooth',
                });
              }
            }}
          >
            BUY NOW
          </button>
        </div>

        <div className="aranoz-hero-img animated">
          <img
            src={currentSlide.img}
            alt="Hero"
            style={{
              borderRadius: '15px',
            }}
            loading="eager"
            fetchpriority="high"
          />
        </div>
      </div>
    </div>
  );
}
