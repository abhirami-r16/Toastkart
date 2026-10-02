
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useSEO from '../hooks/useSEO';
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

  useSEO({
    title: 'Select a Plan - ToastKart',
    description: 'Choose a subscription plan for your store'
  });

  // ------------------------------------------------------------
  // AUTH / SUBSCRIPTION REDIRECT
  // ------------------------------------------------------------
  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login', { replace: true });
      } else if (
        user.active_subscription ||
        user.activeSubscription
      ) {
        const searchParams = new URLSearchParams(window.location.search);
        const redirect = searchParams.get('redirect');
        if (redirect === 'create-store') {
          navigate('/owner/dashboard?action=create-store', { replace: true });
        } else if (redirect === 'categories') {
          navigate('/owner/dashboard?action=categories', { replace: true });
        } else if (redirect === 'ai-builder') {
          navigate('/owner/dashboard?action=ai-builder', { replace: true });
        } else {
          navigate('/owner/dashboard', { replace: true });
        }
      }
    }
  }, [user, loading, navigate]);

  // ------------------------------------------------------------
  // LOAD RAZORPAY SDK
  // ------------------------------------------------------------
  useEffect(() => {
    if (window.Razorpay) {
      console.log('Razorpay SDK already available.');
      setIsRazorpayLoaded(true);
      return;
    }

    const script = document.createElement('script');

    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;

    script.onload = () => {
      console.log('Razorpay SDK loaded successfully.');
      setIsRazorpayLoaded(true);
    };

    script.onerror = () => {
      console.error('Failed to load Razorpay SDK.');

      setError(
        'Failed to load Razorpay SDK. Please check your network connection.'
      );
    };

    document.body.appendChild(script);

    return () => { };
  }, []);

  // ------------------------------------------------------------
  // PLAN STATE
  // ------------------------------------------------------------
  const [selectedPlanModal, setSelectedPlanModal] = useState(null);
  const [enableAutoPay, setEnableAutoPay] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');

  // ------------------------------------------------------------
  // SELECT PLAN
  // ------------------------------------------------------------
  const handleSelectPlan = (planId) => {
    if (!isRazorpayLoaded) {
      setError(
        'Razorpay is still loading. Please wait a moment and try again.'
      );
      return;
    }

    setError('');
    setSelectedPlanModal(planId);
    setEnableAutoPay(false);
    setBillingCycle('monthly');
  };

  // ------------------------------------------------------------
  // RAZORPAY AUTOPAY FAILURE LOGGER
  // ------------------------------------------------------------
  const logRazorpayFailure = (response) => {
    console.error(
      '=================================================='
    );

    console.error('RAZORPAY AUTOPAY PAYMENT FAILED');

    console.error(
      '=================================================='
    );

    console.error('Full Razorpay failure response:', response);

    const razorpayError = response?.error || {};

    console.error('Razorpay AutoPay Error Details:', {
      code: razorpayError.code,
      description: razorpayError.description,
      reason: razorpayError.reason,
      source: razorpayError.source,
      step: razorpayError.step,
      metadata: razorpayError.metadata
    });

    console.error('AutoPay Context:', {
      plan: selectedPlanModal,
      billing_cycle: billingCycle,
      user_id: user?.id,
      user_email: user?.email
    });

    setError(
      razorpayError.description ||
      razorpayError.reason ||
      'AutoPay setup failed. Please try again.'
    );

    setLoading(false);
  };

  // ------------------------------------------------------------
  // PROCEED TO PAYMENT
  // ------------------------------------------------------------
  const handleProceedToPayment = async () => {
    setLoading(true);
    setError('');

    try {
      // ==========================================================
      // AUTOPAY FLOW
      // ==========================================================
      if (enableAutoPay) {
        console.log(
          '=================================================='
        );

        console.log('STARTING RAZORPAY AUTOPAY FLOW');

        console.log(
          '=================================================='
        );

        console.log('AutoPay Context:', {
          plan: selectedPlanModal,
          billing_cycle: billingCycle,
          user_id: user?.id,
          user_email: user?.email
        });

        // --------------------------------------------------------
        // CREATE RAZORPAY SUBSCRIPTION
        // --------------------------------------------------------
        const res = await api.post(
          '/subscriptions/autopay/create',
          {
            plan: selectedPlanModal,
            billing_cycle: billingCycle
          }
        );

        console.log(
          'AutoPay create API response:',
          res.data
        );

        if (!res.data.success) {
          throw new Error(
            res.data.message ||
            'Failed to initialize AutoPay'
          );
        }

        const subscriptionId =
          res.data.subscription_id;

        if (!subscriptionId) {
          throw new Error(
            'Razorpay subscription ID was not returned by the server.'
          );
        }

        console.log(
          'Razorpay AutoPay subscription created:',
          subscriptionId
        );

        // --------------------------------------------------------
        // RAZORPAY CHECKOUT OPTIONS
        // --------------------------------------------------------
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,

          subscription_id: subscriptionId,

          name: 'ToastKart',

          description:
            `AutoPay - ${selectedPlanModal.charAt(0).toUpperCase() + selectedPlanModal.slice(1)} Plan (${billingCycle})`,

          image:
            'https://www.toastkart.com/favicon.png',

          prefill: {
            name: user?.name || '',
            email: user?.email || '',
            ...(user?.phone
              ? { contact: user.phone }
              : {})
          },

          theme: {
            color: '#ff5a1f'
          },

          // ------------------------------------------------------
          // AUTOPAY SUCCESS
          // ------------------------------------------------------
          handler: async function (response) {
            console.log(
              '=================================================='
            );

            console.log(
              'RAZORPAY AUTOPAY SUCCESS HANDLER CALLED'
            );

            console.log(
              '=================================================='
            );

            console.log(
              'Full Razorpay AutoPay response:',
              response
            );

            console.log(
              'Payment ID:',
              response?.razorpay_payment_id
            );

            console.log(
              'Subscription ID:',
              response?.razorpay_subscription_id
            );

            console.log(
              'Signature:',
              response?.razorpay_signature
                ? 'RECEIVED'
                : 'MISSING'
            );

            // ----------------------------------------------------
            // VALIDATE RAZORPAY RESPONSE
            // ----------------------------------------------------
            if (
              !response?.razorpay_payment_id ||
              !response?.razorpay_subscription_id ||
              !response?.razorpay_signature
            ) {
              console.error(
                'Incomplete Razorpay AutoPay response:',
                response
              );

              setError(
                'Razorpay AutoPay authorization did not return complete payment details.'
              );

              setLoading(false);
              return;
            }

            try {
              setLoading(true);

              const verifyPayload = {
                razorpay_payment_id:
                  response.razorpay_payment_id,

                razorpay_subscription_id:
                  response.razorpay_subscription_id,

                razorpay_signature:
                  response.razorpay_signature
              };

              console.log(
                'Sending AutoPay verification request:',
                {
                  razorpay_payment_id:
                    verifyPayload.razorpay_payment_id,

                  razorpay_subscription_id:
                    verifyPayload.razorpay_subscription_id,

                  signature_received:
                    Boolean(
                      verifyPayload.razorpay_signature
                    )
                }
              );

              // --------------------------------------------------
              // VERIFY AUTOPAY WITH BACKEND
              // --------------------------------------------------
              const verifyRes = await api.post(
                '/subscriptions/autopay/verify',
                verifyPayload
              );

              console.log(
                'AutoPay verification response:',
                verifyRes.data
              );

              if (verifyRes.data.success) {
                console.log(
                  'AutoPay verification successful.'
                );

                // ----------------------------------------------
                // REFRESH USER SUBSCRIPTION
                // ----------------------------------------------
                await refreshUser();

                console.log(
                  'User subscription refreshed successfully.'
                );

                alert(
                  'AutoPay enabled successfully. Your subscription will renew automatically according to your selected billing cycle.'
                );

                navigate('/owner/dashboard');
              } else {
                console.error(
                  'AutoPay verification returned unsuccessful response:',
                  verifyRes.data
                );

                setError(
                  verifyRes.data.message ||
                  'AutoPay verification failed.'
                );

                setLoading(false);
              }

            } catch (err) {
              console.error(
                '=================================================='
              );

              console.error(
                'AUTOPAY VERIFICATION REQUEST FAILED'
              );

              console.error(
                '=================================================='
              );

              console.error(
                'Full verification error:',
                err
              );

              console.error(
                'Backend response:',
                err?.response?.data
              );

              console.error(
                'HTTP status:',
                err?.response?.status
              );

              setError(
                err?.response?.data?.message ||
                'Failed to verify AutoPay. Please contact support.'
              );

              setLoading(false);
            }
          },

          // ------------------------------------------------------
          // MODAL DISMISS
          // ------------------------------------------------------
          modal: {
            ondismiss: function () {
              console.log(
                'Razorpay AutoPay checkout dismissed.'
              );

              setLoading(false);
            }
          }
        };

        console.log(
          'Razorpay Checkout options prepared:',
          {
            subscription_id: subscriptionId,
            plan: selectedPlanModal,
            billing_cycle: billingCycle
          }
        );

        console.log(
          'Opening Razorpay AutoPay checkout...'
        );

        // --------------------------------------------------------
        // CREATE RAZORPAY INSTANCE
        // --------------------------------------------------------
        const rzp = new window.Razorpay(options);

        // --------------------------------------------------------
        // PAYMENT FAILED
        // --------------------------------------------------------
        rzp.on(
          'payment.failed',
          function (response) {
            logRazorpayFailure(response);
          }
        );

        // --------------------------------------------------------
        // OPEN CHECKOUT
        // --------------------------------------------------------
        rzp.open();

      } else {
        // ==========================================================
        // NORMAL ONE-TIME PAYMENT FLOW
        // ==========================================================

        console.log(
          '=================================================='
        );

        console.log(
          'STARTING NORMAL ONE-TIME PAYMENT FLOW'
        );

        console.log(
          '=================================================='
        );

        const orderRes = await api.post(
          '/subscriptions/order',
          {
            plan: selectedPlanModal,
            billing_cycle: billingCycle
          }
        );

        console.log(
          'Normal payment order response:',
          orderRes.data
        );

        if (!orderRes.data.success) {
          throw new Error(
            orderRes.data.message ||
            'Failed to create order'
          );
        }

        const {
          order_id,
          amount,
          currency
        } = orderRes.data;

        const options = {
          key:
            import.meta.env.VITE_RAZORPAY_KEY_ID,

          amount: amount,

          currency: currency,

          name: 'ToastKart',

          description:
            `${selectedPlanModal.charAt(0).toUpperCase() + selectedPlanModal.slice(1)} Plan (${billingCycle})`,

          image:
            'https://www.toastkart.com/favicon.png',

          order_id: order_id,

          prefill: {
            name: user?.name || '',
            email: user?.email || '',
            ...(user?.phone
              ? { contact: user.phone }
              : {})
          },

          theme: {
            color: '#ff5a1f'
          },

          handler: async function (response) {
            console.log(
              'Normal Razorpay payment success:',
              response
            );

            try {
              setLoading(true);

              const verifyRes = await api.post(
                '/subscriptions/verify',
                {
                  razorpay_order_id:
                    response.razorpay_order_id,

                  razorpay_payment_id:
                    response.razorpay_payment_id,

                  razorpay_signature:
                    response.razorpay_signature
                }
              );

              console.log(
                'Normal payment verification response:',
                verifyRes.data
              );

              if (verifyRes.data.success) {
                await refreshUser();

                navigate('/owner/dashboard');
              } else {
                setError(
                  verifyRes.data.message ||
                  'Payment verification failed.'
                );

                setLoading(false);
              }

            } catch (err) {
              console.error(
                'Normal payment verification failed:',
                err
              );

              console.error(
                'Backend response:',
                err?.response?.data
              );

              setError(
                err?.response?.data?.message ||
                'Error verifying payment. Please contact support if amount was deducted.'
              );

              setLoading(false);
            }
          },

          modal: {
            ondismiss: function () {
              console.log(
                'Normal Razorpay checkout dismissed.'
              );

              setLoading(false);
            }
          }
        };

        const rzp =
          new window.Razorpay(options);

        rzp.on(
          'payment.failed',
          function (response) {
            console.error(
              'Normal Razorpay payment failed:',
              response
            );

            const razorpayError =
              response?.error || {};

            setError(
              razorpayError.description ||
              razorpayError.reason ||
              'Payment failed.'
            );

            setLoading(false);
          }
        );

        rzp.open();
      }

    } catch (err) {
      console.error(
        '=================================================='
      );

      console.error(
        'PAYMENT INITIALIZATION FAILED'
      );

      console.error(
        '=================================================='
      );

      console.error(
        'Full error:',
        err
      );

      console.error(
        'Backend response:',
        err?.response?.data
      );

      console.error(
        'HTTP status:',
        err?.response?.status
      );

      setError(
        err?.response?.data?.message ||
        err?.message ||
        'An error occurred while setting up the payment.'
      );

      setLoading(false);
    }
  };

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------
  return (
    <div className="pricing-page-wrapper">

      {loading && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-white bg-opacity-75 d-flex align-items-center justify-content-center"
          style={{ zIndex: 1000 }}
        >
          <div
            className="spinner-border text-primary"
            style={{
              width: '3rem',
              height: '3rem'
            }}
          ></div>
        </div>
      )}

      {/* Logout */}
      <div className="d-flex justify-content-end p-3 position-absolute w-100">

        <button
          className="btn rounded-pill px-4 py-2"
          style={{
            backgroundColor: '#ff5a1f',
            color: 'white',
            border: 'none',
            fontWeight: '600',
            zIndex: 100
          }}
          onClick={async () => {
            try {
              await api.post('/logout');
            } catch (err) {
              console.error(
                'Logout request failed:',
                err
              );
            }

            window.location.href = '/login';
          }}
        >
          Logout
        </button>

      </div>

      {/* Header */}
      <div className="pricing-header position-relative">

        <h1>
          Choose Your{' '}
          <span className="brand-text">
            Toastkart
          </span>{' '}
          Plan
        </h1>

        <p>
          Start your online store today.
          Simple, affordable and powerful.
        </p>

        <div className="business-online-doodle">

          <svg
            viewBox="0 0 200 100"
            xmlns="http://www.w3.org/2000/svg"
          >

            <text
              x="10"
              y="30"
              fontFamily="Caveat, cursive, sans-serif"
              fontSize="24"
              fill="#111827"
              transform="rotate(-5)"
            >
              Your
            </text>

            <text
              x="30"
              y="60"
              fontFamily="Caveat, cursive, sans-serif"
              fontSize="28"
              fill="#111827"
              transform="rotate(-5)"
            >
              Business
            </text>

            <text
              x="40"
              y="90"
              fontFamily="Caveat, cursive, sans-serif"
              fontSize="28"
              fill="#111827"
              transform="rotate(-5)"
            >
              Online
            </text>

            <path
              d="M 40 95 Q 100 80 180 90"
              fill="none"
              stroke="#ff5a1f"
              strokeWidth="3"
            />

          </svg>

        </div>

        <div className="pricing-badges">

          <div className="badge-item">
            <Zap size={18} />
            No Coding Required
          </div>

          <div className="badge-item">
            <Store size={18} />
            Launch Quickly
          </div>

          <div className="badge-item">
            <Coins size={18} />
            Affordable Plans
          </div>

          <div className="badge-item">
            <TrendingUp size={18} />
            Grow Your Business
          </div>

        </div>

        {error && (
          <div
            className="alert alert-danger text-center mx-auto mb-4"
            style={{ maxWidth: '600px' }}
          >
            {error}
          </div>
        )}

      </div>

      {/* Pricing Cards */}
      <div className="pricing-cards-container">

        {/* Basic */}
        <div className="pricing-card">

          <div className="card-title-section">

            <h2>Basic</h2>

            <p>
              Perfect for getting started
            </p>

            <div className="card-price">
              <span className="currency">
                ₹
              </span>
              799
              <span className="period">
                /month
              </span>
            </div>

          </div>

          <ul className="features-list">

            <li>
              <Check size={18} />
              Online Store
            </li>

            <li>
              <Check size={18} />
              Toastkart Subdomain
            </li>

            <li>
              <Check size={18} />
              Up to 50 Products
            </li>

            <li>
              <Check size={18} />
              Order Management
            </li>

            <li>
              <Check size={18} />
              Payment Integration
            </li>

            <li>
              <Check size={18} />
              WhatsApp Integration
            </li>

            <li>
              <Check size={18} />
              Email Support
            </li>

          </ul>

          <button
            className="btn-get-started btn-outline"
            onClick={() =>
              handleSelectPlan('basic')
            }
            disabled={
              loading ||
              !isRazorpayLoaded
            }
          >
            Get Started
          </button>

        </div>

        {/* Growth */}
        <div className="pricing-card popular">

          <div className="popular-tag">
            MOST POPULAR
          </div>

          <div className="card-title-section">

            <h2>Growth</h2>

            <p>
              Best for growing businesses
            </p>

            <div className="card-price">

              <span className="currency">
                ₹
              </span>

              999

              <span className="period">
                /month
              </span>

            </div>

          </div>

          <ul className="features-list">

            <li>
              <Check size={18} />
              Online Store
            </li>

            <li>
              <Check size={18} />
              Custom Domain Support
            </li>

            <li>
              <Check size={18} />
              Up to 200 Products
            </li>

            <li>
              <Check size={18} />
              Order Management
            </li>

            <li>
              <Check size={18} />
              Payment Integration
            </li>

            <li>
              <Check size={18} />
              WhatsApp Integration
            </li>

            <li>
              <Check size={18} />
              Email Support
            </li>

            <li>
              <Check size={18} />
              Basic SEO Tools
            </li>

            <li>
              <Check size={18} />
              Priority Support
            </li>

          </ul>

          <button
            className="btn-get-started btn-solid"
            onClick={() =>
              handleSelectPlan('growth')
            }
            disabled={
              loading ||
              !isRazorpayLoaded
            }
          >
            Get Started
          </button>

        </div>

        {/* Pro */}
        <div className="pricing-card">

          <div className="card-title-section">

            <h2>Pro</h2>

            <p>
              For established businesses
            </p>

            <div className="card-price">

              <span className="currency">
                ₹
              </span>

              1,999

              <span className="period">
                /month
              </span>

            </div>

          </div>

          <ul className="features-list">

            <li>
              <Check size={18} />
              Online Store
            </li>

            <li>
              <Check size={18} />
              Custom Domain
            </li>

            <li>
              <Check size={18} />
              Unlimited Products
            </li>

            <li>
              <Check size={18} />
              Order Management
            </li>

            <li>
              <Check size={18} />
              Payment Integration
            </li>

            <li>
              <Check size={18} />
              WhatsApp Integration
            </li>

            <li>
              <Check size={18} />
              Advanced Customization
            </li>

            <li>
              <Check size={18} />
              SEO & Marketing Tools
            </li>

            <li>
              <Check size={18} />
              Priority Support
            </li>

          </ul>

          <button
            className="btn-get-started btn-outline"
            onClick={() =>
              handleSelectPlan('pro')
            }
            disabled={
              loading ||
              !isRazorpayLoaded
            }
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

            <h3>
              Need help setting up your store?
            </h3>

            <p>
              Our team can design, configure and
              launch your store for a one-time setup fee.
            </p>

          </div>

        </div>

        <div className="info-box">

          <div className="info-icon-wrapper green">
            <MessageSquare size={24} />
          </div>

          <div className="info-content">

            <h3>
              Have questions?
            </h3>

            <p>
              Talk to our team and we'll help you
              choose the right plan.
            </p>

          </div>

        </div>

        <div className="info-box">

          <div className="info-icon-wrapper">
            <Rocket size={24} />
          </div>

          <div className="info-content">

            <h3>
              Start Selling Today
            </h3>

            <p>
              Join hundreds of businesses building
              their online store with Toastkart.
            </p>

          </div>

        </div>

      </div>

      {/* Footer Features */}
      <div className="pricing-footer">

        <div className="trust-badges">

          <div className="trust-badge">
            <ShieldCheck size={20} />
            Secure & Reliable
          </div>

          <div className="trust-badge">
            <Headset size={20} />
            Dedicated Support
          </div>

          <div className="trust-badge">
            <Smartphone size={20} />
            Mobile Friendly
          </div>

          <div className="trust-badge">
            <BarChart2 size={20} />
            Built for Growth
          </div>

        </div>

        <div className="footer-logo">

          <div className="logo-text">
            Toast<span>kart</span>
          </div>

          <p>
            SELL . GROW . BEYOND
          </p>

        </div>

      </div>

      {/* Selected Plan Modal */}
      {selectedPlanModal && (

        <div
          className="position-fixed top-0 bottom-0 start-0 end-0 bg-dark bg-opacity-75 d-flex align-items-center justify-content-center p-3"
          style={{ zIndex: 1050 }}
        >

          <div
            className="bg-white rounded-3 shadow w-100 p-4"
            style={{ maxWidth: 420 }}
          >

            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">

              <h3 className="fs-5 font-bold mb-0 text-capitalize">
                {selectedPlanModal} Plan
              </h3>

              <button
                onClick={() =>
                  setSelectedPlanModal(null)
                }
                className="btn btn-sm p-0 border-0 bg-transparent"
                style={{
                  color: '#6d7175'
                }}
              >
                ✕
              </button>

            </div>

            <div className="mb-4 text-center">

              <div
                className="fs-1 fw-bold"
                style={{
                  color: '#ff5a1f'
                }}
              >
                ₹
                {billingCycle === 'monthly'
                  ? selectedPlanModal === 'basic'
                    ? 799
                    : selectedPlanModal === 'growth'
                      ? 999
                      : '1,999'
                  : selectedPlanModal === 'basic'
                    ? '7,999'
                    : selectedPlanModal === 'growth'
                      ? '9,999'
                      : '19,999'}
              </div>

              <div className="text-muted">
                / {billingCycle === 'monthly' ? 'month' : 'year'}
              </div>

            </div>

            <div className="mb-3">

              <label className="fw-semibold mb-2">
                Billing Cycle
              </label>

              <select
                className="form-select"
                value={billingCycle}
                onChange={(e) =>
                  setBillingCycle(
                    e.target.value
                  )
                }
              >

                <option value="monthly">
                  Monthly
                </option>

                <option value="yearly">
                  Yearly
                </option>

              </select>

            </div>

            <div className="mb-4">

              <div className="form-check p-3 bg-light rounded border">

                <input
                  type="checkbox"
                  className="form-check-input mt-1"
                  id="enableAutoPayCheck"
                  checked={enableAutoPay}
                  onChange={(e) =>
                    setEnableAutoPay(
                      e.target.checked
                    )
                  }
                />

                <label
                  className="form-check-label fw-bold ms-2 cursor-pointer"
                  htmlFor="enableAutoPayCheck"
                >
                  Enable AutoPay
                </label>

                {enableAutoPay && (
                  <p className="fs-7 text-muted mt-2 mb-0 ms-2">
                    Your subscription will
                    automatically renew{' '}
                    {billingCycle === 'monthly'
                      ? 'monthly'
                      : 'yearly'}.
                  </p>
                )}

              </div>

            </div>

            <button
              className="btn w-100 py-2 fw-bold text-white"
              style={{
                backgroundColor: '#ff5a1f',
                borderRadius: '8px'
              }}
              onClick={
                handleProceedToPayment
              }
              disabled={loading}
            >
              Continue to Payment
            </button>

          </div>

        </div>

      )}

    </div>
  );
}

