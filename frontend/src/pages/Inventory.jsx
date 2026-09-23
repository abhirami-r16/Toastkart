import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useStore } from '../context/StoreContext';
import useSEO from '../hooks/useSEO';
import {
  Boxes,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Sparkles,
  RefreshCw,
  Plus,
  Minus
} from 'lucide-react';

const GOLD = "#d4af37";
const GOLD_LIGHT = "#f3d675";
const GOLD_DEEP = "#8a6d1f";
const INK = "#050505";
const CREAM = "#f6f1e4";

const initialSampleInventory = [
  { id: 1, name: "Linen Kurta", sku: "LK-101", category: { name: "Apparel" }, price: 86.00, stock_quantity: 45, image: "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22800%22%20height%3D%221000%22%20viewBox%3D%220%200%20800%201000%22%3E%3Crect%20fill%3D%22%23f3f4f6%22%20width%3D%22800%22%20height%3D%221000%22%2F%3E%3Ctext%20fill%3D%22%239ca3af%22%20font-family%3D%22sans-serif%22%20font-size%3D%2230%22%20dy%3D%2210.5%22%20font-weight%3D%22bold%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E" },
  { id: 2, name: "Brass Diya Set", sku: "BD-204", category: { name: "Home Decor" }, price: 42.50, stock_quantity: 18, image: "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22800%22%20height%3D%221000%22%20viewBox%3D%220%200%20800%201000%22%3E%3Crect%20fill%3D%22%23f3f4f6%22%20width%3D%22800%22%20height%3D%221000%22%2F%3E%3Ctext%20fill%3D%22%239ca3af%22%20font-family%3D%22sans-serif%22%20font-size%3D%2230%22%20dy%3D%2210.5%22%20font-weight%3D%22bold%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E" },
  { id: 3, name: "Silk Scarf", sku: "SS-309", category: { name: "Accessories" }, price: 34.00, stock_quantity: 4, image: "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22800%22%20height%3D%221000%22%20viewBox%3D%220%200%20800%201000%22%3E%3Crect%20fill%3D%22%23f3f4f6%22%20width%3D%22800%22%20height%3D%221000%22%2F%3E%3Ctext%20fill%3D%22%239ca3af%22%20font-family%3D%22sans-serif%22%20font-size%3D%2230%22%20dy%3D%2210.5%22%20font-weight%3D%22bold%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E" },
  { id: 4, name: "Clay Vase", sku: "CV-412", category: { name: "Home Decor" }, price: 54.00, stock_quantity: 0, image: "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22800%22%20height%3D%221000%22%20viewBox%3D%220%200%20800%201000%22%3E%3Crect%20fill%3D%22%23f3f4f6%22%20width%3D%22800%22%20height%3D%221000%22%2F%3E%3Ctext%20fill%3D%22%239ca3af%22%20font-family%3D%22sans-serif%22%20font-size%3D%2230%22%20dy%3D%2210.5%22%20font-weight%3D%22bold%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E" },
  { id: 5, name: "Handwoven Cushion Cover", sku: "HC-502", category: { name: "Textiles" }, price: 28.00, stock_quantity: 62, image: "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22800%22%20height%3D%221000%22%20viewBox%3D%220%200%20800%201000%22%3E%3Crect%20fill%3D%22%23f3f4f6%22%20width%3D%22800%22%20height%3D%221000%22%2F%3E%3Ctext%20fill%3D%22%239ca3af%22%20font-family%3D%22sans-serif%22%20font-size%3D%2230%22%20dy%3D%2210.5%22%20font-weight%3D%22bold%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E" },
];

export default function Inventory() {
  const { activeStore, formatPrice } = useStore();
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem("aureum_owner_products");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map(p => ({
            id: p.id,
            name: p.name,
            sku: p.sku || `SKU-${p.id}`,
            category: { name: p.category || "General" },
            price: String(p.price || "").replace(/^\$/, ""),
            stock_quantity: Number(p.stock) || 0,
            image: p.image
          }));
        }
      } catch (e) {}
    }
    return [];
  });
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useSEO({ title: 'Inventory Stock Maintenance', description: 'Real-time stock quantity maintenance and inventory alerts.' });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const storeId = activeStore?.id || 1;
      const res = await api.get(`/inventory?store_id=${storeId}`);
      if (Array.isArray(res.data?.products) && res.data.products.length > 0) {
        setProducts(res.data.products);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.debug('Failed to load inventory from API, using current local inventory state', err);
    }
    const saved = localStorage.getItem("aureum_owner_products");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setProducts(parsed.map(p => ({
            id: p.id,
            name: p.name,
            sku: p.sku || `SKU-${p.id}`,
            category: { name: p.category || "General" },
            price: String(p.price || "").replace(/^\$/, ""),
            stock_quantity: Number(p.stock) || 0,
            image: p.image
          })));
          setLoading(false);
          return;
        }
      } catch (e) {}
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInventory();
  }, [activeStore]);

  const handleStockAdjust = async (productId, newQuantity) => {
    if (newQuantity < 0) return;
    try {
      await api.put(`/inventory/${productId}/stock`, { stock_quantity: newQuantity });
    } catch (err) {
      console.warn('API update failed, updating local state:', err);
    }
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock_quantity: newQuantity } : p));
    showToast(`Stock updated to ${newQuantity} units.`);
  };

  // Dynamic Live Calculations
  const totalItemsCount = products.length;
  const inStockCount = products.filter(p => p.stock_quantity > 5).length;
  const lowStockCount = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5).length;
  const outOfStockCount = products.filter(p => p.stock_quantity <= 0).length;

  // Filtered List
  const filteredProducts = products.filter(p => {
    const isOut = p.stock_quantity <= 0;
    const isLow = p.stock_quantity > 0 && p.stock_quantity <= 5;
    const isIn = p.stock_quantity > 5;

    let matchesFilter = true;
    if (filterStatus === 'In Stock') matchesFilter = isIn;
    if (filterStatus === 'Low Stock') matchesFilter = isLow;
    if (filterStatus === 'Out of Stock') matchesFilter = isOut;

    const matchesSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{ background: INK, color: CREAM, minHeight: '100vh' }} className="p-4 md:p-8 flex flex-col gap-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3"
          style={{ background: '#0e0d0b', border: `1px solid ${GOLD}`, color: GOLD_LIGHT }}
        >
          <CheckCircle2 size={18} style={{ color: GOLD }} />
          <span className="font-semibold text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(212,175,55,0.18)]">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 text-white">
            <Boxes size={24} style={{ color: GOLD }} /> Inventory & Live Stock Levels
          </h1>
          <p className="text-xs mt-1" style={{ color: '#a99f80' }}>
            Real-time stock tracking and inventory maintenance for <strong style={{ color: GOLD_LIGHT }}>{activeStore?.name || 'Coastal Threads'}</strong>
          </p>
        </div>
      </div>

      {/* Dynamic Live Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Items */}
        <div className="rounded-2xl p-5 flex flex-col justify-between" style={{ background: '#0f0e0c', border: `1px solid rgba(212,175,55,0.18)` }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#8a7a4d' }}>Total Items</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-500/10">
              <Boxes size={16} style={{ color: GOLD }} />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{totalItemsCount}</div>
          <div className="text-[11px]" style={{ color: '#a99f80' }}>Catalog items tracked</div>
        </div>

        {/* In Stock */}
        <div className="rounded-2xl p-5 flex flex-col justify-between" style={{ background: '#0f0e0c', border: `1px solid rgba(16,185,129,0.2)` }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">In Stock (&gt; 5)</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/15">
              <CheckCircle2 size={16} className="text-emerald-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-400 mb-1">{inStockCount}</div>
          <div className="text-[11px]" style={{ color: '#a99f80' }}>Optimal inventory items</div>
        </div>

        {/* Low Stock */}
        <div className="rounded-2xl p-5 flex flex-col justify-between" style={{ background: '#0f0e0c', border: `1px solid rgba(245,158,11,0.25)` }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Low Stock (1-5)</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-500/15">
              <AlertTriangle size={16} className="text-amber-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-amber-400 mb-1">{lowStockCount}</div>
          <div className="text-[11px]" style={{ color: '#a99f80' }}>Reorder recommended soon</div>
        </div>

        {/* Out of Stock */}
        <div className="rounded-2xl p-5 flex flex-col justify-between" style={{ background: '#0f0e0c', border: `1px solid rgba(239,68,68,0.25)` }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-400">Out of Stock (0)</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/15">
              <Clock size={16} className="text-red-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-red-400 mb-1">{outOfStockCount}</div>
          <div className="text-[11px]" style={{ color: '#a99f80' }}>Restock urgent action needed</div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="p-4 rounded-2xl flex flex-col sm:flex-row gap-3 items-center justify-between" style={{ background: '#0f0e0c', border: `1px solid rgba(212,175,55,0.18)` }}>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {[
            { key: '', label: `All Items (${totalItemsCount})` },
            { key: 'In Stock', label: `In Stock (${inStockCount})` },
            { key: 'Low Stock', label: `Low Stock (${lowStockCount})` },
            { key: 'Out of Stock', label: `Out of Stock (${outOfStockCount})` },
          ].map(tab => {
            const isActive = filterStatus === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilterStatus(tab.key)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: isActive ? `linear-gradient(135deg, ${GOLD_DEEP}, ${GOLD})` : '#161310',
                  color: isActive ? INK : '#a99f80',
                  border: isActive ? `1px solid ${GOLD_LIGHT}` : '1px solid rgba(212, 175, 55, 0.15)',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl w-full sm:w-64 bg-[#161310] border border-[rgba(212,175,55,0.2)]">
          <Search size={14} style={{ color: '#8a7a4d' }} />
          <input
            type="text"
            placeholder="Search inventory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none text-xs w-full text-white placeholder-[#8a7a4d]"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="rounded-2xl p-6" style={{ background: '#0f0e0c', border: `1px solid rgba(212,175,55,0.18)` }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b text-xs" style={{ color: '#8a7a4d', borderColor: 'rgba(212,175,55,0.15)' }}>
                <th className="font-medium pb-3">Item Details</th>
                <th className="font-medium pb-3">SKU</th>
                <th className="font-medium pb-3">Unit Price</th>
                <th className="font-medium pb-3">Stock Status</th>
                <th className="font-medium pb-3 text-center" style={{ width: '220px' }}>Stock Maintenance</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-xs" style={{ color: '#a99f80' }}>
                    No inventory items found matching filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(prod => {
                  const isOut = prod.stock_quantity <= 0;
                  const isLow = prod.stock_quantity > 0 && prod.stock_quantity <= 5;

                  return (
                    <tr key={prod.id} className="border-t transition-colors hover:bg-amber-500/5 text-xs" style={{ borderColor: 'rgba(212,175,55,0.12)' }}>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.image || 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22800%22%20height%3D%221000%22%20viewBox%3D%220%200%20800%201000%22%3E%3Crect%20fill%3D%22%23f3f4f6%22%20width%3D%22800%22%20height%3D%221000%22%2F%3E%3Ctext%20fill%3D%22%239ca3af%22%20font-family%3D%22sans-serif%22%20font-size%3D%2230%22%20dy%3D%2210.5%22%20font-weight%3D%22bold%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E'}
                            alt={prod.name}
                            className="w-9 h-9 rounded-lg object-cover border border-[rgba(212,175,55,0.2)] flex-shrink-0"
                          />
                          <div>
                            <div className="font-bold text-white text-xs">{prod.name}</div>
                            <div className="text-[11px]" style={{ color: '#8a7a4d' }}>{prod.category?.name || 'General'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 font-mono text-xs" style={{ color: GOLD }}>{prod.sku}</td>
                      <td className="py-3 font-bold" style={{ color: GOLD_LIGHT }}>
                        {formatPrice ? formatPrice(prod.price) : `$${Number(prod.price).toFixed(2)}`}
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${isOut ? 'bg-red-500/15 text-red-400 border border-red-500/30' : isLow ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'}`}>
                          {isOut ? '🔴 Out of Stock (0)' : isLow ? `🟡 Low Stock (${prod.stock_quantity})` : `🟢 In Stock (${prod.stock_quantity})`}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleStockAdjust(prod.id, prod.stock_quantity - 1)}
                            disabled={prod.stock_quantity <= 0}
                            className="w-7 h-7 rounded-lg border flex items-center justify-center font-bold text-xs bg-[#161310] border-[rgba(212,175,55,0.2)] text-amber-400 disabled:opacity-30 hover:border-amber-400"
                          >
                            <Minus size={12} />
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={prod.stock_quantity}
                            onChange={(e) => handleStockAdjust(prod.id, parseInt(e.target.value || 0, 10))}
                            style={{ background: '#161310', color: '#ffffff', border: '1px solid rgba(212,175,55,0.25)' }}
                            className="w-16 p-1 text-center font-bold rounded-lg text-xs outline-none"
                          />
                          <button
                            onClick={() => handleStockAdjust(prod.id, prod.stock_quantity + 1)}
                            className="w-7 h-7 rounded-lg border flex items-center justify-center font-bold text-xs bg-[#161310] border-[rgba(212,175,55,0.2)] text-emerald-400 hover:border-emerald-400"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
