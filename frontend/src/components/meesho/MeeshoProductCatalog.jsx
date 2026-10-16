import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Search, Plus, Check, Star, Sparkles } from 'lucide-react';

export default function MeeshoProductCatalog({
  catalog,
  catalogSource,
  onImport,
  loading,
}) {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [customPrice, setCustomPrice] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  // duplicate customTitle removed
  // duplicate selectedProduct removed

  // Open import modal for a product
  const openImportModal = (product) => {
    setSelectedProduct(product);
    setCustomTitle(product.title);
    setCustomPrice('');
  };

  // Handle import confirmation
  const handleConfirmImport = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const importPayload = {
      meesho_product_id: selectedProduct.meesho_product_id,
      selling_price: parseFloat(customPrice),
      custom_title: customTitle || selectedProduct.title,
    };
    await onImport(importPayload);
    setSelectedProduct(null);
    setCustomPrice('');
    setCustomTitle('');
  };

  // No internal fetch; use catalog prop passed from parent.
  // Filtering based on search query and selected category.
  const filtered = (catalog || []).filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCat === 'all' || item.category === selectedCat;
    return matchesSearch && matchesCat;
  });

// Removed now since selection is handled via state

// Removed internal modal handling remains unchanged

  return (
    <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
      <div className="card-header bg-white border-bottom p-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <h5 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
              <Sparkles size={20} className="text-warning" /> Meesho Reselling Catalog (Staging)
            </h5>
            <p className="text-secondary fs-8 mb-0">
              {catalogSource}. Sample workflow data, not live Meesho inventory. Verify supplier availability and pricing before resale.
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <div className="input-group input-group-sm rounded-pill border overflow-hidden" style={{ width: 240 }}>
              <span className="input-group-text bg-white border-0 ps-3">
                <Search size={14} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-0 ps-1 fs-8"
                placeholder="Search catalog..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="d-flex gap-2 mt-3 overflow-auto pb-1">
          {['all', 'Ethnic Wear', 'Jewelry', 'Home & Living', 'Footwear', 'Beauty'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCat(cat)}
              className={`btn btn-sm rounded-pill fs-8 px-3 text-nowrap ${
                selectedCat === cat ? 'btn-dark text-white fw-bold' : 'btn-outline-secondary'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="card-body p-4">
        {filtered.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <p className="mb-0 fs-7">No eligible dropshipping products match your criteria.</p>
          </div>
        ) : (
          <div className="row g-3">
            {filtered.map((item) => {
              const estimatedMargin = Math.max(0, (item.suggested_price || 0) - item.source_price - item.estimated_shipping);
              return (
                <div key={item.meesho_product_id} className="col-12 col-sm-6 col-lg-4">
                  <div
                    className="card h-100 border rounded-4 overflow-hidden shadow-none transition-all hover-shadow"
                    style={{ background: '#ffffff', borderColor: '#f0f0f0' }}
                  >
                    <div className="position-relative">
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className="w-100 object-cover"
                        style={{ height: 210 }}
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80';
                        }}
                      />
                      <span className="badge bg-dark text-white position-absolute top-0 start-0 m-2 fs-9 rounded-pill px-2">
                        {item.category}
                      </span>
                      {item.is_imported && (
                        <span className="badge bg-success text-white position-absolute top-0 end-0 m-2 fs-9 rounded-pill px-2 d-flex align-items-center gap-1">
                          <Check size={11} /> Imported
                        </span>
                      )}
                    </div>

                    <div className="card-body p-3 d-flex flex-column justify-content-between">
                      <div>
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <span className="text-muted fs-9 fw-semibold">{item.supplier_name}</span>
                          <span className="d-flex align-items-center gap-1 text-warning fs-9 fw-bold">
                            <Star size={12} fill="#f59e0b" /> {item.rating} ({item.reviews_count})
                          </span>
                        </div>
                        <h6 className="fw-bold text-dark fs-7 mb-2 text-truncate" title={item.title}>
                          {item.title}
                        </h6>
                        <p className="text-secondary fs-8 line-clamp-2 mb-3">
                          {item.description}
                        </p>
                      </div>

                      <div>
                        <div className="p-2 rounded-3 bg-light mb-3">
                          <div className="d-flex justify-content-between align-items-center fs-8 mb-1">
                            <span className="text-muted">Supplier Cost:</span>
                            <strong className="text-dark">₹{item.source_price.toFixed(2)}</strong>
                          </div>
                          <div className="d-flex justify-content-between align-items-center fs-8 mb-1">
                            <span className="text-muted">Suggested Retail:</span>
                            <strong className="text-primary">₹{item.suggested_price.toFixed(2)}</strong>
                          </div>
                          <div className="d-flex justify-content-between align-items-center fs-8 text-success fw-bold border-top pt-1 mt-1">
                            <span>Potential Margin:</span>
                            <span>+₹{estimatedMargin.toFixed(2)}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={item.is_imported || loading}
                          onClick={() => openImportModal(item)}
                          className={`btn btn-sm w-100 rounded-pill fw-bold fs-8 d-flex align-items-center justify-content-center gap-2 ${
                            item.is_imported
                              ? 'btn-light text-muted'
                              : 'text-white'
                          }`}
                          style={{
                            background: item.is_imported
                              ? '#f3f4f6'
                              : 'linear-gradient(135deg, #d81b60 0%, #ad1457 100%)',
                          }}
                        >
                          {item.is_imported ? (
                            <>
                              <Check size={14} /> Already in Your Store
                            </>
                          ) : (
                            <>
                              <Plus size={14} /> Import to Store
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal for setting selling price & profit check before import */}
      {selectedProduct && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-bottom p-4">
                <h5 className="modal-title fw-bold text-dark">Import Product & Set Selling Price</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedProduct(null)}></button>
              </div>
              <form onSubmit={handleConfirmImport}>
                <div className="modal-body p-4 d-flex flex-column gap-3 fs-7">
                  <div className="d-flex gap-3 align-items-center p-2 rounded-3 bg-light">
                    <img
                      src={selectedProduct.images[0]}
                      alt="Thumb"
                      className="rounded-3 object-cover"
                      style={{ width: 60, height: 60 }}
                    />
                    <div>
                      <div className="fw-bold text-dark fs-8">{selectedProduct.title}</div>
                      <div className="text-muted fs-9">SKU: {selectedProduct.sku} | Cat: {selectedProduct.category}</div>
                    </div>
                  </div>

                  <div>
                    <label className="fw-bold mb-1 text-dark fs-8">Store Product Title</label>
                    <input
                      type="text"
                      required
                      className="form-control fs-7"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                    />
                  </div>

                  <div className="row g-2">
                    <div className="col-6">
                      <label className="fw-bold mb-1 text-dark fs-8">Supplier Price (Meesho)</label>
                      <input
                        type="text"
                        disabled
                        className="form-control fs-7 bg-light text-muted"
                        value={`₹${selectedProduct.source_price.toFixed(2)}`}
                      />
                    </div>
                    <div className="col-6">
                      <label className="fw-bold mb-1 text-dark fs-8">Your Selling Price (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min={selectedProduct.source_price + 1}
                        required
                        className="form-control fs-7 fw-bold text-primary"
                        value={customPrice}
                        onChange={(e) => setCustomPrice(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Real-time Profit Preview */}
                  <div className="p-3 rounded-3 border" style={{ background: '#fdf2f8', borderColor: '#fbcfe8' }}>
                    <div className="fw-bold text-dark fs-8 mb-2">Profit Breakdown (Per Sale)</div>
                    <div className="d-flex justify-content-between fs-8 mb-1">
                      <span className="text-secondary">Selling Price:</span>
                      <strong className="text-dark">₹{parseFloat(customPrice || 0).toFixed(2)}</strong>
                    </div>
                    <div className="d-flex justify-content-between fs-8 mb-1">
                      <span className="text-secondary">Supplier Base Cost:</span>
                      <span className="text-danger">-₹{selectedProduct.source_price.toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between fs-8 mb-1">
                      <span className="text-secondary">Est. Delivery Charges:</span>
                      <span className="text-danger">-₹{selectedProduct.estimated_shipping.toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between fs-8 text-success fw-bold border-top pt-2 mt-1 fs-7">
                      <span>Estimated Net Profit:</span>
                      <span>
                        +₹{Math.max(0, (parseFloat(customPrice || 0) - selectedProduct.source_price - selectedProduct.estimated_shipping)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top p-3">
                  <button type="button" className="btn btn-light rounded-pill fs-8" onClick={() => setSelectedProduct(null)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn text-white rounded-pill fs-8 fw-bold px-4"
                    style={{ background: 'linear-gradient(135deg, #d81b60 0%, #ad1457 100%)' }}
                  >
                    {loading ? 'Importing...' : 'Confirm Import'}
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
