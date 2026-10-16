import React, { useState } from 'react';
import { Package, Truck, ExternalLink, CheckCircle2, Clock, AlertCircle, RotateCcw } from 'lucide-react';

export default function ResellingOrders({
  orders,
  onProcessOrder,
  onUpdateTracking,
  onHandleReturn,
  loading,
}) {
  const [activeModal, setActiveModal] = useState(null); // { type: 'process' | 'tracking' | 'return', order: obj }
  const [supplierOrderId, setSupplierOrderId] = useState('');
  const [courierPartner, setCourierPartner] = useState('Delhivery');
  const [awbNumber, setAwbNumber] = useState('');
  const [shipmentStatus, setShipmentStatus] = useState('In Transit');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [returnStatus, setReturnStatus] = useState('requested');
  const [returnReason, setReturnReason] = useState('Customer size mismatch / Defect');

  const openProcessModal = (order) => {
    setActiveModal({ type: 'process', order });
    setSupplierOrderId(order.meesho_order_id || `MSH-ORD-${Math.floor(Math.random() * 89999 + 10000)}`);
  };

  const openTrackingModal = (order) => {
    setActiveModal({ type: 'tracking', order });
    setCourierPartner(order.courier_partner || 'Delhivery');
    setAwbNumber(order.awb_number || `DLH${Math.floor(Math.random() * 89999999 + 10000000)}`);
    setShipmentStatus(order.shipment_status || 'In Transit');
    setTrackingUrl(order.tracking_url || '');
  };

  const openReturnModal = (order) => {
    setActiveModal({ type: 'return', order });
    setReturnStatus(order.return_status || 'requested');
    setReturnReason(order.return_reason || '');
  };

  const handleProcessSubmit = (e) => {
    e.preventDefault();
    onProcessOrder(activeModal.order.id, {
      meesho_order_id: supplierOrderId,
      supplier_order_status: 'Placed with Supplier',
    });
    setActiveModal(null);
  };

  const handleTrackingSubmit = (e) => {
    e.preventDefault();
    onUpdateTracking(activeModal.order.id, {
      courier_partner: courierPartner,
      awb_number: awbNumber,
      shipment_status: shipmentStatus,
      tracking_url: trackingUrl,
    });
    setActiveModal(null);
  };

  const handleReturnSubmit = (e) => {
    e.preventDefault();
    onHandleReturn(activeModal.order.id, {
      return_status: returnStatus,
      return_reason: returnReason,
    });
    setActiveModal(null);
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
      <div className="card-header bg-white border-bottom p-4">
        <h5 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
          <Truck size={20} className="text-primary" /> Supplier Order Processing & Fulfilment
        </h5>
        <p className="text-secondary fs-8 mb-0">
          Process customer orders with Meesho suppliers, enter tracking references, and track customer shipments.
        </p>
      </div>

      <div className="card-body p-0 table-responsive">
        {orders.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <p className="mb-0 fs-7">No reselling orders yet. New store orders with dropshipped items will automatically appear here.</p>
          </div>
        ) : (
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-secondary fs-8 text-uppercase">
              <tr>
                <th className="ps-4">Order / Customer</th>
                <th>Supplier Ref</th>
                <th>Financial Snapshot</th>
                <th>Net Profit</th>
                <th>Supplier Status</th>
                <th>Shipment & Tracking</th>
                <th className="text-end pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const customerName = o.order?.customer_name || 'Store Customer';
                const orderNum = o.order?.order_number || `#ORD-${o.order_id}`;

                return (
                  <tr key={o.id}>
                    <td className="ps-4">
                      <div>
                        <strong className="text-dark fs-8">{orderNum}</strong>
                        <div className="text-muted fs-9">{customerName}</div>
                      </div>
                    </td>

                    <td>
                      {o.meesho_order_id ? (
                        <span className="badge bg-light text-dark border fs-9 fw-bold">
                          {o.meesho_order_id}
                        </span>
                      ) : (
                        <span className="text-danger fs-9 fw-semibold">Not Placed Yet</span>
                      )}
                    </td>

                    <td>
                      <div className="fs-9">
                        <div>Sale: <strong className="text-dark">₹{parseFloat(o.toastkart_selling_price).toFixed(2)}</strong></div>
                        <div className="text-muted">Cost: ₹{parseFloat(o.source_purchase_cost).toFixed(2)} + Ship: ₹{parseFloat(o.shipping_charges).toFixed(2)}</div>
                      </div>
                    </td>

                    <td>
                      <div className="d-flex flex-column">
                        <strong className={`fs-8 ${o.net_profit > 0 ? 'text-success' : 'text-danger'}`}>
                          +₹{parseFloat(o.net_profit).toFixed(2)}
                        </strong>
                        <span className="fs-9 text-muted">
                          {o.is_profit_confirmed ? '✓ Confirmed' : 'Estimated'}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`badge fs-9 rounded-pill px-2 py-1 ${
                          o.supplier_order_status === 'Confirmed' || o.supplier_order_status === 'Placed with Supplier'
                            ? 'bg-info text-dark'
                            : o.supplier_order_status === 'Cancelled'
                            ? 'bg-danger text-white'
                            : 'bg-warning text-dark'
                        }`}
                      >
                        {o.supplier_order_status}
                      </span>
                    </td>

                    <td>
                      <div>
                        <span
                          className={`badge fs-9 rounded-pill px-2 py-1 ${
                            o.shipment_status === 'Delivered'
                              ? 'bg-success text-white'
                              : o.shipment_status === 'In Transit' || o.shipment_status === 'Out for Delivery'
                              ? 'bg-primary text-white'
                              : 'bg-secondary text-white'
                          }`}
                        >
                          {o.shipment_status}
                        </span>
                        {o.awb_number && (
                          <div className="fs-9 text-muted mt-1">
                            {o.courier_partner}: <strong>{o.awb_number}</strong>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="text-end pe-4">
                      <div className="d-flex justify-content-end gap-1 flex-wrap">
                        {!o.meesho_order_id ? (
                          <button
                            type="button"
                            onClick={() => openProcessModal(o)}
                            disabled={loading}
                            className="btn btn-sm text-white rounded-pill fs-9 fw-bold px-3"
                            style={{ background: 'linear-gradient(135deg, #d81b60 0%, #ad1457 100%)' }}
                          >
                            Place Supplier Order
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openTrackingModal(o)}
                            disabled={loading}
                            className="btn btn-sm btn-outline-primary rounded-pill fs-9 fw-semibold px-2"
                          >
                            Update Tracking
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => openReturnModal(o)}
                          className="btn btn-sm btn-outline-secondary rounded-pill fs-9 px-2"
                          title="Returns / Cancellation"
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
                <h5 className="modal-title fw-bold text-dark">Process Supplier Order on Meesho</h5>
                <button type="button" className="btn-close" onClick={() => setActiveModal(null)}></button>
              </div>
              <form onSubmit={handleProcessSubmit}>
                <div className="modal-body p-4 d-flex flex-column gap-3 fs-7">
                  <div className="p-3 rounded-3 bg-light fs-8">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Customer:</span>
                      <strong>{activeModal.order.order?.customer_name}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span>Shipping Address:</span>
                      <strong className="text-truncate" style={{ maxWidth: 240 }}>
                        {activeModal.order.order?.shipping_address || 'Address provided on checkout'}
                      </strong>
                    </div>
                    <div className="d-flex justify-content-between border-top pt-1 mt-1 text-primary fw-bold">
                      <span>Supplier Cost to Pay:</span>
                      <span>₹{activeModal.order.source_purchase_cost}</span>
                    </div>
                  </div>

                  <div>
                    <label className="fw-bold mb-1 text-dark fs-8">Meesho Supplier Order ID / Reference *</label>
                    <input
                      type="text"
                      required
                      className="form-control fs-7"
                      placeholder="e.g. MSH-ORD-89412"
                      value={supplierOrderId}
                      onChange={(e) => setSupplierOrderId(e.target.value)}
                    />
                    <div className="form-text fs-9 text-muted">
                      Enter the order ID generated upon booking with the Meesho supplier.
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
                    Confirm Order Placed
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
                <h5 className="modal-title fw-bold text-dark">Update Shipment Tracking & AWB</h5>
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
                      </select>
                    </div>

                    <div className="col-6">
                      <label className="fw-bold mb-1 text-dark fs-8">AWB / Tracking Number</label>
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
                      <option value="Picked Up">Picked Up</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered (Confirms Profit)</option>
                      <option value="RTO_Initiated">RTO Initiated</option>
                      <option value="Returned">Returned</option>
                    </select>
                  </div>

                  <div>
                    <label className="fw-bold mb-1 text-dark fs-8">Tracking URL (Optional)</label>
                    <input
                      type="url"
                      className="form-control fs-7"
                      placeholder="https://track.courier.com/..."
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
                    Save Tracking
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
                <h5 className="modal-title fw-bold text-dark">Returns & Cancellation Management</h5>
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
                      <option value="refunded">Refund Issued (Reverses Profit)</option>
                      <option value="rejected">Return Request Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="fw-bold mb-1 text-dark fs-8">Reason / Feedback Notes</label>
                    <textarea
                      rows={3}
                      required
                      className="form-control fs-7"
                      placeholder="Specify reason for cancellation or return..."
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
                    Update Return Status
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
