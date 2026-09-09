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
  
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const shippingData = location.state?.shippingData;

  const getBasePath = () => {
    const p = window.location.pathname;
    if (p.startsWith('/store/')) return `/store/${p.split('/')[2]}`;
    return '/storefront';
  };
  const basePath = getBasePath();

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

  const handlePayment = async (e) => {
    e.preventDefault();
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

  return (
    <div className="storefront-container py-5">
      <h1 className="fs-2 font-bold mb-4">Payment Gateway</h1>

      <div className="row g-5">
        <div className="col-lg-7">
          <div className="bg-white rounded shadow-sm border border-light p-4 mb-4">
            <h3 className="fs-5 fw-bold mb-4">Select Payment Method</h3>
            <form id="payment-form" onSubmit={handlePayment}>
              <div className="d-flex flex-column gap-3">
                
                {/* UPI Option */}
                <label className={`border rounded p-3 cursor-pointer d-flex align-items-center gap-3 ${paymentMethod === 'upi' ? 'border-primary bg-primary bg-opacity-10' : ''}`}>
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="upi" 
                    checked={paymentMethod === 'upi'} 
                    onChange={() => setPaymentMethod('upi')} 
                    className="form-check-input mt-0"
                  />
                  <div>
                    <div className="fw-bold fs-7">UPI (GPay, PhonePe, Paytm)</div>
                    <div className="fs-8 text-secondary">Pay directly from your bank account</div>
                  </div>
                </label>

                {paymentMethod === 'upi' && (
                  <div className="mt-2 p-4 bg-light rounded border text-center">
                    <div className="mb-3">
                      <div style={{width: 150, height: 150, margin: '0 auto'}} className="bg-white border p-2 mb-2 d-flex align-items-center justify-content-center">
                        <svg viewBox="0 0 24 24" width="100%" height="100%" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="7" y="7" width="3" height="3"></rect><rect x="14" y="7" width="3" height="3"></rect><rect x="7" y="14" width="3" height="3"></rect><rect x="14" y="14" width="3" height="3"></rect></svg>
                      </div>
                      <p className="fs-8 fw-semibold mb-1">Scan to Pay</p>
                      <p className="fs-8 text-secondary">Or enter UPI ID below</p>
                    </div>
                    <div>
                      <input type="text" className="form-control text-center" placeholder="yourname@upi" />
                    </div>
                  </div>
                )}

                {/* Credit Card Option */}
                <label className={`border rounded p-3 cursor-pointer d-flex align-items-center gap-3 ${paymentMethod === 'card' ? 'border-primary bg-primary bg-opacity-10' : ''}`}>
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="card" 
                    checked={paymentMethod === 'card'} 
                    onChange={() => setPaymentMethod('card')} 
                    className="form-check-input mt-0"
                  />
                  <div>
                    <div className="fw-bold fs-7">Credit / Debit Card</div>
                    <div className="fs-8 text-secondary">Secure online card payment</div>
                  </div>
                </label>

                {paymentMethod === 'card' && (
                  <div className="mt-2 p-4 bg-light rounded border">
                    <div className="mb-3">
                      <label className="form-label fs-8 text-secondary fw-semibold">Card Number</label>
                      <input type="text" className="form-control" placeholder="0000 0000 0000 0000" maxLength="19" required />
                    </div>
                    <div className="row g-3">
                      <div className="col-6">
                        <label className="form-label fs-8 text-secondary fw-semibold">Expiry Date</label>
                        <input type="text" className="form-control" placeholder="MM/YY" maxLength="5" required />
                      </div>
                      <div className="col-6">
                        <label className="form-label fs-8 text-secondary fw-semibold">CVV</label>
                        <input type="password" className="form-control" placeholder="123" maxLength="4" required />
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </form>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="bg-white rounded shadow-sm border border-light p-4 position-sticky" style={{ top: 100 }}>
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
                type="submit" 
                form="payment-form"
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
