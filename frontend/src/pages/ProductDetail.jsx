import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import { useStore } from '../context/StoreContext';
import useSEO from '../hooks/useSEO';
import {
  ArrowLeft,
  Box,
  DollarSign,
  ImageOff,
  Package,
  Tag,
  Warehouse,
  ShoppingCart,
} from 'lucide-react';

const GOLD = '#d4af37';
const GOLD_LIGHT = '#f3d675';
const INK = '#050505';
const CREAM = '#f6f1e4';

const normalizeProduct = (p, idx = 0) => ({
  id: p.id || idx + 1,
  name: p.name || 'Untitled Product',
  sku: p.sku || `SKU-${idx + 1}`,
  category_id: p.category_id || p.category?.id || null,
  category: p.category || { name: p.category_name || 'Uncategorized' },
  price: typeof p.price === 'number'
    ? p.price
    : parseFloat(String(p.price || 0).replace(/[^0-9.]/g, '')) || 0,
  compare_price: p.compare_price || null,
  stock_quantity: p.stock_quantity ?? p.stock ?? 0,
  image: p.image || 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22800%22%20height%3D%221000%22%20viewBox%3D%220%200%20800%201000%22%3E%3Crect%20fill%3D%22%23f3f4f6%22%20width%3D%22800%22%20height%3D%221000%22%2F%3E%3Ctext%20fill%3D%22%239ca3af%22%20font-family%3D%22sans-serif%22%20font-size%3D%2230%22%20dy%3D%2210.5%22%20font-weight%3D%22bold%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E',
  description: p.description || 'No description available for this product yet.',
  store_name: p.store_name || p.store?.name || 'Store',
});

export default function ProductDetail() {
  const { activeStore, formatPrice } = useStore();
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: 'Product Details',
    description: 'View full product details, pricing, inventory, and category information.',
  });

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      try {
        const storeId = activeStore?.id || 1;
        const res = await api.get(`/products?store_id=${storeId}`);
        const list = Array.isArray(res.data) ? res.data : [];
        if (list.length > 0) {
          const found = list
            .map((p, idx) => normalizeProduct(p, idx))
            .find((item) => String(item.id) === String(id));
          setProduct(found || null);
        } else {
          const saved = localStorage.getItem('aureum_owner_products');
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed)) {
                const found = parsed
                  .map((p, idx) => normalizeProduct(p, idx))
                  .find((item) => String(item.id) === String(id));
                setProduct(found || null);
              }
            } catch (e) {
              console.debug('Unable to parse saved products', e);
            }
          }
        }
      } catch (err) {
        console.debug('Unable to load product details', err);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [activeStore, id]);

  const categoryName = product?.category?.name || product?.category || 'Uncategorized';
  const isOutOfStock = (product?.stock_quantity ?? 0) <= 0;

  return (
    <div style={{ background: INK, color: CREAM, minHeight: '100vh' }} className="p-4 md:p-8 flex flex-col gap-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex w-fit items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border"
        style={{ background: '#0f0e0c', borderColor: 'rgba(212,175,55,0.2)', color: GOLD_LIGHT }}
      >
        <ArrowLeft size={16} /> Back to catalog
      </button>

      {loading ? (
        <div className="rounded-3xl p-8 text-center" style={{ background: '#0f0e0c', border: `1px solid rgba(212,175,55,0.18)` }}>
          <Package size={24} className="mx-auto mb-3" style={{ color: GOLD }} />
          <p className="text-sm" style={{ color: GOLD_LIGHT }}>Loading product details...</p>
        </div>
      ) : !product ? (
        <div className="rounded-3xl p-8 text-center" style={{ background: '#0f0e0c', border: `1px solid rgba(212,175,55,0.18)` }}>
          <ImageOff size={24} className="mx-auto mb-3" style={{ color: GOLD }} />
          <h2 className="text-xl font-bold text-white mb-2">Product not found</h2>
          <p className="text-sm" style={{ color: '#a99f80' }}>The requested product could not be found in the current catalog.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl p-4" style={{ background: '#0f0e0c', border: `1px solid rgba(212,175,55,0.18)` }}>
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-[420px] rounded-2xl object-cover border border-[rgba(212,175,55,0.2)]"
            />
          </div>

          <div className="rounded-3xl p-6 flex flex-col gap-4" style={{ background: '#0f0e0c', border: `1px solid rgba(212,175,55,0.18)` }}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full px-3 py-1 text-[11px] font-semibold" style={{ background: 'rgba(212,175,55,0.14)', color: GOLD_LIGHT }}>
                {categoryName}
              </span>
              <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${isOutOfStock ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                {isOutOfStock ? 'Out of Stock' : 'In Stock'}
              </span>
            </div>

            <div>
              <h1 className="text-2xl font-bold text-white">{product.name}</h1>
              <p className="text-sm mt-2" style={{ color: '#a99f80' }}>{product.description}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl p-4" style={{ background: '#161310', border: '1px solid rgba(212,175,55,0.14)' }}>
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#8a7a4d' }}>
                  <DollarSign size={14} style={{ color: GOLD }} /> Price
                </div>
                <div className="mt-2 text-xl font-bold" style={{ color: GOLD_LIGHT }}>
                  {formatPrice ? formatPrice(product.price) : `$${Number(product.price).toFixed(2)}`}
                </div>
              </div>

              <div className="rounded-2xl p-4" style={{ background: '#161310', border: '1px solid rgba(212,175,55,0.14)' }}>
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#8a7a4d' }}>
                  <Box size={14} style={{ color: GOLD }} /> Stock
                </div>
                <div className="mt-2 text-xl font-bold text-white">{product.stock_quantity}</div>
              </div>
            </div>

            <div className="rounded-2xl p-4" style={{ background: '#161310', border: '1px solid rgba(212,175,55,0.14)' }}>
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#8a7a4d' }}>
                <Tag size={14} style={{ color: GOLD }} /> Product Details
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between"><span style={{ color: '#a99f80' }}>SKU</span><span className="font-semibold text-white">{product.sku}</span></div>
                <div className="flex justify-between"><span style={{ color: '#a99f80' }}>Category</span><span className="font-semibold text-white">{categoryName}</span></div>
                <div className="flex justify-between"><span style={{ color: '#a99f80' }}>Store</span><span className="font-semibold text-white">{product.store_name}</span></div>
              </div>
            </div>

            <button
              onClick={() => navigate('/products')}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
              style={{ background: `linear-gradient(135deg, #8a6d1f, ${GOLD})`, color: INK }}
            >
              <ShoppingCart size={16} /> View all products
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
