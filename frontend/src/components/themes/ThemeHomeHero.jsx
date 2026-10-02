import React, { useState, useEffect } from 'react';
import { ArrowRight, Leaf, Truck, RotateCcw, ShieldCheck } from 'lucide-react';
import './ThemeHome.css';

export default function ThemeHomeHero() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroImages = [
    '/nordic_hero.png?v=2',
    '/nordic_hero_2.png?v=2',
    '/nordic_hero_3.png?v=2'
  ];

  const fallbackImages = [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1600&q=80'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const categories = [
    { name: 'Living Room', img: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=200&q=80' },
    { name: 'Bedroom', img: 'https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=200&q=80' },
    { name: 'Dining Room', img: 'https://images.unsplash.com/photo-1617806118233-18e1c48e650f?auto=format&fit=crop&w=200&q=80' },
    { name: 'Office', img: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=200&q=80' },
    { name: 'Storage', img: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=200&q=80' },
    { name: 'Lighting', img: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=200&q=80' },
    { name: 'Decor', img: 'https://images.unsplash.com/photo-1513161455079-7dc1de15ef3e?auto=format&fit=crop&w=200&q=80' },
    { name: 'Outdoor', img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=200&q=80' },
  ];

  return (
    <div className="theme-home-wrapper">
      {/* Main Hero */}
      <div className="home-hero position-relative overflow-hidden" style={{ backgroundColor: '#f6f0eb', height: '75vh', minHeight: '600px' }}>
        {heroImages.map((img, index) => (
          <img 
            key={index}
            src={img} 
            alt={`Nordic Living Furniture ${index + 1}`} 
            className="w-100 h-100 position-absolute top-0 start-0 object-fit-cover"
            style={{ 
              opacity: currentSlide === index ? 1 : 0, 
              transition: 'opacity 1s ease-in-out',
              zIndex: currentSlide === index ? 1 : 0
            }}
            onError={(e) => {
              e.target.src = fallbackImages[index];
            }}
          />
        ))}

        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column justify-content-center" style={{ zIndex: 3 }}>
          <div className="container position-relative h-100 d-flex flex-column justify-content-center">
            <div className="hero-content" style={{ 
              maxWidth: '550px', 
              position: 'relative',
              paddingTop: '3rem',
              paddingBottom: '3rem'
            }}>
              <div className="text-uppercase mb-3 fw-bold" style={{ letterSpacing: '2px', fontSize: '11px', color: '#8b7355', textShadow: '0px 0px 8px rgba(255,255,255,0.9)' }}>
                Curated for You.<br/>Crafted for Life.
              </div>
              <h1 className="display-4 fw-bold mb-4" style={{ fontFamily: 'Georgia, serif', lineHeight: '1.1', color: '#1a1a1a', textShadow: '0px 0px 15px rgba(255,255,255,0.8), 0px 0px 30px rgba(255,255,255,0.6)' }}>
                Create a Space<br/>You Truly Love
              </h1>
              <p className="mb-4" style={{ fontSize: '1.05rem', lineHeight: '1.6', color: '#1a1a1a', fontWeight: '500', textShadow: '0px 0px 10px rgba(255,255,255,0.9)' }}>
                Explore our collection of modern, minimalist furniture designed to bring warmth and timeless elegance to your everyday living.
              </p>
              <button className="btn rounded-0 px-4 py-3 text-uppercase fw-bold text-white" style={{ fontSize: '12px', letterSpacing: '1px', backgroundColor: '#7b6348', border: 'none' }}>
                Shop Now <ArrowRight size={14} className="ms-2" />
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
