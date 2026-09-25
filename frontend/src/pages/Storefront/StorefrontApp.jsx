import React, { useEffect, useState, useCallback, Suspense } from 'react'; // Syncing file to fix syntax error
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { useStorefrontAuth } from '../../context/StorefrontAuthContext';
import { StorefrontCartProvider } from '../../context/StorefrontCartContext';
import { StorefrontAuthProvider } from '../../context/StorefrontAuthContext';
import StorefrontLayout from '../../layouts/StorefrontLayout';

const StorefrontHome = React.lazy(() => import('./StorefrontHome'));
const ProductDetail = React.lazy(() => import('./ProductDetail'));
const Cart = React.lazy(() => import('./Cart'));
const Checkout = React.lazy(() => import('./Checkout'));
const PaymentGateway = React.lazy(() => import('./PaymentGateway'));
const Wishlist = React.lazy(() => import('./Wishlist'));
const MyOrders = React.lazy(() => import('./MyOrders'));
import '../../styles/storefront.css';

export default function StorefrontApp({ subdomain }) {
  const { slug } = useParams();
  const [storeData, setStoreData] = useState(() => {
    // Generate a temporary store data to render the shell immediately
    const cleanSub = subdomain || slug || 'store';
    const name = cleanSub.charAt(0).toUpperCase() + cleanSub.slice(1).replace(/-/g, ' ').replace('store', 'Store');
    let category = 'General Retail';
    if (cleanSub.includes('perfume')) category = 'perfumes';
    else if (cleanSub.includes('jewelry')) category = 'jewelry';
    else if (cleanSub.includes('beauty') || cleanSub.includes('glow')) category = 'beauty';
    else if (cleanSub.includes('home') || cleanSub.includes('decor')) category = 'home & living';
    else if (cleanSub.includes('grocery')) category = 'grocery';
    else if (cleanSub.includes('fashion') || cleanSub.includes('margas')) category = 'fashion & apparel';
    else if (cleanSub.includes('electronic')) category = 'electronics';
    else if (cleanSub.includes('footwear')) category = 'footwear';
    else if (cleanSub.includes('gift')) category = 'gift';
    
    return { id: 'loading', name, subdomain: cleanSub, category, loading: true };
  });
  const [storeProducts, setStoreProducts] = useState([]);
  const [storeCategories, setStoreCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const tenantId = subdomain || slug;

  // Fetch all required data (store, products, categories)
  const fetchStoreData = useCallback(async (isMounted = () => true) => {
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

     // 3️⃣ Find the requested store in backend stores
const findMatchingStore = (stores) => {
  if (!Array.isArray(stores)) return null;

  const cleanSub = String(subdomain || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  if (tenantId) {
    const byId = stores.find(
      s => String(s.id) === String(tenantId)
    );

    if (byId) return byId;
  }

  return stores.find(s => {
    const sSub = String(s.subdomain || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    const sSlug = String(s.slug || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    const sName = String(s.name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    return (
      sSub === cleanSub ||
      sSlug === cleanSub ||
      sName === cleanSub ||
      (sName && cleanSub && (
        sName.includes(cleanSub) || cleanSub.includes(sName)
      )) ||
      (sSub && cleanSub && (
        sSub.includes(cleanSub) || cleanSub.includes(sSub)
      ))
    );
  }) || null;
};

// 4️⃣ Try backend stores first
foundStore = findMatchingStore(allStores);

// 5️⃣ If backend does not contain this store, check localStorage
if (!foundStore) {
  const saved = localStorage.getItem('aureum_owner_stores');

  if (saved) {
    try {
      const localStores = JSON.parse(saved) || [];
      const localStore = findMatchingStore(localStores);

      if (localStore) {
        foundStore = localStore;
        console.log('FOUND LOCAL STORE:', localStore);
        console.log('LOCAL STORE CATEGORY:', localStore.category);
      }
    } catch (e) {
      console.debug('Failed to read local owner stores', e);
    }
  }
}

      // 5️⃣ Set store data (or dummy if not found)
      if (!isMounted()) return;
      if (foundStore) {
        console.log('FOUND STORE:', foundStore);
        console.log('STORE CATEGORY:', foundStore.category);
        setStoreData(foundStore);
      } else {
        const generatedName =
          subdomain.charAt(0).toUpperCase() + subdomain.slice(1).replace('store', ' Store');
        setStoreData({ id: 'dummy-store-id', name: generatedName, subdomain, category: storeData?.category || 'General Retail' });
      }

      // ----- Products -----
      // Fetch products filtered by store ID from the API when store is known
      let currentStoreProducts = [];
      const storeId = foundStore?.id ?? null;
      const normalizeStoreValue = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanSub = subdomain.toLowerCase().replace(/[^a-z0-9]/g, '');

      let fetchedProducts = [];
      let allCategories = [];

      // OPTIMIZATION: If the store already includes products and categories, use them directly!
      if (foundStore?.products && Array.isArray(foundStore.products) && foundStore.products.length > 0) {
        fetchedProducts = foundStore.products;
        if (foundStore?.categories && Array.isArray(foundStore.categories)) {
          allCategories = foundStore.categories;
        }
      } else {
        // Fetch products and categories concurrently only if they aren't already provided
        const productsUrl = storeId ? `/products?store_id=${storeId}` : '/products';
        const categoriesUrl = storeId ? `/categories?store_id=${storeId}` : '/categories';

        const [productsResult, categoriesResult] = await Promise.allSettled([
          api.get(productsUrl),
          api.get(categoriesUrl)
        ]);

        if (productsResult.status === 'fulfilled' && Array.isArray(productsResult.value.data) && productsResult.value.data.length > 0) {
          fetchedProducts = productsResult.value.data;
        } else {
          console.debug('Backend products failed, trying local storage');
        }

        if (categoriesResult.status === 'fulfilled' && Array.isArray(categoriesResult.value.data) && categoriesResult.value.data.length > 0) {
          allCategories = categoriesResult.value.data;
        } else {
          console.debug('Backend categories failed, trying local storage');
        }
      }

      // LocalStorage fallback for products
      if (fetchedProducts.length === 0) {
        const saved = localStorage.getItem('aureum_owner_products');
        if (saved) {
          try { fetchedProducts = JSON.parse(saved) || []; } catch (e) {}
        }
      }

      // Strictly filter products to only those matching the current store
      const currentStoreIdentity = foundStore ? {
        id: foundStore.id ?? foundStore.store_id ?? foundStore.storeId ?? null,
        slug: foundStore.slug ?? foundStore.subdomain ?? foundStore.store_slug ?? null,
        subdomain: foundStore.subdomain ?? foundStore.slug ?? foundStore.store_slug ?? null,
        name: foundStore.name ?? foundStore.store_name ?? null,
      } : null;

      if (fetchedProducts.length > 0) {
        currentStoreProducts = fetchedProducts.filter(p => {
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

      if (!isMounted()) return;
      setStoreProducts(currentStoreProducts);

      if (allCategories.length === 0) {
        const saved = localStorage.getItem('aureum_owner_categories');
        if (saved) {
          try { allCategories = JSON.parse(saved) || []; } catch (e) {}
        }
      }
      // Strictly filter categories to only those matching the current store
      if (allCategories.length > 0) {
        let currentStoreCategories = allCategories.filter(c => {
          const cStoreId = c.store_id ?? c.store?.id ?? c.storeId ?? null;
          const cStoreSlug = c.store?.slug ?? c.store?.subdomain ?? c.store_subdomain ?? c.store_slug ?? null;
          const cStoreSubdomain = c.store?.subdomain ?? c.store_subdomain ?? cStoreSlug ?? null;
          const cStoreName = c.store?.name ?? c.store_name ?? null;

          if (currentStoreIdentity?.id && cStoreId && String(cStoreId) === String(currentStoreIdentity.id)) return true;
          if (currentStoreIdentity?.slug && cStoreSlug && normalizeStoreValue(cStoreSlug) === normalizeStoreValue(currentStoreIdentity.slug)) return true;
          if (currentStoreIdentity?.subdomain && cStoreSubdomain && normalizeStoreValue(cStoreSubdomain) === normalizeStoreValue(currentStoreIdentity.subdomain)) return true;
          if (currentStoreIdentity?.name && cStoreName && normalizeStoreValue(cStoreName) === normalizeStoreValue(currentStoreIdentity.name)) return true;
          if (cStoreSlug && normalizeStoreValue(cStoreSlug) === cleanSub) return true;
          if (cStoreSubdomain && normalizeStoreValue(cStoreSubdomain) === cleanSub) return true;
          if (c.store_subdomain && normalizeStoreValue(c.store_subdomain) === cleanSub) return true;
          if (c.store?.slug && normalizeStoreValue(c.store.slug) === cleanSub) return true;
          
          return false;
        });

        if (!isMounted()) return;
        setStoreCategories(currentStoreCategories);
      } else {
        if (!isMounted()) return;
        setStoreCategories([]);
      }
    } catch (e) {
      console.error('Error loading store data for storefront:', e);
    } finally {
      if (isMounted()) setLoading(false);
    }
  }, [subdomain, tenantId]);

  // Initial load & re‑load when relevant identifiers change
  useEffect(() => {
    let mounted = true;
    fetchStoreData(() => mounted);
    return () => { mounted = false; };
  }, [fetchStoreData]);

  // Listen for changes to categories/products in localStorage (owner dashboard writes here)
  useEffect(() => {
    let mounted = true;
    const handler = e => {
      if (e.key === 'aureum_owner_categories' || e.key === 'aureum_owner_products') {
        fetchStoreData(() => mounted);
      }
    };
    window.addEventListener('storage', handler);
    return () => {
      mounted = false;
      window.removeEventListener('storage', handler);
    };
  }, [fetchStoreData]);

  if (!loading && !storeData) {
    return (
      <div className="storefront-not-found">
        <h2>Store Not Found</h2>
        <p>The requested store could not be found.</p>
        <a href="https://toastkart.com">Return to Marketplace</a>
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
          <Suspense fallback={<div className="storefront-loading"><div className="spinner" /></div>}>
            <Routes>
              <Route
                path="/"
                element={<StorefrontLayout storeData={storeData} categories={storeCategories} products={storeProducts} loading={loading} />}
              >
                <Route
                index
                element={<StorefrontHome storeData={storeData} products={storeProducts} categories={storeCategories} loading={loading} />}
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
          </Suspense>
        </StorefrontCartProvider>
      </StorefrontAuthProvider>
    </div>
  );
}
