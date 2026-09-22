import React, { useState, useEffect } from 'react';
import BrowseStores from './BrowseStores';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import api from '../api/axios';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  LayoutDashboard, Package, Tag, ShoppingCart, Heart, Clock,
  CheckCircle2, ShoppingBag, User, Settings, LogOut, Search,
  Bell, Menu, X, ArrowRight, Plus, Trash2, Download, Filter,
  Star, MapPin, Eye, Check, ShieldCheck, Sparkles, CreditCard,
  ChevronRight, Award, Gift, Truck, HelpCircle, FileText, Copy, Percent,
  TrendingUp, BarChart3, Store, ExternalLink
} from 'lucide-react';
import AureumLogo from '../assets/aureum-logo.svg';
import '../styles/dashboard-premium.css';

const GOLD = "#007f5f";
const GOLD_LIGHT = "#00a87a";

const buildProductPlaceholderImage = (product) => {
  const name = String(product?.name || product?.title || 'Product').trim().toLowerCase();
  if (name.includes('shoe') || name.includes('sneaker') || name.includes('boot') || name.includes('footwear')) {
    return 'https://source.unsplash.com/600x600/?sneakers';
  }
  if (name.includes('dress') || name.includes('fashion') || name.includes('jacket') || name.includes('apparel') || name.includes('outfit')) {
    return 'https://source.unsplash.com/600x600/?dress,fashion';
  }
  return 'https://source.unsplash.com/600x600/?fashion,product';
};

const getProductImageUrl = (product) => {
  const raw = product?.image || product?.image_url || '';
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim();
  }
  return buildProductPlaceholderImage(product);
};

const demoProductNames = new Set([
  'Nova Pro Wireless Headphones',
  'Luma Ambient Desk Lamp',
  'Velvet Matte Lipstick Set',
  'Botanical Glow Serum',
  'Aurora Silk Jacket'
]);

const isDemoProduct = (product) => {
  const name = String(product?.name || product?.title || '').trim().toLowerCase();
  const storeName = String(product?.store_name || product?.store?.name || '').trim().toLowerCase();
  return demoProductNames.has(product?.name || product?.title || '') || ['glow boutique', 'modern nest', 'margas store'].includes(storeName);
};

const getOrderItemSummary = (order = {}) => {
  const rawItems = order?.items || order?.order_items || order?.products || order?.line_items || order?.product_items || [];
  const items = Array.isArray(rawItems) ? rawItems : [];
  const normalized = items
    .map((item) => {
      if (typeof item === 'string') {
        return { name: item, quantity: 1 };
      }

      const rawName = item?.product?.name || item?.name || item?.product_name || item?.title || item?.product?.title || 'Ordered item';
      const name = typeof rawName === 'string' ? rawName : (rawName?.name || 'Ordered item');
      const quantity = Number(item?.quantity ?? item?.qty ?? item?.product_quantity ?? 1) || 1;

      return { name, quantity };
    })
    .filter((item) => item?.name);

  if (normalized.length === 0) {
    const fallbackName = order?.product_name || order?.item_name || order?.name;
    if (fallbackName) {
      normalized.push({ name: fallbackName, quantity: order?.quantity ?? 1 });
    }
  }

  const summaryParts = normalized.slice(0, 3).map((item) => {
    const qtySuffix = Number(item.quantity) > 1 ? ` ×${item.quantity}` : '';
    return `${item.name}${qtySuffix}`;
  });

  const summary = summaryParts.join(', ');

  return {
    itemsList: normalized,
    itemSummary: normalized.length > 0 ? (summary + (normalized.length > 3 ? ` +${normalized.length - 3} more` : '')) : 'No items listed',
    itemsCount: normalized.length,
  };
};

const createOrderFromCart = (cartItems = [], profileData = {}, fallbackStoreName = 'Aureum Store') => {
  const items = (cartItems || []).map((item) => ({
    name: item?.product?.name || item?.name || 'Ordered item',
    quantity: item?.quantity || 1,
    price: item?.price ?? item?.product?.price ?? 0,
  }));

  const subtotal = items.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
  const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
  const createdAt = new Date().toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });

  return {
    id: `order_${Date.now()}`,
    order_number: orderNumber,
    store_name: cartItems?.[0]?.product?.store_name || cartItems?.[0]?.product?.store?.name || fallbackStoreName,
    customer_name: profileData?.name || 'Customer',
    customer_email: profileData?.email || 'customer@aureum.local',
    total_amount: Number(subtotal).toFixed(2),
    status: 'Completed',
    payment_status: 'Completed',
    carrier: 'FedEx Express',
    tracking: `TRK-${Math.floor(100000 + Math.random() * 900000)}`,
    created_at: createdAt,
    items: items,
    itemsList: items.map((item) => ({ name: item.name, quantity: item.quantity })),
    itemSummary: items.length > 0 ? items.map((item) => `${item.name} ×${item.quantity}`).join(', ') : 'No items listed',
    itemsCount: items.length,
    ...getOrderItemSummary({ items }),
  };
};

const getValidCartProductId = (item) => {
  const productEntity = item?.product || item || {};
  const nestedProduct = productEntity?.product || null;
  const productSource = productEntity?.source || nestedProduct?.source || item?.product_source || item?.source || null;

  if (productEntity?.localOnly === true || nestedProduct?.localOnly === true || productSource === 'local' || productSource === 'owner') {
    // Return a fallback ID if available (local ID) so the item can be ordered.
    return productEntity.id || productEntity.product_id || productEntity.backend_id || nestedProduct?.id || null;
  }

  const isApiBacked = Boolean(
    productSource === 'api' || productSource === 'backend' || productSource === 'server' ||
    productEntity?.backend_id != null || nestedProduct?.backend_id != null ||
    productEntity?.product_id != null || nestedProduct?.product_id != null
  );

  if (!isApiBacked) {
    return null;
  }

  const candidates = [
    item?.product_id,
    item?.product_backend_id,
    productEntity?.backend_id,
    productEntity?.product_id,
    productEntity?.id,
    nestedProduct?.backend_id,
    nestedProduct?.product_id,
    nestedProduct?.id,
  ];

  for (const candidate of candidates) {
    if (candidate == null) continue;
    if (typeof candidate === 'number') {
      if (candidate > 0) return candidate;
      continue;
    }
    const cleaned = String(candidate).trim();
    if (!cleaned) continue;
    const numeric = Number(cleaned.replace(/^[^0-9]+|[^0-9]+$/g, ''));
    if (Number.isFinite(numeric) && numeric > 0) {
      return numeric;
    }
  }

  return null;
};

const getValidStoreId = (candidate) => {
  if (candidate == null) return null;
  const cleaned = String(candidate).trim();
  if (!/^[0-9]+$/.test(cleaned)) return null;
  const numeric = Number(cleaned);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

const resolveStoreIdFromProduct = (product, stores = []) => {
  if (!product) return null;

  const directStoreId = getValidStoreId(product.store_id || product.store?.id || product.product?.store_id || product.product?.store?.id);
  if (directStoreId) return directStoreId;

  const productStoreName = String(product.store_name || product.store?.name || product.product?.store_name || product.product?.store?.name || '').trim().toLowerCase();
  const productStoreSlug = String(product.store_slug || product.store?.slug || product.store?.subdomain || product.product?.store?.slug || product.product?.store?.subdomain || '').trim().toLowerCase();

  if (!productStoreName && !productStoreSlug) return null;

  const matched = stores.find((store) => {
    const storeName = String(store.name || store.store_name || store.store?.name || '').trim().toLowerCase();
    const storeSlug = String(store.slug || store.subdomain || store.store_name || store.store?.slug || '').trim().toLowerCase();
    return (storeName && productStoreName && storeName === productStoreName)
      || (storeSlug && productStoreSlug && storeSlug === productStoreSlug)
      || (storeName && productStoreSlug && storeName.includes(productStoreSlug))
      || (storeSlug && productStoreName && storeSlug.includes(productStoreName));
  });

  return matched ? getValidStoreId(matched.id) : null;
};

const resolveStoreIdFromCartItems = (cartItems, stores = [], selectedStoreId = null) => {
  const candidates = new Set();

  const addCandidate = (candidate) => {
    const valid = getValidStoreId(candidate);
    if (valid) candidates.add(valid);
  };

  if (selectedStoreId) addCandidate(selectedStoreId);

  (cartItems || []).forEach((item) => {
    addCandidate(item?.store_id || item?.store?.id || item?.store?.store_id);
    addCandidate(item?.product_id);
    if (item?.product) {
      addCandidate(item.product.store_id || item.product.store?.id || item.product.product?.store_id || item.product.product?.store?.id);
      addCandidate(item.product.id);
      addCandidate(item.product.backend_id || item.product.id);
      addCandidate(item.product.store_name || item.product.store?.name);
      const direct = resolveStoreIdFromProduct(item.product, stores);
      if (direct) candidates.add(direct);
    }
  });

  if (candidates.size === 1) {
    return Array.from(candidates)[0];
  }

  if (stores && stores.length > 0) {
    const fallbackStore = getValidStoreId(stores[0].id);
    if (fallbackStore) return fallbackStore;
  }

  return candidates.size > 0 ? Array.from(candidates)[0] : null;
};

const cleanCategoryLabel = (category = '') => {
    if (!category) return 'General';
    const normalized = String(category)
      .replace(/\bapparel\b/gi, '')
      .replace(/&\s*/g, '&')
      .replace(/[\-–_,]+$/g, '')
      .replace(/^[\-–_,]+/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .replace(/^&\s*/g, '')
      .replace(/\s*&$/g, '')
      .trim();
    return normalized || 'General';
};

const normalizeCustomerStore = (store = {}) => {
  const name = store.name || store.store_name || store?.store?.name || 'Owner Store';
  const slug = store.slug || store.subdomain || store.store_slug || store?.store?.slug || (name || 'owner-store').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return {
    id: store.id ?? store.store_id ?? store?.store?.id ?? null,
    name,
    category: store.category || store.category_name || store.type || store?.store?.category || 'General',
    slug,
    subdomain: store.subdomain || store.slug || store.store_slug || store?.store?.subdomain || slug,
    owner: store.owner_name || store.owner || store.user?.name || store?.store?.owner_name || 'Store Owner',
    status: store.status || 'Active',
    description: store.description || store.bio || store?.store?.description || 'Store owner created store listing.',
    products_count: store.products_count ?? store.products?.length ?? 0,
    rating: store.rating ?? 4.8,
    logo: store.logo || store?.store?.logo || '',
    store_name: name,
  };
};

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
    return storesArray.filter(Boolean).map(normalizeCustomerStore);
  } catch (error) {
    console.debug('Failed to load local owner stores', error);
    return [];
  }
};

const mergeStoresWithLocal = (apiStores = [], ownerStores = []) => {
  const normalizedApiStores = (Array.isArray(apiStores) ? apiStores : []).map(normalizeCustomerStore);
  const merged = [...normalizedApiStores];
  ownerStores.forEach((store) => {
    const normalized = normalizeCustomerStore(store);
    const exists = merged.some((s) =>
      s.id && normalized.id && s.id === normalized.id ||
      s.slug === normalized.slug ||
      s.subdomain === normalized.subdomain ||
      s.name === normalized.name ||
      s.store_name === normalized.store_name
    );
    if (!exists) merged.push(normalized);
  });
  return merged;
};

const readStoredOrders = () => {
  try {
    const savedOrders = localStorage.getItem('aureum_customer_orders');
    if (!savedOrders) return [];
    const parsed = JSON.parse(savedOrders);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.debug('Failed to read stored orders', error);
    return [];
  }
};

const writeStoredOrders = (orders) => {
  try {
    localStorage.setItem('aureum_customer_orders', JSON.stringify(orders));
  } catch (error) {
    console.debug('Failed to save orders', error);
  }
};

export default function CustomerDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const { stores: storeContextStores } = useStore();
  const cartContext = useCart() || {};
  const { cartItems = [], addToCart, removeFromCart, clearCart, cartSubtotal = 0, totalCartCount = 0 } = cartContext;

  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStoreFilter, setSelectedStoreFilter] = useState('All Stores');
  // New state to hold a store selected from Browse Stores
  const [selectedStore, setSelectedStore] = useState(null);

  // Real / Demo Data States
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [storesList, setStoresList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [categories, setCategories] = useState(['All']);
  const [loading, setLoading] = useState(true);

  const selectedStoreProducts = selectedStore ? products.filter((product) => {
    if (!product) return false;

    const selectedStoreId = selectedStore.id;
    const productStoreId = product.store_id || product.store?.id;
    if (selectedStoreId && productStoreId) {
      return String(selectedStoreId) === String(productStoreId);
    }

    const productStoreName = String(product.store_name || product.store?.name || '').trim().toLowerCase();
    const productStoreSlug = String(product.store_slug || product.store?.slug || product.store?.subdomain || '').trim().toLowerCase();
    const selectedStoreName = String(selectedStore.name || selectedStore.store_name || '').trim().toLowerCase();
    const selectedStoreSlug = String(selectedStore.slug || selectedStore.subdomain || selectedStore.store_name || '').trim().toLowerCase();

    const storeNameMatch = productStoreName && selectedStoreName && (
      productStoreName === selectedStoreName ||
      productStoreName.includes(selectedStoreName) ||
      selectedStoreName.includes(productStoreName)
    );
    const storeSlugMatch = productStoreSlug && selectedStoreSlug && (
      productStoreSlug === selectedStoreSlug ||
      productStoreSlug.includes(selectedStoreSlug) ||
      selectedStoreSlug.includes(productStoreSlug)
    );

    if (storeNameMatch || storeSlugMatch) {
      return true;
    }

    const hasStoreMetadata = Boolean(productStoreId || productStoreName || productStoreSlug || product.store_name || product.store?.name || product.store_slug || product.store?.slug || product.store_subdomain || product.store?.subdomain);
    return !hasStoreMetadata;
  }) : products;

  // Modals & Panels
  const [showTrackingModalOrder, setShowTrackingModalOrder] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [orderDetailsError, setOrderDetailsError] = useState('');
  const [showQuickViewProduct, setShowQuickViewProduct] = useState(null);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);

  // Customer Profile & Data
  const activeUser = user || {
    name: 'Sara Ahmed (Customer)',
    email: 'sara.ahmed@aureum.local',
    role: 'customer'
  };

  const getCustomerProfile = (authUser = activeUser) => ({
    name: authUser?.name || 'Sara Ahmed (Customer)',
    email: authUser?.email || 'sara.ahmed@aureum.local',
    phone: '+1 (555) 019-2834',
    address: '742 Luxury Boulevard, Beverly Hills, CA 90210',
  });

  const [profileData, setProfileData] = useState(getCustomerProfile(activeUser));

  useEffect(() => {
    setProfileData((prev) => ({
      ...prev,
      ...getCustomerProfile(activeUser),
    }));
  }, [activeUser?.name, activeUser?.email]);
  const [savedNotification, setSavedNotification] = useState(false);
  const [cartNotification, setCartNotification] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentDetails, setPaymentDetails] = useState({ name: '', cardNumber: '', expiry: '', cvc: '' });
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const [wishlistItems, setWishlistItems] = useState([]);

  const [addresses, setAddresses] = useState([
    { id: 1, type: 'Home', label: 'Primary Residence', address: '742 Luxury Boulevard, Beverly Hills, CA 90210', phone: '+1 (555) 019-2834', isDefault: true },
    { id: 2, type: 'Office', label: 'Tech Tower Work HQ', address: '100 Silicon Way, Suite 400, San Francisco, CA 94107', phone: '+1 (555) 982-1049', isDefault: false },
  ]);

  const [newAddress, setNewAddress] = useState({ type: 'Home', label: '', address: '', phone: '' });

  const spendingChartData = [
    { m: 'Jan', v: 340 }, { m: 'Feb', v: 420 }, { m: 'Mar', v: 290 },
    { m: 'Apr', v: 580 }, { m: 'May', v: 610 }, { m: 'Jun', v: 490 }, { m: 'Jul', v: 750 },
  ];

  const handleMoveToCart = (product) => {
    addToCart?.(product, 1);
    setWishlistItems((items) => items.filter((item) => item.id !== product.id));
    setCartNotification('Added to cart');
    setTimeout(() => setCartNotification(''), 2500);
  };

  const handleProceedToPayment = () => {
    setPaymentAmount(cartSubtotal);
    setPaymentDetails({ name: '', cardNumber: '', expiry: '', cvc: '' });
    setPaymentError('');
    setPaymentConfirmed(false);
    setActiveTab('payment');
  };

  const formatExpiryInput = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
  };

  const handleConfirmPayment = async () => {
    if (cartItems.length === 0) {
      setPaymentError('Your cart is empty.');
      return;
    }

    setPaymentError('');
    setPaymentProcessing(true);

    try {
      // Build order items directly from cart items, using fallback IDs when necessary.
      const orderItems = cartItems
        .map((item) => {
          const productId = getValidCartProductId(item);
          return productId ? { product_id: Number(productId), quantity: item.quantity || 1 } : null;
        })
        .filter(Boolean);

      // Determine store ID; fall back to first store if resolution fails.
      let storeId = resolveStoreIdFromCartItems(cartItems, storesList, selectedStore?.id);
      if (!storeId && storesList.length > 0) {
        storeId = storesList[0].id;
      }
      if (!storeId) {
        setPaymentError('Unable to determine store for the order.');
        setPaymentProcessing(false);
        return;
      }

      const orderPayload = {
        store_id: storeId,
        customer_name: profileData.name,
        customer_email: profileData.email,
        customer_phone: profileData.phone,
        shipping_address: profileData.address,
        items: orderItems,
      };

      const response = await api.post('/orders', orderPayload);
      const createdOrder = response?.data || null;
      const normalizedOrder = createdOrder
        ? {
            ...createdOrder,
            ...getOrderItemSummary(createdOrder),
            itemsList: (createdOrder?.items || []).map((item) => ({
              name: item?.product?.name || item?.product_name || item?.name || 'Ordered item',
              quantity: item?.quantity || 1,
            })),
            itemSummary:
              (createdOrder?.items || []).length > 0
                ? (createdOrder?.items || [])
                    .map((item) => `${item?.product?.name || item?.product_name || item?.name || 'Ordered item'} ×${item?.quantity || 1}`)
                    .join(', ')
                : 'No items listed',
            itemsCount: (createdOrder?.items || []).length,
          }
        : createOrderFromCart(cartItems, profileData);

      setPaymentProcessing(false);
      setPaymentConfirmed(true);
      setCartNotification('Payment successful! Order confirmed.');
      setOrders((prev) => {
        const updated = [normalizedOrder, ...prev];
        writeStoredOrders(updated);
        return updated;
      });
      setActiveTab('orders');
      setTimeout(() => setCartNotification(''), 2500);
      clearCart?.();
    } catch (error) {
      setPaymentProcessing(false);
      setPaymentError(error?.response?.data?.message || 'Unable to create your order right now.');
    }
  };

  const handleRemoveWishlistItem = (id) => {
    setWishlistItems((items) => items.filter((item) => item.id !== id));
  };

  const handleAddAddressSubmit = (e) => {
    e.preventDefault();
    if (!newAddress.address) return;
    const item = { id: Date.now(), ...newAddress, isDefault: addresses.length === 0 };
    setAddresses([...addresses, item]);
    setShowAddAddressModal(false);
    setNewAddress({ type: 'Home', label: '', address: '', phone: '' });
  };

  const handleViewOrderDetails = async (order) => {
    setShowTrackingModalOrder(order);
    setSelectedOrderDetails(null);
    setOrderDetailsLoading(true);
    setOrderDetailsError('');

    try {
      const response = await api.get(`/orders/${order.id}`).catch(() => null);
      const data = response?.data || order;
      const enrichedOrder = { ...data, ...getOrderItemSummary(data) };
      setSelectedOrderDetails(enrichedOrder);
    } catch (err) {
      const enrichedOrder = { ...order, ...getOrderItemSummary(order) };
      setSelectedOrderDetails(enrichedOrder);
      setOrderDetailsError('Unable to load full order details at this time.');
      console.debug('Order detail fetch failed:', err);
    } finally {
      setOrderDetailsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      setLoading(true);
      try {
        const [prodRes, orderRes, storeRes, catRes] = await Promise.all([
          api.get('/products').catch(() => null),
          api.get('/orders').catch(() => null),
          api.get('/stores').catch(() => null),
          api.get('/categories').catch(() => null),
        ]);

        const rawProducts = Array.isArray(prodRes?.data) ? prodRes.data : (prodRes?.data?.data || []);
        const ownerProducts = [];
        const savedProducts = localStorage.getItem('aureum_owner_products');
        if (savedProducts) {
          try {
            const parsed = JSON.parse(savedProducts);
            if (Array.isArray(parsed)) {
              parsed.forEach((p, idx) => {
                ownerProducts.push({
                  id: p.id || Date.now() + idx,
                  backend_id: p.backend_id ?? null,
                  source: p.backend_id ? 'api' : 'local',
                  localOnly: !p.backend_id,
                  name: p.name || p.title || 'Store Item',
                  category: p.category || 'General',
                  price: typeof p.price === 'number' ? p.price : parseFloat(String(p.price || 0).replace(/[^0-9.]/g, '')) || 99,
                  image: p.image || p.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
                  stock_quantity: p.stock ?? p.stock_quantity ?? 10,
                  rating: p.rating || 4.9,
                  store_id: p.store_id || p.store?.id || null,
                  store_name: p.store_name || p.store?.name || 'Owner Store',
                  store_slug: p.store_slug || p.store?.slug || p.store?.subdomain || (p.store_name || 'owner-store').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                  store_subdomain: p.store_subdomain || p.store?.subdomain || p.store?.slug || (p.store_name || 'owner-store').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                  description: p.description || 'Product created by the store owner.',
                });
              });
            }
          } catch (e) {
            console.debug('Failed to read owner products from localStorage', e);
          }
        }

        const mergedProducts = [
          ...(rawProducts.length > 0 ? rawProducts.filter(p => !isDemoProduct(p)).map(p => ({
            id: p.id || Date.now(),
            backend_id: p.id || null,
            source: 'api',
            localOnly: false,
            name: p.name || p.title || 'Store Item',
            // API returns category as an object {id, name} — extract the name string
            category: (typeof p.category === 'object' && p.category?.name)
              ? p.category.name
              : (typeof p.category === 'string' ? p.category : null)
                || p.category_name || 'General',
            price: p.price ?? '99.00',
            image: p.image || p.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
            stock_quantity: p.stock_quantity ?? p.stock ?? 10,
            rating: p.rating || 4.9,
            // API returns store as an object {id, name} — extract the name string
            store_name: (typeof p.store === 'object' && p.store?.name)
              ? p.store.name
              : p.store_name || 'Store',
            store_id: p.store_id || p.store?.id || null,
            description: p.description || 'Premium quality handcrafted product available in store.',
            status: p.status || 'In Stock',
          })) : []),
          ...ownerProducts.filter(p => !isDemoProduct(p))
        ];

        if (mergedProducts.length > 0) {
          setProducts(mergedProducts);
          setCategories(['All', ...new Set(mergedProducts.map(p => p.category).filter(Boolean))]);
        } else {
          setProducts([]);
        }

        const matchesCurrentUserOrder = (order) => {
          if (!order) return false;
          const orderEmail = String(order.customer_email || order.customer?.email || '').toLowerCase().trim();
          const userEmail = String(user?.email || profileData?.email || '').toLowerCase().trim();

          if (user?.id && order.customer_id) {
            if (String(order.customer_id) === String(user.id)) return true;
          }

          if (userEmail && orderEmail) {
            return orderEmail === userEmail;
          }

          return false;
        };

        const ordersPayload = Array.isArray(orderRes?.data) ? orderRes.data : (orderRes?.data?.data || []);
        const currentUserOrders = Array.isArray(ordersPayload)
          ? ordersPayload.filter(matchesCurrentUserOrder)
          : [];

        const localOrders = readStoredOrders().filter(matchesCurrentUserOrder).map((order) => ({
          ...order,
          ...getOrderItemSummary(order),
        }));

        const normalizedOrders = currentUserOrders.map((order) => ({
          ...order,
          ...getOrderItemSummary(order),
        }));

        const mergedOrders = [...localOrders, ...normalizedOrders];
        const uniqueOrders = Array.from(new Map(mergedOrders.map((order) => [order.id || order.order_number, order])).values());
        setOrders(uniqueOrders);

        const storesPayload = Array.isArray(storeRes?.data) ? storeRes.data : (storeRes?.data?.data || []);
        const apiStores = storesPayload.length > 0 ? storesPayload.map(normalizeCustomerStore) : [];

        const ownerStores = loadLocalOwnerStores();
        const mergedStores = mergeStoresWithLocal(apiStores, ownerStores);
        const allStores = mergeStoresWithLocal(mergedStores, storeContextStores || []);

        if (allStores.length === 0 && Array.isArray(storeContextStores) && storeContextStores.length > 0) {
          setStoresList(storeContextStores);
        } else if (allStores.length > 0) {
          setStoresList(allStores);
        } else {
          setStoresList([
            {
              id: 1,
              name: 'Coastal Threads Store',
              category: 'Fashion & Apparel',
              subdomain: 'coastal-threads',
              owner: 'Merchant Owner',
              status: 'Active',
              description: 'Premium handcrafted organic textiles and luxury fashion apparel.',
              products_count: 24,
              rating: 4.9
            },
            {
              id: 2,
              name: 'Aureum Boutique',
              category: 'Jewelry & Luxury',
              subdomain: 'aureum-boutique',
              owner: 'Merchant Owner',
              status: 'Active',
              description: 'Artisanal gold-plated jewelry and luxury lifestyle pieces.',
              products_count: 12,
              rating: 4.8
            },
            {
              id: 3,
              name: 'Margas Store',
              category: 'Apparel & Fashion',
              subdomain: 'margas-store',
              owner: 'Marcus Vance',
              status: 'Active',
              description: 'Bespoke tailoring, outerwear, and modern streetwear collections.',
              products_count: 36,
              rating: 4.9
            },
            {
              id: 4,
              name: 'Sheikh Home Decor',
              category: 'Luxury Furniture',
              subdomain: 'sheikh-home',
              owner: 'Fatima Sheikh',
              status: 'Active',
              description: 'Handcarved brass artifacts, luxury rugs, and home decor items.',
              products_count: 18,
              rating: 4.7
            }
          ]);
        }

        const rawCategories = Array.isArray(catRes?.data) ? catRes.data : (catRes?.data?.data || []);
        if (rawCategories.length > 0) {
          setCategoriesList(rawCategories.map(c => ({
            id: c.id,
            name: c.name,
            slug: c.slug || c.name.toLowerCase().replace(/\s+/g, '-'),
            description: c.description || 'Verified product category created by store merchants.',
            featured: Boolean(c.featured),
            products_count: c.products_count ?? 12
          })));
        } else {
          setCategoriesList([
            { id: 1, name: 'Fashion & Apparel', slug: 'fashion-apparel', description: 'Handcrafted organic textiles, dresses, and luxury outerwear created by store merchants.', featured: true, products_count: 24 },
            { id: 2, name: 'Jewelry & Luxury', slug: 'jewelry-luxury', description: 'Artisanal gold-plated jewelry, rings, and handcrafted accessories.', featured: true, products_count: 18 },
            { id: 3, name: 'Home & Living', slug: 'home-living', description: 'Ceramic decor, brass lamps, throw blankets, and artisanal interior items.', featured: false, products_count: 15 },
            { id: 4, name: 'Watches', slug: 'watches', description: 'Bespoke timepieces, automatic watches, and luxury chronographs.', featured: true, products_count: 10 },
            { id: 5, name: 'Electronics', slug: 'electronics', description: 'Premium noise-cancelling earbuds, smart devices, and accessories.', featured: false, products_count: 8 }
          ]);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchData();
    return () => { isMounted = false; };
  }, [user?.id, user?.email, storeContextStores]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 3000);
  };

  const filteredProducts = products.filter((p) => {
    if (!p || isDemoProduct(p)) return false;
    const prodName = String(p.name || p.title || '');
    const prodCat = String(p.category || '');
    const storeName = String(p.store_name || p.store?.name || '');
    const query = String(searchQuery || '').trim().toLowerCase();

    const matchesCat = selectedCategory === 'All' || prodCat.toLowerCase().includes(selectedCategory.toLowerCase());
    const filterStore = selectedStoreFilter.toLowerCase();
    const matchesStore = selectedStoreFilter === 'All Stores' ||
      storeName.toLowerCase().includes(filterStore) ||
      filterStore.includes(storeName.toLowerCase()) ||
      String(p.store_id || p.store?.id || '').toLowerCase() === filterStore;
    const matchesSearch = !query || 
                          prodName.toLowerCase().includes(query) || 
                          prodCat.toLowerCase().includes(query) ||
                          storeName.toLowerCase().includes(query);

    return matchesCat && matchesStore && matchesSearch;
  });

  const sidebarMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'browse-store', label: 'Browse Store', icon: Store },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'cart', label: 'Shopping Cart', icon: ShoppingCart },
    { id: 'orders', label: 'My Orders', icon: Clock },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'profile', label: 'Profile', icon: User },

    
  ];

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", backgroundColor: '#f1f2f4', color: '#202223', minHeight: '100vh' }} className="d-flex w-100 flex-column flex-md-row">
      
      {/* 1. FIXED NAVBAR (Mobile Only / Top Bar) */}
      <header className="sticky-top border-bottom d-md-none" style={{ backgroundColor: '#ffffff', borderColor: '#dfe3e8', height: 70 }}>
        <div className="container-fluid px-4 h-100 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="btn btn-sm text-dark border-0">
              <Menu size={22} />
            </button>
            <div className="d-flex align-items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="brand-icon-box d-flex align-items-center justify-content-center rounded-3" style={{ width: 34, height: 34, background: "#ffffff", color: "#202223", border: "1px solid #dfe3e8", fontWeight: 700, fontSize: 18 }}>
                A
              </div>
              <span className="brand-title" style={{ color: "#202223", fontWeight: 800, fontSize: "0.95rem", letterSpacing: "0.15em" }}>AUREUM</span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3">
            {/* Cart Counter */}
            <button onClick={() => setActiveTab('cart')} className="btn btn-sm text-dark position-relative border-0">
              <ShoppingCart size={20} style={{ color: GOLD }} />
              {cartItems.length > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning text-dark font-bold fs-9">
                  {cartItems.length}
                </span>
              )}
            </button>

            {/* Customer Avatar Removed As Requested */}

            <button onClick={handleLogout} className="btn btn-sm btn-outline-danger d-none d-sm-flex align-items-center gap-1 fs-8">
              <LogOut size={14} /> Exit
            </button>
          </div>
        </div>
      </header>

      {cartNotification && (
        <div className="position-fixed top-0 start-50 translate-middle-x mt-5" style={{ zIndex: 1080 }}>
          <div className="alert alert-success bg-light border-warning text-warning py-2 px-4 rounded-pill shadow-lg">
            {cartNotification}
          </div>
        </div>
      )}

      {/* 2. BODY LAYOUT */}
      <div className="d-flex flex-grow-1">
        
        {/* SIDEBAR */}
          <aside className={`customer-sidebar p-3 border-end flex-shrink-0 ${sidebarOpen ? 'd-block position-absolute bg-white z-3' : 'd-none d-md-flex flex-column'}`} style={{ width: 250, minWidth: 250, backgroundColor: '#ebebeb', borderColor: '#dfe3e8', minHeight: '100vh' }}>
          
          <div className="d-none d-md-flex align-items-center gap-2 p-2 mb-3 border-bottom" style={{ borderColor: "#dfe3e8" }}>
            <div className="brand-icon-box d-flex align-items-center justify-content-center rounded-3" style={{ width: 34, height: 34, background: "#ffffff", color: "#202223", border: "1px solid #dfe3e8", fontWeight: 700, fontSize: 18 }}>
              A
            </div>
            <span className="brand-title" style={{ color: "#202223", fontWeight: 800, fontSize: "0.95rem", letterSpacing: "0.15em" }}>AUREUM</span>
          </div>

          <div className="px-2 pb-3 text-uppercase fs-8 font-semibold tracking-wider" style={{ color: '#6d7175' }}>
            Customer Workspace
          </div>
          <nav className="d-flex flex-column gap-1">
            {sidebarMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const highlightItem = ['dashboard', 'browse-store', 'products', 'categories', 'wishlist', 'cart', 'orders', 'addresses', 'profile'].includes(item.id);
              const itemTextColor = isActive ? '#007f5f' : '#454f5b';
              const itemIconColor = isActive ? '#007f5f' : '#6d7175';
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                  className={`btn text-start d-flex align-items-center gap-3 px-3 py-2.5 rounded-3 border-0 transition-all ${isActive ? 'active' : ''}`}
                  style={{
                    backgroundColor: isActive ? 'rgba(0,127,95,0.1)' : 'transparent',
                    color: itemTextColor,
                    fontWeight: isActive ? 'bold' : '600',
                    borderLeft: isActive ? '3px solid #007f5f' : '3px solid transparent'
                  }}
                >
                  <Icon size={18} style={{ color: itemIconColor }} />
                  <span className="fs-7" style={{ color: itemTextColor }}>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* MAIN BODY AREA */}
        <main className="flex-grow-1 p-4 overflow-y-auto" style={{ minWidth: 0 }}>
          
          {/* HEADER GREETING */}
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4 pb-3 border-bottom" style={{ borderColor: '#dfe3e8' }}>
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="fs-6 text-uppercase fw-bold" style={{ color: '#6d7175', letterSpacing: '0.05em' }}>CUSTOMER DASHBOARD</span>
              </div>
            </div>
            <div className="d-flex align-items-center gap-3">
              <div className="input-group shadow-sm rounded-pill" style={{ maxWidth: 280, overflow: 'hidden', border: '1px solid #dfe3e8' }}>
                <span className="input-group-text bg-white border-0 text-secondary pe-1"><Search size={16} /></span>
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search items..." className="form-control form-control-sm bg-white text-dark border-0 fs-8 shadow-none" style={{ outline: 'none' }} />
              </div>
              
              <button onClick={() => setActiveTab('cart')} className="btn btn-sm text-dark position-relative border bg-white p-2 rounded-circle shadow-sm" style={{ borderColor: '#dfe3e8' }}>
                <ShoppingCart size={18} style={{ color: '#454f5b' }} />
                {cartItems.length > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-success text-white font-bold fs-9">
                    {cartItems.length}
                  </span>
                )}
              </button>

              <div className="btn btn-sm bg-light text-dark border rounded-circle d-flex justify-content-center align-items-center shadow-sm" style={{ width: 34, height: 34, fontWeight: 'bold', borderColor: '#dfe3e8' }}>
                {activeUser?.name?.charAt(0) || 'C'}
              </div>
            </div>
          </div>

          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="d-flex flex-column gap-4">
              
              <div className="row g-3">
                <div className="col-6 col-md-4 col-lg-2.4">
                  <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "16px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <div className="fs-8 text-secondary mb-1">Total Orders</div>
                    <div className="fs-4 font-bold text-dark">{orders.length}</div>
                    <div className="fs-8 text-success font-semibold mt-1">Active Account</div>
                  </div>
                </div>
                <div className="col-6 col-md-4 col-lg-2.4">
                  <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "16px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <div className="fs-8 text-secondary mb-1">In Transit</div>
                    <div className="fs-4 font-bold text-dark">{orders.filter(o => o.status === 'Shipped' || o.status === 'Pending').length}</div>
                    <div className="fs-8 text-warning font-semibold mt-1">On the way</div>
                  </div>
                </div>
                <div className="col-6 col-md-4 col-lg-2.4">
                  <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "16px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <div className="fs-8 text-secondary mb-1">Completed</div>
                    <div className="fs-4 font-bold text-success">{orders.filter(o => o.status === 'Completed' || o.status === 'Delivered').length}</div>
                    <div className="fs-8 text-success font-semibold mt-1">Delivered</div>
                  </div>
                </div>
                <div className="col-6 col-md-4 col-lg-2.4">
                  <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "16px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <div className="fs-8 text-secondary mb-1">Cart Items</div>
                    <div className="fs-4 font-bold text-dark">{cartItems.length}</div>
                    <div className="fs-8 text-warning font-semibold mt-1">In Cart</div>
                  </div>
                </div>
                <div className="col-6 col-md-4 col-lg-2.4">
                  <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "16px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <div className="fs-8 text-secondary mb-1">Saved Wishlist</div>
                    <div className="fs-4 font-bold text-dark">{wishlistItems.length}</div>
                    <div className="fs-8 text-danger font-semibold mt-1">Favorites</div>
                  </div>
                </div>
              </div>

              {/* SPENDING ANALYTICS CHART */}
              <div className="row g-3">
                <div className="col-12 col-lg-8">
                  <div className="bg-white border rounded-4 shadow-sm ">
                    <h3 className="fs-6 font-bold text-dark mb-1">Shopping Spend Analytics</h3>
                    <p className="fs-8 text-secondary mb-3">Monthly expenditure on AUREUM platform stores</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={spendingChartData}>
                        <defs>
                          <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={GOLD} stopOpacity={0.4} />
                            <stop offset="100%" stopColor={GOLD} stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,175,55,0.1)" vertical={false} />
                        <XAxis dataKey="m" tick={{ fontSize: 11, fill: "#8a7a4d" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#8a7a4d" }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: "#0e0d0b", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 8, fontSize: 12, color: "#fff" }} />
                        <Area type="monotone" dataKey="v" stroke={GOLD} strokeWidth={2.5} fill="url(#spendGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="col-12 col-lg-4">
                  <div className="bg-white border rounded-4 shadow-sm  d-flex flex-column justify-between">
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-2 text-warning">
                        <Award size={20} />
                        <h3 className="fs-6 font-bold text-dark mb-0">AUREUM Club Rewards</h3>
                      </div>
                      <div className="fs-3 font-bold text-dark mb-1">1,250 <span className="fs-8 font-normal text-secondary">Pts</span></div>
                      <p className="fs-8 text-secondary mb-3">You are 250 points away from unlocking <strong>Platinum Tier</strong> benefits & free international shipping.</p>
                      <div className="progress bg-light mb-2" style={{ height: 8 }}>
                        <div className="progress-bar bg-warning" style={{ width: '75%' }}></div>
                      </div>
                    </div>
                    <button onClick={() => setActiveTab('coupons')} className="btn btn-gold-primary btn-sm w-100 py-2">
                      Claim Coupons
                    </button>
                  </div>
                </div>
              </div>

              {/* RECENT ORDERS SUMMARY */}
              <div className="bg-white border rounded-4 shadow-sm ">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h3 className="fs-6 font-bold text-dark mb-0">Recent Shipments & Orders</h3>
                  <button onClick={() => setActiveTab('orders')} className="btn btn-link text-warning fs-8 p-0 text-decoration-none">View All Orders</button>
                </div>
                <div className="table-responsive">
                  <table className="table table-dark table-hover mb-0 align-middle">
                    <thead>
                      <tr className="text-secondary fs-8">
                        <th>Order ID</th>
                        <th>Store</th>
                        <th>Date</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th className="text-end">Tracking</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => (
                        <tr key={o.id}>
                          <td className="fw-bold text-warning">{o.order_number}</td>
                          <td className="text-dark">
                            <div>{o.store_name}</div>
                            <div className="fs-8 text-secondary">{o.itemSummary || 'Awaiting item details'}</div>
                          </td>
                          <td className="fs-8 text-secondary">{o.created_at}</td>
                          <td className="fw-bold text-dark">${o.total_amount}</td>
                          <td>
                            <span className={o.status === 'Delivered' || o.status === 'Completed' ? 'gold-badge-emerald' : 'gold-badge-amber'}>
                              {o.status}
                            </span>
                          </td>
                          <td className="text-end">
                            <button onClick={() => handleViewOrderDetails(o)} className="btn btn-sm btn-outline-warning fs-8 py-1 px-2">
                              <Truck size={12} className="me-1" /> Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB: BROWSE STORE */}
          {activeTab === 'browse-store' && (
            selectedStore ? (
              <div className="d-flex flex-column gap-4">
                {/* Store Detail View */}
                <div className="p-4 rounded-3xl border" style={{ background: '#0b0a08', borderColor: 'rgba(212,175,55,0.2)' }}>
                  <div className="flex items-center gap-4 mb-4">
                    {(selectedStore.logo && selectedStore.name?.toLowerCase().trim() !== 'ali livings') ? (
                      <img src={selectedStore.logo} alt={selectedStore.name} className="w-16 h-16 rounded" />
                    ) : (
                      <div className="w-16 h-16 rounded bg-[#14120e] flex items-center justify-center text-[#f3d675]">Logo</div>
                    )}
                    <div>
                      <h2 className="text-2xl font-bold text-[#f3d675]">{selectedStore.name}</h2>
                      <p className="text-sm text-[#f3d675]">{selectedStore.slug || '(no-slug)'}</p>
                    </div>
                  </div>
                  <p className="mb-2 text-[#f3d675]">{selectedStore.description || 'No description provided.'}</p>
                  <div className="mb-4 d-flex flex-wrap align-items-center gap-2">
                    {selectedStore.category && (
                      <span className="badge bg-warning text-dark py-2 px-3 fs-8">
                        Category: {selectedStore.category}
                      </span>
                    )}
                    <span className="badge bg-light border border-light text-dark py-2 px-3 fs-8">
                      {selectedStore.products_count ?? 0} Products
                    </span>
                    <span className="badge bg-light border border-light text-dark py-2 px-3 fs-8">
                      {selectedStore.orders_count ?? 0} Orders
                    </span>
                    <span className="badge bg-light border border-light text-dark py-2 px-3 fs-8">
                      {selectedStore.status ?? 'Active'}
                    </span>
                  </div>

                  {selectedStoreProducts.length > 0 ? (
                    <div className="mb-4">
                      <h3 className="fs-5 text-dark mb-3">Store Products</h3>
                      <div className="row g-3">
                        {selectedStoreProducts.map((product) => (
                          <div key={product.id} className="col-12 col-sm-6 col-lg-4">
                            <div className="bg-white border rounded-4 shadow-sm  p-3 h-100 d-flex flex-column justify-between">
                              <div>
                                <img
                                  src={getProductImageUrl(product)}
                                  alt={product.name}
                                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = buildProductPlaceholderImage(product); }}
                                  className="w-100 rounded-3 mb-3 object-cover"
                                  style={{ height: 180, background: '#161310', border: '1px solid rgba(212,175,55,0.22)' }}
                                />
                                <div className="d-flex align-items-center justify-content-between mb-2">
                                  <span className="fs-8 text-warning font-semibold">{cleanCategoryLabel(product.category)}</span>
                                  <span className="fs-8 text-secondary">{product.stock_quantity ?? 0} left</span>
                                </div>
                                <h4 className="fs-6 font-bold text-dark mb-1">{product.name}</h4>
                                <p className="fs-8 text-secondary mb-3 line-clamp-2">{product.description || 'High-quality store item available for immediate purchase.'}</p>
                              </div>
                              <div className="d-flex gap-2 align-items-center justify-content-between">
                                <button onClick={() => { addToCart?.(product, 1); setCartNotification('Added to cart'); setTimeout(() => setCartNotification(''), 2500); }} className="btn btn-gold-primary btn-sm py-2 flex-grow-1 d-flex align-items-center justify-content-center gap-1">
                                  <ShoppingCart size={14} /> Add to Cart
                                </button>
                                <button
                                  onClick={() => setWishlistItems((items) => items.some((item) => item.id === product.id) ? items : [...items, product])}
                                  className={`btn btn-sm py-2 px-3 d-flex align-items-center justify-content-center ${wishlistItems.some((item) => item.id === product.id) ? 'btn-danger text-dark' : 'btn-outline-warning text-dark'}`}
                                  title="Add to Wishlist"
                                >
                                  <Heart size={14} className={`${wishlistItems.some((item) => item.id === product.id) ? 'text-dark' : 'text-warning'}`} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white border rounded-4 shadow-sm  p-3 mb-4 text-center">
                      <p className="fs-8 text-secondary mb-0">No products available for this store yet.</p>
                    </div>
                  )}

                  <button onClick={() => setSelectedStore(null)} className="btn btn-outline-warning btn-sm">
                    ← Back to Stores
                  </button>
                </div>
              </div>
            ) : (
              <BrowseStores stores={storesList} onSelectStore={setSelectedStore} />
            )
          )}

          {/* TAB 2: PRODUCTS */}
          {activeTab === 'products' && (
            <div className="d-flex flex-column gap-3">
              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                <div>
                  <h2 className="fs-4 font-bold text-dark mb-0">Store Products Catalog</h2>
                  <p className="fs-8 text-secondary mb-0">Browse items available across registered Aureum platform stores</p>
                </div>
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <div className="d-flex align-items-center gap-1 bg-light px-2 py-1 rounded border border-light">
                    <Store size={14} className="text-warning" />
                    <select
                      value={selectedStoreFilter}
                      onChange={(e) => setSelectedStoreFilter(e.target.value)}
                      className="form-select form-select-sm bg-light text-dark border-0 fs-8 py-0 shadow-none"
                      style={{ width: 170, cursor: "pointer" }}
                    >
                      <option value="All Stores">All Stores ({storesList.length})</option>
                      {storesList.map(s => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="d-flex gap-1 overflow-x-auto py-1">
                    {categories.map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedCategory(c)}
                        className={`btn btn-sm px-3 py-1 rounded-pill fs-8 text-nowrap ${selectedCategory === c ? 'btn-warning text-dark font-bold' : 'btn-outline-secondary text-dark'}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="bg-white border rounded-4 shadow-sm  text-center py-5">
                  <Package size={40} className="text-secondary mb-2" />
                  <h3 className="fs-6 text-dark mb-1">No products found</h3>
                  <p className="fs-8 text-secondary">Try clearing your store or category search filter.</p>
                </div>
              ) : (
                <div className="row g-3">
                  {filteredProducts.map((p) => (
                    <div key={p.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                      <div className="bg-white border rounded-4 shadow-sm  p-3 d-flex flex-column justify-between h-100 position-relative group">
                        <div className="position-relative mb-2 cursor-pointer" onClick={() => setShowQuickViewProduct(p)}>
                          <img
                            src={getProductImageUrl(p)}
                            alt={p.name}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = buildProductPlaceholderImage(p);
                            }}
                            className="w-100 rounded-3 object-cover"
                            style={{ height: 160, background: '#161310', border: '1px solid rgba(212,175,55,0.22)' }}
                          />
                          <span className="position-absolute bottom-0 start-0 m-2 gold-badge-amber fs-9 font-mono d-flex align-items-center gap-1">
                            <Store size={10} /> {p.store_name || "Merchant Store"}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setWishlistItems((items) => items.some((item) => item.id === p.id) ? items : [...items, p]);
                            }}
                            className={`position-absolute top-0 end-0 m-2 p-1.5 rounded-circle border ${wishlistItems.some((item) => item.id === p.id) ? 'bg-danger border-danger text-dark' : 'bg-light border-light text-dark'}`}
                            title="Add to Wishlist"
                          >
                            <Heart size={14} className={wishlistItems.some((item) => item.id === p.id) ? 'text-dark' : 'text-warning'} />
                          </button>
                        </div>
                        <div>
                          <div className="d-flex align-items-center justify-content-between mb-1">
                            <span className="fs-8 text-warning font-semibold">{cleanCategoryLabel(p.category)}</span>
                            <span className="fs-8 text-secondary d-flex align-items-center"><Star size={11} className="text-warning fill-warning me-1" />{p.rating || 4.9}</span>
                          </div>
                          <div
                            onClick={() => setShowQuickViewProduct(p)}
                            className="fs-7 font-bold text-dark mb-2 line-clamp-1 cursor-pointer hover:text-warning transition-all"
                            title="Click to view store product details"
                          >
                            {p.name}
                          </div>
                          <div className="fs-6 font-bold text-dark mb-3">${p.price}</div>
                        </div>
                        <div className="d-flex gap-2">
                          <button onClick={() => setShowQuickViewProduct(p)} className="btn btn-outline-warning btn-sm fs-8 py-1.5 px-2 flex-shrink-0" title="Quick View">
                            <Eye size={14} /> Details
                          </button>
                          <button onClick={() => { addToCart?.(p, 1); setCartNotification('Added to cart'); setTimeout(() => setCartNotification(''), 2500); }} className="btn btn-gold-primary btn-sm w-100 py-1.5 font-bold">
                            <ShoppingCart size={14} className="me-1" /> Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: CATEGORIES - STORE OWNER CREATED CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="d-flex flex-column gap-4">
              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                <div>
                  <div className="gold-badge-amber mb-1 d-inline-flex align-items-center gap-1">
                    <Tag size={13} /> MERCHANT CATALOG CATEGORIES
                  </div>
                  <h2 className="fs-4 font-bold text-dark mb-0">Store Product Categories</h2>
                  <p className="fs-8 text-secondary mb-0">Categories created and maintained by store owners across all verified shops</p>
                </div>

                <div className="input-group" style={{ maxWidth: 280 }}>
                  <span className="input-group-text bg-light border-light text-secondary"><Search size={14} /></span>
                  <input
                    value={categorySearchQuery}
                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                    placeholder="Search categories..."
                    className="form-control form-control-sm bg-light text-dark border-light fs-8"
                  />
                </div>
              </div>

              {/* Categories Cards Grid */}
              <div className="row g-3">
                {categoriesList.filter(c => 
                  c.name.toLowerCase().includes(categorySearchQuery.toLowerCase()) || 
                  (c.description && c.description.toLowerCase().includes(categorySearchQuery.toLowerCase()))
                ).map((cat) => (
                  <div key={cat.id} className="col-12 col-md-6 col-lg-4">
                    <div className="bg-white border rounded-4 shadow-sm  p-4 d-flex flex-column justify-between h-100">
                      <div>
                        <div className="d-flex align-items-center justify-content-between mb-3">
                          <div className="d-flex align-items-center gap-2">
                            <div className="w-10 h-10 rounded-circle d-flex align-items-center justify-content-center" style={{ background: "rgba(212,175,55,0.15)", color: GOLD }}>
                              <Tag size={18} />
                            </div>
                            <div>
                              <h3 className="fs-6 font-bold text-dark mb-0">{cat.name}</h3>
                              <span className="fs-8 text-warning font-mono">/{cat.slug}</span>
                            </div>
                          </div>
                          {cat.featured ? (
                            <span className="gold-badge-amber">⭐ Featured</span>
                          ) : (
                            <span className="badge bg-light border border-light text-secondary fs-8">Standard</span>
                          )}
                        </div>

                        <p className="fs-8 text-secondary mb-3" style={{ lineHeight: 1.5 }}>
                          {cat.description || "Verified product category created by store merchants."}
                        </p>
                      </div>

                      <div className="d-flex align-items-center justify-content-between pt-3 border-top" style={{ borderColor: "rgba(212,175,55,0.15)" }}>
                        <span className="badge bg-secondary bg-opacity-50 text-dark font-mono px-2 py-1 fs-8">
                          <Package size={12} className="me-1" /> {cat.products_count ?? 12} Products
                        </span>
                        <button
                          onClick={() => {
                            setSelectedCategory(cat.name);
                            setActiveTab('products');
                          }}
                          className="btn btn-sm btn-gold-primary fs-8 py-1 px-3 d-flex align-items-center gap-1"
                        >
                          View Products ➔
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: WISHLIST */}
          {activeTab === 'wishlist' && (
            <div className="d-flex flex-column gap-3">
              <h2 className="fs-4 font-bold text-dark mb-0">My Wishlist</h2>
              {wishlistItems.length === 0 ? (
                <div className="bg-white border rounded-4 shadow-sm  text-center py-5">
                  <Heart size={40} className="text-secondary mb-2" />
                  <h3 className="fs-6 text-dark">Your wishlist is empty</h3>
                </div>
              ) : (
                <div className="row g-3">
                  {wishlistItems.map((item) => (
                    <div key={item.id} className="col-12 col-md-4">
                      <div className="bg-white border rounded-4 shadow-sm  p-3 d-flex gap-3 align-items-center">
                        <img
                          src={getProductImageUrl(item)}
                          alt={item.name}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = buildProductPlaceholderImage(item);
                          }}
                          className="w-16 h-16 rounded object-cover"
                          style={{ width: 70, height: 70, background: '#161310', border: '1px solid rgba(212,175,55,0.22)' }}
                        />
                        <div className="flex-grow-1">
                          <div className="fs-7 font-bold text-dark">{item.name}</div>
                          <div className="fs-8 text-warning font-bold">${item.price}</div>
                          <div className="d-flex gap-2 mt-2">
                            <button onClick={() => handleMoveToCart(item)} className="btn btn-sm btn-gold-primary fs-8 py-1 px-2">Move to Cart</button>
                            <button onClick={() => handleRemoveWishlistItem(item.id)} className="btn btn-sm btn-outline-danger fs-8 py-1 px-2">Remove</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SHOPPING CART */}
          {activeTab === 'cart' && (
            <div className="d-flex flex-column gap-3">
              <h2 className="fs-4 font-bold text-dark mb-0">Your Shopping Cart</h2>
              {cartItems.length === 0 ? (
                <div className="bg-white border rounded-4 shadow-sm  text-center py-5">
                  <ShoppingCart size={40} className="text-secondary mb-2" />
                  <h3 className="fs-6 text-dark">Your cart is currently empty</h3>
                </div>
              ) : (
                <div className="row g-3">
                  <div className="col-12 col-lg-8">
                    <div className="bg-white border rounded-4 shadow-sm ">
                      <div className="table-responsive">
                        <table className="table table-dark table-hover align-middle mb-0">
                          <thead>
                            <tr className="text-secondary fs-8">
                              <th>Product</th>
                              <th className="text-end">Qty</th>
                              <th className="text-end">Price</th>
                              <th className="text-end">Total</th>
                              <th className="text-end">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cartItems.map((item, idx) => {
                              const productName = item.product?.name || item.name || 'Cart Item';
                              const unitPrice = Number(item.price) || Number(item.product?.price) || 0;
                              const quantity = Number(item.quantity) || 1;
                              const rowTotal = (unitPrice * quantity).toFixed(2);
                              return (
                                <tr key={idx}>
                                  <td>
                                    <div className="d-flex align-items-center gap-3">
                                      {item.product?.image || item.image ? (
                                        <img
                                          src={item.product?.image || item.image}
                                          alt={productName}
                                          className="rounded"
                                          style={{ width: 55, height: 55, objectFit: 'cover', background: '#161310' }}
                                        />
                                      ) : (
                                        <div className="rounded bg-secondary d-flex align-items-center justify-content-center" style={{ width: 55, height: 55 }}>
                                          <ShoppingBag size={16} />
                                        </div>
                                      )}
                                      <div>
                                        <div className="fw-bold text-dark">{productName}</div>
                                        <div className="fs-8 text-secondary">{item.product?.store_name || item.store_name || 'AUREUM Store'}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="text-end">{quantity}</td>
                                  <td className="text-end text-warning">${unitPrice.toFixed(2)}</td>
                                  <td className="text-end text-dark">${rowTotal}</td>
                                  <td className="text-end">
                                    <button onClick={() => removeFromCart?.(item.id)} className="btn btn-sm btn-outline-danger p-1">
                                      <Trash2 size={14} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-lg-4">
                    <div className="bg-white border rounded-4 shadow-sm  p-4">
                      <h3 className="fs-6 font-bold text-dark mb-3">Order Summary</h3>
                      <div className="d-flex justify-content-between fs-7 mb-2"><span className="text-secondary">Items ({totalCartCount})</span> <span>${cartSubtotal.toFixed(2)}</span></div>
                      <div className="d-flex justify-content-between fs-7 mb-2"><span className="text-secondary">Shipping</span> <span className="text-success">FREE</span></div>
                      <div className="d-flex justify-content-between fs-7 mb-2"><span className="text-secondary">Taxes</span> <span>${(cartSubtotal * 0.00).toFixed(2)}</span></div>
                      <div className="d-flex justify-content-between fs-6 font-bold border-top pt-2 mb-3" style={{ borderColor: 'rgba(212,175,55,0.2)' }}>
                        <span>Total</span> <span className="text-warning">${cartSubtotal.toFixed(2)}</span>
                      </div>
                      <button onClick={handleProceedToPayment} className="btn btn-gold-primary w-100 py-2 font-bold">
                        Proceed to Payment
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PAYMENT */}
          {activeTab === 'payment' && (
            <div className="d-flex flex-column gap-3">
              <h2 className="fs-4 font-bold text-dark mb-0">Payment Checkout</h2>
              <div className="row g-3">
                <div className="col-12 col-lg-7">
                  <div className="bg-white border rounded-4 shadow-sm  p-4">
                    <div className="d-flex align-items-center gap-3 mb-4">
                      <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 42, height: 42, background: '#d4af37' }}>
                        <Truck size={20} className="text-dark" />
                      </div>
                      <div>
                        <div className="fs-6 font-bold text-dark">Cash on Delivery</div>
                        <div className="fs-8 text-secondary">Pay with cash when your order arrives.</div>
                      </div>
                    </div>

                    {!paymentConfirmed ? (
                      <form className="d-flex flex-column gap-3" onSubmit={(e) => { e.preventDefault(); handleConfirmPayment(); }}>
                        <div className="p-3 mb-2 rounded-3" style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.2)' }}>
                          <p className="fs-8 text-dark mb-0">You have selected Cash on Delivery. Please keep the exact change ready at the time of delivery.</p>
                        </div>
                        {paymentError && <div className="text-danger fs-8">{paymentError}</div>}
                        <button type="submit" disabled={paymentProcessing} className="btn btn-gold-primary w-100 py-2 font-bold">
                          {paymentProcessing ? 'Processing Order…' : `Confirm Order for ${paymentAmount ? `$${paymentAmount.toFixed(2)}` : ''}`}
                        </button>
                        <button onClick={() => setActiveTab('cart')} type="button" className="btn btn-outline-secondary w-100 py-2">
                          Back to Cart
                        </button>
                      </form>
                    ) : (
                      <div className="text-center py-5">
                        <div className="fs-1 text-success mb-3">✓</div>
                        <h3 className="fs-5 font-bold text-dark mb-2">Order Confirmed</h3>
                        <p className="fs-8 text-secondary mb-3">Your order of <strong>${paymentAmount.toFixed(2)}</strong> has been successfully placed.</p>
                        <button onClick={() => setActiveTab('orders')} className="btn btn-outline-warning btn-sm px-4 py-2">
                          View Order History
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-12 col-lg-5">
                  <div className="bg-white border rounded-4 shadow-sm  p-4">
                    <h3 className="fs-6 font-bold text-dark mb-3">Order Summary</h3>
                    <div className="d-flex justify-content-between fs-7 mb-2"><span className="text-secondary">Subtotal</span> <span>${paymentAmount.toFixed(2)}</span></div>
                    <div className="d-flex justify-content-between fs-7 mb-2"><span className="text-secondary">COD Fee</span> <span>$0.00</span></div>
                    <div className="d-flex justify-content-between fs-7 mb-3"><span className="text-secondary">Shipping</span> <span className="text-success">FREE</span></div>
                    <div className="d-flex justify-content-between fs-6 font-bold border-top pt-2" style={{ borderColor: 'rgba(212,175,55,0.2)' }}>
                      <span>Total</span> <span className="text-warning">${paymentAmount.toFixed(2)}</span>
                    </div>
                    <div className="mt-4 p-3 rounded-3" style={{ background: '#0f0d0b', border: '1px solid rgba(212,175,55,0.12)' }}>
                      <div className="fs-8 text-warning font-bold mb-2">Cash on Delivery</div>
                      <div className="fs-8 text-secondary">A fast and secure way to pay upon arrival.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ORDERS */}
          {activeTab === 'orders' && (
            <div className="d-flex flex-column gap-3">
              <h2 className="fs-4 font-bold text-dark mb-0">My Order History</h2>
              <div className="bg-white border rounded-4 shadow-sm ">
                <div className="table-responsive">
                  <table className="table table-dark table-hover mb-0 align-middle">
                    <thead>
                      <tr className="text-secondary fs-8">
                        <th>Order #</th>
                        <th>Products</th>
                        <th>Carrier</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th className="text-end">Track Order</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center text-secondary py-4">
                            You have no orders yet. Once you place an order, it will appear here with tracking details.
                          </td>
                        </tr>
                      ) : orders.map((o) => (
                        <tr key={o.id}>
                          <td className="fw-bold text-warning">{o.order_number}</td>
                          <td className="text-dark">
                            <div className="fw-semibold">{o.store_name}</div>
                            <div className="fs-8 text-secondary">{o.itemSummary || 'No items listed'}</div>
                          </td>
                          <td className="fs-8 text-secondary">{o.carrier || 'FedEx'}</td>
                          <td className="fw-bold">${o.total_amount}</td>
                          <td><span className="gold-badge-emerald">{o.status}</span></td>
                          <td className="text-end">
                            <button onClick={() => handleViewOrderDetails(o)} className="btn btn-sm btn-gold-primary fs-8 py-1 px-2">
                              <Truck size={14} className="me-1" /> View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="d-flex flex-column gap-3">
              <div className="d-flex align-items-center justify-content-between">
                <h2 className="fs-4 font-bold text-dark mb-0">Saved Addresses</h2>
                <button onClick={() => setShowAddAddressModal(true)} className="btn btn-gold-primary btn-sm px-3 py-2">
                  <Plus size={16} className="me-1" /> Add New Address
                </button>
              </div>
              <div className="row g-3">
                {addresses.map((addr) => (
                  <div key={addr.id} className="col-12 col-md-6">
                    <div className="bg-white border rounded-4 shadow-sm  p-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="gold-badge-amber">{addr.type}</span>
                        {addr.isDefault && <span className="gold-badge-emerald">Default</span>}
                      </div>
                      <div className="fw-bold text-dark mb-1">{addr.label || addr.type}</div>
                      <p className="fs-8 text-secondary mb-2">{addr.address}</p>
                      <div className="fs-8 text-secondary mb-3">Phone: {addr.phone}</div>
                      <button onClick={() => setAddresses(addresses.filter(a => a.id !== addr.id))} className="btn btn-sm btn-outline-danger fs-8">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: COUPONS */}
          {activeTab === 'coupons' && (
            <div className="d-flex flex-column gap-3">
              <h2 className="fs-4 font-bold text-dark mb-0">Coupons & Rewards</h2>
              <div className="row g-3">
                {[
                  { code: 'AUREUMGOLD20', desc: 'Get 20% off on luxury watches & jewelry', expiry: 'Expires Jul 31' },
                  { code: 'FREESHIP100', desc: 'Free express shipping on orders over $100', expiry: 'Expires Aug 15' },
                ].map((c, i) => (
                  <div key={i} className="col-12 col-md-6">
                    <div className="bg-white border rounded-4 shadow-sm  p-3 border-dashed">
                      <div className="d-flex justify-between align-items-center mb-2">
                        <span className="fs-5 font-bold text-warning font-mono">{c.code}</span>
                        <button onClick={() => alert(`Copied code ${c.code}`)} className="btn btn-sm btn-outline-warning fs-8"><Copy size={12} className="me-1" /> Copy</button>
                      </div>
                      <p className="fs-8 text-secondary mb-1">{c.desc}</p>
                      <div className="fs-9 text-secondary">{c.expiry}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: SUPPORT & SETTINGS */}
          {(activeTab === 'settings' || activeTab === 'profile' || activeTab === 'support') && (
            <div className="d-flex flex-column gap-3">
              <h2 className="fs-4 font-bold text-dark mb-0">Account Profile & Settings</h2>
              {savedNotification && <div className="alert alert-success bg-light text-success border-success fs-7">Profile updated successfully!</div>}
              <div className="bg-white border rounded-4 shadow-sm  col-12 col-md-6">
                <form onSubmit={handleProfileSubmit} className="d-flex flex-column gap-3 fs-7">
                  <div>
                    <label className="text-secondary mb-1 fs-8">Full Name</label>
                    <input value={profileData.name} onChange={(e) => setProfileData({ ...profileData, name: e.target.value })} className="form-control" />
                  </div>
                  <div>
                    <label className="text-secondary mb-1 fs-8">Email Address</label>
                    <input value={profileData.email} onChange={(e) => setProfileData({ ...profileData, email: e.target.value })} className="form-control" />
                  </div>
                  <div>
                    <label className="text-secondary mb-1 fs-8">Phone Number</label>
                    <input value={profileData.phone} onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })} className="form-control" />
                  </div>
                  <button type="submit" className="btn btn-gold-primary py-2 mt-2">Save Profile Updates</button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 9: STORE DETAILS - REGISTERED STORES DIRECTORY */}
          {activeTab === 'store details' && (
            <div className="d-flex flex-column gap-4">
              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                <div>
                  <div className="gold-badge-amber mb-1 d-inline-flex align-items-center gap-1">
                    <Store size={13} /> REGISTERED PLATFORM STORES
                  </div>
                  <h2 className="fs-4 font-bold text-dark mb-0">Explore Merchant Stores</h2>
                  <p className="fs-8 text-secondary mb-0">Browse all verified merchant stores operating on the Aureum platform</p>
                </div>

                <div className="input-group" style={{ maxWidth: 300 }}>
                  <span className="input-group-text bg-light border-light text-secondary"><Search size={14} /></span>
                  <input
                    value={storeSearchQuery}
                    onChange={(e) => setStoreSearchQuery(e.target.value)}
                    placeholder="Search by store name or category..."
                    className="form-control form-control-sm bg-light text-dark border-light fs-8"
                  />
                </div>
              </div>

              {/* Stores Grid */}
              <div className="row g-3">
                {storesList.filter(s => 
                  s.name.toLowerCase().includes(storeSearchQuery.toLowerCase()) || 
                  s.category.toLowerCase().includes(storeSearchQuery.toLowerCase()) ||
                  (s.description && s.description.toLowerCase().includes(storeSearchQuery.toLowerCase()))
                ).map((s) => (
                  <div key={s.id} className="col-12 col-md-6 col-lg-6">
                    <div className="bg-white border rounded-4 shadow-sm  p-4 d-flex flex-column justify-between h-100">
                      <div>
                        <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
                          <div className="d-flex align-items-center gap-3">
                            <div
                              className="w-12 h-12 rounded-3 d-flex align-items-center justify-content-center fs-5 font-bold flex-shrink-0"
                              style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`, color: "#050505" }}
                            >
                              {s.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="fs-5 font-bold text-dark mb-0">{s.name}</h3>
                              <span className="fs-8 text-warning font-mono">https://{s.subdomain}.storemanager.app</span>
                            </div>
                          </div>
                          <span className="gold-badge-emerald">🟢 {s.status || "Active"}</span>
                        </div>

                        <p className="fs-8 text-secondary mb-3" style={{ lineHeight: 1.5 }}>
                          {s.description}
                        </p>

                        <div className="row g-2 p-2 rounded-3 mb-3" style={{ background: "#0e0d0b", border: "1px solid rgba(212,175,55,0.15)" }}>
                          <div className="col-6">
                            <span className="fs-8 text-secondary d-block">Category</span>
                            <span className="fs-8 fw-semibold text-dark">{s.category}</span>
                          </div>
                          <div className="col-6">
                            <span className="fs-8 text-secondary d-block">Merchant Owner</span>
                            <span className="fs-8 fw-semibold text-warning">{s.owner}</span>
                          </div>
                        </div>
                      </div>

                      <div className="d-flex align-items-center justify-content-between pt-2 border-top" style={{ borderColor: "rgba(212,175,55,0.15)" }}>
                        <div className="d-flex align-items-center gap-1 fs-8 text-secondary">
                          <Star size={13} className="text-warning fill-warning" />
                          <strong className="text-dark">{s.rating || 4.9}</strong> ({s.products_count || 18} Products)
                        </div>
                        <div className="d-flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedCategory(s.category === 'Fashion & Apparel' || s.category === 'Apparel & Fashion' ? 'Watches' : 'All');
                              setActiveTab('products');
                            }}
                            className="btn btn-sm btn-outline-warning fs-8 py-1 px-3"
                          >
                            View Items
                          </button>
                          <a
                            href={`https://${s.subdomain}.storemanager.app`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-sm btn-gold-primary fs-8 py-1 px-3 d-flex align-items-center gap-1 text-decoration-none"
                          >
                            Visit Storefront ➔
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* TRACKING MODAL */}
      {showTrackingModalOrder && (
        <div className="position-fixed top-0 bottom-0 start-0 end-0 bg-light bg-opacity-75 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1050 }}>
          <div className="bg-white border rounded-4 shadow-sm  w-100" style={{ maxWidth: 500 }}>
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2" style={{ borderColor: 'rgba(212,175,55,0.2)' }}>
              <h3 className="fs-6 font-bold text-warning mb-0">Order Details: {selectedOrderDetails?.order_number || showTrackingModalOrder.order_number}</h3>
              <button onClick={() => { setShowTrackingModalOrder(null); setSelectedOrderDetails(null); setOrderDetailsError(''); }} className="btn btn-sm text-secondary p-0">✕</button>
            </div>

            {orderDetailsLoading ? (
              <div className="py-5 text-center text-secondary">Loading order details…</div>
            ) : (
              <>
                {orderDetailsError && <div className="alert alert-warning mb-3 fs-8">{orderDetailsError}</div>}
                <div className="d-flex flex-column gap-3 mb-3 fs-8">
                  <div className="d-flex justify-between"><span className="text-secondary">Store:</span> <strong>{selectedOrderDetails?.store_name || showTrackingModalOrder.store_name || 'Unknown Store'}</strong></div>
                  <div className="d-flex justify-between"><span className="text-secondary">Carrier:</span> <strong>{selectedOrderDetails?.carrier || showTrackingModalOrder.carrier || 'FedEx Express'}</strong></div>
                  <div className="d-flex justify-between"><span className="text-secondary">Tracking Code:</span> <span className="font-mono text-warning">{selectedOrderDetails?.tracking || showTrackingModalOrder.tracking || 'TRK-982401'}</span></div>
                  <div className="d-flex justify-between"><span className="text-secondary">Status:</span> <span className="gold-badge-emerald">{selectedOrderDetails?.status || showTrackingModalOrder.status || 'Pending'}</span></div>
                  <div className="d-flex justify-between"><span className="text-secondary">Total Paid:</span> <strong>${(selectedOrderDetails?.total_amount ?? showTrackingModalOrder.total_amount ?? 0).toFixed(2)}</strong></div>
                </div>

                <div className="p-3 bg-light rounded border border-light mb-3">
                  <div className="fs-8 text-secondary mb-2">Order Summary</div>
                  <div className="d-flex justify-between"><span className="text-secondary">Items count</span> <strong>{selectedOrderDetails?.items_count ?? showTrackingModalOrder.items_count ?? 'N/A'}</strong></div>
                  <div className="d-flex justify-between"><span className="text-secondary">Placed on</span> <strong>{selectedOrderDetails?.created_at || showTrackingModalOrder.created_at || 'N/A'}</strong></div>
                  <div className="d-flex justify-between"><span className="text-secondary">Customer Email</span> <strong>{selectedOrderDetails?.customer_email || showTrackingModalOrder.customer_email || 'N/A'}</strong></div>
                  <div className="d-flex justify-between"><span className="text-secondary">Payment</span> <strong>{selectedOrderDetails?.payment_status || showTrackingModalOrder.payment_status || 'Completed'}</strong></div>
                  {(selectedOrderDetails?.itemsList || showTrackingModalOrder.itemsList || []).length > 0 && (
                    <div className="mt-3">
                      <div className="fs-8 text-secondary mb-2">Ordered Products</div>
                      <div className="d-flex flex-column gap-2">
                        {(selectedOrderDetails?.itemsList || showTrackingModalOrder.itemsList || []).map((item, index) => (
                          <div key={`${item.name}-${index}`} className="rounded border border-light px-2 py-2 text-xs text-dark">
                            <div className="fw-semibold">{item.name}</div>
                            <div className="text-secondary">Qty: {item.quantity || 1}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-center fs-8 text-secondary">
                  📦 Shipment in transit — Estimated delivery within 2 business days.
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ADD ADDRESS MODAL */}
      {showAddAddressModal && (
        <div className="position-fixed top-0 bottom-0 start-0 end-0 bg-light bg-opacity-75 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1050 }}>
          <div className="bg-white border rounded-4 shadow-sm  w-100" style={{ maxWidth: 400 }}>
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2" style={{ borderColor: 'rgba(212,175,55,0.2)' }}>
              <h3 className="fs-6 font-bold text-warning mb-0">Add Shipping Address</h3>
              <button onClick={() => setShowAddAddressModal(false)} className="btn btn-sm text-secondary p-0">✕</button>
            </div>
            <form onSubmit={handleAddAddressSubmit} className="d-flex flex-column gap-2 fs-7">
              <div>
                <label className="text-secondary mb-1 fs-8">Address Label</label>
                <input value={newAddress.label} onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })} className="form-control" placeholder="e.g. Vacation Home" />
              </div>
              <div>
                <label className="text-secondary mb-1 fs-8">Full Street Address *</label>
                <textarea required value={newAddress.address} onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })} className="form-control" rows={3} placeholder="Street, City, Zip Code" />
              </div>
              <button type="submit" className="btn btn-gold-primary w-100 mt-2 py-2">Save Address</button>
            </form>
          </div>
        </div>
      )}

      {/* QUICK VIEW STORE PRODUCT MODAL */}
      {showQuickViewProduct && (
        <div className="position-fixed top-0 bottom-0 start-0 end-0 bg-light bg-opacity-75 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1060 }}>
          <div className="bg-white border rounded-4 shadow-sm  w-100" style={{ maxWidth: 720 }}>
            {/* Modal Topbar */}
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2" style={{ borderColor: "rgba(212,175,55,0.2)" }}>
              <div className="d-flex align-items-center gap-2">
                <span className="gold-badge-amber d-flex align-items-center gap-1 fs-8 font-bold">
                  <Store size={13} /> {showQuickViewProduct.store_name || showQuickViewProduct.store?.name || "Coastal Threads Store"}
                </span>
                <span className="fs-8 text-secondary">Product SKU: PRD-{showQuickViewProduct.id}</span>
              </div>
              <button onClick={() => setShowQuickViewProduct(null)} className="btn btn-sm text-secondary p-0 border-0 bg-transparent fs-5">✕</button>
            </div>

            <div className="row g-4">
              {/* Product Media Column */}
              <div className="col-12 col-md-5 d-flex flex-column gap-2">
                <div className="position-relative rounded-3 overflow-hidden border" style={{ borderColor: "rgba(212,175,55,0.2)" }}>
                  <img
                    src={getProductImageUrl(showQuickViewProduct)}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = buildProductPlaceholderImage(showQuickViewProduct);
                    }}
                    alt={showQuickViewProduct.name}
                    className="w-100 object-cover"
                    style={{ height: 250 }}
                  />
                  <span className="position-absolute top-0 start-0 m-2 gold-badge-emerald fs-9 font-bold">
                    🟢 In Stock ({showQuickViewProduct.stock_quantity ?? 12} left)
                  </span>
                </div>
                
                {/* Rating & Guarantee Badges */}
                <div className="p-2 rounded-2 bg-light border border-light text-center">
                  <div className="d-flex align-items-center justify-content-center gap-1 text-warning fs-7 font-bold">
                    <Star size={14} className="fill-warning" />
                    <span>{showQuickViewProduct.rating || 4.9} / 5.0 Rating</span>
                  </div>
                  <span className="fs-9 text-secondary">Verified Customer Purchase Feedback</span>
                </div>
              </div>

              {/* Product & Store Specification Details Column */}
              <div className="col-12 col-md-7 d-flex flex-column justify-between">
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="fs-8 text-warning font-semibold tracking-wider text-uppercase">{showQuickViewProduct.category || "General"}</span>
                    <span className="fs-6 font-bold text-dark">${showQuickViewProduct.price}</span>
                  </div>
                  <h3 className="fs-4 font-bold text-dark mb-2">{showQuickViewProduct.name}</h3>

                  {/* Merchant Store Details Panel */}
                  <div className="p-3 rounded-3 mb-3" style={{ background: "#0e0d0b", border: "1px solid rgba(212,175,55,0.2)" }}>
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span className="fs-8 text-secondary d-flex align-items-center gap-1">
                        <Store size={13} style={{ color: GOLD }} /> Merchant Store:
                      </span>
                      <strong className="fs-8 text-warning">
                        {showQuickViewProduct.store_name || showQuickViewProduct.store?.name || "Coastal Threads Store"}
                      </strong>
                    </div>
                    <div className="fs-9 text-secondary font-mono text-truncate">
                      https://{(showQuickViewProduct.store_name || "coastal-threads").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.storemanager.app
                    </div>
                  </div>

                  {/* Product Description */}
                  <div className="mb-3">
                    <label className="fs-8 text-secondary d-block mb-1">Item Description & Craftsmanship</label>
                    <p className="fs-8 text-dark mb-0" style={{ lineHeight: 1.6 }}>
                      {showQuickViewProduct.description || "Premium quality product crafted with attention to detail, organic materials, and gold-standard durability."}
                    </p>
                  </div>

                  {/* Shipping & Delivery Guarantee */}
                  <div className="row g-2 pt-2 border-top" style={{ borderColor: "rgba(212,175,55,0.15)" }}>
                    <div className="col-6">
                      <div className="fs-9 text-secondary d-flex align-items-center gap-1">
                        <Truck size={12} className="text-warning" /> Free Express Delivery
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="fs-9 text-secondary d-flex align-items-center gap-1">
                        <ShieldCheck size={12} className="text-emerald-400" /> 256-Bit SSL Encrypted
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="d-flex gap-2 pt-3 border-top mt-3" style={{ borderColor: "rgba(212,175,55,0.15)" }}>
                  <button
                    onClick={() => {
                      addToCart?.(showQuickViewProduct, 1);
                      setShowQuickViewProduct(null);
                      setCartNotification('Added to cart');
                      setTimeout(() => setCartNotification(''), 2500);
                    }}
                    className="btn btn-gold-primary btn-sm flex-grow-1 py-2 font-bold d-flex align-items-center justify-content-center gap-1"
                  >
                    <ShoppingCart size={15} /> Add to Cart
                  </button>
                  <a
                    href={`https://${(showQuickViewProduct.store_name || "coastal-threads").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.storemanager.app`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline-warning btn-sm fs-8 py-2 px-3 d-flex align-items-center gap-1 text-decoration-none"
                  >
                    <ExternalLink size={13} /> Visit Store
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
