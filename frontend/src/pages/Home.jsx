import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ToastKartLogo from "../components/ToastKartLogo";
import {
  Sparkles, ArrowRight, ShieldCheck, Zap, Store, Package, ShoppingCart, DollarSign,
  CheckCircle, Star, Rocket, Crown, Mail, Check, Menu, X, MapPin, Phone, Send, MessageCircle
} from "lucide-react";

const goslotStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

  .goslot-theme {
    --primary: #FF5722;
    --primary-dark: #E64A19;
    --secondary: #FF8A65;
    --accent: #EC4899;
    --bg: #F8FAFC;
    --dark: #0F172A;
    --white: #FFFFFF;
    --ink: #1E293B;
    --muted: #64748B;
    --line: rgba(15, 23, 42, 0.08);
    
    background-color: var(--bg);
    background-image: 
      radial-gradient(at 40% 20%, rgba(99, 102, 241, 0.12) 0px, transparent 50%),
      radial-gradient(at 80% 0%, rgba(168, 85, 247, 0.12) 0px, transparent 50%),
      radial-gradient(at 0% 50%, rgba(236, 72, 153, 0.12) 0px, transparent 50%);
    background-attachment: fixed;
    color: var(--ink);
    font-family: 'Outfit', system-ui, -apple-system, sans-serif;
    min-height: 100vh;
    overflow-x: hidden;
  }
  .goslot-theme h1, .goslot-theme h3, .goslot-theme h4 {
    color: var(--dark) !important;
    font-weight: 800 !important;
    letter-spacing: -0.03em !important;
  }
  .goslot-theme h2 {
    background: linear-gradient(135deg, #FF5722 0%, #FF9800 100%);
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    display: block;
    font-weight: 800 !important;
    letter-spacing: -0.03em !important;
  }
  .goslot-theme p, .goslot-theme span, .goslot-theme div, .goslot-theme li, .goslot-theme a {
    color: var(--ink) !important;
  }
  .goslot-theme p {
    color: var(--muted) !important;
    line-height: 1.8 !important;
  }
  .goslot-theme .text-dark, .goslot-theme .text-muted {
    color: var(--dark) !important;
  }
  .goslot-theme .text-success { color: var(--primary) !important; }
  
  .goslot-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    padding: 14px 28px; font-weight: 700; border-radius: 100px;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
    border: none; cursor: pointer; letter-spacing: 0.02em;
  }
  .goslot-btn-primary {
    background: linear-gradient(135deg, var(--primary), var(--secondary)) !important;
    color: var(--white) !important;
    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3) !important;
  }
  .goslot-btn-primary:hover {
    transform: translateY(-4px) scale(1.02) !important;
    box-shadow: 0 14px 32px rgba(168, 85, 247, 0.4) !important;
    color: white !important;
  }
  .goslot-btn-outline {
    background: rgba(255, 255, 255, 0.8) !important;
    backdrop-filter: blur(10px) !important;
    border: 2px solid rgba(99, 102, 241, 0.2) !important;
    color: var(--primary-dark) !important;
  }
  .goslot-btn-outline:hover {
    border-color: var(--primary) !important;
    background: rgba(99, 102, 241, 0.05) !important;
    transform: translateY(-4px) scale(1.02) !important;
    box-shadow: 0 10px 24px rgba(99, 102, 241, 0.15) !important;
  }
  
  .goslot-eyebrow {
    display: inline-block; font-size: 0.85rem; font-weight: 800;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--primary-dark) !important;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15)) !important;
    border: 1px solid rgba(99, 102, 241, 0.2) !important;
    padding: 8px 18px; border-radius: 100px; margin-bottom: 20px;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.08) !important;
  }
  
  .goslot-hero {
    padding-top: 160px; padding-bottom: 120px;
    position: relative; overflow: hidden; width: 100%;
  }
  .goslot-theme .force-white-text {
    color: #ffffff !important;
    text-shadow: 0 4px 16px rgba(0,0,0,0.6) !important;
  }
  
  .template-iframe-container {
    height: 450px; position: relative; border-radius: 24px; overflow: hidden;
    background-color: white; 
    box-shadow: 0 24px 50px rgba(15, 23, 42, 0.15);
    border: 1px solid rgba(255,255,255,0.8);
  }
  .template-iframe {
    width: 200%; height: 900px; transform: scale(0.5);
    transform-origin: top left; border: none; pointer-events: none;
  }
  
  .hero-blob {
    position: absolute; border-radius: 50%; filter: blur(100px);
    opacity: 0.8; z-index: 0; animation: blobFloat 16s ease-in-out infinite alternate;
  }
  .blob-1 {
    width: 500px; height: 500px; background: var(--secondary);
    top: -100px; right: -100px;
  }
  .blob-2 {
    width: 450px; height: 450px; background: var(--primary);
    bottom: -150px; left: -100px; animation-delay: -8s;
  }
  @keyframes blobFloat {
    0% { transform: translate(0, 0) scale(1) rotate(0deg); }
    50% { transform: translate(50px, -50px) scale(1.1) rotate(10deg); }
    100% { transform: translate(-30px, 30px) scale(0.95) rotate(-5deg); }
  }
  
  .goslot-card {
    background: rgba(255, 255, 255, 0.65) !important;
    backdrop-filter: blur(24px) !important;
    -webkit-backdrop-filter: blur(24px) !important;
    border: 1px solid rgba(255, 255, 255, 0.9) !important;
    border-radius: 28px !important;
    box-shadow: 0 10px 40px rgba(15, 23, 42, 0.04) !important;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
  }
  .goslot-card:hover {
    transform: translateY(-8px) scale(1.02) !important;
    box-shadow: 0 24px 48px rgba(99, 102, 241, 0.12) !important;
    border-color: rgba(99, 102, 241, 0.3) !important;
  }
  
  .goslot-header {
    background: rgba(255, 255, 255, 0.75) !important;
    backdrop-filter: blur(24px) !important;
    -webkit-backdrop-filter: blur(24px) !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.6) !important;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.03) !important;
  }
  .goslot-nav-link {
    color: var(--dark); font-weight: 700; text-decoration: none;
    position: relative; padding: 4px 0; transition: color 0.3s ease;
    font-size: 1.05rem;
  }
  .goslot-nav-link:hover { color: var(--primary) !important; }
  
  .goslot-theme section.bg-white, .goslot-theme footer.bg-white, .goslot-theme section[style*="background-color: #f8f9fc"] {
    background: transparent !important;
  }
  
  .icon-float { transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
  .goslot-card:hover .icon-float { transform: translateY(-8px) scale(1.15) rotate(5deg); }
  
  .gradient-text {
    background: linear-gradient(135deg, #FF5722 0%, #FF9800 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    display: inline-block;
  }
  .glow-text {
    text-shadow: 0 0 30px rgba(255, 87, 34, 0.6) !important;
  }
  
  @media (max-width: 767px) {
    .goslot-hero { padding-top: 120px; padding-bottom: 80px; }
    .template-iframe-container { height: 250px; border-radius: 16px; }
    .template-iframe { width: 400%; height: 1000px; transform: scale(0.25); }
  }
`;

export default function Home() {
  const navigate = useNavigate();
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [cartCount, setCartCount] = useState(2);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

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
      <style dangerouslySetInnerHTML={{ __html: goslotStyles }} />

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
            <button onClick={() => navigate("/login")} className="d-none d-md-flex goslot-btn goslot-btn-primary py-1.5 px-3 fs-8">
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
          <iframe
            src="https://www.youtube.com/embed/01BZVNowenQ?autoplay=1&mute=1&loop=1&playlist=01BZVNowenQ&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&disablekb=1"
            style={{
              width: '100vw',
              height: '56.25vw',
              minHeight: '100%',
              minWidth: '177.77vh',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) scale(1.35)',
              pointerEvents: 'none',
              border: 'none'
            }}
            allow="autoplay; encrypted-media"
            title="Background Video"
          ></iframe>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.3)'
          }}></div>
        </div>
        <div className="hero-blob blob-1"></div>
        <div className="hero-blob blob-2"></div>

        <div className="container-xl position-relative z-10 text-center max-w-4xl mx-auto py-5">
          <h1 className="display-3 fw-bolder mb-4 force-white-text" style={{ letterSpacing: '-0.03em', lineHeight: 1.15 }}>
            Build Your Ecommerce Store <br />
            <span className="gradient-text">With In 24 Hours</span>
          </h1>
          <p className="fs-5 mx-auto mb-5 force-white-text fw-normal" style={{ maxWidth: 700, lineHeight: 1.6 }}>
            ToastKart is the all-in-one platform for vendors to launch their stores and buyers to shop seamlessly. Manage orders, payouts, and catalogs from a central dashboard.
          </p>
        </div>
      </section>

      {/* FEATURES */}
      {/* TEMPLATES */}
      <section id="templates" className="py-5" style={{ backgroundColor: '#f8f9fc' }}>
        <div className="container-xl">
          <div className="text-center mb-5">
            <div className="goslot-eyebrow">Stunning Templates</div>
            <h2 className="fs-2 mb-3">Launch With Beautiful Themes</h2>
            <p className="fs-6 text-muted mx-auto" style={{ maxWidth: 600 }}>Choose from our collection of premium, conversion-optimized themes tailored specifically for your industry.</p>
          </div>
          <div className="d-flex flex-column pt-4">
            {[
              { title: "Fashion Theme", url: "https://themewagon.github.io/eflyer/", img: null, desc: "Vibrant and modern aesthetic for apparel and boutiques." },
              { title: "Beauty & Cosmetics", url: null, img: "/beauty-template.png", desc: "Elegant and clean layouts for skincare and makeup brands." },
              { title: "Home & Living", url: "https://themewagon.github.io/aranoz/", img: null, desc: "Warm and inviting design for furniture and home decor stores." },
              { title: "Jewelry & Luxury", url: null, img: "/jewelry-template.png", desc: "Premium, luxurious aesthetic for fine jewelry and accessories." }
            ].map((t, i) => (
              <div key={i} className={`row align-items-center mb-5 pb-4`}>
                <div className={`col-12 col-lg-7 ${i % 2 !== 0 ? 'order-lg-2' : ''}`}>
                  <div className="template-iframe-container">
                    {t.url ? (
                      <iframe
                        src={t.url}
                        title={t.title}
                        className="template-iframe"
                      />
                    ) : (
                      <img src={t.img} alt={t.title} className="w-100 h-100" style={{ objectFit: 'cover' }} />
                    )}
                  </div>
                </div>
                <div className={`col-12 col-lg-5 mt-4 mt-lg-0 ${i % 2 !== 0 ? 'order-lg-1 pe-lg-5' : 'ps-lg-5'}`}>
                  <h3 className="display-5 fw-bold mb-3">{t.title}</h3>
                  <p className="fs-5 text-muted mb-4">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PORTFOLIO / FEATURED STORES MOVED TO DEDICATED PAGE */}

      {/* FEATURES */}
      <section id="features" className="py-5 my-5">
        <div className="container-xl">
          <div className="text-center mb-5 pb-4">
            <div className="goslot-eyebrow">Enterprise Grade</div>
            <h2 className="display-5 fw-bolder mb-3" style={{ letterSpacing: '-0.02em' }}>Everything you need to scale</h2>
            <p className="fs-5 text-muted mx-auto" style={{ maxWidth: 600 }}>Powerful tools engineered to help you manage products, process orders, and grow revenue on autopilot.</p>
          </div>
          <div className="row g-4 pt-2">
            {[
              { icon: Store, title: "Custom Storefronts", desc: "Merchants get branded subdomains, unlimited catalogs, and conversion-optimized checkout flows." },
              { icon: DollarSign, title: "Automated Payouts", desc: "Split payments seamlessly. Instant merchant commissions routed directly to linked bank accounts." },
              { icon: ShieldCheck, title: "Enterprise Security", desc: "Rest easy with bank-grade 256-bit SSL encryption, PCI compliance, and full transaction audit logs." },
              { icon: ShoppingCart, title: "Unified Cart System", desc: "Shoppers can effortlessly buy from multiple vendors in a single, lightning-fast checkout flow." }
            ].map((f, i) => (
              <div key={i} className="col-12 col-md-6 col-lg-3">
                <div className="goslot-card glow-on-hover h-100 d-flex flex-column p-4" style={{ borderRadius: 24, border: '1px solid rgba(0,0,0,0.06)' }}>
                  <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-4 shadow-sm" style={{ width: 64, height: 64, background: "linear-gradient(135deg, rgba(255,87,34,0.12), rgba(255,87,34,0.03))", color: "var(--primary)" }}>
                    <f.icon size={32} className="icon-float" />
                  </div>
                  <h3 className="fs-4 fw-bold mb-3">{f.title}</h3>
                  <p className="fs-6 text-muted mb-0" style={{ lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="py-5 bg-white">
        <div className="container-xl" style={{ maxWidth: 900 }}>
          <div className="text-center mb-5">
            <div className="goslot-eyebrow">About ToastKart</div>
            <h2 className="display-6 fw-bolder mb-4">Build. Sell. Grow.</h2>

            <p className="fs-5 text-muted mb-4">
              ToastKart is a simple and powerful e-commerce platform designed to help businesses create, manage, and grow their online stores without the complexity.
            </p>
            <p className="fs-6 text-muted mb-4">
              Whether you're starting your first online business or expanding an existing brand, ToastKart gives you the tools you need to build a professional online store, showcase your products, manage orders, and reach your customers—all in one place.
            </p>
            <p className="fs-6 text-muted mb-5">
              We believe creating an online store should be <strong className="text-dark">simple, affordable, and accessible to everyone</strong>. That's why ToastKart is built with an easy-to-use interface and practical features that let you focus on what matters most: <strong className="text-dark">growing your business</strong>.
            </p>
          </div>

          <div className="p-5 rounded-4 text-center mt-4" style={{ background: "linear-gradient(135deg, rgba(255,87,34,0.08), rgba(255,87,34,0.02))", border: "1px solid rgba(255,87,34,0.15)" }}>
            <h3 className="fs-4 fw-bold mb-3" style={{ color: "var(--primary)" }}>Our Mission</h3>
            <p className="fs-5 mb-4 text-dark mx-auto" style={{ maxWidth: 700, lineHeight: 1.6 }}>
              Our mission is to empower entrepreneurs and businesses with simple technology that makes selling online easier.
            </p>
            <div className="fw-bolder fs-5" style={{ color: "var(--primary)" }}>
              Your business. Your store. Your growth. Powered by ToastKart.
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-5" style={{ backgroundColor: '#f8f9fc' }}>
        <div className="container-xl">
          <div className="text-center mb-5">
            <div className="goslot-eyebrow">Pricing</div>
            <h2 className="fs-2 mb-3">ToastKart Pricing</h2>
            <p className="fs-6 text-muted mx-auto fw-bold" style={{ maxWidth: 600 }}>Free Trial: 14 Days</p>
          </div>
          <div className="row g-4 justify-content-center">
            {/* Basic Tier */}
            <div className="col-12 col-md-6 col-lg-4">
              <div className="goslot-card h-100 d-flex flex-column text-center">
                <h3 className="fs-4 fw-bold mb-2">Basic</h3>
                <div className="fs-3 fw-bolder text-dark mb-1">₹499<span className="fs-6 text-muted fw-normal">/month</span></div>
                <div className="fs-6 text-muted mb-4">₹4,999/year</div>
                <ul className="list-unstyled text-start mb-4 flex-grow-1">
                  <li className="mb-2"><Check size={16} className="text-success me-2"/> Online Store</li>
                  <li className="mb-2"><Check size={16} className="text-success me-2"/> ToastKart Subdomain</li>
                  <li className="mb-2"><Check size={16} className="text-success me-2"/> Up to 50 Products</li>
                  <li className="mb-2"><Check size={16} className="text-success me-2"/> Order Management</li>
                  <li className="mb-2"><Check size={16} className="text-success me-2"/> Payment Integration</li>
                  <li className="mb-2"><Check size={16} className="text-success me-2"/> WhatsApp Integration</li>
                  <li className="mb-2"><Check size={16} className="text-success me-2"/> Email Support</li>
                </ul>
                <button onClick={() => navigate('/login')} className="goslot-btn goslot-btn-outline w-100 mt-auto">Get Started</button>
              </div>
            </div>
            {/* Growth Tier */}
            <div className="col-12 col-md-6 col-lg-4">
              <div className="goslot-card h-100 d-flex flex-column text-center position-relative shadow-lg" style={{ border: '2px solid var(--primary)' }}>
                <div className="position-absolute top-0 start-50 translate-middle badge rounded-pill" style={{ backgroundColor: 'var(--primary)', color: '#fff', fontSize: '0.8rem', padding: '0.4rem 1rem' }}>Most Popular</div>
                <h3 className="fs-4 fw-bold mb-2">Growth</h3>
                <div className="fs-3 fw-bolder text-dark mb-1">₹999<span className="fs-6 text-muted fw-normal">/month</span></div>
                <div className="fs-6 text-muted mb-4">₹9,999/year</div>
                <ul className="list-unstyled text-start mb-4 flex-grow-1">
                  <li className="mb-2"><Check size={16} className="text-success me-2"/> Everything in Basic</li>
                  <li className="mb-2"><Check size={16} className="text-success me-2"/> Custom Domain</li>
                  <li className="mb-2"><Check size={16} className="text-success me-2"/> Up to 500 Products</li>
                  <li className="mb-2"><Check size={16} className="text-success me-2"/> Advanced Analytics</li>
                  <li className="mb-2"><Check size={16} className="text-success me-2"/> Priority Support</li>
                </ul>
                <button onClick={() => navigate('/login')} className="goslot-btn goslot-btn-primary w-100 mt-auto">Get Started</button>
              </div>
            </div>
            {/* Pro Tier */}
            <div className="col-12 col-md-6 col-lg-4">
              <div className="goslot-card h-100 d-flex flex-column text-center">
                <h3 className="fs-4 fw-bold mb-2">Pro</h3>
                <div className="fs-3 fw-bolder text-dark mb-1">₹1,999<span className="fs-6 text-muted fw-normal">/month</span></div>
                <div className="fs-6 text-muted mb-4">₹19,999/year</div>
                <ul className="list-unstyled text-start mb-4 flex-grow-1">
                  <li className="mb-2"><Check size={16} className="text-success me-2"/> Everything in Growth</li>
                  <li className="mb-2"><Check size={16} className="text-success me-2"/> Unlimited Products</li>
                  <li className="mb-2"><Check size={16} className="text-success me-2"/> Advanced Analytics</li>
                  <li className="mb-2"><Check size={16} className="text-success me-2"/> Priority Support</li>
                </ul>
                <button onClick={() => navigate('/login')} className="goslot-btn goslot-btn-outline w-100 mt-auto">Get Started</button>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* CONTACT */}
      <section id="contact" className="py-5 bg-white">
        <div className="container-xl" style={{ maxWidth: 1000 }}>
          <div className="text-center mb-5">
            <div className="goslot-eyebrow">Contact Us</div>
            <h2 className="fs-2 fw-bolder mb-3">Get in Touch</h2>
            <p className="fs-5 text-muted mx-auto" style={{ maxWidth: 600 }}>
              Have questions or need help setting up your store? Reach out to our team.
            </p>
          </div>
          <div className="row g-4 justify-content-center text-center">
            {/* Address */}
            <div className="col-12 col-md-4">
              <div className="goslot-card glow-on-hover h-100 p-4 p-xl-5" style={{ borderRadius: 24, border: '1px solid rgba(0,0,0,0.06)' }}>
                <MapPin size={40} className="mb-3 icon-float" style={{ color: "var(--primary)" }} />
                <h3 className="fs-5 fw-bold mb-3">Address</h3>
                <p className="fs-6 text-muted mb-0">
                  Webtoast<br />
                  inQ Tower, 1st floor<br />
                  Opp EMC NH Bypass<br />
                  Palarivattom, Kochi, Kerala 682025
                </p>
              </div>
            </div>
            {/* Email */}
            <div className="col-12 col-md-4">
              <div className="goslot-card glow-on-hover h-100 p-4 p-xl-5" style={{ borderRadius: 24, border: '1px solid rgba(0,0,0,0.06)' }}>
                <Mail size={40} className="mb-3 icon-float" style={{ color: "var(--primary)" }} />
                <h3 className="fs-5 fw-bold mb-3">Email Support</h3>
                <p className="fs-6 text-muted mb-4">
                  Send us an email and our support team will get back to you within 24 hours.
                </p>
                <a href="mailto:business@webtoast.in" className="fw-bold text-decoration-none" style={{ color: "var(--primary)" }}>
                  business@webtoast.in
                </a>
              </div>
            </div>
            {/* Phone */}
            <div className="col-12 col-md-4">
              <div className="goslot-card glow-on-hover h-100 p-4 p-xl-5" style={{ borderRadius: 24, border: '1px solid rgba(0,0,0,0.06)' }}>
                <Phone size={40} className="mb-3 icon-float" style={{ color: "var(--primary)" }} />
                <h3 className="fs-5 fw-bold mb-3">Phone</h3>
                <p className="fs-6 text-muted mb-4">
                  Call us directly for immediate assistance during business hours.
                </p>
                <a href="tel:9526706406" className="fw-bold text-decoration-none" style={{ color: "var(--primary)" }}>
                  9526706406
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

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