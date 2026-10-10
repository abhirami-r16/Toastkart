import React from 'react';
import { 
  Zap, 
  Store, 
  Coins, 
  TrendingUp, 
  Check, 
  Settings, 
  MessageSquare, 
  Rocket,
  ShieldCheck,
  Headset,
  Smartphone,
  BarChart2
} from 'lucide-react';
import '../styles/Plans.css';

const Plans = () => {
  return (
    <div className="pricing-page-wrapper">
      {/* Header Section */}
      <div className="pricing-header position-relative">
        <h1>Choose Your <span className="brand-text">Toastkart</span> Plan</h1>
        <p>Start your online store today. Simple, affordable and powerful.</p>
        
        {/* Doodle image (simulated with SVG for simplicity, though we could use an image) */}
        <div className="business-online-doodle">
          <svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
            <text x="10" y="30" fontFamily="Caveat, cursive, sans-serif" fontSize="24" fill="#111827" transform="rotate(-5)">Your</text>
            <text x="30" y="60" fontFamily="Caveat, cursive, sans-serif" fontSize="28" fill="#111827" transform="rotate(-5)">Business</text>
            <text x="40" y="90" fontFamily="Caveat, cursive, sans-serif" fontSize="28" fill="#111827" transform="rotate(-5)">Online</text>
            <path d="M 40 95 Q 100 80 180 90" fill="none" stroke="#ff5a1f" strokeWidth="3" />
          </svg>
        </div>

        <div className="pricing-badges">
          <div className="badge-item">
            <Zap size={18} /> No Coding Required
          </div>
          <div className="badge-item">
            <Store size={18} /> Launch Quickly
          </div>
          <div className="badge-item">
            <Coins size={18} /> Affordable Plans
          </div>
          <div className="badge-item">
            <TrendingUp size={18} /> Grow Your Business
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="pricing-cards-container">
        {/* Basic Plan */}
        <div className="pricing-card">
          <div className="card-title-section">
            <h2>Basic</h2>
            <p>Perfect for getting started</p>
            <div className="card-price">
              <span className="currency">₹</span>799<span className="period">/month</span>
            </div>
          </div>
          


          <ul className="features-list">
            <li><Check size={18} /> Online Store</li>
            <li><Check size={18} /> Toastkart Subdomain</li>
            <li><Check size={18} /> Up to 50 Products</li>
            <li><Check size={18} /> Order Management</li>
            <li><Check size={18} /> Payment Integration</li>
            <li><Check size={18} /> WhatsApp Integration</li>
            <li><Check size={18} /> Email Support</li>
          </ul>

          <button className="btn-get-started btn-outline">Get Started</button>
        </div>

        {/* Growth Plan */}
        <div className="pricing-card popular">
          <div className="popular-tag">MOST POPULAR</div>
          <div className="card-title-section">
            <h2>Growth</h2>
            <p>Best for growing businesses</p>
            <div className="card-price">
              <span className="currency">₹</span>999<span className="period">/month</span>
            </div>
          </div>
          


          <ul className="features-list">
            <li><Check size={18} /> Online Store</li>
            <li><Check size={18} /> Custom Domain Support</li>
            <li><Check size={18} /> Up to 200 Products</li>
            <li><Check size={18} /> Order Management</li>
            <li><Check size={18} /> Payment Integration</li>
            <li><Check size={18} /> WhatsApp Integration</li>
            <li><Check size={18} /> Email Support</li>
            <li><Check size={18} /> Basic SEO Tools</li>
            <li><Check size={18} /> Priority Support</li>
          </ul>

          <button className="btn-get-started btn-solid">Get Started</button>
        </div>

        {/* Pro Plan */}
        <div className="pricing-card">
          <div className="card-title-section">
            <h2>Pro</h2>
            <p>For established businesses</p>
            <div className="card-price">
              <span className="currency">₹</span>1,999<span className="period">/month</span>
            </div>
          </div>
          


          <ul className="features-list">
            <li><Check size={18} /> Online Store</li>
            <li><Check size={18} /> Custom Domain</li>
            <li><Check size={18} /> Unlimited Products</li>
            <li><Check size={18} /> Order Management</li>
            <li><Check size={18} /> Payment Integration</li>
            <li><Check size={18} /> WhatsApp Integration</li>
            <li><Check size={18} /> Advanced Customization</li>
            <li><Check size={18} /> SEO & Marketing Tools</li>
            <li><Check size={18} /> Priority Support</li>
          </ul>

          <button className="btn-get-started btn-outline">Get Started</button>
        </div>
      </div>

      {/* Info Boxes */}
      <div className="info-boxes-container">
        <div className="info-box">
          <div className="info-icon-wrapper">
            <Settings size={24} />
          </div>
          <div className="info-content">
            <h3>Need help setting up your store?</h3>
            <p>Our team can design, configure and launch your store for a one-time setup fee.</p>
          </div>
        </div>

        <div className="info-box">
          <div className="info-icon-wrapper green">
            <MessageSquare size={24} />
          </div>
          <div className="info-content">
            <h3>Have questions?</h3>
            <p>Talk to our team and we'll help you choose the right plan.</p>
          </div>
        </div>

        <div className="info-box">
          <div className="info-icon-wrapper">
            <Rocket size={24} />
          </div>
          <div className="info-content">
            <h3>Start Selling Today</h3>
            <p>Join hundreds of businesses building their online store with Toastkart.</p>
          </div>
        </div>
      </div>

      {/* Footer Features */}
      <div className="pricing-footer">
        <div className="trust-badges">
          <div className="trust-badge">
            <ShieldCheck size={20} /> Secure & Reliable
          </div>
          <div className="trust-badge">
            <Headset size={20} /> Dedicated Support
          </div>
          <div className="trust-badge">
            <Smartphone size={20} /> Mobile Friendly
          </div>
          <div className="trust-badge">
            <BarChart2 size={20} /> Built for Growth
          </div>
        </div>
        
        <div className="footer-logo">
          <div className="logo-text">Toast<span>kart</span></div>
          <p>SELL . GROW . BEYOND</p>
        </div>
      </div>
    </div>
  );
};

export default Plans;
