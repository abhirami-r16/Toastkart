import React, { useState } from 'react';
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

  const getBasePath = () => {
    const p = window.location.pathname;
    if (p.startsWith('/store/')) return `/store/${p.split('/')[2]}`;
    return '/storefront';
  };
  const basePath = getBasePath();

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

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate(`${basePath}/payment`, { state: { shippingData: formData } });
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
                  <input type="tel" className="form-control" name="phone" required onChange={handleInputChange} />
                </div>
                <div className="col-12">
                  <label className="form-label fs-8 text-secondary fw-semibold">Street Address</label>
                  <input type="text" className="form-control" name="address" required onChange={handleInputChange} />
                </div>
                <div className="col-12">
                  <label className="form-label fs-8 text-secondary fw-semibold">City</label>
                  <input type="text" className="form-control" name="city" required onChange={handleInputChange} />
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
            <div className="d-flex flex-column gap-3 mt-4">
              <button 
                type="submit" 
                form="checkout-form"
                className="btn w-100 py-3 fw-bold text-white fs-6" 
                style={{ backgroundColor: '#fb641b' }}
              >
                Proceed to Payment
              </button>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
