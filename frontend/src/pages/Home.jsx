import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ToastKartLogo from "../components/ToastKartLogo";
import {
  Sparkles, ArrowRight, ShieldCheck, Zap, Store, Package, ShoppingCart, DollarSign,
  CheckCircle, Star, Rocket, Crown, Mail, Check, Menu, X, MapPin, Phone, Send, MessageCircle
} from "lucide-react";

import "../styles/Home.css";

const HomeTemplates = React.lazy(() => import('../components/home/HomeTemplates'));
const HomeFeatures = React.lazy(() => import('../components/home/HomeFeatures'));
const HomeAbout = React.lazy(() => import('../components/home/HomeAbout'));
const HomePricing = React.lazy(() => import('../components/home/HomePricing'));
const HomeContact = React.lazy(() => import('../components/home/HomeContact'));

export default function Home() {
  const navigate = useNavigate();
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [cartCount, setCartCount] = useState(2);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [isYearly, setIsYearly] = useState(false);

  const handleAddToCart = (e, prod) => {
    e.stopPropagation();
    setCartCount((prev) => prev + 1);
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSuccess(true);
    setNewsletterEmail("");
    setTimeout(() => setNewsletterSuccess(false), 4000);
  };

  return (
    <div className="goslot-theme">

      {/* HEADER */}
      <header className="fixed-top goslot-header py-3" style={{ zIndex: 1040 }}>
        <div className="container-xl d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <ToastKartLogo />
          </div>

          <nav className="d-none d-lg-flex align-items-center gap-4">
            <a href="#hero" className="goslot-nav-link">Home</a>
            <a href="#features" className="goslot-nav-link">Features</a>
            <a href="/portfolio" className="goslot-nav-link">Portfolio</a>
            <a href="#about" className="goslot-nav-link">About</a>
            <a href="#pricing" className="goslot-nav-link">Pricing</a>
            <a href="#contact" className="goslot-nav-link">Contact Us</a>
          </nav>

          <div className="d-flex align-items-center gap-3">
            <button onClick={() => navigate("/login")} className="d-none d-md-flex goslot-btn goslot-btn-primary py-1.5 px-4 fs-8 fw-bold">
              Login
            </button>

            <button className="d-lg-none btn btn-light border-0 p-1 bg-transparent text-dark shadow-none" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="d-lg-none bg-white position-absolute w-100 border-bottom shadow-sm" style={{ top: "100%", left: 0 }}>
            <nav className="d-flex flex-column p-4 gap-3 text-center">
              <a href="#hero" className="goslot-nav-link fs-5" onClick={() => setIsMobileMenuOpen(false)}>Home</a>
              <a href="#features" className="goslot-nav-link fs-5" onClick={() => setIsMobileMenuOpen(false)}>Features</a>
              <a href="/portfolio" className="goslot-nav-link fs-5" onClick={() => setIsMobileMenuOpen(false)}>Portfolio</a>
              <a href="#about" className="goslot-nav-link fs-5" onClick={() => setIsMobileMenuOpen(false)}>About</a>
              <a href="#pricing" className="goslot-nav-link fs-5" onClick={() => setIsMobileMenuOpen(false)}>Pricing</a>
              <a href="#contact" className="goslot-nav-link fs-5" onClick={() => setIsMobileMenuOpen(false)}>Contact Us</a>
              <div className="border-top my-2"></div>
              <a href="/login" className="goslot-nav-link fs-5 text-primary" onClick={() => setIsMobileMenuOpen(false)}>Login</a>
            </nav>
          </div>
        )}
      </header>

      {/* HERO */}
      <section id="hero" className="goslot-hero position-relative">
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          opacity: 1,
          pointerEvents: 'none',
          overflow: 'hidden'
        }}>
          <img
            src="/main-hero-bg.webp"
            alt="Hero Background"
            loading="eager"
            fetchpriority="high"
            style={{
              width: '100vw',
              height: '100%',
              minHeight: '100%',
              minWidth: '100vw',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              border: 'none',
              objectFit: 'cover'
            }}
          />
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.3)'
          }}></div>
        </div>

        <div className="container-xl position-relative z-10 text-center max-w-4xl mx-auto py-5">
          <h1 className="display-3 fw-bolder mb-4 force-white-text" style={{ letterSpacing: '-0.03em', lineHeight: 1.15 }}>
            Build Your Ecommerce Store <br />
            <span className="gradient-text">With In 24 Hours</span>
          </h1>
          <p className="fs-5 mx-auto mb-4 force-white-text fw-normal" style={{ maxWidth: 700, lineHeight: 1.6 }}>
            ToastKart is the all-in-one platform for vendors to launch their stores and buyers to shop seamlessly. Manage orders, payouts, and catalogs from a central dashboard.
          </p>
        </div>
      </section>

      <React.Suspense fallback={null}>
        <HomeTemplates />
        <HomeFeatures />
        <HomeAbout />
        <HomePricing />
        <HomeContact />
      </React.Suspense>

      {/* FOOTER */}
      <footer className="py-4 mt-5 bg-white border-top">
        <div className="container-xl d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3 fs-8 text-muted">
          <div>
            <span className="fw-bolder text-dark me-2">ToastKart SaaS</span>
            <span>© 2026. All rights reserved.</span>
          </div>
          <div className="d-flex gap-4">
            <a href="#privacy" className="text-muted text-decoration-none hover-text-dark">Privacy</a>
            <a href="#terms" className="text-muted text-decoration-none hover-text-dark">Terms</a>
          </div>
        </div>
      </footer>

      {/* ROLE SELECTOR MODAL */}
      {showRoleModal && (
        <div className="position-fixed top-0 bottom-0 start-0 end-0 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1050, backdropFilter: "blur(4px)" }}>
          <div className="goslot-card w-100" style={{ maxWidth: 460 }}>
            <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-3">
              <h3 className="fs-5 fw-bold mb-0">Select Workspace</h3>
              <button onClick={() => setShowRoleModal(false)} className="btn btn-sm btn-light rounded-circle">✕</button>
            </div>
            <div className="d-flex flex-column gap-3">
              <div onClick={() => { setShowRoleModal(false); navigate("/login"); }} className="p-3 rounded-3 border cursor-pointer d-flex align-items-center gap-3 hover-bg-light transition-all" style={{ background: "white" }}>
                <div className="rounded-circle bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center p-2">
                  <Store size={22} />
                </div>
                <div>
                  <div className="fw-bolder text-dark">Store Owner Dashboard</div>
                  <div className="fs-8 text-muted">Manage products & catalogs</div>
                </div>
              </div>
              <div onClick={() => { setShowRoleModal(false); navigate("/login"); }} className="p-3 rounded-3 border cursor-pointer d-flex align-items-center gap-3 hover-bg-light transition-all" style={{ background: "white" }}>
                <div className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center p-2">
                  <Crown size={22} />
                </div>
                <div>
                  <div className="fw-bolder text-dark">Super Admin Control</div>
                  <div className="fs-8 text-muted">Platform revenue & operations</div>
                </div>
              </div>
              <div onClick={() => { setShowRoleModal(false); navigate("/login"); }} className="p-3 rounded-3 border cursor-pointer d-flex align-items-center gap-3 hover-bg-light transition-all" style={{ background: "white" }}>
                <div className="rounded-circle bg-warning bg-opacity-25 text-dark d-flex align-items-center justify-content-center p-2">
                  <ShoppingCart size={22} />
                </div>
                <div>
                  <div className="fw-bolder text-dark">Customer Shopping Portal</div>
                  <div className="fs-8 text-muted">Browse items & track orders</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK VIEW MODAL */}
      {quickViewProduct && (
        <div className="position-fixed top-0 bottom-0 start-0 end-0 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1050, backdropFilter: "blur(4px)" }}>
          <div className="goslot-card w-100" style={{ maxWidth: 500 }}>
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
              <h3 className="fs-6 font-bold text-dark mb-0">{quickViewProduct.name}</h3>
              <button onClick={() => setQuickViewProduct(null)} className="btn btn-sm btn-light rounded-circle">✕</button>
            </div>
            <div className="row g-3">
              <div className="col-12 col-sm-5">
                <img src={quickViewProduct.img || quickViewProduct.image || "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400"} alt={quickViewProduct.name} className="w-100 rounded-3 object-cover shadow-sm" style={{ height: 140 }} />
              </div>
              <div className="col-12 col-sm-7 d-flex flex-column justify-between mt-3 mt-sm-0">
                <div>
                  <div className="fs-9 text-success fw-bolder mb-1">{quickViewProduct.store_name || "ToastKart Merchant"}</div>
                  <div className="fs-5 fw-bolder text-dark mb-2">{quickViewProduct.price}</div>
                  <p className="fs-8 text-muted mb-0">High-quality product available directly from the store owner.</p>
                </div>
                <button onClick={(e) => { handleAddToCart(e, quickViewProduct); setQuickViewProduct(null); }} className="goslot-btn goslot-btn-primary py-2 w-100 mt-2 fs-7">
                  + Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}