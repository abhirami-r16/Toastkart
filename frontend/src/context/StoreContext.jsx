import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const StoreContext = createContext();

const INITIAL_DEMO_STORES = [
  {
    id: 1,
    user_id: 1, // Store Manager Sarah J.
    name: 'Margas Store',
    slug: 'margas-store',
    subdomain: 'margas-store',
    customDomain: 'www.margasstore.com',
    logo: '/sarah_avatar.png',
    banner: '/boconcept-hero.png',
    currency: 'USD',
    description: 'Premium curated apparel, footwear, and luxury lifestyle accessories.',
    status: 'Active',
    email: 'sarah@margasstore.com',
    phone: '+1 (555) 234-5678',
    category: 'Fashion & Apparel',
    timezone: 'America/New_York',
    products_count: 24,
    orders_count: 142
  }
];

export const StoreProvider = ({ children }) => {
  const { user } = useAuth();
  const [stores, setStores] = useState(INITIAL_DEMO_STORES);
  const [loading, setLoading] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);

  // Get current user id safely from localStorage or default to 1
  const getUserId = () => {
    try {
      const saved = localStorage.getItem('toastkart_user');
      if (saved) {
        const u = JSON.parse(saved);
        return u.id || 1;
      }
    } catch (e) {}
    return 1;
  };

  const currentUserId = getUserId();

  useEffect(() => {
    if (!selectedStore && stores.length > 0) {
      const ownerStores = stores.filter((store) => String(store.user_id ?? store.owner_id ?? store.owner?.id ?? '') === String(user?.id ?? user?.user_id ?? ''));
      if (ownerStores.length > 0) {
        setSelectedStore(ownerStores[0]);
      } else if (stores.some((store) => String(store.id) === String(currentUserId))) {
        setSelectedStore(stores.find((store) => String(store.id) === String(currentUserId)) || null);
      }
    }
  }, [stores, user?.id, currentUserId]);

  // Show the full collection of stores to customers and browsing flows
  const availableStores = stores;
  const activeStore = selectedStore || (availableStores.length > 0 ? availableStores[0] : null);

  const normalizeStore = (store) => ({
    ...store,
    id: store.id ?? store.store_id ?? null,
    name: store.name || store.store_name || 'Unnamed Store',
    slug: store.slug || store.subdomain || store.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'store',
    subdomain: store.subdomain || store.slug || store.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'store',
    category: store.category || store.category_name || store.type || 'General Retail',
    description: store.description || store.bio || 'Premium handcrafted products from a verified store owner.',
    status: store.status || 'Active',
    email: store.email || store.contact_email || '',
    phone: store.phone || store.contact_phone || '',
    ownerName: store.owner_name || store.ownerName || store.user?.name || store.owner?.name || 'Store Owner',
    owner: store.owner_name || store.ownerName || store.user?.name || store.owner?.name || 'Store Owner',
    products_count: store.products_count ?? store.products?.length ?? 0,
    orders_count: store.orders_count ?? 0,
    source: store.source || 'api',
    localOnly: !!store.localOnly,
  });

  const loadLocalOwnerStores = () => {
    try {
      const saved = localStorage.getItem('aureum_owner_stores');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      const storesArray = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.stores)
          ? parsed.stores
          : Array.isArray(parsed?.data)
            ? parsed.data
            : [];
      return storesArray.filter(Boolean).map((store) => normalizeStore({
        ...store,
        source: 'local',
        localOnly: true,
      }));
    } catch (err) {
      console.warn('Failed to load local owner stores', err);
      return [];
    }
  };

  const mergeStores = (backendStores, localStores) => {
    const merged = [...backendStores];
    localStores.forEach((localStore) => {
      const exists = merged.some((store) =>
        store.id === localStore.id ||
        store.slug === localStore.slug ||
        store.subdomain === localStore.subdomain ||
        store.name === localStore.name
      );
      if (!exists) {
        merged.push(localStore);
      }
    });
    return merged;
  };

  const fetchStores = async () => {
    const localStores = loadLocalOwnerStores();
    try {
      const res = await api.get('/stores');
      const backendStores = Array.isArray(res.data) ? res.data.map(normalizeStore) : [];
      const merged = mergeStores(backendStores, localStores);
      if (merged.length > 0) {
        setStores(merged);
        return merged;
      }
      if (localStores.length > 0) {
        setStores(localStores);
        return localStores;
      }
      if (backendStores.length > 0) {
        setStores(backendStores);
        return backendStores;
      }
    } catch (err) {
      console.warn('Using local isolated store state for manager', err);
    }
    if (localStores.length > 0) {
      setStores(localStores);
      return localStores;
    }
    return [];
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const createStore = async (storeData) => {
    try {
      const payload = {
        ...storeData,
        user_id: currentUserId,
        owner_name: storeData.ownerName ?? storeData.owner_name ?? null,
      };
      const res = await api.post('/stores', payload);
      await fetchStores();
      return { success: true, store: res.data };
    } catch (err) {
      const newId = Date.now();
      const slug = (storeData.name || 'my-store').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const newStore = {
        id: newId,
        user_id: currentUserId,
        name: storeData.name,
        owner_name: storeData.ownerName || storeData.owner_name || 'Store Owner',
        ownerName: storeData.ownerName || storeData.owner_name || 'Store Owner',
        slug: storeData.slug || slug,
        subdomain: storeData.subdomain || slug,
        customDomain: storeData.customDomain || '',
        logo: storeData.logo || '/sarah_avatar.png',
        banner: storeData.banner || '/hero-banner-v2.png',
        currency: storeData.currency || 'USD',
        description: storeData.description || 'Welcome to my store!',
        status: storeData.status || 'Active',
        email: storeData.email || 'sarah@margasstore.com',
        phone: storeData.phone || '+1 (555) 234-5678',
        category: storeData.category || 'General Retail',
        timezone: storeData.timezone || 'America/New_York',
        products_count: 0,
        orders_count: 0
      };
      setStores(prev => [newStore, ...prev.filter(s => s.user_id !== currentUserId)]);
      return { success: true, store: newStore };
    }
  };

  const updateStore = async (id, storeData) => {
    if (activeStore && activeStore.id !== id) {
      return { success: false, message: 'Unauthorized: You can only edit your own store details.' };
    }

    try {
      const res = await api.put(`/stores/${id}`, storeData);
      await fetchStores();
      return { success: true, store: res.data };
    } catch (err) {
      setStores(prev => prev.map(s => (s.id === id ? { ...s, ...storeData } : s)));
      return { success: true, store: { ...activeStore, ...storeData } };
    }
  };

  const deleteStore = async (id) => {
    if (activeStore && activeStore.id !== id) {
      return { success: false, message: 'Unauthorized: You can only manage your own store.' };
    }

    try {
      await api.delete(`/stores/${id}`);
      await fetchStores();
      return { success: true };
    } catch (err) {
      setStores(prev => prev.filter(s => s.id !== id));
      return { success: true };
    }
  };

  const formatPrice = (amount) => {
    const num = parseFloat(amount || 0);
    const curr = activeStore?.currency || 'USD';
    const symbolMap = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      PKR: 'Rs. ',
      INR: '₹',
      CAD: 'CA$',
      AUD: 'AU$',
    };
    const symbol = symbolMap[curr] || `${curr} `;
    return `${symbol}${num.toFixed(2)}`;
  };

  // --- Product API Helpers ---
  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      return res.data?.data || [];
    } catch (e) {
      console.error('Failed to fetch products', e);
      return [];
    }
  };

  const createProduct = async (product) => {
    try {
      const res = await api.post('/products', product);
      return { success: true, product: res.data };
    } catch (e) {
      console.error('Create product error', e);
      return { success: false, error: e };
    }
  };

  const updateProduct = async (id, product) => {
    try {
      const res = await api.put(`/products/${id}`, product);
      return { success: true, product: res.data };
    } catch (e) {
      console.error('Update product error', e);
      return { success: false, error: e };
    }
  };

  const deleteProduct = async (id) => {
    try {
      await api.delete(`/products/${id}`);
      return { success: true };
    } catch (e) {
      console.error('Delete product error', e);
      return { success: false, error: e };
    }
  };

  return (
    <StoreContext.Provider value={{
      stores: availableStores,
      myStore: activeStore,
      activeStore,
      loading,
      fetchStores,
      createStore,
      updateStore,
      deleteStore,
      formatPrice,
      fetchProducts,
      createProduct,
      updateProduct,
      deleteProduct,
      setActiveStore: setSelectedStore,
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    return {
      stores: INITIAL_DEMO_STORES,
      myStore: INITIAL_DEMO_STORES[0],
      activeStore: INITIAL_DEMO_STORES[0],
      loading: false,
      createStore: async () => ({ success: true }),
      updateStore: async () => ({ success: true }),
      deleteStore: async () => ({ success: true }),
      formatPrice: (val) => `$${val}`,
      setActiveStore: () => {}
    };
  }
  return context;
};

export { StoreContext };
