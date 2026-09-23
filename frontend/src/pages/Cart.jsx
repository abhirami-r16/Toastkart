import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import useSEO from '../hooks/useSEO';

export default function Cart() {
  const { cartItems, updateQuantity, removeFromCart, clearCart, cartSubtotal, placeOrder, loading } = useCart();
  const { activeStore, formatPrice } = useStore();

  useSEO({ title: 'Shopping Cart', description: 'Review your cart items, quantities, and proceed to checkout.' });

  const [customer, setCustomer] = useState({ name: '', email: '', phone: '', address: '' });
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCheckout = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const res = await placeOrder(customer);
    if (res.success) {
      setOrderSuccess(res.order);
    } else {
      setErrorMsg(res.message);
    }
  };

  if (orderSuccess) {
    return (
      <div className="container py-5 text-center">
        <div className="shopify-card p-5 border-0 shadow-lg max-w-lg mx-auto">
          <div className="display-3 mb-3">✅</div>
          <h2 className="fw-bold text-success mb-2">Order Confirmed!</h2>
          <p className="lead text-muted mb-4">Order Number: <strong>{orderSuccess.order_number}</strong></p>
          <div className="p-3 bg-light rounded text-start mb-4 border">
            <div><strong>Store:</strong> {activeStore?.name}</div>
            <div><strong>Total Paid:</strong> {formatPrice(orderSuccess.total_amount)}</div>
            <div><strong>Status:</strong> <span className="badge badge-shopify-warning">Pending Processing</span></div>
          </div>
          <NavLink to="/" className="btn btn-shopify py-2.5 px-4 fw-bold">
            Return to Storefront
          </NavLink>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark m-0">Shopping Cart</h2>
          <p className="text-muted fs-7 m-0">Review items & checkout for <strong>{activeStore?.name}</strong></p>
        </div>
        {cartItems.length > 0 && (
          <button className="btn btn-sm btn-outline-danger" onClick={clearCart}>
            Clear Cart
          </button>
        )}
      </div>

      {cartItems.length === 0 ? (
        <div className="shopify-card p-5 text-center">
          <div className="display-3 text-muted mb-3">🛒</div>
          <h4 className="fw-bold text-dark">Your cart is empty</h4>
          <p className="text-muted fs-7 mb-4">Browse storefront products to add items to your cart.</p>
          <NavLink to="/" className="btn btn-shopify">
            Explore Storefront ↗
          </NavLink>
        </div>
      ) : (
        <div className="row g-4">
          {/* Cart Table */}
          <div className="col-12 col-lg-8">
            <div className="shopify-card p-4">
              <div className="table-responsive">
                <table className="shopify-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th className="text-center">Quantity</th>
                      <th className="text-end">Subtotal</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="d-flex align-items-center gap-3">
                            <img
                              src={item.product?.image || 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22800%22%20height%3D%221000%22%20viewBox%3D%220%200%20800%201000%22%3E%3Crect%20fill%3D%22%23f3f4f6%22%20width%3D%22800%22%20height%3D%221000%22%2F%3E%3Ctext%20fill%3D%22%239ca3af%22%20font-family%3D%22sans-serif%22%20font-size%3D%2230%22%20dy%3D%2210.5%22%20font-weight%3D%22bold%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E'}
                              alt={item.product?.name}
                              className="rounded border"
                              style={{ width: '56px', height: '56px', objectFit: 'cover' }}
                            />
                            <div>
                              <div className="fw-bold text-dark">{item.product?.name}</div>
                              <div className="fs-8 text-muted">SKU: {item.product?.sku}</div>
                            </div>
                          </div>
                        </td>
                        <td className="fw-bold text-dark">{formatPrice(item.price)}</td>
                        <td className="text-center">
                          <div className="input-group input-group-sm mx-auto" style={{ width: '100px' }}>
                            <button
                              className="btn btn-outline-secondary"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >-</button>
                            <span className="input-group-text bg-white fw-bold">{item.quantity}</span>
                            <button
                              className="btn btn-outline-secondary"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >+</button>
                          </div>
                        </td>
                        <td className="fw-bold text-success text-end">{formatPrice(item.price * item.quantity)}</td>
                        <td className="text-end">
                          <button className="btn btn-sm btn-link text-danger p-0 text-decoration-none" onClick={() => removeFromCart(item.id)}>
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Checkout Panel */}
          <div className="col-12 col-lg-4">
            <div className="shopify-card p-4">
              <h5 className="fw-bold text-dark mb-3">Order Summary</h5>

              {errorMsg && <div className="alert alert-danger py-2 fs-7 mb-3">{errorMsg}</div>}

              <form onSubmit={handleCheckout}>
                <div className="mb-2">
                  <label className="form-label fs-8 fw-bold text-uppercase text-muted">Customer Name *</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    required
                    placeholder="Full Name"
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  />
                </div>

                <div className="mb-2">
                  <label className="form-label fs-8 fw-bold text-uppercase text-muted">Email *</label>
                  <input
                    type="email"
                    className="form-control form-control-sm"
                    required
                    placeholder="email@example.com"
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                  />
                </div>

                <div className="mb-2">
                  <label className="form-label fs-8 fw-bold text-uppercase text-muted">Phone *</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    required
                    placeholder="+1 (555) 000-0000"
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fs-8 fw-bold text-uppercase text-muted">Shipping Address *</label>
                  <textarea
                    className="form-control form-control-sm"
                    rows="2"
                    required
                    placeholder="Address..."
                    value={customer.address}
                    onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                  ></textarea>
                </div>

                <div className="p-3 bg-light rounded border mb-3 fs-7">
                  <div className="d-flex justify-content-between mb-1">
                    <span>Subtotal:</span>
                    <span>{formatPrice(cartSubtotal)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span>Est. Tax (5%):</span>
                    <span>{formatPrice(cartSubtotal * 0.05)}</span>
                  </div>
                  <div className="d-flex justify-content-between fw-bold pt-2 border-top fs-6">
                    <span>Total:</span>
                    <span className="text-success">{formatPrice(cartSubtotal * 1.05)}</span>
                  </div>
                </div>

                <button type="submit" className="btn btn-shopify w-100 py-2.5 fw-bold" disabled={loading}>
                  {loading ? 'Processing...' : 'Complete Checkout'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
