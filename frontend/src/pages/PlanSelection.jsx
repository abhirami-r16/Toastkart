import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useSEO from '../hooks/useSEO';
import ToastKartLogo from '../components/ToastKartLogo';
import { useAuth } from '../context/AuthContext';

const plansConfig = {
  monthly: [
    {
      id: 'basic',
      name: 'Basic',
      price: 499,
      features: [
        'Online Store',
        'ToastKart Subdomain',
        'Up to 50 Products',
        'Order Management',
        'Payment Integration',
        'WhatsApp Integration',
        'Email Support',
      ],
    },
    {
      id: 'growth',
      name: 'Growth',
      price: 999,
      features: [
        'Everything in Basic',
        'Custom Domain',
        'Up to 500 Products',
        'Advanced Analytics',
        'Priority Support',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 1999,
      features: [
        'Everything in Growth',
        'Unlimited Products',
        'Advanced Analytics',
        'Priority Support',
      ],
    },
  ],
  yearly: [
    {
      id: 'basic',
      name: 'Basic',
      price: 4999,
      features: [
        'Online Store',
        'ToastKart Subdomain',
        'Up to 50 Products',
        'Order Management',
        'Payment Integration',
        'WhatsApp Integration',
        'Email Support',
      ],
    },
    {
      id: 'growth',
      name: 'Growth',
      price: 9999,
      features: [
        'Everything in Basic',
        'Custom Domain',
        'Up to 500 Products',
        'Advanced Analytics',
        'Priority Support',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 19999,
      features: [
        'Everything in Growth',
        'Unlimited Products',
        'Advanced Analytics',
        'Priority Support',
      ],
    },
  ]
};

const planStyles = `
  .plans-bg {
    background: #f8f9fa;
    min-height: 100vh;
    font-family: system-ui, -apple-system, sans-serif;
    padding-bottom: 4rem;
  }
  .plans-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem 2rem;
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    margin-bottom: 3rem;
  }
  .billing-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 3rem;
    flex-wrap: wrap;
  }
  .toggle-btn {
    background: #e2e8f0;
    color: #475569;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 9999px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  .toggle-btn.active {
    background: #FF5722;
    color: white;
  }
  .savings-badge {
    background: #10b981;
    color: white;
    font-size: 0.75rem;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-weight: bold;
    margin-left: 0.5rem;
  }
  .plans-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }
  @media (min-width: 768px) {
    .plans-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  .plan-card {
    background: #ffffff;
    border-radius: 24px;
    padding: 2.5rem 2rem;
    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
    border: 1px solid #f0f0f0;
    display: flex;
    flex-direction: column;
    position: relative;
    transition: transform 0.2s;
  }
  @media (max-width: 480px) {
    .plan-card {
      padding: 1.5rem 1rem;
    }
    .plan-price {
      font-size: 2rem !important;
    }
  }
  .plan-card:hover {
    transform: translateY(-5px);
    border: 2px solid #FF5722;
  }
  .plan-card:hover .plan-btn {
    background: #FF5722;
    color: white;
  }
  .plan-card:hover .plan-btn:hover {
    background: #E64A19;
  }
  .popular-badge {
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    background: #FF5722;
    color: white;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.25rem 1rem;
    border-radius: 9999px;
    text-transform: uppercase;
  }
  .plan-name {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 0.5rem;
  }
  .plan-price {
    font-size: 2.5rem;
    font-weight: 800;
    color: #1a1a1a;
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
  }
  .plan-price span {
    font-size: 1rem;
    font-weight: 500;
    color: #64748b;
  }
  .plan-features {
    margin: 2rem 0;
    flex-grow: 1;
  }
  .feature-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
    color: #475569;
  }
  .feature-icon {
    color: #10b981;
  }
  .plan-btn {
    width: 100%;
    padding: 1rem;
    border-radius: 9999px;
    font-weight: 600;
    font-size: 1.1rem;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  }
  .plan-btn-primary {
    background: #FF5722;
    color: white;
  }
  .plan-btn-primary:hover {
    background: #E64A19;
  }
  .plan-btn-secondary {
    background: #f1f5f9;
    color: #1a1a1a;
  }
  .plan-btn-secondary:hover {
    background: #e2e8f0;
  }
  .loading-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(255,255,255,0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
`;

export default function PlanSelection() {
  const [billingCycle, setBillingCycle] = useState('monthly');
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
    // Load Razorpay Script safely
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
    return () => {
      // Don't remove the script on unmount to prevent reloading issues if they navigate back
    };
  }, []);

  const handleSelectPlan = async (planId) => {
    if (!isRazorpayLoaded) {
      setError('Razorpay is still loading. Please wait a moment and try again.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // 1. Create order on backend
      const orderRes = await api.post('/subscriptions/order', {
        plan: planId,
        billing_cycle: billingCycle,
      });

      if (!orderRes.data.success) {
        throw new Error(orderRes.data.message || 'Failed to create order');
      }

      const { order_id, amount, currency } = orderRes.data;

      // 2. Open Razorpay Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Use public key from env
        amount: amount,
        currency: currency,
        name: 'ToastKart',
        description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan (${billingCycle})`,
        image: 'https://www.toastkart.com/favicon.png', // Replace with your logo URL if needed
        order_id: order_id,
        handler: async function (response) {
          try {
            setLoading(true);
            // 3. Verify payment on backend
            const verifyRes = await api.post('/subscriptions/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.data.success) {
              await refreshUser(); // Update user context with new activeSubscription
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
          color: '#FF5722',
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

  const currentPlans = plansConfig[billingCycle];

  return (
    <div className="plans-bg">
      <style dangerouslySetInnerHTML={{ __html: planStyles }} />
      
      {loading && (
        <div className="loading-overlay">
          <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
        </div>
      )}

      <nav className="plans-nav">
        <div className="d-flex align-items-center gap-2">
          <ToastKartLogo width={140} />
        </div>
        <div>
          <button 
            className="btn rounded-pill"
            style={{ backgroundColor: '#FF5722', color: 'white', border: 'none', padding: '0.5rem 1.5rem', fontWeight: '600' }}
            onClick={async () => {
              await api.post('/logout');
              window.location.href = '/login';
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="container">
        <div className="text-center mb-5">
          <h1 className="fw-bold mb-3">Choose the right plan for your business</h1>
          <p className="text-muted fs-5">Upgrade your ToastKart store and unlock powerful features.</p>
        </div>

        {error && (
          <div className="alert alert-danger text-center max-w-md mx-auto mb-4" style={{ maxWidth: '600px', margin: '0 auto' }}>
            {error}
          </div>
        )}

        <div className="billing-toggle">
          <button 
            className={`toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly
          </button>
          <button 
            className={`toggle-btn ${billingCycle === 'yearly' ? 'active' : ''}`}
            onClick={() => setBillingCycle('yearly')}
          >
            Yearly
          </button>
        </div>

        <div className="plans-grid">
          {currentPlans.map((plan) => (
            <div key={plan.id} className="plan-card">
              
              <div className="plan-name">{plan.name}</div>
              <div className="plan-price">
                ₹{plan.price.toLocaleString('en-IN')}
                <span>/ {billingCycle === 'monthly' ? 'month' : 'year'}</span>
              </div>
              
              <div className="plan-features">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="feature-item">
                    <svg className="feature-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    {feature}
                  </div>
                ))}
              </div>

              <button 
                className="plan-btn plan-btn-secondary"
                onClick={() => handleSelectPlan(plan.id)}
                disabled={loading || !isRazorpayLoaded}
              >
                {(!isRazorpayLoaded) ? 'Loading...' : `Choose ${plan.name}`}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
