import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import ToastKartLogo from '../components/ToastKartLogo';

const portfolioStyles = `
  .portfolio-card {
    transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
    overflow: hidden;
  }
  .portfolio-card:hover {
    transform: translateY(-10px);
    box-shadow: 0 30px 60px rgba(0,0,0,0.2) !important;
  }
  .portfolio-img {
    transition: transform 0.8s cubic-bezier(0.25, 0.8, 0.25, 1);
  }
  .portfolio-card:hover .portfolio-img {
    transform: scale(1.1);
  }
  .explore-link {
    transition: all 0.3s ease;
    color: var(--white);
  }
  .portfolio-card:hover .explore-link {
    color: var(--primary);
  }
  .explore-link svg {
    transition: transform 0.3s ease;
  }
  .portfolio-card:hover .explore-link svg {
    transform: translateX(8px);
  }
  .goslot-nav-link {
    color: var(--title);
    font-weight: 500;
    text-decoration: none;
    transition: color 0.2s ease;
  }
  .goslot-nav-link:hover {
    color: var(--primary);
  }
  .goslot-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    font-weight: 600;
    transition: all 0.3s ease;
    border: none;
  }
  .goslot-btn-primary {
    background: var(--primary);
    color: white;
  }
  .goslot-btn-primary:hover {
    background: #ff5010;
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255,107,43,0.3);
  }
  .force-white-text {
    color: #ffffff !important;
  }
`;

export default function Portfolio() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div style={{ backgroundColor: '#fafafa', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style dangerouslySetInnerHTML={{ __html: portfolioStyles }} />

      {/* HEADER */}
      <header className="bg-white border-bottom py-3" style={{ zIndex: 1040 }}>
        <div className="container-xl d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <ToastKartLogo />
          </div>

          <nav className="d-none d-lg-flex align-items-center gap-4">
            <a href="/" className="goslot-nav-link">Home</a>
            <a href="/#features" className="goslot-nav-link">Features</a>
            <a href="/portfolio" className="goslot-nav-link text-primary fw-bold">Portfolio</a>
            <a href="/#pricing" className="goslot-nav-link">Pricing</a>
            <a href="/#contact" className="goslot-nav-link">Contact Us</a>
          </nav>

          <div className="d-flex align-items-center gap-3">
            <button onClick={() => navigate("/login")} className="d-none d-md-flex goslot-btn goslot-btn-primary py-2 px-4">
              Login
            </button>

            <button className="d-lg-none btn btn-light border-0 p-1 bg-transparent text-dark shadow-none" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="d-lg-none bg-white position-absolute w-100 border-bottom shadow-sm" style={{ top: "100%", left: 0, zIndex: 9999 }}>
            <nav className="d-flex flex-column p-4 gap-3 text-center">
              <a href="/" className="goslot-nav-link fs-5" onClick={() => setIsMobileMenuOpen(false)}>Home</a>
              <a href="/#features" className="goslot-nav-link fs-5" onClick={() => setIsMobileMenuOpen(false)}>Features</a>
              <a href="/portfolio" className="goslot-nav-link fs-5 text-primary fw-bold" onClick={() => setIsMobileMenuOpen(false)}>Portfolio</a>
              <a href="/#pricing" className="goslot-nav-link fs-5" onClick={() => setIsMobileMenuOpen(false)}>Pricing</a>
              <a href="/#contact" className="goslot-nav-link fs-5" onClick={() => setIsMobileMenuOpen(false)}>Contact Us</a>
              <div className="border-top my-2"></div>
              <a href="/login" className="goslot-nav-link fs-5 text-primary" onClick={() => setIsMobileMenuOpen(false)}>Login</a>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-grow-1 d-flex flex-column" style={{ marginTop: '50px' }}>
        {/* PORTFOLIO / FEATURED STORES */}
        <section id="portfolio" className="py-5 bg-white flex-grow-1">
          <div className="container-xl py-4">
            <div className="mb-5 pb-2">
              <div className="text-center text-md-start">
                <div className="text-primary fw-bold mb-2 text-uppercase" style={{ letterSpacing: '0.1em', fontSize: '0.85rem' }}>Our Portfolio</div>
                <h2 className="display-5 fw-bolder mb-3" style={{ letterSpacing: '-0.02em' }}>Take A Look At The Beautiful E-Commerce Stores You Can Build Today.</h2>
              </div>
            </div>
            <div className="row g-4">
              {/* Store 1 */}
              <div className="col-12 col-md-6">
                <div className="portfolio-card position-relative border-0 shadow-lg" style={{ borderRadius: '24px', minHeight: '450px' }}>
                  <img src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=800&auto=format&fit=crop" alt="Elara Fashions" className="w-100 h-100 position-absolute top-0 start-0 portfolio-img" style={{ objectFit: 'cover', zIndex: 0 }} />
                  <div className="position-absolute top-0 start-0 w-100 h-100" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%)', zIndex: 1 }}></div>
                  
                  <div className="position-absolute top-0 end-0 p-4" style={{ zIndex: 2 }}>
                     <span className="badge bg-white text-dark rounded-pill px-3 py-2 fw-bold shadow-sm fs-7">Fashion</span>
                  </div>

                  <div className="position-absolute bottom-0 start-0 w-100 p-4 p-xl-5 text-start" style={{ zIndex: 2 }}>
                    <h3 className="display-6 fw-bold mb-3 force-white-text" style={{ color: '#fff' }}>Elara Fashions</h3>
                    <p className="fs-6 force-white-text mb-4" style={{ maxWidth: '400px', lineHeight: 1.6, color: 'rgba(255,255,255,0.85)' }}>Explore the latest trends in apparel and accessories, showcased in a vibrant and engaging storefront.</p>
                    <a href="https://www.toastkart.com/store/john-fashion-1" target="_blank" rel="noreferrer" className="d-inline-flex align-items-center fw-bold explore-link fs-6 text-uppercase force-white-text text-decoration-none" style={{ color: '#fff' }}>
                      View More <ArrowRight size={20} className="ms-2" />
                    </a>
                  </div>
                </div>
              </div>
              {/* Store 2 */}
              <div className="col-12 col-md-6">
                <div className="portfolio-card position-relative border-0 shadow-lg" style={{ borderRadius: '24px', minHeight: '450px' }}>
                  <img src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=800&auto=format&fit=crop" alt="Zivara Jewels" className="w-100 h-100 position-absolute top-0 start-0 portfolio-img" style={{ objectFit: 'cover', zIndex: 0 }} />
                  <div className="position-absolute top-0 start-0 w-100 h-100" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%)', zIndex: 1 }}></div>
                  
                  <div className="position-absolute top-0 end-0 p-4" style={{ zIndex: 2 }}>
                     <span className="badge bg-white text-dark rounded-pill px-3 py-2 fw-bold shadow-sm fs-7">Jewellery</span>
                  </div>

                  <div className="position-absolute bottom-0 start-0 w-100 p-4 p-xl-5 text-start" style={{ zIndex: 2 }}>
                    <h3 className="display-6 fw-bold mb-3 force-white-text" style={{ color: '#fff' }}>Zivara Jewels</h3>
                    <p className="fs-6 force-white-text mb-4" style={{ maxWidth: '400px', lineHeight: 1.6, color: 'rgba(255,255,255,0.85)' }}>A luxurious online storefront designed exclusively for fine jewellery, highlighting elegance and detail.</p>
                    <a href="https://www.toastkart.com/store/ajil-jewellery" target="_blank" rel="noreferrer" className="d-inline-flex align-items-center fw-bold explore-link fs-6 text-uppercase force-white-text text-decoration-none" style={{ color: '#fff' }}>
                      View More <ArrowRight size={20} className="ms-2" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-dark text-white py-4 text-center mt-auto">
        <div className="container-xl">
          <p className="mb-0 text-white-50">© 2026 ToastKart. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
