import React, { useState, useEffect } from 'react';
import {
  Truck, Package, CheckCircle2, Clock, AlertCircle, RefreshCw,
  ExternalLink, FileText, X, Search, ChevronRight, MapPin,
  ShieldCheck, ArrowRight, Download, Send, AlertTriangle, Info
} from 'lucide-react';
import api from '../../api/axios';
import { formatINR } from '../../utils/currency';

export default function ShiprocketDashboardView({ activeStore }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [syncFilter, setSyncFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [courierModalOpen, setCourierModalOpen] = useState(false);
  const [couriers, setCouriers] = useState([]);
  const [loadingCouriers, setLoadingCouriers] = useState(false);
  const [destinationPincode, setDestinationPincode] = useState('');

  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const [loadingTracking, setLoadingTracking] = useState(false);

  const [dimensionsModalOpen, setDimensionsModalOpen] = useState(false);
  const [dimensions, setDimensions] = useState({
    package_weight: 0.50,
    package_length: 10.0,
    package_breadth: 10.0,
    package_height: 10.0,
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);

  // Fetch status & orders on mount
  const fetchData = async () => {
    setLoading(true);
    try {
      const [statusRes, ordersRes] = await Promise.all([
        api.get('/shiprocket/status'),
        api.get(`/shiprocket/orders?sync_status=${syncFilter}&search=${searchTerm}`)
      ]);
      setStatus(statusRes.data);
      const ordersData = ordersRes.data?.data || ordersRes.data || [];
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (err) {
      console.error('Failed to load Shiprocket dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [syncFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchData();
  };

  // Sync Order
  const handleSyncOrder = async (order, customDimensions = null) => {
    setActionLoading(true);
    try {
      const payload = customDimensions || dimensions;
      const res = await api.post(`/shiprocket/orders/${order.id}/sync`, payload);
      setAlertMsg({ type: 'success', text: `Order ${order.order_number} synced with Shiprocket!` });
      setDimensionsModalOpen(false);
      fetchData();
    } catch (err) {
      setAlertMsg({ type: 'danger', text: err.response?.data?.error || 'Failed to sync with Shiprocket.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Open Serviceability Modal
  const handleOpenCouriers = async (order) => {
    setSelectedOrder(order);
    setCourierModalOpen(true);
    setLoadingCouriers(true);

    let pincode = '';
    const rawAddr = order.shipping_address || order.customer?.address || '';
    const match = rawAddr.match(/\b([1-9][0-9]{5})\b/);
    if (match) pincode = match[1];
    setDestinationPincode(pincode || '683549');

    try {
      const res = await api.post(`/shiprocket/orders/${order.id}/serviceability`, {
        pincode: pincode || undefined,
        weight: order.shiprocket_shipment?.package_weight || 0.5,
      });
      setCouriers(res.data.couriers || []);
    } catch (err) {
      setAlertMsg({ type: 'danger', text: 'Failed to check courier serviceability.' });
    } finally {
      setLoadingCouriers(false);
    }
  };

  // Generate AWB with selected courier
  const handleGenerateAwb = async (order, courierCompanyId = null) => {
    setActionLoading(true);
    try {
      const res = await api.post(`/shiprocket/orders/${order.id}/generate-awb`, {
        courier_company_id: courierCompanyId,
      });
      setAlertMsg({ type: 'success', text: res.data.message || 'AWB generated successfully!' });
      setCourierModalOpen(false);
      fetchData();
    } catch (err) {
      setAlertMsg({ type: 'danger', text: err.response?.data?.error || 'Failed to generate AWB.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Download Label
  const handleDownloadLabel = async (order) => {
    setActionLoading(true);
    try {
      const res = await api.get(`/shiprocket/orders/${order.id}/label`);
      if (res.data?.label_url) {
        window.open(res.data.label_url, '_blank');
      } else {
        alert('Label URL not found.');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to generate shipping label.');
    } finally {
      setActionLoading(false);
    }
  };

  // Download Manifest
  const handleDownloadManifest = async (order) => {
    setActionLoading(true);
    try {
      const res = await api.get(`/shiprocket/orders/${order.id}/manifest`);
      if (res.data?.manifest_url) {
        window.open(res.data.manifest_url, '_blank');
      } else {
        alert('Manifest URL not found.');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to generate manifest.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Real-time Tracking Modal
  const handleOpenTracking = async (order) => {
    setSelectedOrder(order);
    setTrackingModalOpen(true);
    setLoadingTracking(true);
    try {
      const res = await api.get(`/shiprocket/orders/${order.id}/track`);
      setTrackingData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTracking(false);
    }
  };

  // Cancel Shipment
  const handleCancelShipment = async (order) => {
    if (!window.confirm(`Are you sure you want to cancel the Shiprocket shipment for ${order.order_number}?`)) {
      return;
    }
    setActionLoading(true);
    try {
      await api.post(`/shiprocket/orders/${order.id}/cancel`);
      setAlertMsg({ type: 'warning', text: `Shipment for ${order.order_number} cancelled.` });
      fetchData();
    } catch (err) {
      setAlertMsg({ type: 'danger', text: err.response?.data?.error || 'Failed to cancel shipment.' });
    } finally {
      setActionLoading(false);
    }
  };

  const getSyncStatusBadge = (order) => {
    const shipment = order.shiprocket_shipment;
    const status = shipment?.sync_status || 'unsynced';
    switch (status) {
      case 'awb_generated':
      case 'shipped':
        return <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1">AWB Assigned</span>;
      case 'synced':
        return <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 px-2 py-1">Order Synced</span>;
      case 'pickup_scheduled':
        return <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 px-2 py-1">Pickup Scheduled</span>;
      case 'delivered':
        return <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1">Delivered</span>;
      case 'cancelled':
        return <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1">Cancelled</span>;
      default:
        return <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 px-2 py-1">Ready to Sync</span>;
    }
  };

  return (
    <div className="container-fluid p-0">
      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge rounded-pill px-3 py-1 text-white fw-bold" style={{ backgroundColor: '#14271C', border: '1px solid #C2844E' }}>
              AMIORA (Store ID: 86)
            </span>
            <span className={`badge rounded-pill px-2 py-1 ${status?.is_sandbox ? 'bg-warning text-dark' : 'bg-success text-white'}`}>
              {status?.is_sandbox ? 'Sandbox Simulation Mode' : 'Live Production API'}
            </span>
          </div>
          <h2 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
            <Truck size={28} className="text-success" />
            Shiprocket Shipping Management
          </h2>
          <p className="text-muted fs-7 m-0">
            Automated courier serviceability, AWB assignment, and real-time tracking for <strong>LA EMVITHA – AMIORA</strong>.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            onClick={fetchData}
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 shadow-sm"
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {alertMsg && (
        <div className={`alert alert-${alertMsg.type} alert-dismissible fade show d-flex align-items-center justify-content-between`} role="alert">
          <div>{alertMsg.text}</div>
          <button type="button" className="btn-close" onClick={() => setAlertMsg(null)} aria-label="Close"></button>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="shopify-card p-3 d-flex align-items-center gap-3">
            <div className="p-3 rounded-circle bg-success bg-opacity-10 text-success">
              <Package size={24} />
            </div>
            <div>
              <div className="fs-8 text-muted text-uppercase fw-bold">Total AMIORA Orders</div>
              <div className="fs-4 fw-bold text-dark">{status?.stats?.total_orders || orders.length}</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="shopify-card p-3 d-flex align-items-center gap-3">
            <div className="p-3 rounded-circle bg-info bg-opacity-10 text-info">
              <RefreshCw size={24} />
            </div>
            <div>
              <div className="fs-8 text-muted text-uppercase fw-bold">Shiprocket Synced</div>
              <div className="fs-4 fw-bold text-dark">{status?.stats?.synced_orders || 0}</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="shopify-card p-3 d-flex align-items-center gap-3">
            <div className="p-3 rounded-circle bg-primary bg-opacity-10 text-primary">
              <Truck size={24} />
            </div>
            <div>
              <div className="fs-8 text-muted text-uppercase fw-bold">AWB Assigned</div>
              <div className="fs-4 fw-bold text-dark">{status?.stats?.awb_generated || 0}</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="shopify-card p-3 d-flex align-items-center gap-3">
            <div className="p-3 rounded-circle bg-dark bg-opacity-10 text-dark">
              <MapPin size={24} />
            </div>
            <div>
              <div className="fs-8 text-muted text-uppercase fw-bold">Pickup Origin</div>
              <div className="fs-6 fw-bold text-dark">Kerala (PIN {status?.pickup_pincode || '683549'})</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="shopify-card p-3 mb-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div className="d-flex align-items-center gap-2 overflow-auto">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'unsynced', label: 'Ready to Sync' },
            { id: 'synced', label: 'Synced in Shiprocket' },
            { id: 'awb_generated', label: 'AWB Assigned' },
            { id: 'delivered', label: 'Delivered' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              className={`btn btn-sm ${syncFilter === tab.id ? 'btn-success text-white' : 'btn-outline-secondary'} text-nowrap rounded-pill px-3`}
              onClick={() => setSyncFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="d-flex align-items-center gap-2" style={{ maxWidth: '340px' }}>
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Search order #, customer, AWB..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="btn btn-sm btn-outline-success">
            <Search size={14} />
          </button>
        </form>
      </div>

      {/* Orders Table */}
      <div className="shopify-card p-4">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status"></div>
            <p className="mt-2 text-muted fs-7">Loading AMIORA shipping orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <Package size={42} className="opacity-25 mb-2" />
            <h5>No AMIORA orders found</h5>
            <p className="fs-7">Orders placed on AMIORA store (Store ID: 86) will appear here for one-click Shiprocket fulfillment.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="shopify-table align-middle">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer Details</th>
                  <th>Destination Address</th>
                  <th>Amount</th>
                  <th>Sync Status</th>
                  <th>Shiprocket ID / AWB</th>
                  <th>Courier</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => {
                  const shipment = order.shiprocket_shipment;
                  return (
                    <tr key={order.id}>
                      <td className="fw-bold text-dark">
                        {order.order_number || `#ORD-${order.id}`}
                        <div className="fs-8 text-muted">{new Date(order.created_at).toLocaleDateString()}</div>
                      </td>
                      <td>
                        <div className="fw-bold">{order.customer_name}</div>
                        <div className="fs-8 text-muted">{order.customer_phone || 'N/A'}</div>
                      </td>
                      <td>
                        <div className="fs-8 text-truncate" style={{ maxWidth: '200px' }} title={order.shipping_address}>
                          {order.shipping_address || 'Kerala, India'}
                        </div>
                      </td>
                      <td className="fw-bold text-success">
                        {formatINR(parseFloat(order.total_amount) || 0)}
                        <div className="fs-8 text-muted">{order.payment_status || 'Paid'}</div>
                      </td>
                      <td>
                        {getSyncStatusBadge(order)}
                      </td>
                      <td>
                        {shipment?.awb_code ? (
                          <div>
                            <span className="fw-bold text-primary">{shipment.awb_code}</span>
                            <div className="fs-8 text-muted">SR ID: {shipment.shiprocket_order_id}</div>
                          </div>
                        ) : shipment?.shiprocket_order_id ? (
                          <span className="text-muted fs-8">SR ID: {shipment.shiprocket_order_id}</span>
                        ) : (
                          <span className="text-muted fs-8">Not Synced</span>
                        )}
                      </td>
                      <td>
                        {shipment?.courier_name ? (
                          <span className="badge bg-light text-dark border">
                            {shipment.courier_name}
                          </span>
                        ) : (
                          <span className="text-muted fs-8">—</span>
                        )}
                      </td>
                      <td className="text-end">
                        <div className="d-flex align-items-center justify-content-end gap-1">
                          {!shipment || !shipment.shiprocket_order_id ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-success text-white d-inline-flex align-items-center gap-1 shadow-sm"
                              onClick={() => {
                                setSelectedOrder(order);
                                setDimensionsModalOpen(true);
                              }}
                              disabled={actionLoading}
                            >
                              <Send size={12} /> Sync
                            </button>
                          ) : (
                            <>
                              {!shipment.awb_code && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-primary text-white d-inline-flex align-items-center gap-1"
                                  onClick={() => handleOpenCouriers(order)}
                                  disabled={actionLoading}
                                >
                                  <Truck size={12} /> Couriers
                                </button>
                              )}

                              {shipment.awb_code && (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-primary"
                                    title="Real-time Tracking"
                                    onClick={() => handleOpenTracking(order)}
                                  >
                                    Track
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary"
                                    title="Download Shipping Label"
                                    onClick={() => handleDownloadLabel(order)}
                                  >
                                    <FileText size={13} />
                                  </button>
                                </>
                              )}

                              {shipment.sync_status !== 'cancelled' && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  title="Cancel Shipment"
                                  onClick={() => handleCancelShipment(order)}
                                >
                                  <X size={12} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dimensions & Sync Modal */}
      {dimensionsModalOpen && selectedOrder && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shopify-card border-0">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">Sync Order {selectedOrder.order_number} to Shiprocket</h5>
                <button type="button" className="btn-close" onClick={() => setDimensionsModalOpen(false)}></button>
              </div>
              <div className="modal-body p-4">
                <p className="text-muted fs-7 mb-3">
                  Specify parcel weight and dimensions for this coconut product order dispatched from AMIORA warehouse:
                </p>
                <div className="row g-3">
                  <div className="col-6">
                    <label className="form-label fs-8 fw-bold">Package Weight (kg)</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      className="form-control"
                      value={dimensions.package_weight}
                      onChange={(e) => setDimensions({ ...dimensions, package_weight: parseFloat(e.target.value) || 0.5 })}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label fs-8 fw-bold">Length (cm)</label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      className="form-control"
                      value={dimensions.package_length}
                      onChange={(e) => setDimensions({ ...dimensions, package_length: parseFloat(e.target.value) || 10 })}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label fs-8 fw-bold">Breadth (cm)</label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      className="form-control"
                      value={dimensions.package_breadth}
                      onChange={(e) => setDimensions({ ...dimensions, package_breadth: parseFloat(e.target.value) || 10 })}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label fs-8 fw-bold">Height (cm)</label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      className="form-control"
                      value={dimensions.package_height}
                      onChange={(e) => setDimensions({ ...dimensions, package_height: parseFloat(e.target.value) || 10 })}
                    />
                  </div>
                </div>

                <div className="p-3 bg-light rounded mt-3 fs-8 text-secondary">
                  <strong>Origin Warehouse:</strong> 14/97 Cherukunnam, Asamannoor P.O., Perumbavoor, Kerala 683549
                </div>
              </div>
              <div className="modal-footer border-top">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setDimensionsModalOpen(false)}>Cancel</button>
                <button
                  type="button"
                  className="btn btn-success text-white px-4 fw-bold"
                  disabled={actionLoading}
                  onClick={() => handleSyncOrder(selectedOrder, dimensions)}
                >
                  {actionLoading ? 'Syncing...' : 'Confirm & Sync'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Courier Serviceability & Assign Modal */}
      {courierModalOpen && selectedOrder && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shopify-card border-0">
              <div className="modal-header border-bottom">
                <div>
                  <h5 className="modal-title fw-bold">Available Couriers for {selectedOrder.order_number}</h5>
                  <span className="fs-8 text-muted">Destination PIN: {destinationPincode} • Weight: 0.5 kg</span>
                </div>
                <button type="button" className="btn-close" onClick={() => setCourierModalOpen(false)}></button>
              </div>
              <div className="modal-body p-4">
                {loadingCouriers ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="mt-2 text-muted fs-7">Checking live courier availability and rates...</p>
                  </div>
                ) : couriers.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <AlertTriangle size={32} className="text-warning mb-2" />
                    <p>No couriers serviceable for this destination pincode.</p>
                  </div>
                ) : (
                  <div className="list-group">
                    {couriers.map((courier, idx) => (
                      <div key={idx} className="list-group-item d-flex align-items-center justify-content-between p-3 mb-2 rounded border">
                        <div className="d-flex align-items-center gap-3">
                          <div className="p-2 rounded bg-light border">
                            <Truck size={22} className="text-primary" />
                          </div>
                          <div>
                            <div className="fw-bold fs-6">{courier.courier_name}</div>
                            <div className="fs-8 text-muted">
                              Estimated Delivery: <strong className="text-dark">{courier.etd}</strong> • Rating: ⭐ {courier.rating}
                            </div>
                          </div>
                        </div>

                        <div className="d-flex align-items-center gap-3">
                          <div className="text-end">
                            <div className="fw-bold fs-5 text-success">{formatINR(courier.rate)}</div>
                            <div className="fs-8 text-muted">{courier.is_cod ? 'COD Available' : 'Prepaid Only'}</div>
                          </div>

                          <button
                            type="button"
                            className="btn btn-sm btn-primary px-3 fw-bold"
                            disabled={actionLoading}
                            onClick={() => handleGenerateAwb(selectedOrder, courier.courier_company_id)}
                          >
                            Assign & Generate AWB
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-footer border-top">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setCourierModalOpen(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Tracking Modal */}
      {trackingModalOpen && selectedOrder && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shopify-card border-0">
              <div className="modal-header border-bottom">
                <div>
                  <h5 className="modal-title fw-bold">Live Tracking: {selectedOrder.order_number}</h5>
                  <span className="fs-8 text-muted">
                    Courier: {selectedOrder.shiprocket_shipment?.courier_name || 'Assigned Courier'} • AWB: {selectedOrder.shiprocket_shipment?.awb_code}
                  </span>
                </div>
                <button type="button" className="btn-close" onClick={() => setTrackingModalOpen(false)}></button>
              </div>
              <div className="modal-body p-4">
                {loadingTracking ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                  </div>
                ) : (
                  <>
                    {/* Status Highlights */}
                    <div className="d-flex align-items-center justify-content-between p-3 rounded mb-4" style={{ backgroundColor: '#14271C', color: '#fff' }}>
                      <div>
                        <div className="fs-8 text-uppercase" style={{ color: '#C2844E' }}>Current Status</div>
                        <div className="fs-5 fw-bold">{trackingData?.tracking?.current_status || 'In Transit'}</div>
                      </div>
                      <div className="text-end">
                        <div className="fs-8 text-uppercase" style={{ color: '#C2844E' }}>Estimated Delivery</div>
                        <div className="fs-6 fw-bold">{trackingData?.tracking?.etd || '3-5 Business Days'}</div>
                      </div>
                    </div>

                    {/* Milestones Flow */}
                    <div className="mb-4">
                      <h6 className="fw-bold mb-3">Shipment Progress Milestones</h6>
                      <div className="d-flex flex-wrap justify-content-between position-relative gap-2">
                        {selectedOrder.shiprocket_shipment?.milestones?.map((m) => (
                          <div key={m.step} className="text-center" style={{ flex: '1 1 0px', minWidth: '80px' }}>
                            <div
                              className={`rounded-circle mx-auto d-flex align-items-center justify-content-center mb-1 ${m.completed ? 'bg-success text-white' : 'bg-light text-secondary border'}`}
                              style={{ width: '32px', height: '32px' }}
                            >
                              {m.completed ? <CheckCircle2 size={16} /> : m.step}
                            </div>
                            <div className="fs-8 fw-semibold">{m.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Activity Log */}
                    <h6 className="fw-bold mb-2">Transit Activity History</h6>
                    <div className="border rounded p-3 bg-light" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {trackingData?.tracking?.activities && trackingData.tracking.activities.length > 0 ? (
                        trackingData.tracking.activities.map((act, i) => (
                          <div key={i} className="border-bottom pb-2 mb-2 fs-8">
                            <div className="fw-bold text-dark">{act.activity}</div>
                            <div className="text-muted d-flex justify-content-between">
                              <span>{act.location}</span>
                              <span>{act.date}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-muted fs-8">Package registered with courier partner. Live scanning updates will appear shortly.</div>
                      )}
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer border-top d-flex justify-content-between">
                {selectedOrder.shiprocket_shipment?.tracking_url && (
                  <a
                    href={selectedOrder.shiprocket_shipment.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1"
                  >
                    Open Courier Portal <ExternalLink size={12} />
                  </a>
                )}
                <button type="button" className="btn btn-outline-secondary" onClick={() => setTrackingModalOpen(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
