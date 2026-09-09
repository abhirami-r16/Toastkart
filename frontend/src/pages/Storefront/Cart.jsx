import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useStorefrontCart } from '../../context/StorefrontCartContext';
import { normalizeProductImage } from '../../utils/imageUtils';

export default function Cart() {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeFromCart, cartTotal } = useStorefrontCart();

  const getBasePath = () => {
    const p = window.location.pathname;
    if (p.startsWith('/store/')) return `/store/${p.split('/')[2]}`;
    return '/storefront';
  };
  const basePath = getBasePath();

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="storefront-container py-5 text-center">
        <div className="py-5 bg-white rounded shadow-sm border border-light">
          <div className="d-inline-flex align-items-center justify-content-center bg-light rounded-circle mb-4" style={{ width: 80, height: 80 }}>
            <ShoppingBag size={40} className="text-muted" />
          </div>
          <h2 className="fs-3 font-bold mb-3">Your cart is empty</h2>
          <p className="text-secondary mb-4">Looks like you haven't added anything to your cart yet.</p>
          <button className="btn btn-primary px-4 py-2" onClick={() => navigate(basePath)}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  const handleCheckout = () => {
    navigate(`${basePath}/checkout`);
  };

  return (
    <div className="storefront-container py-5">
      <div className="d-flex align-items-center mb-4">
        <button onClick={() => navigate(basePath)} className="btn btn-link text-dark p-0 me-3 d-flex align-items-center justify-content-center">
          <ArrowLeft size={28} />
        </button>
        <h1 className="fs-2 font-bold m-0">Shopping Cart</h1>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="bg-white rounded shadow-sm border border-light p-4">
            <div className="d-flex justify-content-between border-bottom pb-3 mb-4 d-none d-md-flex text-muted fs-8 text-uppercase fw-bold">
              <div style={{ width: '50%' }}>Product</div>
              <div className="text-center" style={{ width: '15%' }}>Price</div>
              <div className="text-center" style={{ width: '20%' }}>Quantity</div>
              <div className="text-end" style={{ width: '15%' }}>Total</div>
            </div>

            <div className="d-flex flex-column gap-4">
              {cartItems.map(item => (
                <div key={item.id} className="d-flex flex-column flex-md-row align-items-md-center justify-content-between border-bottom pb-4">
                  
                  <div className="d-flex gap-3 align-items-center mb-3 mb-md-0" style={{ width: '100%', md: { width: '50%' } }}>
                    <div style={{ width: 80, height: 80 }} className="bg-light rounded overflow-hidden flex-shrink-0">
                      <img 
                        src={normalizeProductImage(item.image || item.image_url, item.name)} 
                        alt={item.name} 
                        className="w-100 h-100 object-fit-cover" 
                      />
                    </div>
                    <div>
                      <div className="fs-6 fw-bold mb-1">{item.name}</div>
                      {item.selectedSize && (
                        <div className="fs-8 text-secondary mb-1">Size: {item.selectedSize}</div>
                      )}
                      {item.selectedColor && (
                        <div className="fs-8 text-secondary text-capitalize">Color: {item.selectedColor}</div>
                      )}
                      <button 
                        className="btn btn-link p-0 text-danger text-decoration-none fs-8 d-flex align-items-center gap-1"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between w-100 flex-md-row align-items-center">
                    <div className="text-md-center fw-semibold" style={{ width: '15%' }}>
                      ₹{Number(item.price).toFixed(2)}
                    </div>

                    <div className="d-flex justify-content-md-center" style={{ width: '20%' }}>
                      <div className="d-flex align-items-center border rounded">
                        <button 
                          className="btn btn-sm px-2 py-1 border-0" 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="px-2 fs-7 fw-semibold">{item.quantity}</span>
                        <button 
                          className="btn btn-sm px-2 py-1 border-0"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="text-end fw-bold text-primary" style={{ width: '15%' }}>
                      ₹{(Number(item.price) * item.quantity).toFixed(2)}
                    </div>
                  </div>

                </div>
              ))}
            </div>

            <div className="mt-4 pt-3">
              <button 
                className="btn btn-link text-decoration-none text-secondary d-flex align-items-center gap-2 p-0"
                onClick={() => navigate(basePath)}
              >
                <ArrowLeft size={16} /> Continue Shopping
              </button>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="bg-white rounded shadow-sm border border-light p-4 position-sticky" style={{ top: '20px' }}>
            <h3 className="fs-5 fw-bold border-bottom pb-3 mb-3">Order Summary</h3>
            
            <div className="d-flex justify-content-between mb-2 fs-7 text-secondary">
              <span>Subtotal</span>
              <span>₹{cartTotal.toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between mb-3 fs-7 text-secondary">
              <span>Shipping</span>
              <span className="text-success">Free</span>
            </div>
            
            <div className="d-flex justify-content-between border-top pt-3 mb-4 fw-bold fs-5">
              <span>Total</span>
              <span>₹{cartTotal.toFixed(2)}</span>
            </div>
            
            <button 
              className="btn w-100 py-3 fw-bold text-white fs-6" 
              style={{ backgroundColor: '#fb641b' }}
              onClick={handleCheckout}
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
