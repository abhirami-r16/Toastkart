import React, { useState } from 'react';
import {
  Package,
  Truck,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  RefreshCw,
  Search,
  MapPin,
  Phone,
  Mail,
  Info,
  ShieldAlert,
} from 'lucide-react';

export default function ResellingOrders({
  orders = [],
  onProcessOrder,
  onRetryOrder,
  onSyncTracking,
  onSyncAllTracking,
  onUpdateTracking,
  onHandleReturn,
  loading = false,
}) {
  const [activeModal, setActiveModal] = useState(null); // { type: 'process' | 'tracking' | 'return', order: obj }
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states - clean without fake auto-generated IDs
  const [supplierOrderId, setSupplierOrderId] = useState('');
  const [courierPartner, setCourierPartner] = useState('Delhivery');
  const [awbNumber, setAwbNumber] = useState('');
  const [shipmentStatus, setShipmentStatus] = useState('In Transit');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [returnStatus, setReturnStatus] = useState('requested');
  const [returnReason, setReturnReason] = useState('Customer size mismatch / Defect');
  const [refundAmount, setRefundAmount] = useState('');

  const openProcessModal = (order) => {
    setActiveModal({ type: 'process', order });
    setSupplierOrderId(order.meesho_order_id || '');
  };

  const openTrackingModal = (order) => {
    setActiveModal({ type: 'tracking', order });
    setCourierPartner(order.courier_partner || 'Delhivery');
    setAwbNumber(order.awb_number || '');
    setShipmentStatus(order.shipment_status || 'In Transit');
    setTrackingUrl(order.tracking_url || '');
  };

  const openReturnModal = (order) => {
    setActiveModal({ type: 'return', order });
    setReturnStatus(order.return_status || 'requested');
    setReturnReason(order.return_reason || '');
    setRefundAmount(order.refund_amount ? String(order.refund_amount) : String(order.toastkart_selling_price || ''));
  };

  const handleProcessSubmit = (e) => {
    e.preventDefault();
    if (!supplierOrderId.trim()) {
      alert('Please enter a valid supplier order reference.');
      return;
    }
    onProcessOrder(activeModal.order.id, {
      meesho_order_id: supplierOrderId.trim(),
      supplier_order_status: 'Placed with Supplier',
    });
    setActiveModal(null);
  };

  const handleTrackingSubmit = (e) => {
    e.preventDefault();
    onUpdateTracking(activeModal.order.id, {
      courier_partner: courierPartner,
      awb_number: awbNumber.trim(),
      shipment_status: shipmentStatus,
      tracking_url: trackingUrl.trim(),
    });
    setActiveModal(null);
  };

  const handleReturnSubmit = (e) => {
    e.preventDefault();
    onHandleReturn(activeModal.order.id, {
      return_status: returnStatus,
      return_reason: returnReason.trim(),
      refund_amount: refundAmount ? parseFloat(refundAmount) : null,
    });
    setActiveModal(null);
  };

  // Status mapping helper
  const getOverallStatus = (o) => {
    if (o.return_status === 'refunded') return 'Refunded';
    if (o.shipment_status === 'Returned' || o.shipment_status === 'RTO_Initiated') return 'RTO';
    if (o.return_status && o.return_status !== 'rejected') return 'Return Requested';
    if (o.supplier_order_status === 'Failed') return 'Failed';
    if (o.supplier_order_status === 'Submitting to Supplier') return 'Submitting to Supplier';
    if (o.shipment_status === 'Delivered') return 'Delivered';
    if (o.shipment_status === 'Out for Delivery') return 'Out for Delivery';
    if (o.shipment_status === 'In Transit' || o.shipment_status === 'Picked Up') return 'Shipped';
    if (o.supplier_order_status === 'Supplier Confirmed' || o.supplier_order_status === 'Placed with Supplier') return 'Supplier Confirmed';
    if (o.supplier_order_status === 'Processing' || o.supplier_order_status === 'Supplier Processing') return 'Processing';
    return 'Pending Fulfillment';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Delivered':
        return <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-pill fs-9 fw-bold">✓ Delivered</span>;
      case 'Out for Delivery':
        return <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle px-2 py-1 rounded-pill fs-9 fw-semibold">Out for Delivery</span>;
      case 'Shipped':
        return <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 rounded-pill fs-9 fw-semibold">Shipped</span>;
      case 'Processing':
        return <span className="badge bg-primary text-white px-2 py-1 rounded-pill fs-9 fw-semibold">Processing</span>;
      case 'Supplier Confirmed':
        return <span className="badge bg-info text-dark px-2 py-1 rounded-pill fs-9 fw-semibold">Supplier Confirmed</span>;
      case 'Submitting to Supplier':
        return <span className="badge bg-warning text-dark px-2 py-1 rounded-pill fs-9 fw-semibold">Submitting to Supplier...</span>;
      case 'Failed':
        return <span className="badge bg-danger text-white px-2 py-1 rounded-pill fs-9 fw-bold">✕ Failed</span>;
      case 'Return Requested':
        return <span className="badge bg-warning-subtle text-warning-emphasis border border-warning px-2 py-1 rounded-pill fs-9 fw-semibold">Return Requested</span>;
      case 'Refunded':
        return <span className="badge bg-secondary-subtle text-secondary border px-2 py-1 rounded-pill fs-9 fw-semibold">Refunded</span>;
      case 'RTO':
        return <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1 rounded-pill fs-9 fw-bold">RTO</span>;
      default:
        return <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1 rounded-pill fs-9 fw-semibold">Pending Fulfillment</span>;
    }
  };

  const filteredOrders = orders.filter((o) => {
    const status = getOverallStatus(o);
    if (statusFilter !== 'All') {
      if (statusFilter === 'Returns/RTO') {
        if (!['Return Requested', 'Refunded', 'RTO'].includes(status)) return false;
      } else if (status !== statusFilter) {
        return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const orderNum = (o.order?.order_number || `#ORD-${o.order_id}`).toLowerCase();
      const customer = (o.customer_name || o.order?.customer_name || '').toLowerCase();
      const supplierRef = (o.meesho_order_id || '').toLowerCase();
      const awb = (o.awb_number || '').toLowerCase();
      return orderNum.includes(q) || customer.includes(q) || supplierRef.includes(q) || awb.includes(q);
    }

    return true;
  });

  return (
    <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
      {/* Header & Overview */}
      <div className="card-header bg-white border-bottom p-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <h5 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
              <Truck size={20} className="text-primary" /> Supplier Order Processing & Automated Fulfilment
            </h5>
            <p className="text-secondary fs-8 mb-0">
              Track customer orders, manage supplier booking references, monitor live shipments, and reconcile profit margins.
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            {onSyncAllTracking && (
              <button
                type="button"
                onClick={onSyncAllTracking}
                disabled={loading}
                className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 fs-8 d-flex align-items-center gap-1"
                title="Poll tracking updates for all in-transit shipments"
              >
                <RefreshCw size={13} className={loading ? 'spin' : ''} />
                <span>Sync Tracking</span>
              </button>
            )}
          </div>
        </div>

        {/* Informative Provider Notice */}
        <div className="alert alert-light border mt-3 mb-0 p-3 rounded-3 d-flex align-items-start gap-2 fs-8 text-secondary">
          <Info size={16} className="text-primary mt-1 flex-shrink-0" />
          <div>
            <strong>Provider Architecture:</strong> ReefAPI and Apify provide catalog search only. Automatic dropshipping fulfillment uses verified payment gates, idempotency protection, and manual or enterprise partner fulfillment fallbacks without fabricating supplier confirmations.
          </div>
        </div>

        {/* Filter Tabs & Search */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mt-3 pt-3 border-top">
          <div className="d-flex gap-1 overflow-auto pb-1" style={{ maxWidth: '100%' }}>
            {[
              'All',
              'Pending Fulfillment',
              'Supplier Confirmed',
              'Processing',
              'Shipped',
              'Delivered',
              'Failed',
              'Returns/RTO',
            ].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`btn btn-sm rounded-pill px-3 py-1 fs-9 text-nowrap fw-semibold ${
                  statusFilter === tab
                    ? 'btn-dark text-white'
                    : 'btn-outline-secondary'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="input-group input-group-sm" style={{ maxWidth: 280 }}>
            <span className="input-group-text bg-light border-end-0">
              <Search size={14} className="text-muted" />
            </span>
            <input
              type="text"
              className="form-control border-start-0 fs-8"
              placeholder="Search order #, AWB, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card-body p-0 table-responsive">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <Package size={40} className="text-secondary opacity-50 mb-2" />
            <p className="mb-0 fs-7">
              {searchQuery || statusFilter !== 'All'
                ? 'No reselling orders match the selected filters.'
                : 'No dropshipping orders found. Orders with imported Meesho products will automatically appear here.'}
            </p>
          </div>
        ) : (
          <table className="table table-hover align-middle mb-0 fs-8">
            <thead className="table-light text-secondary fs-9 text-uppercase">
              <tr>
                <th className="ps-4">Order / Customer</th>
                <th>Product & Qty</th>
                <th>Supplier Ref</th>
                <th>Financial Snapshot</th>
                <th>Net Profit</th>
                <th>Status</th>
                <th>Shipment & Courier</th>
                <th className="text-end pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o) => {
                const customerName = o.customer_name || o.order?.customer_name || 'Store Customer';
                const customerEmail = o.customer_email || o.order?.customer_email || '';
                const customerPhone = o.customer_phone || o.order?.customer_phone || '';
                const shippingAddress = o.customer_address || o.order?.shipping_address || 'Address provided on checkout';
                const orderNum = o.order?.order_number || `#ORD-${o.order_id}`;
                const overallStatus = getOverallStatus(o);
                const isDelivered = overallStatus === 'Delivered';
                const meeshoProdId = o.meesho_product?.meesho_product_id;
                const meeshoUrl = meeshoProdId ? (meeshoProdId.startsWith('http') ? meeshoProdId : `https://www.meesho.com/s/p/${meeshoProdId}`) : null;

                return (
                  <tr key={o.id}>
                    {/* Order & Customer */}
                    <td className="ps-4">
                      <div>
                        {meeshoUrl ? (
                          <a
                            href={meeshoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-decoration-none fw-bold fs-8 d-inline-flex align-items-center gap-1"
                            style={{ color: "#9c27b0" }}
                            title="Click Order ID to open in Meesho App / Website"
                          >
                            <span>{orderNum}</span>
                            <span className="badge rounded-pill bg-purple-subtle text-purple fs-10 p-0.5 px-1 ms-1" style={{ fontSize: "9px" }}>
                              Meesho ↗
                            </span>
                          </a>
                        ) : (
                          <strong className="text-dark fs-8 d-block">{orderNum}</strong>
                        )}
                        <div className="text-dark fw-semibold fs-9">{customerName}</div>
                        {customerPhone && (
                          <div className="text-muted fs-9 d-flex align-items-center gap-1">
                            <Phone size={10} /> {customerPhone}
                          </div>
                        )}
                        <div
                          className="text-truncate text-secondary fs-9 d-flex align-items-center gap-1 mt-1"
                          style={{ maxWidth: 200 }}
                          title={shippingAddress}
                        >
                          <MapPin size={10} className="flex-shrink-0" />
                          <span>{shippingAddress}</span>
                        </div>
                      </div>
                    </td>

                    {/* Product & Variant */}
                    <td>
                      <div style={{ maxWidth: 180 }}>
                        {meeshoUrl ? (
                          <a
                            href={meeshoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="fw-semibold text-dark text-truncate text-decoration-none d-inline-flex align-items-center gap-1"
                            title={`Open ${o.meesho_product?.title || 'product'} in Meesho App`}
                          >
                            <span className="text-truncate">{o.meesho_product?.title || 'Dropshipped Product'}</span>
                            <ExternalLink size={10} style={{ color: "#9c27b0", flexShrink: 0 }} />
                          </a>
                        ) : (
                          <div className="fw-semibold text-dark text-truncate" title={o.meesho_product?.title || 'Meesho Product'}>
                            {o.meesho_product?.title || 'Dropshipped Product'}
                          </div>
                        )}
                        <div className="text-muted fs-9">
                          Qty: <strong>{o.quantity || 1}</strong>
                          {o.variant_info?.size && <span> | Size: {o.variant_info.size}</span>}
                          {o.variant_info?.color && <span> | Color: {o.variant_info.color}</span>}
                        </div>
                      </div>
                    </td>


                    {/* Supplier Reference */}
                    <td>
                      {o.meesho_order_id ? (
                        <span className="badge bg-light text-dark border fs-9 fw-bold">
                          {o.meesho_order_id}
                        </span>
                      ) : (
                        <div>
                          <span className="text-danger fs-9 fw-semibold d-block">Awaiting Supplier Placement</span>
                          <span className="text-muted fs-9">Not Placed Yet</span>
                        </div>
                      )}
                    </td>

                    {/* Financial Breakdown */}
                    <td>
                      <div className="fs-9">
                        <div>Retail: <strong className="text-dark">₹{parseFloat(o.toastkart_selling_price || 0).toFixed(2)}</strong></div>
                        <div className="text-muted">
                          Cost: ₹{parseFloat(o.source_purchase_cost || 0).toFixed(2)} + Ship: ₹{parseFloat(o.shipping_charges || 0).toFixed(2)}
                        </div>
                        <div className="text-muted">
                          Fees: ₹{(parseFloat(o.platform_fees || 0) + parseFloat(o.payment_gateway_fees || 0)).toFixed(2)}
                        </div>
                      </div>
                    </td>

                    {/* Net Profit */}
                    <td>
                      <div className="d-flex flex-column">
                        <strong className={`fs-8 ${parseFloat(o.net_profit || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                          {parseFloat(o.net_profit || 0) >= 0 ? '+' : ''}₹{parseFloat(o.net_profit || 0).toFixed(2)}
                        </strong>
                        <span className="fs-9 text-muted">
                          {o.is_profit_confirmed ? (
                            <span className="text-success fw-semibold">✓ Realized</span>
                          ) : (
                            <span>Estimated</span>
                          )}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      <div className="d-flex flex-column align-items-start gap-1">
                        {getStatusBadge(overallStatus)}
                        {o.customer_payment_status && (
                          <span className="fs-9 text-muted">
                            Pay: <strong>{o.customer_payment_status}</strong>
                          </span>
                        )}
                        {o.failure_reason && overallStatus === 'Failed' && (
                          <span className="text-danger fs-9 text-truncate" style={{ maxWidth: 140 }} title={o.failure_reason}>
                            ⚠ {o.failure_reason}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Shipment & Courier */}
                    <td>
                      <div>
                        {o.awb_number ? (
                          <>
                            <div className="fw-semibold text-dark fs-9">
                              {o.courier_partner || 'Courier'}: {o.awb_number}
                            </div>
                            {o.tracking_url ? (
                              <a
                                href={o.tracking_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary text-decoration-none fs-9 d-flex align-items-center gap-1"
                              >
                                Track Package <ExternalLink size={10} />
                              </a>
                            ) : (
                              <span className="text-muted fs-9">{o.shipment_status}</span>
                            )}
                          </>
                        ) : (
                          <span className="text-muted fs-9">No tracking number</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="text-end pe-4">
                      <div className="d-flex justify-content-end gap-1 flex-wrap">
                        {/* Auto-Retry when failed or unplaced */}
                        {onRetryOrder && (overallStatus === 'Failed' || (!o.meesho_order_id && overallStatus === 'Pending Fulfillment')) && (
                          <button
                            type="button"
                            onClick={() => onRetryOrder(o.id)}
                            disabled={loading}
                            className="btn btn-sm btn-outline-danger rounded-pill fs-9 px-2 d-flex align-items-center gap-1"
                            title="Retry automated submission to supplier"
                          >
                            <RefreshCw size={11} /> <span>Retry</span>
                          </button>
                        )}

                        {/* Manual Supplier Placement */}
                        {!o.meesho_order_id && (
                          <button
                            type="button"
                            onClick={() => openProcessModal(o)}
                            disabled={loading}
                            className="btn btn-sm text-white rounded-pill fs-9 fw-bold px-3"
                            style={{ background: 'linear-gradient(135deg, #d81b60 0%, #ad1457 100%)' }}
                          >
                            Record Supplier Ref
                          </button>
                        )}

                        {/* Update Tracking Modal */}
                        {o.meesho_order_id && (
                          <button
                            type="button"
                            onClick={() => openTrackingModal(o)}
                            disabled={loading}
                            className="btn btn-sm btn-outline-primary rounded-pill fs-9 fw-semibold px-2"
                          >
                            Update Tracking
                          </button>
                        )}

                        {/* Direct Sync Tracking */}
                        {onSyncTracking && o.meesho_order_id && !isDelivered && (
                          <button
                            type="button"
                            onClick={() => onSyncTracking(o.id)}
                            disabled={loading}
                            className="btn btn-sm btn-light border rounded-pill fs-9 px-2"
                            title="Poll tracking status"
                          >
                            <RefreshCw size={11} />
                          </button>
                        )}

                        {/* Return & Refund */}
                        <button
                          type="button"
                          onClick={() => openReturnModal(o)}
                          className="btn btn-sm btn-outline-secondary rounded-pill fs-9 px-2"
                          title="Returns / Cancellation / RTO"
                        >
                          <RotateCcw size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal for Supplier Order Placement */}
      {activeModal?.type === 'process' && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-bottom p-4">
                <h5 className="modal-title fw-bold text-dark">Record Meesho Supplier Order</h5>
                <button type="button" className="btn-close" onClick={() => setActiveModal(null)}></button>
              </div>
              <form onSubmit={handleProcessSubmit}>
                <div className="modal-body p-4 d-flex flex-column gap-3 fs-7">
                  <div className="p-3 rounded-3 bg-light fs-8">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Customer:</span>
                      <strong>{activeModal.order.customer_name || activeModal.order.order?.customer_name}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span>Destination:</span>
                      <strong className="text-truncate" style={{ maxWidth: 240 }}>
                        {activeModal.order.customer_address || activeModal.order.order?.shipping_address || 'Address provided on checkout'}
                      </strong>
                    </div>
                    <div className="d-flex justify-content-between border-top pt-1 mt-1 text-primary fw-bold">
                      <span>Wholesale Supplier Cost:</span>
                      <span>₹{activeModal.order.source_purchase_cost}</span>
                    </div>
                  </div>

                  <div>
                    <label className="fw-bold mb-1 text-dark fs-8">Genuine Meesho Order ID / Supplier Reference *</label>
                    <input
                      type="text"
                      required
                      className="form-control fs-7"
                      placeholder="e.g. MSH-ORD-89412"
                      value={supplierOrderId}
                      onChange={(e) => setSupplierOrderId(e.target.value)}
                    />
                    <div className="form-text fs-9 text-muted">
                      Enter the genuine order reference provided by the supplier. Never fabricate fake IDs.
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top p-3">
                  <button type="button" className="btn btn-light rounded-pill fs-8" onClick={() => setActiveModal(null)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn text-white rounded-pill fs-8 fw-bold px-4"
                    style={{ background: 'linear-gradient(135deg, #d81b60 0%, #ad1457 100%)' }}
                  >
                    Confirm Supplier Order
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Tracking Updates */}
      {activeModal?.type === 'tracking' && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-bottom p-4">
                <h5 className="modal-title fw-bold text-dark">Update Courier & Live Tracking</h5>
                <button type="button" className="btn-close" onClick={() => setActiveModal(null)}></button>
              </div>
              <form onSubmit={handleTrackingSubmit}>
                <div className="modal-body p-4 d-flex flex-column gap-3 fs-7">
                  <div className="row g-2">
                    <div className="col-6">
                      <label className="fw-bold mb-1 text-dark fs-8">Courier Partner</label>
                      <select
                        className="form-select fs-7"
                        value={courierPartner}
                        onChange={(e) => setCourierPartner(e.target.value)}
                      >
                        <option value="Delhivery">Delhivery</option>
                        <option value="Shadowfax">Shadowfax</option>
                        <option value="Xpressbees">Xpressbees</option>
                        <option value="Ekart Logistics">Ekart Logistics</option>
                        <option value="Blue Dart">Blue Dart</option>
                        <option value="Other Carrier">Other Carrier</option>
                      </select>
                    </div>

                    <div className="col-6">
                      <label className="fw-bold mb-1 text-dark fs-8">AWB Tracking Number</label>
                      <input
                        type="text"
                        className="form-control fs-7"
                        placeholder="e.g. DLH4891284"
                        value={awbNumber}
                        onChange={(e) => setAwbNumber(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="fw-bold mb-1 text-dark fs-8">Shipment Status</label>
                    <select
                      className="form-select fs-7"
                      value={shipmentStatus}
                      onChange={(e) => setShipmentStatus(e.target.value)}
                    >
                      <option value="Label Created">Label Created</option>
                      <option value="Picked Up">Picked Up (Marks Toastkart order as Shipped)</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered (Confirms Profit Realization)</option>
                      <option value="RTO_Initiated">RTO Initiated</option>
                      <option value="Returned">Returned / RTO Delivered</option>
                    </select>
                  </div>

                  <div>
                    <label className="fw-bold mb-1 text-dark fs-8">Carrier Tracking URL (Optional)</label>
                    <input
                      type="url"
                      className="form-control fs-7"
                      placeholder="https://track.delhivery.com/..."
                      value={trackingUrl}
                      onChange={(e) => setTrackingUrl(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-footer border-top p-3">
                  <button type="button" className="btn btn-light rounded-pill fs-8" onClick={() => setActiveModal(null)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} className="btn btn-primary rounded-pill fs-8 fw-bold px-4">
                    Save Tracking Details
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Returns & Cancellation */}
      {activeModal?.type === 'return' && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-bottom p-4">
                <h5 className="modal-title fw-bold text-dark">Returns, Refunds & RTO Management</h5>
                <button type="button" className="btn-close" onClick={() => setActiveModal(null)}></button>
              </div>
              <form onSubmit={handleReturnSubmit}>
                <div className="modal-body p-4 d-flex flex-column gap-3 fs-7">
                  <div>
                    <label className="fw-bold mb-1 text-dark fs-8">Action / Status</label>
                    <select
                      className="form-select fs-7"
                      value={returnStatus}
                      onChange={(e) => setReturnStatus(e.target.value)}
                    >
                      <option value="requested">Return Requested by Customer</option>
                      <option value="approved">Return Approved for Pickup</option>
                      <option value="picked_up">Return Picked Up</option>
                      <option value="refunded">Refund Issued (Reverses Realized Profit)</option>
                      <option value="rto">RTO - Return to Origin (Customer Refusal / Undeliverable)</option>
                      <option value="rejected">Return Request Rejected</option>
                    </select>
                  </div>

                  {returnStatus === 'refunded' && (
                    <div>
                      <label className="fw-bold mb-1 text-dark fs-8">Refund Amount (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control fs-7"
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                      />
                    </div>
                  )}

                  <div>
                    <label className="fw-bold mb-1 text-dark fs-8">Reason / Feedback Notes</label>
                    <textarea
                      rows={3}
                      required
                      className="form-control fs-7"
                      placeholder="Specify reason for return, refund, or RTO..."
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-footer border-top p-3">
                  <button type="button" className="btn btn-light rounded-pill fs-8" onClick={() => setActiveModal(null)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} className="btn btn-danger rounded-pill fs-8 fw-bold px-4">
                    Confirm Return Action
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
