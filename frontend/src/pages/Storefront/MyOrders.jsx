import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Clock, CheckCircle, Truck, Info, ArrowLeft } from 'lucide-react';
import { useStorefrontAuth } from '../../context/StorefrontAuthContext';
import { useStorefrontCart } from '../../context/StorefrontCartContext';
import api from '../../api/axios';

export default function MyOrders() {
  const { user } = useStorefrontAuth();
  const { storeId } = useStorefrontCart();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getBasePath = () => {
    const p = window.location.pathname;
    if (p.startsWith('/store/')) return `/store/${p.split('/')[2]}`;
    return '/storefront';
  };
  const basePath = getBasePath();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        // Try fetching from API
        const response = await api.get('/orders');
        let apiOrders = Array.isArray(response.data) ? response.data : (response.data?.data || []);
        
        // Filter by the current store if possible
        if (storeId) {
          apiOrders = apiOrders.filter(o => String(o.store_id) === String(storeId) || !o.store_id);
        }

        // Strictly ensure customers only see their OWN orders
        apiOrders = apiOrders.filter(o => {
          const orderEmail = o.customer_email || o.email || o.customer?.email;
          return orderEmail && orderEmail.toLowerCase() === user.email.toLowerCase();
        });
        
        // Also get from local storage just in case (fallback or local-only orders)
        let localOrders = [];
        try {
          const saved = JSON.parse(localStorage.getItem('aureum_owner_orders') || '[]');
          // Attempt to match user email if present
          localOrders = saved.filter(o => !o.email || o.email === user.email);
        } catch (e) {}
        
        // Combine, ensuring no duplicates by ID
        const combined = [...localOrders, ...apiOrders];
        const uniqueOrders = Array.from(new Map(combined.map(o => [o.id, o])).values());
        
        // Sort by date descending
        uniqueOrders.sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));
        
        setOrders(uniqueOrders);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
        // Fallback to local storage only
        try {
          const saved = JSON.parse(localStorage.getItem('aureum_owner_orders') || '[]');
          const localOrders = saved.filter(o => !o.email || o.email === user.email);
          setOrders(localOrders);
        } catch (e) {}
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, storeId, navigate]);

  const getStatusIcon = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'delivered': return <CheckCircle size={16} className="text-success" />;
      case 'shipped': return <Truck size={16} className="text-primary" />;
      case 'pending': return <Clock size={16} className="text-warning" />;
      default: return <Info size={16} className="text-secondary" />;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'delivered': return 'bg-success bg-opacity-10 text-success border border-success border-opacity-25';
      case 'shipped': return 'bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25';
      case 'pending': return 'bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25';
      case 'cancelled': return 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25';
      default: return 'bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };



  return (
    <div className="storefront-container py-5 min-vh-100">
      <div className="d-flex align-items-center mb-4">
        <button onClick={() => navigate(basePath)} className="btn btn-link text-dark p-0 me-3 d-flex align-items-center justify-content-center">
          <ArrowLeft size={28} />
        </button>
        <h1 className="fs-2 font-bold m-0">My Orders</h1>
      </div>

      {!user ? (
        <div className="text-center py-5">
          <div className="w-16 h-16 rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-3">
            <Package size={34} className="text-secondary" />
          </div>
          <h2 className="fs-3 fw-bold mb-2">Please Login</h2>
          <p className="text-secondary max-w-md mx-auto mb-4">
            You must be logged in to view your orders for this store.
          </p>
        </div>
      ) : loading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : orders.length > 0 ? (
        <div className="d-flex flex-column gap-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded shadow-sm border border-light p-4">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center border-bottom pb-3 mb-3 gap-3">
                <div>
                  <h3 className="fs-6 fw-bold mb-1 d-flex align-items-center gap-2">
                    <Package size={18} className="text-secondary" />
                    Order {order.order_number || order.id}
                  </h3>
                  <div className="fs-8 text-secondary">Placed on {formatDate(order.created_at || order.date)}</div>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <div className="fw-bold fs-5">
                    ${Number(order.total_amount || order.total || 0).toFixed(2)}
                  </div>
                  <div className={`badge rounded-pill px-3 py-2 fw-semibold d-flex align-items-center gap-1 ${getStatusBadgeClass(order.status)}`}>
                    {getStatusIcon(order.status)}
                    {order.status || 'Pending'}
                  </div>
                </div>
              </div>
              
              <div className="d-flex flex-column gap-3">
                <h4 className="fs-7 fw-bold mb-2">Order Items</h4>
                {order.items && Array.isArray(order.items) && order.items.length > 0 ? (
                  order.items.map((item, idx) => (
                    <div key={idx} className="d-flex align-items-center gap-3 bg-light p-2 rounded">
                      <div style={{ width: 40, height: 40 }} className="bg-white border rounded overflow-hidden flex-shrink-0">
                        <img 
                          src={item.product?.image || item.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'} 
                          alt={item.product?.name || item.name || 'Product'} 
                          className="w-100 h-100 object-fit-cover" 
                        />
                      </div>
                      <div>
                        <div className="fs-7 fw-semibold">{item.product?.name || item.name || 'Product Item'}</div>
                        <div className="text-secondary fs-8">Qty: {item.quantity || 1} {item.price ? `• $${Number(item.price).toFixed(2)}` : ''}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-secondary fs-7 fst-italic">
                    {order.itemSummary || 'Item details not available'}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-5 rounded shadow-sm border border-light text-center">
          <div className="mb-4 text-secondary">
            <Package size={48} opacity={0.5} />
          </div>
          <h2 className="fs-4 fw-bold mb-3">No orders found</h2>
          <p className="text-secondary mb-4">You haven't placed any orders yet. Start exploring our store!</p>
          <Link to={basePath} className="btn btn-primary px-4 py-2">
            Continue Shopping
          </Link>
        </div>
      )}
    </div>
  );
}
