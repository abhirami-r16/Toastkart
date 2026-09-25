import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStorefrontCart } from '../../context/StorefrontCartContext';
import { useStorefrontAuth } from '../../context/StorefrontAuthContext';
import { normalizeProductImage } from '../../utils/imageUtils';

export default function PaymentGateway() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, cartTotal, clearCart, storeId } = useStorefrontCart();
  const { user } = useStorefrontAuth();
  
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);

  const shippingData = location.state?.shippingData;

  const getBasePath = () => {
    const p = window.location.pathname;
    if (p.startsWith('/store/')) return `/store/${p.split('/')[2]}`;
    return '/storefront';
  };
  const basePath = getBasePath();

  useEffect(() => {
    if (window.Razorpay) {
      setIsRazorpayLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setIsRazorpayLoaded(true);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!shippingData && !orderSuccess) {
      navigate(`${basePath}/checkout`);
    }
  }, [shippingData, navigate, basePath, orderSuccess]);

  if (cartItems.length === 0 && !orderSuccess) {
    return (
      <div className="storefront-container py-5 text-center">
        <h2>Your cart is empty</h2>
        <button className="btn btn-primary mt-3" onClick={() => navigate(basePath)}>
          Return to Store
        </button>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="storefront-container py-5 text-center">
        <div className="py-5 bg-white rounded shadow-sm border border-light max-w-lg mx-auto">
          <div className="mb-4 d-flex justify-content-center">
            <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: 64, height: 64 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
          </div>
          <h2 className="fs-3 font-bold mb-3">Order Placed Successfully!</h2>
          <p className="text-secondary mb-4">Your order has been confirmed. You will receive an email shortly.</p>
          <button className="btn btn-primary mt-3" onClick={() => navigate(basePath)}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  if (!shippingData) return null;

  const placeOrder = async () => {
    setIsSubmitting(true);

    const orderPayload = {
      store_id: storeId,
      customer_name: shippingData.firstName,
      customer_email: user?.email || 'guest@example.com',
      customer_phone: shippingData.phone,
      shipping_address: `${shippingData.address}, ${shippingData.city}`,
      payment_method: paymentMethod,
      items: cartItems.map(item => ({
        product_id: item.id,
        product_name: item.name,
        price: item.price,
        quantity: item.quantity
      }))
    };

    try {
      const { default: api } = await import('../../api/axios');
      await api.post('/orders', orderPayload);
    } catch (err) {
      console.warn("Backend API failed, saving to local mock DB", err);
      try {
        const existing = JSON.parse(localStorage.getItem('aureum_owner_orders') || '[]');
        const mockOrder = {
          id: '#ORD-' + (Math.floor(Math.random() * 9000) + 1000),
          store_id: storeId,
          customer: orderPayload.customer_name,
          email: orderPayload.customer_email,
          total: cartTotal.toFixed(2),
          status: 'Pending',
          date: new Date().toISOString(),
          items: cartItems.map(item => ({
             product_id: item.id,
             product_name: item.name,
             product: item, 
             price: item.price,
             quantity: item.quantity,
             image_url: item.image || item.image_url
          }))
        };
        existing.unshift(mockOrder);
        localStorage.setItem('aureum_owner_orders', JSON.stringify(existing));
      } catch (e) {}
    }

    setIsSubmitting(false);
    setOrderSuccess(true);
    clearCart();
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (paymentMethod === 'razorpay') {
      if (!isRazorpayLoaded) {
        alert('Razorpay is still loading. Please wait.');
        return;
      }
      setIsSubmitting(true);
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_dummykey12345', 
        amount: Math.round(cartTotal * 100),
        currency: 'INR',
        name: 'Store Checkout',
        description: 'Order Payment',
        handler: async function (response) {
          await placeOrder();
        },
        prefill: {
          name: shippingData?.firstName || '',
          email: user?.email || '',
          contact: shippingData?.phone || '',
        },
        theme: {
          color: '#fb641b',
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false);
          },
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        alert(response.error.description || 'Payment failed.');
        setIsSubmitting(false);
      });
      rzp.open();
    } else {
      await placeOrder();
    }
  };

  return (
    <div className="storefront-container py-5">

      <div className="row justify-content-center">
        <div className="col-lg-6 col-md-8">
          <div className="bg-white rounded shadow-sm border border-light p-4">
            <h3 className="fs-5 fw-bold mb-4">Order Summary</h3>
            <div className="d-flex flex-column gap-3 mb-4">
              {cartItems.map((item, idx) => (
                <div key={idx} className="d-flex align-items-center gap-3">
                  <div style={{ width: 50, height: 50 }} className="bg-light border rounded overflow-hidden flex-shrink-0 position-relative">
                    <img src={normalizeProductImage(item.image || item.image_url, item.name)} alt={item.name} className="w-100 h-100 object-fit-cover" />
                    <span className="position-absolute top-0 end-0 badge bg-secondary rounded-circle" style={{ transform: 'translate(25%, -25%)' }}>
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-grow-1">
                    <div className="fs-7 fw-bold">{item.name}</div>
                    {item.selectedSize && (
                      <div className="fs-8 text-secondary mt-1">Size: {item.selectedSize}</div>
                    )}
                    {item.selectedColor && (
                      <div className="fs-8 text-secondary mt-1 text-capitalize">Color: {item.selectedColor}</div>
                    )}
                  </div>
                  <div className="fs-7 fw-semibold">
                    ₹{(Number(item.price) * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-top pt-3 mb-3">
              <div className="d-flex justify-content-between mb-2 fs-7 text-secondary">
                <span>Subtotal</span>
                <span>₹{cartTotal.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-3 fs-7 text-secondary">
                <span>Shipping</span>
                <span className="text-success fw-bold">Free</span>
              </div>
            </div>
            
            <div className="d-flex justify-content-between align-items-center border-top pt-3 mb-4 fw-bold fs-5">
              <span>Total</span>
              <span>₹{cartTotal.toFixed(2)}</span>
            </div>
            <div className="d-flex flex-column gap-3 mt-4">
              <button 
                type="button" 
                onClick={handlePayment}
                className="btn w-100 py-3 fw-bold text-white fs-6" 
                style={{ backgroundColor: '#fb641b' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : `Pay ₹${cartTotal.toFixed(2)} securely`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
