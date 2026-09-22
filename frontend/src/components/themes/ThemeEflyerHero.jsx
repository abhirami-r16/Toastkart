import React from 'react';

export default function ThemeEflyerHero({ eflyerSlide }) {
  const eflyerSlides = [
    {
      bg: '/banner-bg-desktop.webp',
      title: 'UP TO 65% OFF<br />ENJOY YOUR SHOPPING',
      btn: 'Shop Now',
    },
    {
      bg: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&h=800&fit=crop',
      title: "NEW ARRIVALS<br />WOMEN'S BOUTIQUE",
      btn: 'Shop Collection',
    },
    {
      bg: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1600&h=800&fit=crop',
      title: 'EXCLUSIVE OFFERS<br />UP TO 50% OFF',
      btn: 'Explore Deals',
    },
  ];

  const slide = eflyerSlides[eflyerSlide];

  return (
    <div
      className="eflyer-hero position-relative overflow-hidden"
      style={{
        background: 'transparent',
      }}
    >
      {eflyerSlides.map((s, idx) => (
        idx === 0 ? (
          <img
            key={`bg-${idx}`}
            className="position-absolute top-0 start-0 w-100 h-100"
            srcSet="/banner-bg-mobile.webp 800w, /banner-bg-tablet.webp 1200w, /banner-bg-desktop.webp 1920w"
            sizes="100vw"
            src="/banner-bg-desktop.webp"
            alt=""
            fetchpriority="high"
            loading="eager"
            style={{
              objectFit: 'cover',
              objectPosition: 'center',
              opacity: eflyerSlide === idx ? 1 : 0,
              transition: 'opacity 1s ease-in-out',
              zIndex: 1,
            }}
          />
        ) : (
          <img
            key={`bg-${idx}`}
            className="position-absolute top-0 start-0 w-100 h-100"
            src={s.bg}
            alt=""
            loading="lazy"
            decoding="async"
            style={{
              objectFit: 'cover',
              objectPosition: 'center',
              opacity: eflyerSlide === idx ? 1 : 0,
              transition: 'opacity 1s ease-in-out',
              zIndex: 1,
            }}
          />
        )
      ))}

      <div
        className="eflyer-hero-content position-relative"
        key={`content-${eflyerSlide}`}
        style={{
          zIndex: 2,
        }}
      >
        <h1
          className="eflyer-hero-title"
          dangerouslySetInnerHTML={{
            __html: slide.title,
          }}
        />

        <button className="eflyer-hero-btn">
          {slide.btn}
        </button>
      </div>
    </div>
  );
}
