import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Key, Link2, Unlink, CheckCircle2, AlertTriangle, RefreshCw, Info } from 'lucide-react';

export default function MeeshoConnectionCard({
  account,
  capabilities,
  onConnect,
  onDisconnect,
  onTestReefApi,
  testingReefApi,
  loading,
}) {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [formData, setFormData] = useState({
    supplier_id: account?.supplier_id || '',
    account_name: account?.account_name || 'My Meesho Supplier Account',
    registered_email: account?.registered_email || '',
    registered_phone: account?.registered_phone || '',
    api_key: '',
    api_secret: '',
    mode: account?.mode || 'manual_assisted',
  });

  const isConnected = account && account.connection_status !== 'disconnected';
  const isLiveApproved = account?.connection_status === 'live_approved';
  const isLiveCatalogConfigured = capabilities?.live_catalog_search_configured === true;
  const isSandbox = account?.connection_status === 'sandbox_verified';
  const isManual = account?.connection_status === 'manual_active';

  const handleSubmit = (e) => {
    e.preventDefault();
    onConnect(formData);
    setShowConfigModal(false);
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
      <div className="card-body p-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
              style={{
                width: 54,
                height: 54,
                background: 'linear-gradient(135deg, #d81b60 0%, #ad1457 100%)',
                fontSize: 20,
              }}
            >
              M
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <h4 className="fw-bold mb-0 text-dark fs-5">Meesho Reselling Connector</h4>
                {isLiveCatalogConfigured ? (
                    <span className="badge bg-success text-white d-flex align-items-center gap-1 py-1 px-2">
                      <CheckCircle2 size={13} /> {capabilities?.catalog_source || 'Live Meesho Catalog'}
                    </span>
                  ) : isConnected && isLiveApproved ? (
                    <span className="badge bg-warning text-dark d-flex align-items-center gap-1 py-1 px-2">
                      <AlertTriangle size={13} /> Live catalog unavailable
                    </span>
                  ) : isConnected && isSandbox ? (
                    <span className="badge bg-info text-dark d-flex align-items-center gap-1 py-1 px-2">
                      <ShieldCheck size={13} /> Sandbox Staging Verified
                    </span>
                  ) : isConnected ? (
                    <span className="badge bg-warning text-dark d-flex align-items-center gap-1 py-1 px-2">
                      <ShieldCheck size={13} /> Assisted Reselling Active
                    </span>
                  ) : (
                  <span className="badge bg-secondary text-white py-1 px-2">Disconnected</span>
                )}
              </div>
              <p className="text-secondary fs-8 mb-0 mt-1">
                Subscription mode high-margin dropshipping workflow. Source trending products & fulfill customer orders.
              </p>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            {isLiveCatalogConfigured && (
              <button
                type="button"
                onClick={onTestReefApi}
                disabled={testingReefApi || loading}
                className="btn btn-outline-success btn-sm px-3 rounded-pill fs-8 fw-semibold d-flex align-items-center gap-1"
              >
                <RefreshCw size={14} className={testingReefApi ? 'spinner' : ''} />
                {testingReefApi ? 'Testing…' : (capabilities?.scraper_provider === 'reefapi' ? 'Test ReefAPI' : capabilities?.scraper_provider === 'apify' ? 'Test Apify' : 'Test Provider')}
              </button>
            )}
            {isConnected ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowConfigModal(true)}
                  className="btn btn-outline-secondary btn-sm px-3 rounded-pill fs-8 fw-semibold"
                >
                  Configure
                </button>
                <button
                  type="button"
                  onClick={onDisconnect}
                  disabled={loading}
                  className="btn btn-outline-danger btn-sm px-3 rounded-pill fs-8 fw-semibold d-flex align-items-center gap-1"
                >
                  <Unlink size={14} /> Disconnect
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setShowConfigModal(true)}
                className="btn btn-sm text-white px-4 rounded-pill fw-bold fs-7 shadow-sm d-flex align-items-center gap-2"
                style={{ background: 'linear-gradient(135deg, #d81b60 0%, #ad1457 100%)' }}
              >
                <Link2 size={16} /> Connect Meesho Account
              </button>
            )}
          </div>
        </div>

        {capabilities?.live_catalog_search_configured !== true && (
          <div className="alert alert-warning d-flex align-items-start gap-2 py-2 fs-8 mt-3 mb-0" role="status">
            <Info size={16} className="flex-shrink-0 mt-1" />
            <span>{capabilities?.live_catalog_search_message || 'Live Meesho catalog search is not configured. An approved provider endpoint and partner credentials are required.'}</span>
          </div>
        )}

        {/* Verification & Transparency Banner */}
        <div className="mt-3 p-3 rounded-3" style={{ background: '#fdf2f8', border: '1px solid #fbcfe8' }}>
          <div className="d-flex align-items-start gap-2">
            <Info size={18} className="text-pink mt-1 flex-shrink-0" style={{ color: '#be185d' }} />
            <div className="fs-8 text-secondary">
              <strong className="text-dark">Official Integration Status: </strong>
              Meesho does not support public, open self-serve OAuth for individual resellers. Live enterprise automation requires approved Partner Channel/OMS credentials.
              {isConnected ? (
                <span className="ms-1 text-success fw-bold">
                  Currently running in <u>{account?.mode?.replace('_', ' ').toUpperCase()}</u> mode.
                </span>
              ) : (
                <span className="ms-1 text-muted">
                  Connect below to start manual-assisted or sandbox reselling instantly.
                </span>
              )}
              {isLiveCatalogConfigured && (
                <span className="ms-1 text-success fw-semibold">
                  {capabilities?.live_catalog_search_message || 'Live product search is available; supplier fulfillment remains manual.'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal for connecting account */}
      {showConfigModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-bottom p-4">
                <h5 className="modal-title fw-bold text-dark">Configure Meesho Connection</h5>
                <button type="button" className="btn-close" onClick={() => setShowConfigModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4 d-flex flex-column gap-3 fs-7">
                  <div>
                    <label className="fw-bold mb-1 text-dark fs-8">Integration Mode</label>
                    <select
                      className="form-select fs-7"
                      value={formData.mode}
                      onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                    >
                      <option value="manual_assisted">Manual-Assisted Reselling (Live & Instant)</option>
                      <option value="sandbox_verified">Sandbox / Staging Connector Mode</option>
                      <option value="live_approved">Enterprise Partner API V2 (Requires Approval)</option>
                    </select>
                    <div className="form-text fs-9 text-muted mt-1">
                      {formData.mode === 'manual_assisted' && 'Process orders manually with Meesho Supplier Panel references & track AWBs.'}
                      {formData.mode === 'sandbox_verified' && 'Simulate live automated order placement, inventory sync, and tracking.'}
                      {formData.mode === 'live_approved' && 'Only use if Meesho or an authorized OMS partner has issued direct API tokens.'}
                    </div>
                  </div>

                  <div>
                    <label className="fw-bold mb-1 text-dark fs-8">Account / Brand Name *</label>
                    <input
                      type="text"
                      required
                      className="form-control fs-7"
                      placeholder="e.g. Aura Styles Meesho Store"
                      value={formData.account_name}
                      onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                    />
                  </div>

                  <div className="row g-2">
                    <div className="col-6">
                      <label className="fw-bold mb-1 text-dark fs-8">Registered Email *</label>
                      <input
                        type="email"
                        required
                        className="form-control fs-7"
                        placeholder="supplier@brand.com"
                        value={formData.registered_email}
                        onChange={(e) => setFormData({ ...formData, registered_email: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="fw-bold mb-1 text-dark fs-8">Registered Phone</label>
                      <input
                        type="tel"
                        className="form-control fs-7"
                        placeholder="+91 9876543210"
                        value={formData.registered_phone}
                        onChange={(e) => setFormData({ ...formData, registered_phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="fw-bold mb-1 text-dark fs-8">Supplier ID / Reseller Code</label>
                    <input
                      type="text"
                      className="form-control fs-7"
                      placeholder="Optional (e.g. MSH-SUP-7892)"
                      value={formData.supplier_id}
                      onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    />
                  </div>

                  {formData.mode === 'live_approved' && (
                    <div className="p-3 rounded-3 bg-light border">
                      <div className="fw-bold fs-8 text-dark mb-2 d-flex align-items-center gap-1">
                        <Key size={14} /> Partner Credentials (Encrypted Server-Side)
                      </div>
                      <div className="mb-2">
                        <input
                          type="password"
                          className="form-control fs-7 mb-2"
                          placeholder="Meesho Partner API Key"
                          value={formData.api_key}
                          onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                        />
                        <input
                          type="password"
                          className="form-control fs-7"
                          placeholder="Partner API Secret"
                          value={formData.api_secret}
                          onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                        />
                      </div>
                      <span className="text-muted fs-9">Secrets are stored with AES-256 encryption and never exposed on frontend.</span>
                    </div>
                  )}
                </div>
                <div className="modal-footer border-top p-3">
                  <button type="button" className="btn btn-light rounded-pill fs-8" onClick={() => setShowConfigModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn text-white rounded-pill fs-8 fw-bold px-4"
                    style={{ background: 'linear-gradient(135deg, #d81b60 0%, #ad1457 100%)' }}
                  >
                    {loading ? 'Saving...' : 'Save & Connect'}
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
