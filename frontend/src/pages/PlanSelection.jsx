import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useSEO from '../hooks/useSEO';
import ToastKartLogo from '../components/ToastKartLogo';
import { useAuth } from '../context/AuthContext';
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

export default function PlanSelection() {
  const [loading, setLoading] = useState(false);
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);
  const [error, setError] = useState('');
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  useSEO({ title: 'Select a Plan - ToastKart', description: 'Choose a subscription plan for your store' });

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login', { replace: true });
      } else if (user.active_subscription || user.activeSubscription) {
        navigate('/owner/dashboard', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (window.Razorpay) {
      setIsRazorpayLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    
    script.onload = () => {
      setIsRazorpayLoaded(true);
    };
    
    script.onerror = () => {
      setError('Failed to load Razorpay SDK. Please check your network connection.');
    };

    document.body.appendChild(script);
    return () => {};
  }, []);

  const handleSelectPlan = async (planId) => {
    if (!isRazorpayLoaded) {
      setError('Razorpay is still loading. Please wait a moment and try again.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const orderRes = await api.post('/subscriptions/order', {
        plan: planId,
        billing_cycle: 'monthly', // the design only has monthly pricing
      });

      if (!orderRes.data.success) {
        throw new Error(orderRes.data.message || 'Failed to create order');
      }

      const { order_id, amount, currency } = orderRes.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, 
        amount: amount,
        currency: currency,
        name: 'ToastKart',
        description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan (monthly)`,
        image: 'https://www.toastkart.com/favicon.png', 
        order_id: order_id,
        handler: async function (response) {
          try {
            setLoading(true);
            const verifyRes = await api.post('/subscriptions/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.data.success) {
              await refreshUser(); 
              navigate('/owner/dashboard');
            } else {
              setError(verifyRes.data.message || 'Payment verification failed.');
              setLoading(false);
            }
          } catch (err) {
            setError('Error verifying payment. Please contact support if amount was deducted.');
            setLoading(false);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          ...(user?.phone ? { contact: user.phone } : {}),
        },
        theme: {
          color: '#ff5a1f',
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', function (response) {
        setError(response.error.description || 'Payment failed.');
        setLoading(false);
      });

      rzp.open();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred while setting up the payment.');
      setLoading(false);
    }
  };

  return (
    <div className="pricing-page-wrapper">
      {loading && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-white bg-opacity-75 d-flex align-items-center justify-content-center" style={{ zIndex: 1000 }}>
          <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
        </div>
      )}

      {/* Nav with Logout button added back at the top right to maintain functionality */}
      <div className="d-flex justify-content-end p-3 position-absolute w-100">
        <button 
          className="btn rounded-pill px-4 py-2"
          style={{ backgroundColor: '#ff5a1f', color: 'white', border: 'none', fontWeight: '600', zIndex: 100 }}
          onClick={async () => {
            await api.post('/logout');
            window.location.href = '/login';
          }}
        >
          Logout
        </button>
      </div>

      <div className="pricing-header position-relative">
        <h1>Choose Your <span className="brand-text">Toastkart</span> Plan</h1>
        <p>Start your online store today. Simple, affordable and powerful.</p>
        
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

        {error && (
          <div className="alert alert-danger text-center mx-auto mb-4" style={{ maxWidth: '600px' }}>
            {error}
          </div>
        )}
      </div>

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
          
          <div className="setup-fee-box">
            <Settings className="setup-fee-icon" size={24} />
            <div className="setup-fee-text">
              Store Setup Fee
              <span className="price">₹4,999 one-time</span>
              <span className="optional">(Optional, if needed)</span>
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

          <button 
            className="btn-get-started btn-outline"
            onClick={() => handleSelectPlan('basic')}
            disabled={loading || !isRazorpayLoaded}
          >
            Get Started
          </button>
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
          
          <div className="setup-fee-box">
            <Settings className="setup-fee-icon" size={24} />
            <div className="setup-fee-text">
              Store Setup Fee
              <span className="price">₹4,999 one-time</span>
              <span className="optional">(Optional, if needed)</span>
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

          <button 
            className="btn-get-started btn-solid"
            onClick={() => handleSelectPlan('growth')}
            disabled={loading || !isRazorpayLoaded}
          >
            Get Started
          </button>
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
          
          <div className="setup-fee-box">
            <Settings className="setup-fee-icon" size={24} />
            <div className="setup-fee-text">
              Store Setup Fee
              <span className="price">₹9,999 one-time</span>
              <span className="optional">(Optional, if needed)</span>
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

          <button 
            className="btn-get-started btn-outline"
            onClick={() => handleSelectPlan('pro')}
            disabled={loading || !isRazorpayLoaded}
          >
            Get Started
          </button>
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
}
