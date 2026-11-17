import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useStore } from '../context/StoreContext';
import useSEO from '../hooks/useSEO';

export default function Orders() {
  const { activeStore, formatPrice } = useStore();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  const [selectedOrder, setSelectedOrder] = useState(null); // Detail modal
  const [updatingId, setUpdatingId] = useState(null);

  useSEO({ title: 'Order Management', description: 'Create, View Orders, View Details, and Update Order Status.' });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const storeId = activeStore?.id || 1;
      const res = await api.get(`/orders?store_id=${storeId}&status=${statusFilter}&search=${search}`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        const filteredApiOrders = res.data.filter(o => String(o.store_id) === String(storeId));
        setOrders(filteredApiOrders);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.debug('Failed to fetch orders from backend endpoint', err);
    }

    const saved = localStorage.getItem("aureum_owner_orders");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const storeId = activeStore?.id || 1;
          const dummyNames = ["Rhea Kapoor", "Naveen Rao", "Sana Malik", "Om Prakash", "Ananya Roy"];
          const filtered = parsed
            .filter(o => !dummyNames.includes(o.customer))
            .filter(o => String(o.store_id) === String(storeId))
            .map(o => ({
              id: o.id,
              order_number: o.id,
              customer_name: o.customer,
              customer_email: o.email || `${String(o.customer || 'customer').toLowerCase().replace(/\s+/g, '.')}@customer.local`,
              total_amount: String(o.total || "").replace(/[^0-9.]/g, ""),
              status: o.status || "Completed",
              created_at: o.date || new Date().toISOString()
            }));
          setOrders(filtered);
          setLoading(false);
          return;
        }
      } catch (e) {}
    }
    setOrders([]);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [activeStore, statusFilter, search]);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        const updated = await api.get(`/orders/${orderId}`);
        setSelectedOrder(updated.data);
      }
    } catch (err) {
      alert('Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="container-fluid p-0">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold text-dark m-0">Order Management</h2>
          <p className="text-muted fs-7 m-0">
            Track transactions, customer orders, and status updates for <strong>{activeStore?.name}</strong>
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="shopify-card p-3 mb-4 d-flex flex-column flex-md-row justify-content-between gap-3">
        <div className="d-flex align-items-center gap-2 overflow-auto">
          {['All', 'Pending', 'Completed', 'Cancelled'].map(st => (
            <button
              key={st}
              className={`btn btn-sm ${statusFilter === st ? 'btn-shopify' : 'btn-outline-secondary'} text-nowrap`}
              onClick={() => setStatusFilter(st)}
            >
              {st}
            </button>
          ))}
        </div>

        <input
          type="text"
          className="form-control"
          style={{ maxWidth: '300px' }}
          placeholder="🔍 Search order #, customer, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Orders Table */}
      <div className="shopify-card p-4">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status"></div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="shopify-table">
              <thead>
                <tr>
                  <th>Order Number</th>
                  <th>Customer Name & Email</th>
                  <th>Total Amount</th>
                  <th>Order Status</th>
                  <th>Payment</th>
                  <th>Date</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">No orders found matching filters.</td>
                  </tr>
                ) : (
                  orders.map(order => (
                    <tr key={order.id}>
                      <td className="fw-bold text-dark">
                        {order.order_number}
                        {(String(order.store_id) === '86' || String(activeStore?.id) === '86') && (
                          <div className="mt-1">
                            <span className="badge rounded-pill bg-success bg-opacity-10 text-success border border-success border-opacity-25" style={{ fontSize: '10px' }}>
                              Shiprocket {order.shiprocket_shipment?.awb_code ? `• ${order.shiprocket_shipment.awb_code}` : (order.shiprocket_shipment ? '• Synced' : '')}
                            </span>
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="fw-bold">{order.customer_name}</div>
                        <div className="fs-8 text-muted">{order.customer_email}</div>
                      </td>
                      <td className="fw-bold text-success">
                        {formatPrice(order.total_amount)}
                      </td>
                      <td>
                        <select
                          className={`form-select form-select-sm fw-bold border-0 ${order.status === 'Completed' ? 'bg-success text-white' : order.status === 'Cancelled' ? 'bg-danger text-white' : 'bg-warning text-dark'}`}
                          style={{ width: '130px' }}
                          value={order.status}
                          disabled={updatingId === order.id}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td>
                        <span className="badge badge-shopify-success">Paid</span>
                      </td>
                      <td className="text-muted fs-7">
                        {new Date(order.created_at || Date.now()).toLocaleDateString()}
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-shopify-outline"
                          onClick={() => setSelectedOrder(order)}
                        >
                          View Details ↗
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shopify-card border-0">
              <div className="modal-header border-bottom">
                <div>
                  <h5 className="modal-title fw-bold">
                    Order Details: <span className="text-success">{selectedOrder.order_number}</span>
                  </h5>
                  <span className="fs-8 text-muted">
                    Placed on {new Date(selectedOrder.created_at || Date.now()).toLocaleString()}
                  </span>
                </div>
                <button type="button" className="btn-close" onClick={() => setSelectedOrder(null)}></button>
              </div>

              <div className="modal-body">
                {/* Customer & Shipping Summary */}
                <div className="row g-3 mb-4">
                  <div className="col-12 col-md-6">
                    <div className="p-3 bg-light rounded border h-100 fs-7">
                      <h6 className="fw-bold text-dark mb-2">👤 Customer Details</h6>
                      <div><strong>Name:</strong> {selectedOrder.customer_name}</div>
                      <div><strong>Email:</strong> {selectedOrder.customer_email}</div>
                      <div><strong>Phone:</strong> {selectedOrder.customer_phone || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="p-3 bg-light rounded border h-100 fs-7">
                      <h6 className="fw-bold text-dark mb-2">📍 Shipping Address</h6>
                      <p className="m-0 text-secondary">{selectedOrder.shipping_address || 'Standard Shipping'}</p>
                    </div>
                  </div>
                </div>

                {/* Shiprocket Shipping Section (AMIORA Store ID: 86) */}
                {(String(selectedOrder.store_id) === '86' || String(activeStore?.id) === '86') && (
                  <div className="p-3 bg-light rounded border mb-4">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-bold fs-7 text-dark">🚀 Shiprocket Shipping (AMIORA)</span>
                        <span className="badge bg-success text-white" style={{ fontSize: '11px' }}>
                          {selectedOrder.shiprocket_shipment?.sync_status || 'Ready to Sync'}
                        </span>
                      </div>
                      {selectedOrder.shiprocket_shipment?.tracking_url && (
                        <a
                          href={selectedOrder.shiprocket_shipment.tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-xs btn-outline-success fs-8 py-0 px-2"
                        >
                          Courier Tracking ↗
                        </a>
                      )}
                    </div>

                    <div className="row g-2 fs-8 text-secondary">
                      <div className="col-6 col-md-3">
                        <div><strong>Shiprocket ID:</strong> {selectedOrder.shiprocket_shipment?.shiprocket_order_id || '—'}</div>
                      </div>
                      <div className="col-6 col-md-3">
                        <div><strong>Shipment ID:</strong> {selectedOrder.shiprocket_shipment?.shipment_id || '—'}</div>
                      </div>
                      <div className="col-6 col-md-3">
                        <div><strong>AWB Number:</strong> {selectedOrder.shiprocket_shipment?.awb_code || '—'}</div>
                      </div>
                      <div className="col-6 col-md-3">
                        <div><strong>Assigned Courier:</strong> {selectedOrder.shiprocket_shipment?.courier_name || '—'}</div>
                      </div>
                    </div>

                    {selectedOrder.shiprocket_shipment?.label_url && (
                      <div className="mt-2 pt-2 border-top d-flex gap-2">
                        <a
                          href={selectedOrder.shiprocket_shipment.label_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-primary py-0 px-2 fs-8"
                        >
                          📄 Download Shipping Label
                        </a>
                        {selectedOrder.shiprocket_shipment?.manifest_url && (
                          <a
                            href={selectedOrder.shiprocket_shipment.manifest_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-secondary py-0 px-2 fs-8"
                          >
                            📋 Download Manifest
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Line Items Table */}
                <h6 className="fw-bold text-dark mb-2">📦 Order Line Items</h6>
                <div className="table-responsive mb-3 border rounded">
                  <table className="table table-sm align-middle m-0 fs-7">
                    <thead className="table-light">
                      <tr>
                        <th>Product Item</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th className="text-end">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items?.map(item => (
                        <tr key={item.id}>
                          <td className="fw-bold text-dark">{item.product_name}</td>
                          <td>{formatPrice(item.price)}</td>
                          <td>{item.quantity}</td>
                          <td className="fw-bold text-end">{formatPrice(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Price Breakdown */}
                <div className="p-3 bg-light rounded border fs-7 ms-auto" style={{ maxWidth: '320px' }}>
                  <div className="d-flex justify-content-between mb-1">
                    <span>Subtotal:</span>
                    <span>{formatPrice(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span>Tax (5%):</span>
                    <span>{formatPrice(selectedOrder.tax)}</span>
                  </div>
                  <div className="d-flex justify-content-between fw-bold fs-6 pt-2 border-top">
                    <span>Total Amount Paid:</span>
                    <span className="text-success">{formatPrice(selectedOrder.total_amount)}</span>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-top d-flex justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <span className="fs-7 fw-bold">Update Status:</span>
                  <select
                    className="form-select form-select-sm"
                    value={selectedOrder.status}
                    onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <button type="button" className="btn btn-dark" onClick={() => setSelectedOrder(null)}>
                  Close Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
