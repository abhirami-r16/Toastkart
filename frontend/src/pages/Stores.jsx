import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import {
  Store as StoreIcon,
  PlusCircle,
  Edit3,
  Globe,
  CheckCircle2,
  Copy,
  ExternalLink,
  Settings,
  ShieldCheck,
  Lock,
  Sparkles,
  ArrowRight,
  Trash2
} from 'lucide-react';

const GOLD = "#d4af37";
const GOLD_LIGHT = "#f3d675";
const GOLD_DEEP = "#8a6d1f";
const INK = "#050505";
const CREAM = "#f6f1e4";

export default function Stores() {
  const { activeStore, setActiveStore, myStore, createStore, updateStore, deleteStore, stores } = useStore();
  const { user } = useAuth();
  const currentStore = activeStore || myStore;
  const location = useLocation();
  const navigate = useNavigate();
  // Determine which stores to display: admin sees all, manager sees own only
  const displayStores = user && user.role === 'admin' ? stores : stores.filter(s => s.user_id === user?.id);


  const [activeTab, setActiveTab] = useState(currentStore ? 'overview' : 'create');
  const [toastMessage, setToastMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Store Manager Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    subdomain: '',
    customDomain: '',
    currency: 'USD',
    description: '',
    status: 'Active',
    email: '',
    phone: '',
    category: 'Fashion & Apparel',
    timezone: 'America/New_York',
    ownerName: '',
    logo: '',
    banner: '',
    ai_prompt: ''
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabFromUrl = params.get('tab');
    const validTabs = ['overview', 'edit', 'url', 'settings', 'create'];
    const nextTab = currentStore
      ? (validTabs.includes(tabFromUrl) ? tabFromUrl : 'overview')
      : 'create';

    if (currentStore) {
      setFormData({
        name: currentStore.name || '',
        slug: currentStore.slug || '',
        subdomain: currentStore.subdomain || currentStore.slug || '',
        customDomain: currentStore.customDomain || '',
        currency: currentStore.currency || 'USD',
        description: currentStore.description || '',
        status: currentStore.status || 'Active',
        email: currentStore.email || 'manager@mybrand.com',
        phone: currentStore.phone || '+1 (555) 234-5678',
        category: currentStore.category || 'Fashion & Apparel',
        timezone: currentStore.timezone || 'America/New_York',
        ownerName: currentStore.ownerName || 'Store Owner',
        logo: currentStore.logo || '',
        banner: currentStore.banner || '',
        ai_prompt: ''
      });
    }

    setActiveTab(nextTab);
  }, [currentStore, location.search]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleCreateStoreSubmit = async (e) => {
    e.preventDefault();

    // Check if the user has an active plan before creating a store (Flow 4)
    if (!user?.activeSubscription) {
      navigate('/plans?redirect=create-store');
      return;
    }

    setLoading(true);
    const res = await createStore(formData);
    setLoading(false);
    if (res.success) {
      showToast(`Store "${formData.name}" successfully created!`);
      setActiveTab('overview');
    }
  };

  const handleUpdateStoreSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (currentStore) {
      const res = await updateStore(currentStore.id, formData);
      if (res.success) {
        showToast(`Store details for "${formData.name}" updated!`);
      } else {
        showToast(res.message || 'Failed to update store.');
      }
    }
    setLoading(false);
  };

  const handleDeleteStore = async () => {
    if (!currentStore) return;
    const confirmed = window.confirm(`Delete store "${currentStore.name}"? This action cannot be undone.`);
    if (!confirmed) return;

    setLoading(true);
    const res = await deleteStore(currentStore.id);
    setLoading(false);

    if (res.success) {
      showToast(`Store "${currentStore.name}" deleted.`);
      setActiveTab('create');
    } else {
      showToast(res.message || 'Failed to delete store.');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Store URL copied to clipboard!');
  };

  const fullStoreUrl = `https://${formData.subdomain || 'my-store'}.storemanager.app`;
  const initialLetter = (formData.name || currentStore?.name || 'A').charAt(0).toUpperCase();

  // Clean Store Name Formatting
  const rawStoreName = formData.name || currentStore?.name || 'Coastal Threads';
  const cleanDisplayName = rawStoreName.toLowerCase().endsWith('store') ? rawStoreName : `${rawStoreName} Store`;

  return (
    <div style={{ background: INK, color: CREAM, minHeight: '100vh' }} className="p-4 md:p-8 flex flex-col gap-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in"
          style={{ background: '#0e0d0b', border: `1px solid ${GOLD}`, color: GOLD_LIGHT }}
        >
          <CheckCircle2 size={18} style={{ color: GOLD }} />
          <span className="font-semibold text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner - Executive Aureum Suite */}
      <div
        className="p-6 md:p-8 rounded-2xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0f0e0c 0%, #161310 60%, #050505 100%)',
          border: `1px solid rgba(212, 175, 55, 0.25)`,
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div className="grid lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 flex flex-col gap-3">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider self-start"
              style={{ background: 'rgba(212, 175, 55, 0.12)', color: GOLD_LIGHT, border: `1px solid rgba(212, 175, 55, 0.2)` }}
            >
              <Sparkles size={13} style={{ color: GOLD }} />
              <span>TOASTKART MERCHANT SUITE</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              {cleanDisplayName} Management
            </h1>
            <p className="text-xs md:text-sm leading-relaxed" style={{ color: '#a99f80' }}>
              Configure your store branding, manage custom subdomains, update operational settings, and monitor storefront status in pure gold & black elegance.
            </p>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-2xl p-5 flex flex-col justify-between" style={{ background: '#0e0d0b', border: `1px solid rgba(212, 175, 55, 0.22)`, minHeight: 180 }}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5" style={{ background: 'rgba(212, 175, 55, 0.15)', color: GOLD_LIGHT }}>
                  <ShieldCheck size={13} style={{ color: GOLD }} /> 256-Bit SSL Encrypted
                </span>
                <span className="text-xs font-bold text-emerald-400">🟢 {currentStore?.status || 'Active'}</span>
              </div>

              <div className="my-2">
                <h3 className="text-base font-bold text-white mb-0.5 flex items-center gap-2">
                  <StoreIcon size={16} style={{ color: GOLD }} />
                  {cleanDisplayName}
                </h3>
                <p className="text-xs font-mono" style={{ color: GOLD_LIGHT }}>
                  {formData.subdomain || 'my-brand'}.storemanager.app
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2.5 border-t" style={{ borderColor: 'rgba(212, 175, 55, 0.15)' }}>
                <div>
                  <div className="text-[11px]" style={{ color: '#8a7a4d' }}>Category</div>
                  <div className="text-xs font-semibold text-white">{formData.category || 'Fashion'}</div>
                </div>
                <div>
                  <div className="text-[11px]" style={{ color: '#8a7a4d' }}>Currency</div>
                  <div className="text-xs font-bold" style={{ color: GOLD_LIGHT }}>{formData.currency || 'USD ($)'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TAB 1: STORE OVERVIEW */}
      {activeTab === 'overview' && currentStore && (
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="rounded-2xl p-6" style={{ background: '#0f0e0c', border: `1px solid rgba(212, 175, 55, 0.18)` }}>
              {/* Store list - filter based on role */}
              <div className="mb-4">
                {displayStores.map(store => (
                  <button key={store.id} onClick={() => { setActiveStore(store); setActiveTab('overview'); }} className="mr-2 mb-2 px-3 py-1 bg-gray-800 text-white rounded">
                    {store.name}
                  </button>
                ))}
              </div>
              <div className="flex items-start gap-5 mb-6">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DEEP})`, color: INK, border: `1px solid ${GOLD_LIGHT}` }}
                >
                  {initialLetter}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-0.5">{cleanDisplayName}</h2>
                      <p className="text-xs" style={{ color: '#a99f80' }}>{currentStore.category || 'Fashion & Apparel'}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setActiveTab('edit')}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
                        style={{ background: `linear-gradient(135deg, ${GOLD_DEEP}, ${GOLD})`, color: INK }}
                      >
                        <Edit3 size={13} /> Edit Store Details
                      </button>
                      <button
                        onClick={handleDeleteStore}
                        disabled={loading}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm border"
                        style={{ background: 'rgba(220, 38, 38, 0.12)', color: '#fca5a5', borderColor: 'rgba(248, 113, 113, 0.35)' }}
                      >
                        <Trash2 size={13} /> Delete Store
                      </button>
                    </div>
                  </div>
                  <a href={fullStoreUrl} target="_blank" rel="noreferrer" className="text-xs font-bold mt-2 inline-flex items-center gap-1.5 hover:underline" style={{ color: GOLD_LIGHT }}>
                    <Globe size={13} /> {fullStoreUrl}
                  </a>
                  <p className="text-xs mt-3 leading-relaxed" style={{ color: '#a99f80' }}>
                    {currentStore.description || 'Premium curated apparel, footwear, and luxury lifestyle accessories.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-4 rounded-xl text-center" style={{ background: '#161310', border: `1px solid rgba(212, 175, 55, 0.15)` }}>
                <div>
                  <div className="text-lg font-bold text-white">{currentStore.currency || 'USD'}</div>
                  <div className="text-[11px] font-medium" style={{ color: '#8a7a4d' }}>Store Currency</div>
                </div>
                <div className="border-x" style={{ borderColor: 'rgba(212, 175, 55, 0.15)' }}>
                  <div className="text-lg font-bold" style={{ color: GOLD_LIGHT }}>{currentStore.products_count ?? 24}</div>
                  <div className="text-[11px] font-medium" style={{ color: '#8a7a4d' }}>Catalog Products</div>
                </div>
                <div>
                  <div className="text-lg font-bold" style={{ color: GOLD_LIGHT }}>{currentStore.orders_count ?? 142}</div>
                  <div className="text-[11px] font-medium" style={{ color: '#8a7a4d' }}>Total Orders</div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: '#0f0e0c', border: `1px solid rgba(212, 175, 55, 0.18)` }}>
              <h3 className="text-base font-bold text-white">Merchant Quick Actions</h3>
              <div className="flex flex-col gap-3">
                {[
                  { title: 'Edit Store Details', desc: 'Name, contact email & description', icon: Edit3, tab: 'edit' },
                  { title: 'Customize Subdomain', desc: 'Custom handle & URL setup', icon: Globe, tab: 'url' },
                  { title: 'Store Settings', desc: 'Currency, timezone & status', icon: Settings, tab: 'settings' },
                  { title: 'Create New Store', desc: 'Add additional store workspace', icon: PlusCircle, tab: 'create' },
                  { title: 'Delete Current Store', desc: 'Remove this store from your workspace', icon: Trash2, tab: 'delete' },
                ].map((act, i) => {
                  const Icon = act.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        if (act.tab === 'delete') {
                          handleDeleteStore();
                        } else {
                          setActiveTab(act.tab);
                        }
                      }}
                      className="p-3.5 rounded-xl flex items-center justify-between text-left transition-all hover:border-amber-500/40 group"
                      style={{ background: '#161310', border: `1px solid rgba(212, 175, 55, 0.14)` }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(212, 175, 55, 0.14)' }}>
                          <Icon size={16} style={{ color: GOLD }} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{act.title}</div>
                          <div className="text-[11px]" style={{ color: '#8a7a4d' }}>{act.desc}</div>
                        </div>
                      </div>
                      <ArrowRight size={14} className="opacity-40 group-hover:opacity-100 transition-opacity" style={{ color: GOLD }} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EDIT STORE DETAILS */}
      {activeTab === 'edit' && (
        <form onSubmit={handleUpdateStoreSubmit} className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="rounded-2xl p-6 flex flex-col gap-5" style={{ background: '#0f0e0c', border: `1px solid rgba(212, 175, 55, 0.18)` }}>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit3 size={18} style={{ color: GOLD }} /> Edit Store Details
              </h3>

              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: '#8a7a4d' }}>Store Name *</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Margas Store"
                  className="w-full p-3.5 rounded-xl text-sm outline-none text-white"
                  style={{ background: '#161310', border: `1px solid rgba(212, 175, 55, 0.2)` }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: '#8a7a4d' }}>Subdomain Handle</label>
                <div className="flex items-center rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(212, 175, 55, 0.2)', background: '#161310' }}>
                  <input
                    value={formData.subdomain}
                    onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    className="p-3.5 text-sm bg-transparent outline-none flex-1 text-white"
                  />
                  <span className="px-3.5 text-xs font-semibold" style={{ color: GOLD_LIGHT }}>.storemanager.app</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: '#8a7a4d' }}>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-3.5 rounded-xl text-sm outline-none text-white"
                    style={{ background: '#161310', border: `1px solid rgba(212, 175, 55, 0.2)` }}
                  >
                    <option value="Fashion & Apparel">Fashion & Apparel</option>
                    <option value="Jewellery">Jewellery</option>
                    <option value="Beauty & Cosmetics">Beauty & Cosmetics</option>
                    <option value="Home & Living">Home & Living</option>
                    <option value="Perfumes">Perfumes</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Groceries">Groceries</option>
                    <option value="Gift & Novelty">Gift & Novelty</option>
                    <option value="Watches">Watches</option>
                    <option value="Footwear">Footwear</option>
                    <option value="E-flyer">E-flyer</option>
                    <option value="General Retail">General Retail</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: '#8a7a4d' }}>Store Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full p-3.5 rounded-xl text-sm outline-none text-white"
                    style={{ background: '#161310', border: `1px solid rgba(212, 175, 55, 0.2)` }}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: '#8a7a4d' }}>Contact Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="manager@margas.com"
                    className="w-full p-3.5 rounded-xl text-sm outline-none text-white"
                    style={{ background: '#161310', border: `1px solid rgba(212, 175, 55, 0.2)` }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: '#8a7a4d' }}>Support Phone</label>
                  <input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 234-5678"
                    className="w-full p-3.5 rounded-xl text-sm outline-none text-white"
                    style={{ background: '#161310', border: `1px solid rgba(212, 175, 55, 0.2)` }}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: '#8a7a4d' }}>Store Description & Mission</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your brand story, product lines, and values..."
                  className="w-full p-3.5 rounded-xl text-sm outline-none text-white"
                  style={{ background: '#161310', border: `1px solid rgba(212, 175, 55, 0.2)` }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="self-start mt-2 px-6 py-3 rounded-xl text-xs font-bold shadow-md"
                style={{ background: `linear-gradient(135deg, ${GOLD_DEEP}, ${GOLD})`, color: INK }}
              >
                {loading ? 'Saving Changes...' : 'Save Store Details'}
              </button>
            </div>
          </div>
        </form>
      )}

      TAB 3: STORE URL & SUBDOMAIN
      {activeTab === 'url' && (
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: '#0f0e0c', border: `1px solid rgba(212, 175, 55, 0.18)` }}>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Globe size={18} style={{ color: GOLD }} /> Store Subdomain & URL
              </h3>

              <div className="p-4 rounded-xl" style={{ background: '#161310', border: `1px solid rgba(212, 175, 55, 0.15)` }}>
                <div className="text-[11px] uppercase tracking-wider font-bold mb-2" style={{ color: '#8a7a4d' }}>Current Storefront Link</div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-bold font-mono break-all" style={{ color: GOLD_LIGHT }}>{fullStoreUrl}</div>
                    <div className="text-[11px] mt-1" style={{ color: '#a99f80' }}>This is the live storefront address for your store.</div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => copyToClipboard(fullStoreUrl)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                      style={{ background: '#0e0d0b', color: GOLD_LIGHT, border: `1px solid rgba(212, 175, 55, 0.2)` }}
                    >
                      <Copy size={13} /> Copy Link
                    </button>
                    <a
                      href={fullStoreUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
                      style={{ background: `linear-gradient(135deg, ${GOLD_DEEP}, ${GOLD})`, color: INK }}
                    >
                      <ExternalLink size={13} /> Open Store
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SETTINGS 
      {activeTab === 'settings' && (
        <form onSubmit={handleUpdateStoreSubmit} className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: '#0f0e0c', border: `1px solid rgba(212, 175, 55, 0.18)` }}>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings size={18} style={{ color: GOLD }} /> Store Settings
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: '#8a7a4d' }}>Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full p-3.5 rounded-xl text-sm outline-none text-white"
                    style={{ background: '#161310', border: `1px solid rgba(212, 175, 55, 0.2)` }}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: '#8a7a4d' }}>Store Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full p-3.5 rounded-xl text-sm outline-none text-white"
                    style={{ background: '#161310', border: `1px solid rgba(212, 175, 55, 0.2)` }}
                  >
                    <option value="Active">🟢 Active (Open for Orders)</option>
                    <option value="Maintenance">🟡 Maintenance Mode</option>
                    <option value="Draft">🔴 Draft (Private)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="self-start mt-2 px-6 py-2.5 rounded-xl text-xs font-bold"
                style={{ background: `linear-gradient(135deg, ${GOLD_DEEP}, ${GOLD})`, color: INK }}
              >
                Save Settings
              </button>
            </div>
          </div>
        </form>
      )}*/}

      {/* TAB 5: CREATE STORE FORM */}
      {activeTab === 'create' && (
        !user?.activeSubscription ? (
          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 lg:col-start-3 rounded-2xl p-8 flex flex-col items-center justify-center text-center mx-auto mt-8 w-full" style={{ background: '#0f0e0c', border: `1px solid rgba(212, 175, 55, 0.3)`, minHeight: '300px' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(212, 175, 55, 0.1)', color: '#d4af37' }}>
                <Sparkles size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Subscription Required</h3>
              <p className="text-sm mb-6 max-w-md" style={{ color: '#a99f80' }}>
                You need an active plan to access premium features like <strong style={{ color: '#d4af37' }}>Create Store</strong>.
                <br /><br />
                Select a plan to instantly unlock this feature and start building your brand.
              </p>
              <button
                onClick={() => navigate('/plans?redirect=create-store')}
                className="px-6 py-3 rounded-xl text-xs font-bold shadow-md"
                style={{ background: `linear-gradient(135deg, ${GOLD_DEEP}, ${GOLD})`, color: INK }}
              >
                Select Plan
              </button>
            </div>
          </div>
        ) : (
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 lg:col-start-3">
            <form onSubmit={handleCreateStoreSubmit} className="rounded-2xl p-6 flex flex-col gap-4 mx-auto" style={{ background: '#0f0e0c', border: `1px solid rgba(212, 175, 55, 0.18)` }}>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle size={18} style={{ color: GOLD }} /> Create New Store
              </h3>

              <div className="p-4 rounded-xl mb-2" style={{ background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(212, 175, 55, 0.15) 100%)', border: `1px solid rgba(212, 175, 55, 0.3)` }}>
                <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                  <Sparkles size={16} style={{ color: GOLD }} /> AI Auto-Build (Optional)
                </h4>
                <p className="text-xs mb-3" style={{ color: '#a99f80' }}>
                  Describe your dream store in plain English. The AI will automatically extract the name, category, create products, and set up the design! You can leave the fields below empty if you use this.
                </p>
                <textarea
                  rows={3}
                  value={formData.ai_prompt}
                  onChange={(e) => setFormData({ ...formData, ai_prompt: e.target.value })}
                  placeholder="e.g. Create a luxury watch store called ChronoCraft. We sell premium watches for men and women..."
                  className="w-full p-3 rounded-lg text-sm outline-none text-white"
                  style={{ background: '#161310', border: `1px solid rgba(212, 175, 55, 0.3)` }}
                />
              </div>

              <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'rgba(212, 175, 55, 0.16)' }}>
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="border-b border-r p-3" style={{ borderColor: 'rgba(212, 175, 55, 0.14)' }}>
                    <label className="text-[11px] font-semibold uppercase tracking-wide block mb-2" style={{ color: '#8a7a4d' }}>Store Name</label>
                    <input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'), subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-') })}
                      placeholder="e.g. Margas Luxury Boutique"
                      className="w-full h-11 px-3 rounded-lg text-sm outline-none text-white"
                      style={{ background: '#161310', border: `1px solid rgba(212, 175, 55, 0.2)` }}
                    />
                  </div>
                  <div className="border-b p-3" style={{ borderColor: 'rgba(212, 175, 55, 0.14)' }}>
                    <label className="text-[11px] font-semibold uppercase tracking-wide block mb-2" style={{ color: '#8a7a4d' }}>Owner Name</label>
                    <input
                      value={formData.ownerName}
                      onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                      placeholder="e.g. Sarah Johnson"
                      className="w-full h-11 px-3 rounded-lg text-sm outline-none text-white"
                      style={{ background: '#161310', border: `1px solid rgba(212, 175, 55, 0.2)` }}
                    />
                  </div>
                  <div className="border-b border-r p-3" style={{ borderColor: 'rgba(212, 175, 55, 0.14)' }}>
                    <label className="text-[11px] font-semibold uppercase tracking-wide block mb-2" style={{ color: '#8a7a4d' }}>Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full h-11 px-3 rounded-lg text-sm outline-none text-white"
                      style={{ background: '#161310', border: `1px solid rgba(212, 175, 55, 0.2)` }}
                    >
                      <option value="Fashion & Apparel">Fashion & Apparel</option>
                      <option value="Jewellery">Jewellery</option>
                      <option value="Beauty & Cosmetics">Beauty & Cosmetics</option>
                      <option value="Home & Living">Home & Living</option>
                      <option value="Perfumes">Perfumes</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Groceries">Groceries</option>
                      <option value="Gift & Novelty">Gift & Novelty</option>
                      <option value="Watches">Watches</option>
                      <option value="Footwear">Footwear</option>
                      <option value="E-flyer">E-flyer</option>
                      <option value="General Retail">General Retail</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="border-b p-3" style={{ borderColor: 'rgba(212, 175, 55, 0.14)' }}>
                    <label className="text-[11px] font-semibold uppercase tracking-wide block mb-2" style={{ color: '#8a7a4d' }}>Currency</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full h-11 px-3 rounded-lg text-sm outline-none text-white"
                      style={{ background: '#161310', border: `1px solid rgba(212, 175, 55, 0.2)` }}
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="INR">INR (₹)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                  <div className="border-b border-r p-3" style={{ borderColor: 'rgba(212, 175, 55, 0.14)' }}>
                    <label className="text-[11px] font-semibold uppercase tracking-wide block mb-2" style={{ color: '#8a7a4d' }}>Logo URL</label>
                    <input
                      value={formData.logo}
                      onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                      placeholder="https://example.com/logo.png"
                      className="w-full h-11 px-3 rounded-lg text-sm outline-none text-white"
                      style={{ background: '#161310', border: `1px solid rgba(212, 175, 55, 0.2)` }}
                    />
                  </div>
                  <div className="border-b p-3" style={{ borderColor: 'rgba(212, 175, 55, 0.14)' }}>
                    <label className="text-[11px] font-semibold uppercase tracking-wide block mb-2" style={{ color: '#8a7a4d' }}>Banner URL</label>
                    <input
                      value={formData.banner}
                      onChange={(e) => setFormData({ ...formData, banner: e.target.value })}
                      placeholder="https://example.com/banner.png"
                      className="w-full h-11 px-3 rounded-lg text-sm outline-none text-white"
                      style={{ background: '#161310', border: `1px solid rgba(212, 175, 55, 0.2)` }}
                    />
                  </div>
                  <div className="border-b border-r p-3" style={{ borderColor: 'rgba(212, 175, 55, 0.14)' }}>
                    <label className="text-[11px] font-semibold uppercase tracking-wide block mb-2" style={{ color: '#8a7a4d' }}>Contact Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="manager@brand.com"
                      className="w-full h-11 px-3 rounded-lg text-sm outline-none text-white"
                      style={{ background: '#161310', border: `1px solid rgba(212, 175, 55, 0.2)` }}
                    />
                  </div>
                  <div className="border-b p-3" style={{ borderColor: 'rgba(212, 175, 55, 0.14)' }}>
                    <label className="text-[11px] font-semibold uppercase tracking-wide block mb-2" style={{ color: '#8a7a4d' }}>Phone</label>
                    <input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                      className="w-full h-11 px-3 rounded-lg text-sm outline-none text-white"
                      style={{ background: '#161310', border: `1px solid rgba(212, 175, 55, 0.2)` }}
                    />
                  </div>
                  <div className="border-b border-r p-3" style={{ borderColor: 'rgba(212, 175, 55, 0.14)' }}>
                    <label className="text-[11px] font-semibold uppercase tracking-wide block mb-2" style={{ color: '#8a7a4d' }}>Store URL</label>
                    <input
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''), subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                      placeholder="my-store"
                      className="w-full h-11 px-3 rounded-lg text-sm outline-none text-white"
                      style={{ background: '#161310', border: `1px solid rgba(212, 175, 55, 0.2)` }}
                    />
                  </div>
                  <div className="p-3" style={{ borderColor: 'rgba(212, 175, 55, 0.14)' }}>
                    <label className="text-[11px] font-semibold uppercase tracking-wide block mb-2" style={{ color: '#8a7a4d' }}>Store Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full h-11 px-3 rounded-lg text-sm outline-none text-white"
                      style={{ background: '#161310', border: `1px solid rgba(212, 175, 55, 0.2)` }}
                    >
                      <option value="Active">Active</option>
                      <option value="Draft">Draft</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: '#8a7a4d' }}>Store Description</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your brand and product collection..."
                  className="w-full p-3.5 rounded-xl text-sm outline-none text-white"
                  style={{ background: '#161310', border: `1px solid rgba(212, 175, 55, 0.2)` }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="self-start mt-2 px-6 py-3 rounded-xl text-xs font-bold shadow-md"
                style={{ background: `linear-gradient(135deg, ${GOLD_DEEP}, ${GOLD})`, color: INK }}
              >
                {loading ? 'Creating Store...' : 'Create Store'}
              </button>
            </form>
          </div>
        </div>
      )
      )}
    </div>
  );
}
