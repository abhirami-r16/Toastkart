import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Upload } from "lucide-react";

function StoreForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    name: "",
    slug: "",
    description: "",
    logo: "",
    banner: "",
    currency: "INR (₹)",
    theme: "aureum",
    category: "Fashion",
    status: "Draft",
    seoStatus: "Not Optimized",
    productsCount: 0,
    ordersCount: 0,
    revenue: "₹0.00",
  });

  useEffect(() => setForm(initial || {
    name: "",
    slug: "",
    description: "",
    logo: "",
    banner: "",
    currency: "INR (₹)",
    theme: "aureum",
    category: "Fashion",
    status: "Draft",
    seoStatus: "Not Optimized",
    productsCount: 0,
    ordersCount: 0,
    revenue: "₹0.00",
  }), [initial]);

  const submit = (e) => {
    e.preventDefault();
    if (!form.name) return alert("Store name is required");
    onSave({ ...form, id: form.id || Date.now(), createdAt: form.createdAt || new Date().toISOString() });
  };

  return (
    <form onSubmit={submit} className="p-4 bg-[#0b0a08] rounded-3xl border border-[#d4af37]/20 shadow-[0_0_60px_rgba(212,175,55,0.08)]">
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs text-[#f3d675]">Store Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full p-3 rounded-2xl bg-[#14120e] text-white border border-[#d4af37]/10" />
        </div>
        <div>
          <label className="text-xs text-[#f3d675]">Store URL</label>
          <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full p-3 rounded-2xl bg-[#14120e] text-white border border-[#d4af37]/10" placeholder="aureum-store" />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs text-[#f3d675]">Logo URL</label>
          <input value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} className="w-full p-3 rounded-2xl bg-[#14120e] text-white border border-[#d4af37]/10" placeholder="https://.../logo.png" />
        </div>
        <div>
          <label className="text-xs text-[#f3d675]">Banner URL</label>
          <input value={form.banner} onChange={(e) => setForm({ ...form, banner: e.target.value })} className="w-full p-3 rounded-2xl bg-[#14120e] text-white border border-[#d4af37]/10" placeholder="https://.../banner.png" />
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="text-xs text-[#f3d675]">Currency</label>
          <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full p-3 rounded-2xl bg-[#14120e] text-white border border-[#d4af37]/10">
            <option>USD ($)</option>
            <option>INR (₹)</option>
            <option>EUR (€)</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-[#f3d675]">Theme</label>
          <select value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })} className="w-full p-3 rounded-2xl bg-[#14120e] text-white border border-[#d4af37]/10">
            <option value="aureum">Aureum</option>
            <option value="light">Light</option>
            <option value="minimal">Minimal</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-[#f3d675]">Status</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full p-3 rounded-2xl bg-[#14120e] text-white border border-[#d4af37]/10">
            <option>Draft</option>
            <option>Published</option>
            <option>Paused</option>
            <option>Archived</option>
          </select>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs text-[#f3d675]">Category</label>
          <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full p-3 rounded-2xl bg-[#14120e] text-white border border-[#d4af37]/10" />
        </div>
        <div>
          <label className="text-xs text-[#f3d675]">SEO Status</label>
          <select value={form.seoStatus} onChange={(e) => setForm({ ...form, seoStatus: e.target.value })} className="w-full p-3 rounded-2xl bg-[#14120e] text-white border border-[#d4af37]/10">
            <option>Not Optimized</option>
            <option>Optimized</option>
            <option>Needs Review</option>
          </select>
        </div>
      </div>
      <div className="mb-4">
        <label className="text-xs text-[#f3d675]">Description</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full p-3 rounded-2xl bg-[#14120e] text-white border border-[#d4af37]/10" rows={3} />
      </div>
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="text-xs text-[#f3d675]">Products Count</label>
          <input type="number" value={form.productsCount} onChange={(e) => setForm({ ...form, productsCount: Number(e.target.value) })} className="w-full p-3 rounded-2xl bg-[#14120e] text-white border border-[#d4af37]/10" />
        </div>
        <div>
          <label className="text-xs text-[#f3d675]">Orders Count</label>
          <input type="number" value={form.ordersCount} onChange={(e) => setForm({ ...form, ordersCount: Number(e.target.value) })} className="w-full p-3 rounded-2xl bg-[#14120e] text-white border border-[#d4af37]/10" />
        </div>
        <div>
          <label className="text-xs text-[#f3d675]">Revenue</label>
          <input value={form.revenue} onChange={(e) => setForm({ ...form, revenue: e.target.value })} className="w-full p-3 rounded-2xl bg-[#14120e] text-white border border-[#d4af37]/10" />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded bg-transparent border border-[#d4af37]/30 text-[#f3d675]">Cancel</button>
        <button type="submit" className="px-4 py-2 rounded bg-[#d4af37] text-black font-bold">Save Store</button>
      </div>
    </form>
  );
}

export default function StoreDetails() {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("owner_stores_v1");
      setStores(raw ? JSON.parse(raw) : []);
    } catch (e) {
      setStores([]);
    }
  }, [refreshKey]);

  useEffect(() => {
    localStorage.setItem("owner_stores_v1", JSON.stringify(stores));
  }, [stores]);

  const handleSave = (store) => {
    setStores((prev) => {
      const exists = prev.find(s => s.id === store.id);
      if (exists) return prev.map(s => s.id === store.id ? store : s);
      return [store, ...prev];
    });
    setShowForm(false);
    setEditing(null);
  };

  const handleEdit = (s) => { setEditing(s); setShowForm(true); };
  const handleDelete = (id) => {
    if (!confirm("Delete this store? This cannot be undone.")) return;
    setStores(prev => prev.filter(s => s.id !== id));
  };

  const filteredStores = stores.filter((store) => {
    const matchesQuery = store.name.toLowerCase().includes(searchQuery.toLowerCase()) || store.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || store.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const totalStores = stores.length;
  const activeStores = stores.filter((store) => store.status === "Published").length;
  const draftStores = stores.filter((store) => store.status === "Draft").length;
  const pausedStores = stores.filter((store) => store.status === "Paused").length;

  return (
    <div className="min-h-screen p-6" style={{ background: "#040404", color: "#f3d675" }}>
      <div className="max-w-7xl mx-auto">
        <div className="d-flex align-items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <h2 className="text-3xl font-bold gold-gradient-text">My Stores</h2>
            <p className="text-sm text-[#f3d675] mt-2">Manage all your online stores from one place.</p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <button onClick={() => { setEditing(null); setShowForm(true); }} className="px-4 py-2 rounded-full bg-[#d4af37] text-black font-semibold shadow-lg hover:brightness-105 flex items-center gap-2"><Plus /> Create Store</button>
            <button onClick={() => alert('Import Store feature is not configured yet.')} className="px-4 py-2 rounded-full border border-[#d4af37]/30 text-[#f3d675] hover:bg-[#d4af37]/10">Import Store</button>
            <button onClick={() => setRefreshKey((key) => key + 1)} className="px-4 py-2 rounded-full border border-[#d4af37]/30 text-[#f3d675] hover:bg-[#d4af37]/10">Refresh</button>
          </div>
        </div>

        <div className="d-flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="d-flex gap-2 flex-wrap">
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by store name or URL" className="px-4 py-2 rounded-full bg-[#14120e] border border-[#d4af37]/10 text-[#f3d675] min-w-[240px]" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 rounded-full bg-[#14120e] border border-[#d4af37]/10 text-[#f3d675]">
              <option>All</option>
              <option>Draft</option>
              <option>Published</option>
              <option>Paused</option>
              <option>Archived</option>
            </select>
          </div>
        </div>

        {showForm && (
          <div className="mb-6">
            <StoreForm initial={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-4">
          {filteredStores.length === 0 && (
            <div className="p-6 rounded-3xl border border-[#d4af37]/20 bg-[#0b0a08] text-[#f3d675]">No stores match your search or filters. Try a different query or create a new store.</div>
          )}

          {filteredStores.map((s) => (
            <div key={s.id} className={`rounded-3xl overflow-hidden border ${s.theme === 'aureum' ? 'border-[#d4af37]/20 bg-[#0b0a08]' : 'border-[#3b3b3b]/20 bg-[#0f0f0f]'} shadow-[0_20px_50px_rgba(0,0,0,0.35)]`}>
              <div className="relative h-40 overflow-hidden bg-[#14120e]">
                {s.banner ? <img src={s.banner} alt={`${s.name} banner`} className="w-full h-full object-cover" /> : <div className="absolute inset-0 bg-gradient-to-br from-[#000000]/60 to-[#090805]/20"></div>}
                <div className="absolute top-4 left-4 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#0b0a08] border border-[#d4af37]/20 overflow-hidden flex items-center justify-center">
                    {s.logo ? <img src={s.logo} alt={s.name} className="w-full h-full object-cover" /> : <div className="text-[#f3d675]">Logo</div>}
                  </div>
                  <div>
                    <div className="text-lg font-bold text-[#f3d675]">{s.name}</div>
                    <div className="text-[11px] text-[#f3d675] uppercase tracking-[0.18em]">{s.theme === 'aureum' ? 'Aureum Black & Gold' : s.theme === 'light' ? 'Light Classic' : 'Minimal Clean'}</div>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="d-flex items-center justify-between flex-wrap gap-2 mb-3">
                  <span className="text-xs text-[#f3d675]">/{s.slug || '(no-slug)'}</span>
                  <span className="text-xs text-[#f3d675] uppercase">{s.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4 text-[#f3d675]">
                  <div className="p-3 rounded-2xl bg-[#14120e]">
                    <div className="text-[11px] uppercase tracking-[0.18em] mb-2">Products</div>
                    <div className="text-xl font-bold text-[#f3d675]">{s.productsCount}</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#14120e]">
                    <div className="text-[11px] uppercase tracking-[0.18em] mb-2">Orders</div>
                    <div className="text-xl font-bold text-[#f3d675]">{s.ordersCount}</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#14120e]">
                    <div className="text-[11px] uppercase tracking-[0.18em] mb-2">Revenue</div>
                    <div className="text-xl font-bold text-[#f3d675]">{s.revenue}</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#14120e]">
                    <div className="text-[11px] uppercase tracking-[0.18em] mb-2">Created</div>
                    <div className="text-xl font-bold text-[#f3d675]">{new Date(s.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="text-[13px] text-[#f3d675] mb-4">{s.description || 'No store description provided yet.'}</div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => handleEdit(s)} className="px-4 py-2 rounded-full bg-[#0d0b08] border border-[#d4af37]/20 text-[#f3d675] hover:bg-[#d4af37]/10">Manage Store</button>
                  <button onClick={() => alert('Analytics coming soon.')} className="px-4 py-2 rounded-full bg-[#0d0b08] border border-[#d4af37]/20 text-[#f3d675] hover:bg-[#d4af37]/10">Analytics</button>
                  <button onClick={() => handleDelete(s.id)} className="px-4 py-2 rounded-full bg-gradient-to-r from-[#f0c85a] to-[#c89c2f] text-black font-bold">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
