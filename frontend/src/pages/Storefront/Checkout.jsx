import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStorefrontCart } from '../../context/StorefrontCartContext';
import { useStorefrontAuth } from '../../context/StorefrontAuthContext';
import { normalizeProductImage } from '../../utils/imageUtils';

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart, storeId } = useStorefrontCart();
  const { user } = useStorefrontAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zip: '',
    paymentMethod: 'online'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState('');
  const actionRef = useRef('online');

  const getBasePath = () => {
    const p = window.location.pathname;
    if (p.startsWith('/store/')) return `/store/${p.split('/')[2]}`;
    return '/storefront';
  };
  const basePath = getBasePath();

  if (orderSuccess) {
    return (
      <div className="storefront-container py-5 text-center">
        <div className="py-5 bg-white rounded shadow-sm border border-light max-w-lg mx-auto px-4">
          <div className="mb-4 d-flex justify-content-center">
            <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: 64, height: 64 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
          </div>
          <h2 className="fs-3 fw-bold mb-2">Order Placed Successfully!</h2>
          <div className="badge bg-success-subtle text-success fs-7 mb-3 px-3 py-2 border border-success-subtle">
            Cash on Delivery
          </div>
          {placedOrderId && (
            <p className="fw-semibold text-dark mb-1">
              Order ID: <span className="text-primary">{placedOrderId}</span>
            </p>
          )}
          <p className="text-secondary mb-4">
            Your Cash on Delivery order has been confirmed. You will pay in cash upon receiving your package.
          </p>
          <div className="d-flex justify-content-center gap-3">
            <button className="btn btn-outline-secondary px-4 py-2" onClick={() => navigate(`${basePath}/orders`)}>
              View My Orders
            </button>
            <button className="btn btn-primary px-4 py-2" onClick={() => navigate(basePath)}>
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="storefront-container py-5 text-center">
        <div className="py-5 bg-white rounded shadow-sm border border-light max-w-lg mx-auto">
          <h2 className="fs-3 font-bold mb-3">Your cart is empty</h2>
          <p className="text-secondary mb-4">Looks like you haven't added anything to your cart yet.</p>
          <button className="btn btn-primary px-4 py-2" onClick={() => navigate(basePath)}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlaceCodOrder = async () => {
    setIsSubmitting(true);
    const orderPayload = {
      store_id: storeId,
      customer_name: formData.firstName,
      customer_email: user?.email || formData.email || 'guest@example.com',
      customer_phone: formData.phone,
      shipping_address: `${formData.address}, ${formData.city} - ${formData.zip}`,
      payment_method: 'cod',
      items: cartItems.map((item) => ({
        product_id: item.id,
        product_name: item.name,
        price: item.price,
        quantity: item.quantity
      }))
    };

    let generatedOrderId = '#ORD-' + (Math.floor(Math.random() * 9000) + 1000);

    try {
      const { default: api } = await import('../../api/axios');
      try {
        const res = await api.post('/orders', orderPayload);
        if (res.data?.order_number) {
          generatedOrderId = res.data.order_number;
        }
      } catch (err) {
        console.warn('Backend API failed, continuing with local mock DB', err);
      }

      // Always save to local storage so device guests can see their orders
      try {
        const existing = JSON.parse(localStorage.getItem('aureum_owner_orders') || '[]');
        const mockOrder = {
          id: generatedOrderId,
          store_id: storeId,
          customer: orderPayload.customer_name,
          email: orderPayload.customer_email,
          shipping_address: orderPayload.shipping_address,
          total: cartTotal.toFixed(2),
          status: 'Pending',
          payment_method: 'cod',
          date: new Date().toISOString(),
          items: cartItems.map((item) => ({
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
    } catch (e) {
      console.error(e);
    }

    setPlacedOrderId(generatedOrderId);
    setIsSubmitting(false);
    setOrderSuccess(true);
    clearCart();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (actionRef.current === 'cod') {
      await handlePlaceCodOrder();
    } else {
      navigate(`${basePath}/payment`, { state: { shippingData: { ...formData, paymentMethod: 'online' } } });
    }
  };

  return (
    <div className="storefront-container py-5">
      <h1 className="fs-2 font-bold mb-4">Checkout</h1>

      <div className="row g-5">
        <div className="col-lg-7">
          <div className="bg-white rounded shadow-sm border border-light p-4 mb-4">
            <h3 className="fs-5 fw-bold mb-4">Shipping Information</h3>
            <form id="checkout-form" onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label fs-8 text-secondary fw-semibold">Full Name</label>
                  <input type="text" className="form-control" name="firstName" required onChange={handleInputChange} />
                </div>
                <div className="col-12">
                  <label className="form-label fs-8 text-secondary fw-semibold">Phone Number</label>
                  <input type="tel" className="form-control" name="phone" required pattern="\d{10}" maxLength="10" title="Please enter exactly 10 digits" onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }} onChange={handleInputChange} />
                </div>
                <div className="col-12">
                  <label className="form-label fs-8 text-secondary fw-semibold">Home Address</label>
                  <input type="text" className="form-control" name="address" required onChange={handleInputChange} />
                </div>
                <div className="col-12">
                  <label className="form-label fs-8 text-secondary fw-semibold">City</label>
                  <input type="text" className="form-control" name="city" required onChange={handleInputChange} />
                </div>
                <div className="col-12">
                  <label className="form-label fs-8 text-secondary fw-semibold">Pincode</label>
                  <input type="text" className="form-control" name="zip" required onChange={handleInputChange} />
                </div>
              </div>
            </form>
          </div>

          {/* Payment method selection removed, now happens on next page */}
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
            <div className="d-flex flex-column gap-2 mt-4">
              <button 
                type="submit" 
                form="checkout-form"
                onClick={() => { actionRef.current = 'cod'; }}
                disabled={isSubmitting}
                className="btn w-100 py-3 fw-bold text-white fs-6 rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2" 
                style={{ backgroundColor: '#16a34a', border: 'none' }}
              >
                {isSubmitting && actionRef.current === 'cod' ? (
                  <span>Placing Order...</span>
                ) : (
                  <span>Cash on Delivery (Pay on Delivery)</span>
                )}
              </button>
              <button 
                type="submit" 
                form="checkout-form"
                onClick={() => { actionRef.current = 'online'; }}
                disabled={isSubmitting}
                className="btn w-100 py-2.5 fw-semibold fs-7 rounded-3 text-secondary mt-1 border bg-light" 
              >
                Pay Online (UPI / Card / Netbanking) &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
