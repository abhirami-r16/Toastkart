import React from 'react';
import { ArrowRight, Check, Heart, Mail, Leaf, ShieldCheck } from 'lucide-react';
import './ThemeHome.css';

export default function ThemeHomeFooter() {
  return (
    <div className="theme-home-footer-wrapper">
      {/* Promo Banners */}
      <div className="container pb-5 mb-5 pt-5 mt-3">
        <div className="row g-4">
          <div className="col-md-6">
            <div className="position-relative overflow-hidden promo-banner" style={{ height: '350px', backgroundColor: '#f0ece6' }}>
              <img src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80" alt="Modern Living" className="position-absolute end-0 bottom-0 h-100 w-75 object-fit-cover" style={{ objectPosition: 'right' }}/>
              <div className="position-absolute top-0 start-0 w-100 h-100" style={{ background: 'linear-gradient(90deg, #f0ece6 45%, transparent 100%)' }}></div>
              <div className="position-relative h-100 d-flex flex-column justify-content-center p-5 w-75">
                <div className="text-uppercase fw-bold mb-2" style={{ fontSize: '11px', letterSpacing: '1px', color: '#8b7355' }}>Featured Collection</div>
                <h3 className="fw-bold mb-3" style={{ fontFamily: 'Georgia, serif' }}>Modern Living<br/>Room Collection</h3>
                <p className="text-muted mb-4" style={{ fontSize: '13px' }}>Sofas, coffee tables and more — designed for real life.</p>
                <div>
                  <button className="btn btn-dark rounded-0 px-4 py-2 text-uppercase fw-bold" style={{ fontSize: '11px', letterSpacing: '1px', backgroundColor: '#8b7355', border: 'none' }}>
                    Explore <ArrowRight size={12} className="ms-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="position-relative overflow-hidden promo-banner" style={{ height: '350px', backgroundColor: '#e8ebe9' }}>
              <img src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80" alt="Bedroom Essentials" className="position-absolute end-0 bottom-0 h-100 w-75 object-fit-cover" style={{ objectPosition: 'right' }}/>
              <div className="position-absolute top-0 start-0 w-100 h-100" style={{ background: 'linear-gradient(90deg, #e8ebe9 45%, transparent 100%)' }}></div>
              <div className="position-relative h-100 d-flex flex-column justify-content-center p-5 w-75">
                <div className="text-uppercase fw-bold mb-2" style={{ fontSize: '11px', letterSpacing: '1px', color: '#6a7c73' }}>Bedroom Essentials</div>
                <h3 className="fw-bold mb-3" style={{ fontFamily: 'Georgia, serif' }}>Restful.<br/>Stylish. Yours.</h3>
                <p className="text-muted mb-4" style={{ fontSize: '13px' }}>Beds and storage solutions for a better tomorrow.</p>
                <div>
                  <button className="btn btn-dark rounded-0 px-4 py-2 text-uppercase fw-bold" style={{ fontSize: '11px', letterSpacing: '1px', backgroundColor: '#6a7c73', border: 'none' }}>
                    Shop Bedroom <ArrowRight size={12} className="ms-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Section */}
      <div className="container py-5 my-5 text-center">
        <div className="mx-auto" style={{ maxWidth: '800px' }}>
          <h2 className="display-6 fw-bold mb-4" style={{ fontFamily: 'Georgia, serif', color: '#1a1a1a', lineHeight: '1.4' }}>
            "Our philosophy is simple: surround yourself with things that bring you peace, and the rest will follow."
          </h2>
          <div className="text-uppercase fw-bold" style={{ letterSpacing: '2px', fontSize: '12px', color: '#8b7355' }}>
            — The Rinucraft Team
          </div>
        </div>
      </div>

      {/* Timeless Design Split Section */}
      <div className="container-fluid p-0 mb-5 pb-5 mt-5 pt-4">
        <div className="row g-0">
          <div className="col-md-6">
            <img src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80" alt="Timeless Design" className="w-100 object-fit-cover" style={{ height: '500px' }} />
          </div>
          <div className="col-md-6 d-flex flex-column justify-content-center p-5 bg-white">
            <div className="p-md-5">
              <div className="text-uppercase fw-bold mb-3" style={{ fontSize: '11px', letterSpacing: '1.5px', color: '#8b7355' }}>A More Beautiful Way To Live</div>
              <h2 className="display-5 fw-bold mb-4" style={{ fontFamily: 'Georgia, serif', color: '#333' }}>Timeless Design<br/>for Modern Life</h2>
              <p className="text-muted mb-4 fs-5" style={{ lineHeight: '1.6' }}>We create functional, beautiful furniture using sustainable materials and thoughtful craftsmanship.</p>
              <button className="btn btn-dark rounded-0 px-4 py-3 text-uppercase fw-bold" style={{ fontSize: '12px', letterSpacing: '1px', backgroundColor: '#8b7355', border: 'none' }}>
                Our Story <ArrowRight size={14} className="ms-2" />
              </button>
            </div>
          </div>
        </div>
      </div>

      

      

      

      
    </div>
  );
}
