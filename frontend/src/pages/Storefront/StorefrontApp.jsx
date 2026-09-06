import React, { useEffect, useState, useCallback } from 'react'; // Syncing file to fix syntax error
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { StorefrontCartProvider } from '../../context/StorefrontCartContext';
import { StorefrontAuthProvider } from '../../context/StorefrontAuthContext';
import StorefrontLayout from '../../layouts/StorefrontLayout';
import StorefrontHome from './StorefrontHome';
import ProductDetail from './ProductDetail';
import Cart from './Cart';
import Checkout from './Checkout';
import PaymentGateway from './PaymentGateway';
import Wishlist from './Wishlist';
import MyOrders from './MyOrders';
import '../../styles/storefront.css';

export default function StorefrontApp({ subdomain }) {
  const [storeData, setStoreData] = useState(null);
  const [storeProducts, setStoreProducts] = useState([]);
  const [storeCategories, setStoreCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { tenantId } = useParams();
  const { user } = useAuth();

  // Fetch all required data (store, products, categories)
  const fetchStoreData = useCallback(async () => {
    try {
      let foundStore = null;
      let allStores = [];

      // 1️⃣ Try to fetch by tenantId first
      if (tenantId) {
        try {
          const storeRes = await api.get(`/stores/${tenantId}`);
          if (storeRes.data) {
            foundStore = storeRes.data;
            allStores = [storeRes.data];
          }
        } catch (e) {
          console.debug('Backend store by tenantId failed, falling back', e);
        }
      }

      // 2️⃣ If not found, fetch all stores
      if (!foundStore) {
        try {
          const res = await api.get('/stores');
          if (Array.isArray(res.data)) {
            allStores = res.data;
          }
        } catch (e) {
          console.debug('Backend stores failed, trying local storage', e);
        }
      }

      // 3️⃣ LocalStorage fallback for stores
      if (allStores.length === 0) {
        const saved = localStorage.getItem('aureum_owner_stores');
        if (saved) {
          try { allStores = JSON.parse(saved) || []; } catch (e) {}
        }
      }

      // 4️⃣ Find the store that matches tenantId or subdomain
      if (allStores.length > 0) {
        if (tenantId) {
          foundStore = allStores.find(s => String(s.id) === String(tenantId));
        }
        if (!foundStore) {
          const cleanSub = subdomain.toLowerCase().replace(/[^a-z0-9]/g, '');
          foundStore = allStores.find(s => {
            const sSub = (s.subdomain || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const sSlug = (s.slug || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const sName = (s.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            return (
              sSub === cleanSub ||
              sSlug === cleanSub ||
              sName === cleanSub ||
              (sName && cleanSub && (sName.includes(cleanSub) || cleanSub.includes(sName))) ||
              (sSub && cleanSub && (sSub.includes(cleanSub) || cleanSub.includes(sSub)))
            );
          });
        }
      }

      // 5️⃣ Set store data (or dummy if not found)
      if (foundStore) {
        console.log('FOUND STORE:', foundStore);
        console.log('STORE CATEGORY:', foundStore.category);
        setStoreData(foundStore);
      } else {
        const generatedName =
          subdomain.charAt(0).toUpperCase() + subdomain.slice(1).replace('store', ' Store');
        setStoreData({ id: 'dummy-store-id', name: generatedName, subdomain });
      }

      // ----- Products -----
      // Fetch products filtered by store ID from the API when store is known
      let currentStoreProducts = [];
      const storeId = foundStore?.id ?? null;
      const normalizeStoreValue = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanSub = subdomain.toLowerCase().replace(/[^a-z0-9]/g, '');

      try {
        // Use store_id filter on API when we have a real store ID
        const productsUrl = storeId ? `/products?store_id=${storeId}` : '/products';
        const res = await api.get(productsUrl);
        if (Array.isArray(res.data) && res.data.length > 0) {
          currentStoreProducts = res.data;
        }
      } catch (e) {
        console.debug('Backend products failed, trying local storage', e);
      }

      // LocalStorage fallback: filter by store identity
      if (currentStoreProducts.length === 0) {
        const saved = localStorage.getItem('aureum_owner_products');
        let allLocalProducts = [];
        if (saved) {
          try { allLocalProducts = JSON.parse(saved) || []; } catch (e) {}
        }
        if (allLocalProducts.length > 0) {
          const currentStoreIdentity = foundStore ? {
            id: foundStore.id ?? foundStore.store_id ?? foundStore.storeId ?? null,
            slug: foundStore.slug ?? foundStore.subdomain ?? foundStore.store_slug ?? null,
            subdomain: foundStore.subdomain ?? foundStore.slug ?? foundStore.store_slug ?? null,
            name: foundStore.name ?? foundStore.store_name ?? null,
          } : null;

          currentStoreProducts = allLocalProducts.filter(p => {
            const pStoreId = p.store_id ?? p.store?.id ?? p.storeId ?? null;
            const pStoreSlug = p.store?.slug ?? p.store?.subdomain ?? p.store_subdomain ?? p.store_slug ?? null;
            const pStoreSubdomain = p.store?.subdomain ?? p.store_subdomain ?? pStoreSlug ?? null;
            const pStoreName = p.store?.name ?? p.store_name ?? null;

            if (currentStoreIdentity?.id && pStoreId && String(pStoreId) === String(currentStoreIdentity.id)) return true;
            if (currentStoreIdentity?.slug && pStoreSlug && normalizeStoreValue(pStoreSlug) === normalizeStoreValue(currentStoreIdentity.slug)) return true;
            if (currentStoreIdentity?.subdomain && pStoreSubdomain && normalizeStoreValue(pStoreSubdomain) === normalizeStoreValue(currentStoreIdentity.subdomain)) return true;
            if (currentStoreIdentity?.name && pStoreName && normalizeStoreValue(pStoreName) === normalizeStoreValue(currentStoreIdentity.name)) return true;
            if (pStoreSlug && normalizeStoreValue(pStoreSlug) === cleanSub) return true;
            if (pStoreSubdomain && normalizeStoreValue(pStoreSubdomain) === cleanSub) return true;
            if (p.store_subdomain && normalizeStoreValue(p.store_subdomain) === cleanSub) return true;
            if (p.store?.slug && normalizeStoreValue(p.store.slug) === cleanSub) return true;
            return false;
          });
        }
      }

      setStoreProducts(currentStoreProducts);

      // ----- Categories -----
      let allCategories = [];
      try {
        // Use store_id filter on API when we have a real store ID
        const categoriesUrl = storeId ? `/categories?store_id=${storeId}` : '/categories';
        const res = await api.get(categoriesUrl);
        if (Array.isArray(res.data) && res.data.length > 0) {
          allCategories = res.data;
        }
      } catch (e) {
        console.debug('Backend categories failed, trying local storage', e);
      }

      if (allCategories.length === 0) {
        const saved = localStorage.getItem('aureum_owner_categories');
        if (saved) {
          try { allCategories = JSON.parse(saved) || []; } catch (e) {}
          // Filter local categories by store
          if (allCategories.length > 0 && storeId) {
            allCategories = allCategories.filter(c => {
              const cStoreId = c.store_id ?? c.store?.id ?? c.storeId ?? null;
              if (!cStoreId) return false;
              return String(cStoreId) === String(storeId);
            });
          }
        }
      }

      if (allCategories.length > 0) {
        setStoreCategories(allCategories);
      }
    } catch (e) {
      console.error('Error loading store data for storefront:', e);
    } finally {
      setLoading(false);
    }
  }, [subdomain, tenantId]);

  // Initial load & re‑load when relevant identifiers change
  useEffect(() => {
    fetchStoreData();
  }, [fetchStoreData]);

  // Listen for changes to categories/products in localStorage (owner dashboard writes here)
  useEffect(() => {
    const handler = e => {
      if (e.key === 'aureum_owner_categories' || e.key === 'aureum_owner_products') {
        fetchStoreData();
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [fetchStoreData]);

  if (loading) {
    return (
      <div className="storefront-loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!storeData) {
    return (
      <div className="storefront-not-found">
        <h2>Store Not Found</h2>
        <p>The store at {subdomain}.localhost could not be found.</p>
        <a href="http://localhost:3000">Return to Marketplace</a>
      </div>
    );
  }

  const getBasePath = () => {
    const p = window.location.pathname;
    if (p.startsWith('/store/')) return `/store/${p.split('/')[2]}`;
    return '/storefront';
  };
  const basePath = getBasePath();

  return (
    <div className="storefront-app-root">
      <StorefrontAuthProvider>
        <StorefrontCartProvider storeId={storeData.id}>
          <Routes>
            <Route
              path="/"
              element={<StorefrontLayout storeData={storeData} categories={storeCategories} products={storeProducts} />}
            >
              <Route
              index
              element={<StorefrontHome storeData={storeData} products={storeProducts} categories={storeCategories} />}
            />
            <Route path="product/:id" element={<ProductDetail storeData={storeData} products={storeProducts} />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="payment" element={<PaymentGateway />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="orders" element={<MyOrders />} />
            {/* Additional routes such as /product/:id can be added here */}
            <Route path="*" element={<Navigate to={basePath} replace />} />
            </Route>
          </Routes>
        </StorefrontCartProvider>
      </StorefrontAuthProvider>
    </div>
  );
}
