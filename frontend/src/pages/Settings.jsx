import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import useSEO from '../hooks/useSEO';

export default function Settings() {
  const { activeStore, updateStore } = useStore();

  useSEO({ title: 'Store Settings', description: 'Configure Store Name, Logo, Currency, and global shop options.' });

  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    currency: 'INR',
    description: '',
    status: 'Active',
  });

  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeStore) {
      setFormData({
        name: activeStore.name || '',
        logo: activeStore.logo || '',
        currency: activeStore.currency || 'INR',
        description: activeStore.description || '',
        status: activeStore.status || 'Active',
      });
    }
  }, [activeStore]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });

    if (!activeStore?.id) {
      setMsg({ type: 'danger', text: 'No active store selected.' });
      setLoading(false);
      return;
    }

    const res = await updateStore(activeStore.id, formData);
    if (res.success) {
      setMsg({ type: 'success', text: 'Store settings updated successfully!' });
    } else {
      setMsg({ type: 'danger', text: res.message || 'Failed to update store settings.' });
    }
    setLoading(false);
  };

  return (
    <div className="container-fluid p-0 max-w-4xl">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark m-0">Store Settings</h2>
          <p className="text-muted fs-7 m-0">Manage configuration for <strong>{activeStore?.name}</strong></p>
        </div>
      </div>

      {msg.text && (
        <div className={`alert alert-${msg.type} py-2 fs-7 mb-4`}>
          {msg.text}
        </div>
      )}

      <div className="shopify-card p-4 p-md-5">
        <form onSubmit={handleSubmit}>
          <div className="row g-4">
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold fs-7 text-dark">Store Name *</label>
              <input
                type="text"
                className="form-control"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold fs-7 text-dark">Store Currency *</label>
              <select
                className="form-select"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              >
                <option value="USD">USD ($ - US Dollar)</option>
                <option value="EUR">EUR (€ - Euro)</option>
                <option value="GBP">GBP (£ - British Pound)</option>
                <option value="PKR">PKR (Rs. - Pakistani Rupee)</option>
                <option value="INR">INR (₹ - Indian Rupee)</option>
                <option value="CAD">CAD (CA$ - Canadian Dollar)</option>
                <option value="AUD">AUD (AU$ - Australian Dollar)</option>
              </select>
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold fs-7 text-dark">Store Logo URL</label>
              <input
                type="url"
                className="form-control"
                placeholder="https://..."
                value={formData.logo}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
              />
              {formData.logo && (
                <div className="mt-2 d-flex align-items-center gap-2">
                  <span className="fs-8 text-muted">Preview:</span>
                  <img src={formData.logo} alt="Logo" className="rounded-circle border" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                </div>
              )}
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold fs-7 text-dark">Store Tagline / Description</label>
              <textarea
                className="form-control"
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              ></textarea>
            </div>

            <div className="col-12 border-top pt-3 text-end">
              <button type="submit" className="btn btn-shopify fw-bold" disabled={loading}>
                {loading ? 'Saving Changes...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
