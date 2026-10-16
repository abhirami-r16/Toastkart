import React, { useState } from 'react';
import { RefreshCw, Edit2, Check, AlertTriangle, ArrowUpDown, DollarSign, Percent } from 'lucide-react';

export default function ResellingProductTable({
  products,
  onUpdatePrice,
  onSyncProduct,
  onSyncAll,
  loading,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState('');

  const startEdit = (product) => {
    setEditingId(product.id);
    setEditPrice(product.selling_price);
  };

  const handleSavePrice = (productId) => {
    onUpdatePrice(productId, parseFloat(editPrice));
    setEditingId(null);
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
      <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h5 className="fw-bold mb-1 text-dark">My Reselling Products</h5>
          <p className="text-secondary fs-8 mb-0">
            Products imported into your Toastkart storefront with active margin rules and supplier sync.
          </p>
        </div>

        <button
          type="button"
          onClick={onSyncAll}
          disabled={loading || products.length === 0}
          className="btn btn-outline-dark btn-sm rounded-pill fs-8 fw-semibold d-flex align-items-center gap-2 px-3"
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Sync All Prices & Stock
        </button>
      </div>

      <div className="card-body p-0 table-responsive">
        {products.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <p className="mb-0 fs-7">No reselling products imported yet. Browse the catalog above to add your first product.</p>
          </div>
        ) : (
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-secondary fs-8 text-uppercase">
              <tr>
                <th className="ps-4">Product</th>
                <th>Supplier Cost</th>
                <th>Your Selling Price</th>
                <th>Margin (₹)</th>
                <th>Margin (%)</th>
                <th>Stock & Status</th>
                <th>Last Synced</th>
                <th className="text-end pe-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const isEditing = editingId === p.id;
                const images = typeof p.images === 'string' ? JSON.parse(p.images || '[]') : (p.images || []);
                const thumb = images[0] || p.product?.image || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80';

                return (
                  <tr key={p.id}>
                    <td className="ps-4">
                      <div className="d-flex align-items-center gap-3">
                        <img
                          src={thumb}
                          alt={p.title}
                          className="rounded-3 object-cover"
                          style={{ width: 48, height: 48 }}
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80';
                          }}
                        />
                        <div>
                          <div className="fw-bold text-dark fs-8 line-clamp-1" title={p.title}>{p.title}</div>
                          <div className="text-muted fs-9">SKU: {p.sku || p.meesho_product_id} | {p.category}</div>
                        </div>
                      </div>
                    </td>

                    <td className="fs-8 fw-semibold text-secondary">
                      ₹{parseFloat(p.source_price).toFixed(2)}
                    </td>

                    <td>
                      {isEditing ? (
                        <div className="input-group input-group-sm" style={{ width: 140 }}>
                          <span className="input-group-text bg-white">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control fs-8 fw-bold"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                          />
                          <button
                            type="button"
                            className="btn btn-sm btn-success"
                            onClick={() => handleSavePrice(p.id)}
                          >
                            <Check size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="d-flex align-items-center gap-2">
                          <strong className="text-dark fs-8">
                            ₹{Number.isInteger(parseFloat(p.selling_price)) ? parseFloat(p.selling_price) : parseFloat(p.selling_price).toFixed(2)}
                          </strong>
                          <button
                            type="button"
                            onClick={() => startEdit(p)}
                            className="btn btn-link text-muted p-0"
                            title="Edit Selling Price"
                          >
                            <Edit2 size={13} />
                          </button>
                        </div>
                      )}
                    </td>

                    <td className="fs-8 fw-bold text-success">
                      +₹{Number.isInteger(parseFloat(p.margin_amount)) ? parseFloat(p.margin_amount) : parseFloat(p.margin_amount).toFixed(2)}
                    </td>

                    <td className="fs-8 fw-bold text-dark">
                      <span className="badge bg-light text-dark border px-2 py-1">
                        {parseFloat(p.margin_percentage).toFixed(1)}%
                      </span>
                    </td>

                    <td>
                      <span
                        className={`badge fs-9 rounded-pill px-2 py-1 ${
                          p.stock_quantity > 10 ? 'bg-success text-white' : p.stock_quantity > 0 ? 'bg-warning text-dark' : 'bg-danger text-white'
                        }`}
                      >
                        {p.stock_quantity} in stock
                      </span>
                    </td>

                    <td className="fs-9 text-muted">
                      {p.last_synced_at ? new Date(p.last_synced_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                    </td>

                    <td className="text-end pe-4">
                      <button
                        type="button"
                        onClick={() => onSyncProduct(p.id)}
                        disabled={loading}
                        className="btn btn-outline-secondary btn-sm rounded-pill fs-9 px-3 d-inline-flex align-items-center gap-1"
                      >
                        <RefreshCw size={12} /> Sync
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
