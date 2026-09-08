import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  LayoutDashboard, Package, ShoppingCart, Boxes, Users, Gift, Truck, BarChart3,
  Settings, Bell, Search, Sun, Moon, TrendingUp, TrendingDown, DollarSign,
  AlertTriangle, Menu, X, LogOut, Eye, Store as StoreIcon, Sparkles, Plus, Edit, Trash2,
  CheckCircle2, Clock, Tag, Percent, RefreshCw, ShieldCheck, Heart, Printer,
  PlusCircle, Edit3, Globe, Copy, ExternalLink, CreditCard
} from "lucide-react";
import ToastKartLogo from "../components/ToastKartLogo";

const GOLD = "#FF5722";
const GOLD_LIGHT = "#FF8A65";
const GOLD_DEEP = "#BF360C";

const initialStoresData = [
  {
    id: 1,
    user_id: 1,
    name: "Coastal Threads Store",
    slug: "coastal-threads",
    subdomain: "coastal-threads",
    category: "Fashion & Apparel",
    currency: "USD ($)",
    status: "Active",
    email: "support@coostalthreads.local",
    phone: "+1 (555) 234-5678",
    description: "Premium handcrafted organic textiles and luxury fashion apparel.",
    logo: "",
    banner: "",
    products_count: 24,
    orders_count: 142,
    total_revenue: "$18,420.00"
  },
  {
    id: 2,
    user_id: 1,
    name: "Aureum Boutique",
    slug: "aureum-boutique",
    subdomain: "aureum-boutique",
    category: "Jewelry & Luxury",
    currency: "USD ($)",
    status: "Active",
    email: "contact@aureumboutique.com",
    phone: "+1 (555) 987-6543",
    description: "Artisanal gold-plated jewelry and luxury lifestyle pieces.",
    logo: "",
    banner: "",
    products_count: 12,
    orders_count: 68,
    total_revenue: "$9,250.00"
  }
];

const ownerLinks = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "stores", label: "My Store", icon: StoreIcon },
  { key: "categories", label: "Collections", icon: Tag },
  { key: "products", label: "Products", icon: Package },
  { key: "orders", label: "Orders", icon: ShoppingCart },
  { key: "customers", label: "Customers", icon: Users },
  { key: "discounts", label: "Discounts", icon: Percent },
  { key: "payment", label: "Payment Gateway", icon: CreditCard },
  { key: "settings", label: "Settings", icon: Settings },
];

const salesTrendDaily = [
  { d: "Mon", v: 1200 }, { d: "Tue", v: 1900 }, { d: "Wed", v: 1500 }, { d: "Thu", v: 2400 },
  { d: "Fri", v: 2100 }, { d: "Sat", v: 3200 }, { d: "Sun", v: 2800 },
];

const salesTrendMonthly = [
  { d: "Jan", v: 12400 }, { d: "Feb", v: 14800 }, { d: "Mar", v: 16200 }, { d: "Apr", v: 18900 },
  { d: "May", v: 21500 }, { d: "Jun", v: 24800 }, { d: "Jul", v: 29400 },
];

const initialCategories = [
  { id: 1, name: "Apparel", slug: "apparel", description: "Luxury linen kurtas, organic silk scarves and artisan wear.", featured: true, products_count: 24 },
  { id: 2, name: "Home Decor", slug: "home-decor", description: "Handcrafted brass diya sets, clay vases and wall hangings.", featured: true, products_count: 18 },
  { id: 3, name: "Accessories", slug: "accessories", description: "Handwoven silk scarves, leather totes, and brass jewelry.", featured: false, products_count: 12 },
  { id: 4, name: "Textiles", slug: "textiles", description: "Traditional organic cushion covers and handloom throws.", featured: true, products_count: 15 },
  { id: 5, name: "Jewelry", slug: "jewelry", description: "Artisanal gold-plated necklaces and traditional earrings.", featured: false, products_count: 8 },
];

const initialProducts = [
  { id: 1, name: "Linen Kurta", sku: "LK-101", category: "Apparel", price: "$86.00", stock: 45, status: "In Stock", image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=150" },
  { id: 2, name: "Brass Diya Set", sku: "BD-204", category: "Home Decor", price: "$42.50", stock: 18, status: "In Stock", image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=150" },
  { id: 3, name: "Silk Scarf", sku: "SS-309", category: "Accessories", price: "$34.00", stock: 8, status: "Low Stock", image: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=150" },
  { id: 4, name: "Clay Vase", sku: "CV-412", category: "Home Decor", price: "$54.00", stock: 0, status: "Out of Stock", image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=150" },
  { id: 5, name: "Handwoven Cushion Cover", sku: "HC-502", category: "Textiles", price: "$28.00", stock: 62, status: "In Stock", image: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=150" },
];

const initialOrders = [
  { id: "#AU-3021", customer: "Rhea Kapoor", items: "Linen Kurta x1", total: "$86.00", status: "Shipped", date: "2026-07-25", pay: "Stripe" },
  { id: "#AU-3020", customer: "Naveen Rao", items: "Brass Diya Set x2", total: "$142.50", status: "Processing", date: "2026-07-25", pay: "Razorpay" },
  { id: "#AU-3019", customer: "Sana Malik", items: "Clay Vase x1", total: "$54.00", status: "Delivered", date: "2026-07-24", pay: "Card" },
  { id: "#AU-3018", customer: "Om Prakash", items: "Silk Scarf x3, Cushion x2", total: "$210.00", status: "Pending", date: "2026-07-24", pay: "COD" },
  { id: "#AU-3017", customer: "Ananya Roy", items: "Handwoven Cushion Cover x4", total: "$112.00", status: "Delivered", date: "2026-07-23", pay: "Stripe" },
];

const initialInventory = [
  { sku: "LK-101", name: "Linen Kurta", location: "Warehouse A1", stock: 45, reorder: 15, status: "Optimal" },
  { sku: "BD-204", name: "Brass Diya Set", location: "Warehouse A2", stock: 18, reorder: 20, status: "Reorder Soon" },
  { sku: "SS-309", name: "Silk Scarf", location: "Warehouse B1", stock: 8, reorder: 10, status: "Low Stock" },
  { sku: "CV-412", name: "Clay Vase", location: "Warehouse B3", stock: 0, reorder: 15, status: "Out of Stock" },
  { sku: "HC-502", name: "Handwoven Cushion", location: "Warehouse A1", stock: 62, reorder: 20, status: "Optimal" },
];

const initialCustomers = [
  {
    id: "CUST-101",
    name: "Rhea Kapoor",
    email: "rhea@example.com",
    phone: "+1 (555) 234-5678",
    orders: 14,
    spent: "$1,240.00",
    tier: "VIP",
    joined: "Jan 2026",
    orderedProducts: ["Linen Kurta x1", "Silk Scarf x2", "Handwoven Cushion Cover x1"],
    recentOrder: "#AU-3021"
  },
  {
    id: "CUST-102",
    name: "Naveen Rao",
    email: "naveen@example.com",
    phone: "+1 (555) 876-5432",
    orders: 6,
    spent: "$520.00",
    tier: "Regular",
    joined: "Mar 2026",
    orderedProducts: ["Brass Diya Set x2"],
    recentOrder: "#AU-3020"
  },
  {
    id: "CUST-103",
    name: "Sana Malik",
    email: "sana@example.com",
    phone: "+1 (555) 345-6789",
    orders: 9,
    spent: "$890.00",
    tier: "VIP",
    joined: "Feb 2026",
    orderedProducts: ["Clay Vase x1", "Silk Scarf x1"],
    recentOrder: "#AU-3019"
  },
  {
    id: "CUST-104",
    name: "Om Prakash",
    email: "om@example.com",
    phone: "+1 (555) 987-6543",
    orders: 2,
    spent: "$210.00",
    tier: "New",
    joined: "Jul 2026",
    orderedProducts: ["Silk Scarf x3", "Handwoven Cushion Cover x2"],
    recentOrder: "#AU-3018"
  },
  {
    id: "CUST-105",
    name: "Ananya Roy",
    email: "ananya@example.com",
    phone: "+1 (555) 456-7890",
    orders: 5,
    spent: "$450.00",
    tier: "Regular",
    joined: "Apr 2026",
    orderedProducts: ["Handwoven Cushion Cover x4"],
    recentOrder: "#AU-3017"
  }
];

const getFallbackImageByName = (name = "") => {
  const lower = String(name || "").toLowerCase();
  if (lower.includes("sneaker") || lower.includes("shoe") || lower.includes("kicks") || lower.includes("footwear")) {
    return "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=500";
  }
  if (lower.includes("watch") || lower.includes("chronograph") || lower.includes("luxury")) {
    return "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500";
  }
  if (lower.includes("tote") || lower.includes("bag") || lower.includes("leather")) {
    return "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500";
  }
  if (lower.includes("earbud") || lower.includes("headphone") || lower.includes("audio") || lower.includes("tech") || lower.includes("wireless")) {
    return "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500";
  }
  if (lower.includes("vase") || lower.includes("decor") || lower.includes("ceramic") || lower.includes("home")) {
    return "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=500";
  }
  if (lower.includes("kurta") || lower.includes("apparel") || lower.includes("shirt") || lower.includes("dress") || lower.includes("cloth")) {
    return "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500";
  }
  return "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500";
};

const normalizeProductImage = (rawUrl, productName = "") => {
  if (!rawUrl || typeof rawUrl !== "string") {
    return getFallbackImageByName(productName);
  }
  const cleanUrl = rawUrl.trim();
  if (cleanUrl.includes("source.unsplash.com") || cleanUrl.includes("unsplash.com/?")) {
    return getFallbackImageByName(productName || cleanUrl);
  }
  return cleanUrl;
};

const emptyProductForm = { name: "", sku: "", price: "", compare_price: "", discount_percentage: "", category: "Apparel", stock: "", image: "", images: [], color: "", size: "" };

export default function StoreOwnerDashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chartFilter, setChartFilter] = useState("daily");
  const currentUserId = user?.id || parseInt(localStorage.getItem('toastkart_last_user_id')) || null;
  const currentOwnerEmail = String(user?.email || "").trim().toLowerCase();

  const matchesOwnerScope = (item, ownerId = currentUserId, ownerEmail = currentOwnerEmail, storeId = activeStore?.id) => {
    const itemUserId = item?.user_id || item?.owner_id || item?.ownerId || null;
    const itemOwnerEmail = String(item?.owner_email || item?.user_email || item?.email || "").trim().toLowerCase();
    const matchesUser = !ownerId || !itemUserId || String(itemUserId) === String(ownerId);
    const matchesEmail = !ownerEmail || !itemOwnerEmail || itemOwnerEmail === ownerEmail;

    const itemStoreId = item?.store_id ?? item?.store?.id ?? null;
    const activeStoreName = String(activeStore?.name || "").trim().toLowerCase();
    const activeStoreSlug = String(activeStore?.slug || activeStore?.subdomain || "").trim().toLowerCase();
    const itemStoreName = String(item?.store_name || item?.store?.name || "").trim().toLowerCase();
    const itemStoreSlug = String(item?.store_slug || item?.store?.slug || item?.store?.subdomain || "").trim().toLowerCase();

    const matchesStoreById = Boolean(storeId && itemStoreId && String(itemStoreId) === String(storeId));
    const matchesStoreByName = Boolean(activeStoreName && itemStoreName && (
      activeStoreName === itemStoreName ||
      activeStoreName.includes(itemStoreName) ||
      itemStoreName.includes(activeStoreName)
    ));
    const matchesStoreBySlug = Boolean(activeStoreSlug && itemStoreSlug && (
      activeStoreSlug === itemStoreSlug ||
      activeStoreSlug.includes(itemStoreSlug) ||
      itemStoreSlug.includes(activeStoreSlug)
    ));
    
    // Strict fallback: if we have a specific storeId we're looking for, the item MUST match by ID, Name, or Slug.
    // We no longer blindly accept items with missing store info if we are scoping to a specific store.
    const matchesStore = storeId 
      ? (matchesStoreById || matchesStoreByName || matchesStoreBySlug)
      : (!itemStoreId && !itemStoreName && !itemStoreSlug);

    return (matchesUser || matchesEmail) && matchesStore;
  };

  // State Collections
  const [customersList, setCustomersList] = useState([]);

  useEffect(() => {
    localStorage.setItem("aureum_owner_customers", JSON.stringify(customersList));
  }, [customersList]);

  const [productsList, setProductsList] = useState([]);

  const [ordersList, setOrdersList] = useState(() => {
    const saved = localStorage.getItem("aureum_owner_orders");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) { }
    }
    return [];
  });

  const [categoriesList, setCategoriesList] = useState([]);

  const [storesList, setStoresList] = useState(() => {
    const saved = localStorage.getItem("aureum_owner_stores");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) { }
    }
    return [];
  });

  const persistOwnerStores = (stores) => {
    try {
      const saved = localStorage.getItem("aureum_owner_stores");
      const existing = saved ? JSON.parse(saved) : [];
      const preserved = Array.isArray(existing)
        ? existing.filter((store) => String(store.user_id) !== String(currentUserId))
        : [];
      const storesToPersist = Array.isArray(stores)
        ? stores.filter((store) => String(store.user_id) === String(currentUserId))
        : [];
      localStorage.setItem("aureum_owner_stores", JSON.stringify([...preserved, ...storesToPersist]));
    } catch (e) {
      console.debug("Failed to persist owner stores", e);
      localStorage.setItem("aureum_owner_stores", JSON.stringify(stores));
    }
  };

  useEffect(() => {
    persistOwnerStores(storesList);
  }, [storesList]);


  const loadPersistedOwnerStores = () => {
    try {
      const saved = localStorage.getItem("aureum_owner_stores");
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((store) => String(store.user_id) === String(currentUserId) || (!store.user_id && currentUserId === 1));
    } catch (e) {
      return [];
    }
  };

  const mergeOwnerStores = (backendStores, localStores) => {
    const merged = [...(Array.isArray(backendStores) ? backendStores : [])];
    (Array.isArray(localStores) ? localStores : []).forEach((localStore) => {
      // If a local store has a timestamp ID but matches by name/slug to a backend store, we just discard the local one
      // because the backend one is the source of truth and contains the real ID.
      const matchedBackendStore = merged.find((store) =>
        String(store.slug) === String(localStore.slug) ||
        String(store.subdomain) === String(localStore.subdomain) ||
        String(store.name) === String(localStore.name)
      );
      
      const exactIdMatch = merged.some(store => String(store.id) === String(localStore.id));

      // Only push the localStore if it doesn't match ANY backend store by ID, Name, Slug, or Subdomain
      if (!exactIdMatch && !matchedBackendStore) {
        merged.push(localStore);
      } else if (matchedBackendStore && String(localStore.id) !== String(matchedBackendStore.id)) {
        // We found a match by name but the ID is different (likely localStore has a timestamp).
        // Let's ensure selectedStoreId updates to the real ID if it was pointing to the timestamp.
        if (String(selectedStoreId) === String(localStore.id)) {
           setSelectedStoreId(matchedBackendStore.id);
           localStorage.setItem('toastkart_active_store_id', String(matchedBackendStore.id));
        }
      }
    });
    return merged;
  };

  const [inventoryList, setInventoryList] = useState(() => {
    const saved = localStorage.getItem("aureum_owner_inventory");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) { }
    }
    return initialInventory;
  });

  const [selectedStoreId, setSelectedStoreId] = useState(() => {
    const saved = localStorage.getItem("aureum_owner_stores");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((s) => s.user_id === currentUserId || (!s.user_id && currentUserId === 1));
          if (filtered.length > 0) return filtered[0].id;
        }
      } catch (e) { }
    }
    return null;
  });

  const isOwner = user?.role === 'owner';
  const ownerStores = useMemo(() => {
    const filtered = storesList.filter((s) => s.user_id === currentUserId || (!s.user_id && currentUserId === 1));
    if (filtered.length > 0) return filtered;

 const fallbackStore = {
  id: user?.stores?.[0]?.id || currentUserId || 0,
  user_id: user?.id || currentUserId || 0,
  name: user?.stores?.[0]?.name || `${user?.name || 'Owner'} Store`,
  slug: user?.stores?.[0]?.slug || 'owner-store',
  subdomain: user?.stores?.[0]?.subdomain || 'owner-store',
  category: user?.stores?.[0]?.category || 'General Merchandise',
  currency: user?.stores?.[0]?.currency || 'USD',
  status: user?.stores?.[0]?.status || 'Active',
  email: user?.email || '',
  phone: '',
  description: user?.stores?.[0]?.description || '',
  logo: user?.stores?.[0]?.logo || '',
  banner: '',
  products_count: 0,
  orders_count: 0,
  total_revenue: '$0.00'
};
    return [fallbackStore];
  }, [storesList, currentUserId, user]);

  const activeStore = ownerStores.find((s) => String(s.id) === String(selectedStoreId)) || ownerStores[0];
  const currencySymbol = activeStore?.currency ? (activeStore.currency.match(/\((.*?)\)/)?.[1] || '$') : '$';

  const hasRealStore = useMemo(() => {
    return storesList.some((s) => s.user_id === currentUserId || (!s.user_id && currentUserId === 1));
  }, [storesList, currentUserId]);

  const ownerMeta = useMemo(() => ({
    user_id: currentUserId ?? null,
    owner_id: currentUserId ?? null,
    owner_name: user?.name || user?.owner_name || "Owner",
    owner_email: currentOwnerEmail || user?.email || "",
    owner_role: user?.role || "owner",
    store_id: activeStore?.id ?? null,
    store_name: activeStore?.name || user?.stores?.[0]?.name || "Owner Store",
    store_slug: activeStore?.slug || user?.stores?.[0]?.slug || activeStore?.subdomain || "owner-store",
    store_subdomain: activeStore?.subdomain || user?.stores?.[0]?.subdomain || activeStore?.slug || "owner-store",
  }), [currentUserId, currentOwnerEmail, user?.name, user?.owner_name, user?.email, user?.role, user?.stores, activeStore?.id, activeStore?.name, activeStore?.slug, activeStore?.subdomain]);

  useEffect(() => {
    const savedProducts = localStorage.getItem("aureum_owner_products");
    if (!savedProducts) {
      setProductsList([]);
      return;
    }

    try {
      const parsed = JSON.parse(savedProducts);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter((item) => matchesOwnerScope(item)).map((item) => ({
          ...item,
          ...ownerMeta,
          user_id: item.user_id ?? ownerMeta.user_id ?? currentUserId,
          owner_id: item.owner_id ?? ownerMeta.owner_id ?? currentUserId,
          owner_name: item.owner_name || ownerMeta.owner_name || "Owner",
          owner_email: item.owner_email || ownerMeta.owner_email || currentOwnerEmail,
          owner_role: item.owner_role || ownerMeta.owner_role || "owner",
          store_id: item.store_id ?? ownerMeta.store_id ?? activeStore?.id ?? null,
          store_name: item.store_name || ownerMeta.store_name || activeStore?.name || "Owner Store",
          store_slug: item.store_slug || ownerMeta.store_slug || activeStore?.slug || "owner-store",
          store_subdomain: item.store_subdomain || ownerMeta.store_subdomain || activeStore?.subdomain || "owner-store",
        }));
        if (filtered.length > 0) {
          setProductsList(filtered);
        } else {
          setProductsList([]);
        }
      }
    } catch (e) {
      console.debug("Failed to restore scoped owner products", e);
      setProductsList([]);
    }
  }, [currentUserId, currentOwnerEmail, activeStore?.id, ownerMeta]);

  useEffect(() => {
    const savedCategories = localStorage.getItem("aureum_owner_categories");
    if (!savedCategories) {
      setCategoriesList([]);
      return;
    }

    try {
      const parsed = JSON.parse(savedCategories);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter((item) => matchesOwnerScope(item));
        if (filtered.length > 0) {
          setCategoriesList(filtered);
        } else {
          setCategoriesList([]);
        }
      }
    } catch (e) {
      console.debug("Failed to restore scoped owner categories", e);
      setCategoriesList([]);
    }
  }, [currentUserId, currentOwnerEmail, activeStore?.id]);

  useEffect(() => {
    persistOwnerStores(storesList);
  }, [storesList, currentUserId]);

  // Keep toastkart_active_store_id in sync so axios interceptor sends X-Store-Id header
  useEffect(() => {
    if (activeStore?.id) {
      localStorage.setItem('toastkart_active_store_id', String(activeStore.id));
    }
  }, [activeStore?.id]);

  useEffect(() => {
    const saved = localStorage.getItem("aureum_owner_products");
    let all = [];
    if (saved) {
      try { all = JSON.parse(saved); } catch (e) { }
    }
    const outOfScope = all.filter(item => !matchesOwnerScope(item));
    const scopedProducts = productsList.filter((item) => matchesOwnerScope(item));
    try {
      localStorage.setItem("aureum_owner_products", JSON.stringify([...outOfScope, ...scopedProducts]));
    } catch (e) {
      console.warn("Could not save products to localStorage", e);
    }
  }, [productsList, currentUserId, currentOwnerEmail, activeStore?.id]);

  useEffect(() => {
    try {
      localStorage.setItem("aureum_owner_orders", JSON.stringify(ordersList));
    } catch (e) {
      console.warn("Could not save orders to localStorage", e);
    }
  }, [ordersList]);

  useEffect(() => {
    const loadBackendStores = async () => {
      try {
        // Use user_id query param so backend filters directly — more reliable than client-side filtering
        const response = await api.get(`/stores?user_id=${currentUserId}`);
        if (Array.isArray(response.data) && response.data.length > 0) {
          const persisted = loadPersistedOwnerStores();
          const merged = mergeOwnerStores(response.data, persisted);
          if (merged.length > 0) {
            setStoresList(merged);
            if (!selectedStoreId) {
              setSelectedStoreId(merged[0].id);
              // Persist the real DB store id for axios interceptor
              localStorage.setItem('toastkart_active_store_id', String(merged[0].id));
            }
          }
        }
      } catch (err) {
        console.debug("Failed to load backend stores", err);
      }
    };

    if (currentUserId) {
      loadBackendStores();
    }
  }, [currentUserId, selectedStoreId]);


  useEffect(() => {
    localStorage.setItem("aureum_owner_inventory", JSON.stringify(inventoryList));
  }, [inventoryList]);

  useEffect(() => {
    const loadStoreProducts = async () => {
      if (!activeStore?.id) return;
      try {
        // Use store_id query param for precise server-side filtering
        const response = await api.get(`/products?store_id=${activeStore.id}`);
        // API already filters by store_id — map all returned products
        const productsPayload = Array.isArray(response.data) ? response.data : [];

        if (productsPayload.length > 0) {
          setProductsList(productsPayload.map((p) => ({
            id: p.id,
            backend_id: p.id,
            store_id: p.store_id ?? activeStore?.id ?? null,
            store_name: p.store?.name || activeStore?.name || "Owner Store",
            store_slug: p.store?.slug || activeStore?.slug || "owner-store",
            store_subdomain: p.store?.subdomain || activeStore?.subdomain || "owner-store",
            user_id: p.user_id ?? currentUserId,
            owner_id: p.user_id ?? currentUserId,
            owner_name: ownerMeta.owner_name || "Owner",
            owner_email: ownerMeta.owner_email || currentOwnerEmail,
            owner_role: ownerMeta.owner_role || "owner",
            name: p.name,
            sku: p.sku || `SKU-${Math.floor(Math.random() * 900 + 100)}`,
            category: p.category?.name || p.category || "Uncategorized",
            price: typeof p.price === "number" ? `${currencySymbol}${p.price.toFixed(2)}` : p.price,
            compare_price: typeof p.compare_price === "number" ? `${currencySymbol}${p.compare_price.toFixed(2)}` : p.compare_price,
            stock: p.stock_quantity ?? 0,
            status: p.status || (p.stock_quantity > 0 ? "In Stock" : "Out of Stock"),
            image: p.image || getFallbackImageByName(p.name),
            color: p.color || null,
            size: p.size || null
          })));
        } else {
          setProductsList([]);
        }
      } catch (err) {
        console.debug("Failed to load store products from backend, keeping local data", err);
      }
    };

    loadStoreProducts();
  }, [activeStore?.id, currentUserId, currentOwnerEmail, ownerMeta]);

  // Load orders from backend
  useEffect(() => {
    if (!activeStore?.id) return;
    const loadStoreOrders = async () => {
      try {
        const res = await api.get(`/orders?store_id=${activeStore.id}`);
        if (Array.isArray(res.data) && res.data.length > 0) {
          const backendOrders = res.data.map(o => ({
            id: o.id,
            store_id: o.store_id,
            order_number: o.order_number || o.id,
            customer: o.customer_name || 'Customer',
            email: o.customer_email || '',
            total: typeof o.total_amount === 'number' ? `$${o.total_amount.toFixed(2)}` : o.total_amount,
            status: o.status || 'Pending',
            pay: o.payment_status || 'Paid',
            date: o.created_at || new Date().toISOString(),
            items: o.items || []
          }));
          setOrdersList(backendOrders);
        } else {
          setOrdersList([]);
        }
      } catch (err) {
        console.debug("Failed to load store orders from backend", err);
      }
    };
    loadStoreOrders();
  }, [activeStore?.id]);

  // Filter out dummy example orders and ensure we only show orders for the ACTIVE store
  const realOrders = React.useMemo(() => {
    const dummyNames = ["Rhea Kapoor", "Naveen Rao", "Sana Malik", "Om Prakash", "Ananya Roy"];
    if (!activeStore?.id) return [];
    
    return ordersList.filter(o => 
      !dummyNames.includes(o.customer) && 
      String(o.store_id) === String(activeStore.id)
    );
  }, [ordersList, activeStore]);

  // Derive customers ONLY from this store's orders — never show customers from other stores
  const derivedCustomers = React.useMemo(() => {
    // If backend returned scoped customers, use them directly
    if (customersList && customersList.length > 0) {
      return customersList;
    }
    // Fallback: build from real orders that belong to this store
    const storeId = activeStore?.id;
    const map = {};
    realOrders
      .filter(o => {
        const orderStoreId = o.store_id || o.storeId;
        // Include if order has matching store_id, or if no store_id (single-store fallback)
        return !orderStoreId || String(orderStoreId) === String(storeId);
      })
      .forEach(o => {
        const name = o.customer || o.customer_name || "Customer";
        const email = o.email || o.customer_email || `${name.toLowerCase().replace(/\s+/g, ".")}@customer.local`;
        const key = email;
        if (!map[key]) {
          map[key] = {
            id: `CUST-${Object.keys(map).length + 1}`,
            name,
            email,
            phone: o.customer_phone || "N/A",
            orders: 0,
            spentNum: 0,
            orderedProducts: [],
            recentOrder: o.id,
            tier: "New"
          };
        }
        map[key].orders += 1;
        const numVal = parseFloat(String(o.total || o.total_amount || "").replace(/[^0-9.]/g, "")) || 0;
        map[key].spentNum += numVal;
        if (o.items && !map[key].orderedProducts.includes(o.items)) {
          map[key].orderedProducts.push(o.items);
        }
      });

    return Object.values(map).map(c => ({
      ...c,
      spent: `$${c.spentNum.toFixed(2)}`,
      tier: c.orders >= 3 || c.spentNum > 300 ? "VIP" : c.orders > 1 ? "Regular" : "New"
    }));
  }, [realOrders, customersList, activeStore?.id]);

  // Modals
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [invoiceModalOrder, setInvoiceModalOrder] = useState(null);
  const [selectedCustomerModal, setSelectedCustomerModal] = useState(null);

    // Inline Empty State Forms
  const [showInlineCategoryForm, setShowInlineCategoryForm] = useState(false);
  const [showInlineProductForm, setShowInlineProductForm] = useState(false);
  // Store Modals State & Forms
  const [showCreateStoreModal, setShowCreateStoreModal] = useState(false);
  const [showEditStoreModal, setShowEditStoreModal] = useState(false);
  const [showDeleteStoreModal, setShowDeleteStoreModal] = useState(false);
  const [storeForm, setStoreForm] = useState({
    name: "",
    subdomain: "",
    category: "Fashion & Apparel",
    currency: "USD ($)",
    email: "",
    phone: "",
    description: "",
    status: "Active"
  });

  // Category State & Modals
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "", featured: false });
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [categoryToast, setCategoryToast] = useState("");
  const [deletingCategory, setDeletingCategory] = useState(null);

  // Forms
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProd, setNewProd] = useState(emptyProductForm);
  const [storeSettings, setStoreSettings] = useState({
    name: "My Merchant Store",
    email: "support@mybrand.local",
    currency: "USD ($)",
    shippingFee: "$10.00",
    seoDescription: "Multi-vendor store workspace on ToastKart platform.",
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Store CRUD Handlers
  const openCreateStoreModal = () => {
    setStoreForm({
      name: "",
      subdomain: "",
      category: "Fashion & Apparel",
      currency: "USD ($)",
      email: "support@mybrand.com",
      phone: "+1 (555) 000-0000",
      description: "",
      status: "Active"
    });
    setShowCreateStoreModal(true);
  };

  const handleCreateStoreSubmit = async (e) => {
    e.preventDefault();
    if (!storeForm.name.trim()) return;

    const subdomain = storeForm.subdomain.trim() || storeForm.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // Start with a local placeholder (will be replaced by real DB id on success)
    const localPlaceholder = {
      id: Date.now(),
      user_id: currentUserId,
      name: storeForm.name.trim(),
      slug: subdomain,
      subdomain,
      category: storeForm.category,
      currency: storeForm.currency,
      status: storeForm.status,
      email: storeForm.email.trim(),
      phone: storeForm.phone.trim(),
      description: storeForm.description.trim(),
      logo: "",
      banner: "",
      products_count: 0,
      orders_count: 0,
      total_revenue: "$0.00",
      _unsynced: true,
    };

    let createdStore = localPlaceholder;
    let savedToDb = false;

    try {
      const res = await api.post('/stores', {
        name: localPlaceholder.name,
        slug: localPlaceholder.slug,
        subdomain: localPlaceholder.subdomain,
        category: storeForm.category,
        currency: storeForm.currency,
        description: localPlaceholder.description,
        owner_name: user?.name || user?.owner_name || '',
        user_id: currentUserId,
      });

      if (res?.data?.id) {
        // ✅ Use the real MySQL id — this ensures categories/products can link correctly
        createdStore = {
          ...localPlaceholder,
          id: res.data.id,
          slug: res.data.slug || localPlaceholder.slug,
          subdomain: res.data.subdomain || res.data.slug || localPlaceholder.subdomain,
          name: res.data.name || localPlaceholder.name,
          email: res.data.email || localPlaceholder.email,
          owner_name: res.data.owner_name || localPlaceholder.owner_name,
          user_id: res.data.user_id || currentUserId,
          _unsynced: false,
        };
        // Persist real store id so axios interceptor sends correct X-Store-Id
        localStorage.setItem('toastkart_active_store_id', String(res.data.id));
        savedToDb = true;
      }
    } catch (err) {
      console.error("Backend store creation failed:", err?.response?.data || err.message);
      showToast(`Store saved locally — will sync when backend is available.`);
    }

    setStoresList(prev => [createdStore, ...prev]);
    setSelectedStoreId(createdStore.id);
    setStoreSettings(prev => ({ ...prev, name: createdStore.name, email: createdStore.email }));

    const label = savedToDb ? `Store "${createdStore.name}" created! (ID #${createdStore.id})` : `Store "${createdStore.name}" created locally.`;
    showToast(label);
    setShowCreateStoreModal(false);
  };

  const openEditStoreModal = () => {
    if (!activeStore) return;
    setStoreForm({
      name: activeStore.name || "",
      subdomain: activeStore.subdomain || activeStore.slug || "",
      category: activeStore.category || "Fashion & Apparel",
      currency: activeStore.currency || "USD ($)",
      email: activeStore.email || "",
      phone: activeStore.phone || "",
      description: activeStore.description || "",
      status: activeStore.status || "Active"
    });
    setShowEditStoreModal(true);
  };

  const handleEditStoreSubmit = async (e) => {
    e.preventDefault();
    if (!activeStore || !storeForm.name.trim()) return;

    const updatedData = {
      name: storeForm.name.trim(),
      subdomain: storeForm.subdomain.trim() || storeForm.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      category: storeForm.category,
      currency: storeForm.currency,
      email: storeForm.email.trim(),
      phone: storeForm.phone.trim(),
      description: storeForm.description.trim(),
      status: storeForm.status
    };

    try {
      await api.put(`/stores/${activeStore.id}`, updatedData);
    } catch (err) {
      console.debug("Backend API update store fallback to local state", err);
    }

    setStoresList(prev => prev.map(s => s.id === activeStore.id ? { ...s, ...updatedData } : s));
    setStoreSettings(prev => ({ ...prev, name: updatedData.name, email: updatedData.email }));
    showToast(`Store details for "${updatedData.name}" updated successfully!`);
    setShowEditStoreModal(false);
  };

  const handleDeleteStoreExecute = async () => {
    if (!activeStore) return;
    const storeId = activeStore.id;
    const storeName = activeStore.name;

    try {
      await api.delete(`/stores/${storeId}`);
    } catch (err) {
      console.debug("Backend API delete store fallback to local state", err);
    }

    const remaining = storesList.filter(s => s.id !== storeId);
    setStoresList(remaining);

    if (remaining.length > 0) {
      setSelectedStoreId(remaining[0].id);
      setStoreSettings(prev => ({ ...prev, name: remaining[0].name, email: remaining[0].email }));
    } else {
      setSelectedStoreId(null);
    }

    showToast(`Store "${storeName}" deleted.`);
    setShowDeleteStoreModal(false);
  };

  // Fetch Categories and Customers from API on mount
  useEffect(() => {
    const fetchCategories = async () => {
      if (!activeStore?.id) return;
      try {
        // Use store_id query param for server-side filtering
        const res = await api.get(`/categories?store_id=${activeStore.id}`);
        if (res.data && Array.isArray(res.data)) {
          // Map backend data and preserve local meta for scoping
          setCategoriesList(res.data.map((category) => ({
            ...category,
            user_id: currentUserId,
            owner_email: currentOwnerEmail,
            store_id: category.store_id ?? activeStore?.id ?? null,
          })));
        } else {
          setCategoriesList([]);
        }
      } catch (err) {
        console.debug("API categories unavailable, keeping local categories", err);
      }
    };

    const fetchCustomers = async () => {
      if (!activeStore?.id) return;
      try {
        const res = await api.get(`/customers?store_id=${activeStore.id}`);
        if (res.data && Array.isArray(res.data)) {
          const mapped = res.data.map(c => ({
            id: `CUST-${c.id}`,
            name: c.name,
            email: c.email,
            phone: c.phone || "N/A",
            orders: c.total_orders || 0,
            spent: `$${Number(c.total_spent || 0).toFixed(2)}`,
            tier: (c.total_orders || 0) > 5 ? "VIP" : (c.total_orders || 0) > 1 ? "Regular" : "New",
            joined: c.created_at ? new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "2026",
            orderedProducts: ["Ordered from " + (activeStore?.name || "this store")],
            recentOrder: "N/A"
          }));
          setCustomersList(mapped);
        }
      } catch (err) {
        console.debug("API customers unavailable, deriving from orders", err);
      }
    };

    fetchCategories();
    fetchCustomers();
  }, [activeStore?.id, currentUserId]);

  const showToast = (msg) => {
    setCategoryToast(msg);
    setTimeout(() => setCategoryToast(""), 3500);
  };

  const handleLogout = () => {
    navigate("/login");
  };

  // Category CRUD Handlers
  const openAddCategoryModal = () => {
    setEditingCategory(null);
    setCategoryForm({ name: "", description: "", featured: false });
    setShowCategoryModal(true);
  };

  const openEditCategoryModal = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name || "",
      description: cat.description || "",
      featured: Boolean(cat.featured)
    });
    setShowCategoryModal(true);
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
    setCategoryForm({ name: "", description: "", featured: false });
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;

    const slug = categoryForm.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    // Build payload — include subdomain/name so backend can resolve store even if store_id is a local timestamp
    const payload = {
      name: categoryForm.name.trim(),
      description: categoryForm.description.trim(),
      featured: categoryForm.featured,
      slug,
      store_id: activeStore?.id ?? null,
      store_subdomain: activeStore?.subdomain || activeStore?.slug || null,
      store_name: activeStore?.name || null,
      user_id: currentUserId,
    };

    if (editingCategory) {
      let updatedData = { ...editingCategory, ...payload };
      try {
        const res = await api.put(`/categories/${editingCategory.id}`, payload);
        if (res.data) {
          updatedData = {
            ...editingCategory,
            ...res.data,
            // keep local meta so scoping filters work
            user_id: currentUserId,
            owner_email: currentOwnerEmail,
            store_id: res.data.store_id ?? editingCategory.store_id ?? activeStore?.id ?? null,
          };
        }
      } catch (err) {
        console.error("Backend API update category failed:", err?.response?.data || err.message);
      }

      setCategoriesList(prev => {
        const newList = prev.map(c => c.id === editingCategory.id ? updatedData : c);
        const saved = localStorage.getItem("aureum_owner_categories");
        const outOfScope = saved ? JSON.parse(saved).filter((item) => !matchesOwnerScope(item)) : [];
        const scopedCategories = newList.filter((item) => matchesOwnerScope(item));
        localStorage.setItem("aureum_owner_categories", JSON.stringify([...outOfScope, ...scopedCategories]));
        return newList;
      });
      showToast(`Collection "${payload.name}" updated successfully!`);
    } else {
      // Start with a local fallback (uses Date.now() as temp id)
      let createdItem = {
        id: Date.now(),
        ...payload,
        products_count: 0,
        user_id: currentUserId,
        owner_email: currentOwnerEmail,
        store_id: activeStore?.id ?? null,
      };

      try {
        const res = await api.post('/categories', payload);
        if (res.data?.id) {
          // Use the real MySQL id returned by backend
          createdItem = {
            ...createdItem,
            ...res.data,
            // keep local meta so scoping filters work
            user_id: currentUserId,
            owner_email: currentOwnerEmail,
            store_id: res.data.store_id ?? activeStore?.id ?? null,
          };
        }
      } catch (err) {
        console.error("Backend API create category failed:", err?.response?.data || err.message);
      }

      setCategoriesList(prev => {
        const newList = [createdItem, ...prev];
        const saved = localStorage.getItem("aureum_owner_categories");
        const outOfScope = saved ? JSON.parse(saved).filter((item) => !matchesOwnerScope(item)) : [];
        const scopedCategories = newList.filter((item) => matchesOwnerScope(item));
        localStorage.setItem("aureum_owner_categories", JSON.stringify([...outOfScope, ...scopedCategories]));
        return newList;
      });
      showToast(`Collection "${payload.name}" created successfully!`);
    }

    closeCategoryModal();
  };

  const confirmDeleteCategory = (cat) => {
    setDeletingCategory(cat);
  };

  const handleDeleteCategoryExecute = async () => {
    if (!deletingCategory) return;
    const catId = deletingCategory.id;
    const catName = deletingCategory.name;

    try {
      await api.delete(`/categories/${catId}`);
    } catch (err) {
      console.debug("Backend API delete failed, removing from local state", err);
    }

    setCategoriesList(prev => {
      const newList = prev.filter(c => c.id !== catId);
      const saved = localStorage.getItem("aureum_owner_categories");
      const outOfScope = saved ? JSON.parse(saved).filter((item) => !matchesOwnerScope(item)) : [];
      const scopedCategories = newList.filter((item) => matchesOwnerScope(item));
      localStorage.setItem("aureum_owner_categories", JSON.stringify([...outOfScope, ...scopedCategories]));
      return newList;
    });
    setProductsList(prev => prev.map(p => p.category === catName ? { ...p, category: "Uncategorized" } : p));

    showToast(`Category "${catName}" deleted successfully!`);
    setDeletingCategory(null);
  };

  const resetProductForm = () => {
    setNewProd(emptyProductForm);
    setEditingProduct(null);
  };

  const openAddProductModal = () => {
    resetProductForm();
    setShowAddProduct(true);
  };

  const openEditProductModal = (product) => {
    setEditingProduct(product);
    setNewProd({
      name: product.name || "",
      sku: product.sku || "",
      price: String(product.price || "").replace(/[^0-9.]/g, ""),
      compare_price: product.compare_price ? String(product.compare_price).replace(/[^0-9.]/g, "") : "",
      discount_percentage: "",
      category: product.category || "Apparel",
      stock: product.stock_quantity ?? product.stock ?? "",
      image: product.image || "",
      images: Array.isArray(product.images) ? product.images.map(img => typeof img === 'string' ? { url: img, color: '' } : img) : (product.image ? [{ url: product.image, color: '' }] : []),
      color: product.color || "",
      size: product.size || "",
    });
    setShowAddProduct(true);
  };

  const closeProductModal = () => {
    setShowAddProduct(false);
    resetProductForm();
  };

  const handleDeleteProduct = async (product) => {
    const productId = product.backend_id || product.id;
    if (productId) {
      try {
        await api.delete(`/products/${productId}`);
      } catch (err) {
        console.debug("Backend API delete product failed, removing locally", err);
      }
    }
    setProductsList(prev => prev.filter((p) => p.id !== product.id && p.backend_id !== productId));
    setInventoryList(prev => prev.filter((inv) => inv.sku !== product.sku));
  };

  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    if (!newProd.name || !newProd.price) return;

    const normalizedStock = Number(newProd.stock) || 10;
    const status = normalizedStock > 10 ? "In Stock" : normalizedStock > 0 ? "Low Stock" : "Out of Stock";
    const activeStoreSlug = activeStore?.slug || activeStore?.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || '';
    const category = categoriesList.find((cat) => {
      const input = (newProd.category || '').toLowerCase();
      return String(cat.id) === String(newProd.category) || (cat.name || '').toLowerCase() === input || (cat.slug || '').toLowerCase() === input;
    });
    const payload = {
      store_id: activeStore?.id ?? editingProduct?.store_id ?? null,
      category_id: category?.id ?? null,
      name: newProd.name.trim(),
      sku: newProd.sku.trim() || `SKU-${Math.floor(Math.random() * 900 + 100)}`,
      price: Number(String(newProd.price).replace(/[^0-9.]/g, "")) || 0,
      compare_price: newProd.compare_price ? Number(String(newProd.compare_price).replace(/[^0-9.]/g, "")) : null,
      stock_quantity: normalizedStock,
      description: newProd.description?.trim() || "",
      image: normalizeProductImage(newProd.images?.[0]?.url || newProd.image, newProd.name),
      images: newProd.images?.length > 0 ? newProd.images.map(img => ({ ...img, url: normalizeProductImage(img.url, newProd.name) })) : (newProd.image ? [{ url: normalizeProductImage(newProd.image, newProd.name), color: '' }] : []),
      is_active: true,
      store_name: activeStore?.name || ownerMeta.store_name || "Owner Store",
      store_slug: activeStore?.slug || ownerMeta.store_slug || activeStoreSlug,
      store_subdomain: activeStore?.subdomain || ownerMeta.store_subdomain || activeStoreSlug,
      user_id: currentUserId,
      owner_id: currentUserId,
      owner_name: user?.name || user?.owner_name || 'Owner',
      owner_email: currentOwnerEmail || user?.email || '',
      color: newProd.color?.trim() || null,
      size: newProd.size?.trim() || null,
    };

    const mapProduct = (p) => {
      const productId = p?.id ?? p?.backend_id ?? null;
      return {
        id: productId ?? Date.now(),
        backend_id: productId ?? null,
        ...ownerMeta,
        user_id: p.user_id ?? ownerMeta.user_id ?? currentUserId,
        owner_id: p.owner_id ?? ownerMeta.owner_id ?? currentUserId,
        owner_name: p.owner_name || ownerMeta.owner_name || 'Owner',
        owner_email: p.owner_email || ownerMeta.owner_email || currentOwnerEmail,
        owner_role: p.owner_role || ownerMeta.owner_role || 'owner',
        store_id: p.store_id ?? ownerMeta.store_id ?? activeStore?.id ?? null,
        store_name: p.store?.name || ownerMeta.store_name || activeStore?.name || 'Owner Store',
        store_slug: p.store?.slug || ownerMeta.store_slug || activeStoreSlug,
        store_subdomain: p.store?.subdomain || ownerMeta.store_subdomain || activeStore?.subdomain || activeStoreSlug,
        name: p.name,
        sku: p.sku,
        category: p.category?.name || p.category || newProd.category,
        price: typeof p.price === 'number' ? `${currencySymbol}${p.price.toFixed(2)}` : p.price,
        compare_price: typeof p.compare_price === 'number' ? `${currencySymbol}${p.compare_price.toFixed(2)}` : p.compare_price,
        stock: p.stock_quantity ?? normalizedStock,
        status: p.status || status,
        image: p.image || normalizeProductImage(newProd.images?.[0]?.url || newProd.image, newProd.name),
        images: Array.isArray(p.images) && p.images.length > 0 ? p.images : (newProd.images?.length > 0 ? newProd.images : [{ url: p.image || normalizeProductImage(newProd.image, newProd.name), color: '' }]),
        color: p.color || newProd.color || null,
        size: p.size || newProd.size || null,
      };
    };

    try {
      if (editingProduct && editingProduct.backend_id) {
        const response = await api.put(`/products/${editingProduct.backend_id}`, payload);
        const updated = mapProduct(response.data);
        setProductsList(prev => prev.map(product => product.id === editingProduct.id ? updated : product));
        setInventoryList(prev => prev.map(inv => inv.sku === editingProduct.sku ? { ...inv, sku: updated.sku, name: updated.name, stock: updated.stock, status: updated.stock > inv.reorder ? "Optimal" : updated.stock > 0 ? "Low Stock" : "Out of Stock" } : inv));
      } else if (editingProduct && editingProduct.id) {
        try {
          const response = await api.put(`/products/${editingProduct.id}`, payload);
          const updated = mapProduct(response.data);
          setProductsList(prev => prev.map(product => product.id === editingProduct.id ? updated : product));
          setInventoryList(prev => prev.map(inv => inv.sku === editingProduct.sku ? { ...inv, sku: updated.sku, name: updated.name, stock: updated.stock, status: updated.stock > inv.reorder ? "Optimal" : updated.stock > 0 ? "Low Stock" : "Out of Stock" } : inv));
        } catch (innerError) {
          const fallback = mapProduct({ ...editingProduct, ...payload });
          setProductsList(prev => prev.map(product => product.id === editingProduct.id ? fallback : product));
        }
      } else {
        const response = await api.post('/products', payload);
        const created = mapProduct(response.data);
        setProductsList(prev => [created, ...prev]);
        setInventoryList(prev => prev.some(inv => inv.sku === created.sku)
          ? prev.map(inv => inv.sku === created.sku ? { ...inv, name: created.name, stock: created.stock, status: created.stock > inv.reorder ? "Optimal" : created.stock > 0 ? "Low Stock" : "Out of Stock" } : inv)
          : [{ sku: created.sku, name: created.name, location: "Warehouse A1", stock: created.stock, reorder: 15, status: created.stock > 15 ? "Optimal" : created.stock > 0 ? "Low Stock" : "Out of Stock" }, ...prev]);
      }
    } catch (err) {
      console.error("Backend API product save failed", err);
      alert("Failed to save product to the database. Error: " + (err.response?.data?.message || err.message));
      return;
    }

    closeProductModal();
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    // Optimistic UI update
    setOrdersList(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    
    // Check if orderId is a real backend ID (not a local dummy one starting with #)
    if (typeof orderId === 'number' || (typeof orderId === 'string' && !orderId.startsWith('#'))) {
      try {
        await api.put(`/orders/${orderId}/status`, { status: newStatus });
      } catch (err) {
        console.error("Failed to update order status on backend:", err);
      }
    }
  };

  const adjustStock = (productId, delta) => {
    setProductsList(prev => prev.map(p => {
      if (p.id === productId) {
        const currentStock = Number(p.stock) || 0;
        const newStock = Math.max(0, currentStock + delta);
        const status = newStock > 10 ? "In Stock" : newStock > 0 ? "Low Stock" : "Out of Stock";
        return { ...p, stock: newStock, status };
      }
      return p;
    }));
  };

  const handleSettingsSave = (e) => {
    e.preventDefault();
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3500);
  };

  // Stats Calculations
  const totalRevenue = "$18,420.00";
  const totalOrdersCount = realOrders.length;
  const pendingOrdersCount = realOrders.filter(o => o.status === "Pending" || o.status === "Processing").length;
  const cancelledOrdersCount = realOrders.filter(o => o.status === "Cancelled").length;
  const lowStockCount = inventoryList.filter(i => i.stock > 0 && i.stock <= i.reorder).length;

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100" style={{ background: "#040404", color: "#f6f1e4" }}>
        <div className="text-center">
          <div className="spinner-border text-warning" role="status" />
          <p className="mt-3">Loading owner dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#f1f2f4", color: "#202223", minHeight: "100vh" }} className="d-flex w-100">
      <style>{`
        .mobile-menu-btn {
          display: none !important;
        }
        @media (max-width: 991px) {
          .mobile-menu-btn {
            display: flex !important;
          }
          /* OVERRIDE INDEX.CSS BOTTOM NAV */
          .store-sidebar {
            position: fixed !important;
            left: -280px !important;
            top: 0 !important;
            bottom: 0 !important;
            width: 250px !important;
            height: 100vh !important;
            flex-direction: column !important;
            z-index: 1050 !important;
            transition: left 0.3s ease;
            box-shadow: 2px 0 15px rgba(0,0,0,0.2) !important;
            border-top: none !important;
            overflow-y: auto !important;
          }
          .store-sidebar.open {
            left: 0 !important;
          }
          .store-sidebar-brand {
            display: flex !important;
          }
          .store-sidebar > div {
            display: block !important;
            width: auto !important;
            height: auto !important;
          }
          .store-sidebar > div > div:not(nav) {
            display: block !important;
          }
          .store-sidebar nav {
            flex-direction: column !important;
            align-items: stretch !important;
            overflow-x: hidden !important;
          }
          .sidebar-link {
            flex-direction: row !important;
            justify-content: flex-start !important;
            padding: 0.6rem !important;
            font-size: 1rem !important;
            text-align: left !important;
          }
          .sidebar-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 1040;
          }
          .sidebar-overlay.open {
            display: block;
          }
        }
      `}</style>

      {/* SIDEBAR OVERLAY */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)}></div>

      {/* 1. SIDEBAR NAVIGATION */}
      <aside className={`store-sidebar d-flex flex-column justify-between p-3 ${sidebarOpen ? 'open' : ''}`} style={{ width: 250, minWidth: 250, background: "#ebebeb", borderRight: "1px solid #dfe3e8", minHeight: "100vh" }}>
        <div>
          {/* Brand Header */}
          <div className="d-flex align-items-center gap-2 p-2 mb-3 border-bottom" style={{ borderColor: "#dfe3e8" }}>
            <ToastKartLogo width={160} height={32} />
          </div>

          {/* Role Title */}
          <div className="px-2 pb-2 text-uppercase fs-8 font-semibold tracking-wider" style={{ color: "#6d7175" }}>
            Store Merchant
          </div>

          {/* Active Store Selector */}
          <div className="mx-2 mb-3">
            <label className="fs-9 fw-bold text-uppercase mb-1 ms-1" style={{ color: "#6d7175", letterSpacing: "0.05em" }}>Workspace</label>
            <select
              value={selectedStoreId || ""}
              onChange={(e) => {
                if (e.target.value === "CREATE_NEW") {
                  openCreateStoreModal();
                } else {
                  setSelectedStoreId(e.target.value);
                  localStorage.setItem('toastkart_active_store_id', e.target.value);
                }
              }}
              className="form-select form-select-sm fw-bold fs-7 shadow-sm py-2"
              style={{ background: "#ffffff", border: "1px solid #dfe3e8", color: "#202223", borderRadius: "8px", cursor: "pointer" }}
            >
              {ownerStores.map(store => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
              <option disabled>──────────</option>
              <option value="CREATE_NEW">+ Create New Store</option>
            </select>
          </div>

          {/* Nav List */}
          <nav className="d-flex flex-column gap-1">
            {ownerLinks.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.key;
              const handleClick = () => {
                setActive(item.key);
              };
              return (
                <button
                  key={item.key}
                  onClick={handleClick}
                  className={`sidebar-link d-flex align-items-center gap-3 p-2.5 rounded-3 border-0 transition-all ${isActive ? "active" : ""}`}
                  style={{
                    background: isActive ? "rgba(255,87,34,0.1)" : "transparent",
                    color: isActive ? "#FF5722" : "#454f5b",
                    fontWeight: isActive ? "bold" : "600",
                    borderLeft: isActive ? "3px solid #FF5722" : "3px solid transparent",
                    textAlign: "left"
                  }}
                >
                  <Icon size={18} style={{ color: isActive ? "#FF5722" : "#6d7175" }} />
                  <span style={{ color: isActive ? "#FF5722" : "#454f5b" }}>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Logout */}
        <div className="pt-3 border-top" style={{ borderColor: "#dfe3e8" }}>
          <button onClick={handleLogout} className="btn btn-sm btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT VIEW */}
      <div className="flex-grow-1 d-flex flex-column overflow-hidden" style={{ minWidth: 0 }}>

        {/* TOPBAR HEADER */}
        <header className="store-topbar d-flex align-items-center justify-content-between px-4 py-3" style={{ background: "#ffffff", borderBottom: "1px solid #dfe3e8" }}>
          <div className="d-flex align-items-center gap-3">
            <button className="mobile-menu-btn btn btn-sm btn-light border p-1" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div>
              <div className="fs-8 text-uppercase tracking-wider font-bold" style={{ color: "#6d7175" }}>{storeSettings.name}</div>
              <h1 className="fs-5 font-bold mb-0" style={{ color: "#202223" }}>Merchant Dashboard</h1>
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            <a
              href={`${window.location.protocol}//${window.location.host}/store/${activeStore?.slug || activeStore?.subdomain || activeStore?.name?.toLowerCase().replace(/\s+/g, '') || 'teststore1'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm d-flex align-items-center gap-2 px-3 py-1.5 rounded-pill border fw-bold"
              style={{ background: 'rgba(255,87,34,0.05)', borderColor: 'rgba(255,87,34,0.2)', color: '#FF5722', fontSize: '0.8rem' }}
            >
              <ExternalLink size={14} /> View Store
            </a>
            <div className="topbar-search-box d-none d-md-block position-relative">
              <span className="topbar-search-icon" style={{ color: "#6d7175" }}><Search size={14} /></span>
              <input
                placeholder="Search items..."
                className="form-control form-control-sm"
                style={{ background: "#f1f2f4", color: "#202223", border: "1px solid #dfe3e8", paddingLeft: "32px", borderRadius: "8px" }}
              />
            </div>
            <div className="topbar-icon-btn" style={{ color: "#6d7175" }}>
              <Bell size={18} />
            </div>
            <div
              className="w-8 h-8 rounded-circle d-flex align-items-center justify-content-center font-bold text-xs shadow-sm"
              style={{ background: "#ebebeb", color: "#202223", border: "1px solid #dfe3e8" }}
            >
              M
            </div>
          </div>
        </header>

        {/* MAIN BODY AREA */}
        <main className="p-4 flex-grow-1 overflow-y-auto" style={{ background: "#f1f2f4" }}>
          {/* MODULE 1: DASHBOARD OVERVIEW */}
          {active === "dashboard" && (
            <div className="d-flex flex-column gap-4">

              {/* STATS CARDS GRID */}
              <div className="row g-3">
                <div className="col-6 col-md-3 col-lg-2">
                  <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "16px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <div className="fs-8 mb-1" style={{ color: "#6d7175" }}>Total Revenue</div>
                    <div className="fs-5 font-bold" style={{ color: "#202223" }}>{totalRevenue}</div>
                    <div className="fs-8 font-semibold mt-1" style={{ color: "#FF5722" }}>+12.4%</div>
                  </div>
                </div>
                <div className="col-6 col-md-3 col-lg-2">
                  <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "16px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <div className="fs-8 mb-1" style={{ color: "#6d7175" }}>Orders</div>
                    <div className="fs-5 font-bold" style={{ color: "#202223" }}>{totalOrdersCount}</div>
                    <div className="fs-8 font-semibold mt-1" style={{ color: "#FF5722" }}>+6.1%</div>
                  </div>
                </div>
                <div className="col-6 col-md-3 col-lg-2">
                  <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "16px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <div className="fs-8 mb-1" style={{ color: "#6d7175" }}>Customers</div>
                    <div className="fs-5 font-bold" style={{ color: "#202223" }}>890</div>
                    <div className="fs-8 font-semibold mt-1" style={{ color: "#FF5722" }}>+8.2%</div>
                  </div>
                </div>
                <div className="col-6 col-md-3 col-lg-2">
                  <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "16px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <div className="fs-8 mb-1" style={{ color: "#6d7175" }}>Products</div>
                    <div className="fs-5 font-bold" style={{ color: "#202223" }}>{productsList.length}</div>
                    <div className="fs-8 font-semibold mt-1" style={{ color: "#FF5722" }}>Active</div>
                  </div>
                </div>
                <div className="col-6 col-md-3 col-lg-2">
                  <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "16px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <div className="fs-8 mb-1" style={{ color: "#6d7175" }}>Low Stock</div>
                    <div className="fs-5 font-bold" style={{ color: "#202223" }}>{lowStockCount}</div>
                    <div className="fs-8 text-danger font-semibold mt-1">Restock</div>
                  </div>
                </div>
                <div className="col-6 col-md-3 col-lg-2">
                  <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "16px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <div className="fs-8 mb-1" style={{ color: "#6d7175" }}>Pending</div>
                    <div className="fs-5 font-bold" style={{ color: "#202223" }}>{pendingOrdersCount}</div>
                    <div className="fs-8 font-semibold mt-1" style={{ color: "#b98900" }}>Processing</div>
                  </div>
                </div>
              </div>

              {/* CHARTS ROW */}
              <div className="row g-3">
                <div className="col-12 col-lg-8">
                  <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "20px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h3 className="fs-6 font-bold mb-0" style={{ color: "#202223" }}>Sales Analytics</h3>
                      <div className="btn-group btn-group-sm">
                        <button onClick={() => setChartFilter("daily")} className={`btn ${chartFilter === "daily" ? "btn-dark" : "btn-light border"}`}>Daily</button>
                        <button onClick={() => setChartFilter("monthly")} className={`btn ${chartFilter === "monthly" ? "btn-dark" : "btn-light border"}`}>Monthly</button>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={chartFilter === "daily" ? salesTrendDaily : salesTrendMonthly}>
                        <defs>
                          <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#FF5722" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="#FF5722" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e1e3e5" vertical={false} />
                        <XAxis dataKey="d" tick={{ fontSize: 11, fill: "#6d7175" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#6d7175" }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: 8, fontSize: 12, color: "#202223" }} />
                        <Area type="monotone" dataKey="v" stroke="#FF5722" strokeWidth={2.5} fill="url(#salesGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="col-12 col-lg-4">
                  <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "20px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <h3 className="fs-6 font-bold mb-3" style={{ color: "#202223" }}>Best Sellers</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={productsList.slice(0, 4)} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#6d7175" }} axisLine={false} tickLine={false} width={90} />
                        <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: 8, fontSize: 12, color: "#202223" }} />
                        <Bar dataKey="stock" fill="#FF5722" radius={[0, 4, 4, 0]} barSize={14} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* RECENT ORDERS TABLE */}
              <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "20px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h3 className="fs-6 font-bold mb-0" style={{ color: "#202223" }}>Recent Orders</h3>
                  <button className="btn btn-link fs-8 p-0 text-decoration-none fw-semibold" style={{ color: "#FF5722" }} onClick={() => setActive("orders")}>View All</button>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover mb-0 align-middle border-0">
                    <thead>
                      <tr className="fs-8 fw-semibold" style={{ color: "#6d7175", borderBottom: "1px solid #dfe3e8" }}>
                        <th className="border-0">Order ID</th>
                        <th className="border-0">Customer</th>
                        <th className="border-0">Items</th>
                        <th className="border-0">Total</th>
                        <th className="border-0">Status</th>
                        <th className="border-0 text-end">Invoice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {realOrders.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-4 fs-8" style={{ color: "#6d7175" }}>No recent orders yet.</td>
                        </tr>
                      ) : (
                        realOrders.map((o) => (
                          <tr key={o.id} style={{ borderBottom: "1px solid #f1f2f4" }}>
                            <td className="border-0 fw-semibold" style={{ color: "#202223" }}>{o.id}</td>
                            <td className="border-0" style={{ color: "#202223" }}>{o.customer}</td>
                            <td className="border-0 fs-8 fw-medium" style={{ color: "#6d7175" }}>
                              {Array.isArray(o.items) ? o.items.map(i => `${i.quantity || 1}x ${i.product_name || i.name || 'Item'}`).join(', ') || 'Custom Order' : o.items || 'Custom Order'}
                            </td>
                            <td className="border-0 fw-semibold" style={{ color: "#202223" }}>{o.total}</td>
                            <td className="border-0">
                              <span style={{
                                background: o.status === "Delivered" ? "#FFE0D0" : (o.status === "Shipped" ? "#b4e1fa" : "#fef08a"),
                                color: o.status === "Delivered" ? "#FF5722" : (o.status === "Shipped" ? "#006c9c" : "#854d0e"),
                                padding: "2px 8px",
                                borderRadius: "12px",
                                fontSize: "0.75rem",
                                fontWeight: "600"
                              }}>
                                {o.status}
                              </span>
                            </td>
                            <td className="border-0 text-end">
                              <button onClick={() => setInvoiceModalOrder(o)} className="btn btn-sm btn-light border fs-8 py-1 px-2" style={{ color: "#6d7175" }}>
                                Invoice
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* MODULE 2: PRODUCTS */}
          {active === "products" && (
            <div className="d-flex flex-column gap-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h2 className="fs-4 font-bold mb-0" style={{ color: "#202223" }}>Products</h2>
                </div>
                <button onClick={openAddProductModal} className="btn btn-sm px-3 py-1.5 d-flex align-items-center gap-1 text-white fw-bold" style={{ background: "#1c2226", borderRadius: "8px" }}>
                  Add product
                </button>
              </div>

              {productsList.length === 0 ? (
                <div className="text-center py-5 px-4" style={{ background: "#ffffff", border: "1px dashed #dfe3e8", borderRadius: "8px", margin: "16px 0" }}>
                  <Package size={48} style={{ color: "#c9cccf", marginBottom: 16 }} />
                  <h2 className="fs-5 font-bold mb-2" style={{ color: "#202223" }}>No Products Added Yet</h2>
                  <p className="fs-8 max-w-md mx-auto mb-4" style={{ color: "#6d7175", maxWidth: 480, lineHeight: 1.6 }}>
                    Your store catalog is currently empty. Click the button below to add your first product with SKU, category, price, and inventory stock.
                  </p>
                  <button onClick={openAddProductModal} className="btn fw-bold" style={{ background: "#1c2226", color: "#fff", borderRadius: "6px" }}>
                    <Plus size={16} className="me-1" /> Add Your First Product
                  </button>
                </div>
              ) : (
                <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", overflow: "hidden" }}>
                  <div className="table-responsive">
                    <table className="table table-hover mb-0 align-middle border-0">
                      <thead>
                        <tr className="fs-8 fw-semibold" style={{ color: "#6d7175", borderBottom: "1px solid #dfe3e8" }}>
                          <th className="border-0 ps-4 py-3">Product</th>
                          <th className="border-0 py-3">Color</th>
                          <th className="border-0 py-3">Size</th>
                          <th className="border-0 py-3">Price</th>
                          <th className="border-0 py-3">Status</th>
                          <th className="border-0 py-3">Inventory</th>
                          <th className="border-0 py-3">Collection</th>
                          <th className="border-0 text-end pe-4 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productsList.map((p) => (
                          <tr key={p.id} style={{ borderBottom: "1px solid #f1f2f4" }}>
                            <td className="border-0 ps-4 py-2">
                              <div className="d-flex align-items-center gap-3">
                                <div className="rounded overflow-hidden d-inline-block" style={{ width: 40, height: 40, border: "1px solid #dfe3e8", background: "#f1f2f4" }}>
                                  <img
                                    src={normalizeProductImage(p.image, p.name)}
                                    alt={p.name}
                                    className="w-100 h-100 object-cover"
                                    onError={(e) => {
                                      e.target.src = getFallbackImageByName(p.name);
                                    }}
                                  />
                                </div>
                                <span className="fw-semibold fs-7" style={{ color: "#202223" }}>{p.name}</span>
                              </div>
                            </td>
                            <td className="border-0 py-2 fs-7" style={{ color: "#6d7175" }}>{p.color || "—"}</td>
                            <td className="border-0 py-2 fs-7" style={{ color: "#6d7175" }}>{p.size || "—"}</td>
                            <td className="border-0 py-2">
                              <div className="d-flex flex-column">
                                <div className="d-flex align-items-baseline gap-1">
                                  <span className="fw-semibold fs-7" style={{ color: "#202223" }}>{p.price}</span>
                                  {(() => {
                                    try {
                                      if (!p.compare_price) return null;
                                      const cmp = parseFloat(String(p.compare_price).replace(/[^0-9.]/g, ""));
                                      const prc = parseFloat(String(p.price).replace(/[^0-9.]/g, ""));
                                      if (isNaN(cmp) || isNaN(prc) || cmp <= prc || cmp === 0) return null;
                                      const pct = Math.round(((cmp - prc) / cmp) * 100);
                                      return (
                                        <span style={{ color: "#388e3c", fontSize: "0.7rem", fontWeight: "600" }}>
                                          — {pct}% OFF
                                        </span>
                                      );
                                    } catch (e) { return null; }
                                  })()}
                                </div>
                                {(() => {
                                  try {
                                    if (!p.compare_price) return null;
                                    const cmp = parseFloat(String(p.compare_price).replace(/[^0-9.]/g, ""));
                                    const prc = parseFloat(String(p.price).replace(/[^0-9.]/g, ""));
                                    if (isNaN(cmp) || isNaN(prc) || cmp === prc) return null;
                                    return <span className="text-muted fs-8 text-decoration-line-through">{p.compare_price}</span>;
                                  } catch (e) { return null; }
                                })()}
                              </div>
                            </td>
                            <td className="border-0">
                              <span style={{
                                background: p.status === "In Stock" ? "#FFE0D0" : "#e1e3e5",
                                color: p.status === "In Stock" ? "#FF5722" : "#202223",
                                padding: "2px 8px",
                                borderRadius: "12px",
                                fontSize: "0.75rem",
                                fontWeight: "600"
                              }}>
                                {p.status === "In Stock" ? "Active" : p.status}
                              </span>
                            </td>
                            <td className="border-0">
                              <div className="btn-group btn-group-sm">
                                <button onClick={() => adjustStock(p.id, -1)} className="btn btn-outline-secondary py-0 px-2" title="Decrease Stock">-</button>
                                <span className="btn btn-light fs-8 py-0 px-3 border border-secondary border-opacity-25" style={{ pointerEvents: "none", color: "#202223" }}>{p.stock}</span>
                                <button onClick={() => adjustStock(p.id, 1)} className="btn btn-outline-secondary py-0 px-2" title="Increase Stock">+</button>
                              </div>
                            </td>
                            <td className="border-0 fs-7" style={{ color: "#6d7175" }}>{p.category || "Apparel"}</td>
                            <td className="border-0 text-end pe-4">
                              <div className="d-flex justify-content-end gap-2">
                                <button onClick={() => openEditProductModal(p)} className="btn btn-sm btn-light border" style={{ color: "#6d7175" }} title="Edit Product">
                                  <Edit size={14} />
                                </button>
                                <button onClick={() => handleDeleteProduct(p)} className="btn btn-sm btn-light border" style={{ color: "#d82c0d" }} title="Delete Product">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODULE 3: INVENTORY */}
          {active === "inventory" && (
            <div className="d-flex flex-column gap-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h2 className="fs-4 font-bold mb-0" style={{ color: "#FF8A65" }}>Inventory Management</h2>
                  <p className="fs-8 mb-0" style={{ color: "#FF5722" }}>Real-time stock maintenance and inventory tracking for store catalog items</p>
                </div>
                <button onClick={openAddProductModal} className="btn btn-gold-primary btn-sm px-3 py-2 d-flex align-items-center gap-1">
                  <Plus size={16} /> Add Product
                </button>
              </div>

              {productsList.length === 0 ? (
                <div className="gold-panel p-5 rounded-3 text-center my-3" style={{ background: "linear-gradient(135deg, #0f0e0c 0%, #161310 60%, #050505 100%)", border: "1px dashed rgba(212,175,55,0.4)" }}>
                  <div className="w-16 h-16 rounded-circle bg-warning bg-opacity-15 text-warning d-inline-flex align-items-center justify-content-center mb-3">
                    <Boxes size={34} />
                  </div>
                  <h2 className="fs-3 font-serif font-bold text-white mb-2">No Inventory Records Found</h2>
                  <p className="fs-7 text-muted max-w-md mx-auto mb-4" style={{ maxWidth: 480, lineHeight: 1.6 }}>
                    Your store has no products listed yet. Click the button below to add your first product to populate real-time inventory stock levels.
                  </p>
                  <button onClick={openAddProductModal} className="btn btn-gold-primary py-2.5 px-4 font-bold fs-7 d-inline-flex align-items-center gap-2">
                    <Plus size={18} /> + Add Product To Catalog
                  </button>
                </div>
              ) : (
                <div className="gold-panel">
                  <div className="table-responsive">
                    <table className="table table-dark table-hover mb-0 align-middle">
                      <thead>
                        <tr className="text-warning fs-8 font-bold" style={{ borderColor: "rgba(212,175,55,0.2)" }}>
                          <th>Product Image</th>
                          <th>Product Name</th>
                          <th>Unit Price</th>
                          <th>Current Stock</th>
                          <th>Stock Status</th>
                          <th className="text-end">Stock Maintenance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productsList.map((p) => (
                          <tr key={p.id}>
                            <td>
                              <div className="rounded-3 overflow-hidden d-inline-block" style={{ width: 52, height: 52, border: "1px solid rgba(212,175,55,0.4)", background: "#0e0d0b" }}>
                                <img
                                  src={normalizeProductImage(p.image, p.name)}
                                  alt={p.name}
                                  className="w-100 h-100 object-cover"
                                  onError={(e) => {
                                    e.target.src = getFallbackImageByName(p.name);
                                  }}
                                />
                              </div>
                            </td>
                            <td className="fw-bold fs-7" style={{ color: "#FF8A65" }}>
                              {p.name}
                            </td>
                            <td className="fw-bold fs-7 text-warning">{p.price}</td>
                            <td className="fw-bold fs-6 text-white">{p.stock} units</td>
                            <td>
                              <span className={p.status === "In Stock" ? "gold-badge-emerald" : p.status === "Low Stock" ? "gold-badge-amber" : "gold-badge-amber text-danger"}>
                                {p.status}
                              </span>
                            </td>
                            <td className="text-end">
                              <div className="btn-group btn-group-sm">
                                <button
                                  onClick={() => adjustStock(p.id, -1)}
                                  className="btn btn-outline-warning py-1 px-2.5 font-bold"
                                  title="Decrease Stock"
                                >
                                  -
                                </button>
                                <span className="btn btn-dark text-warning font-bold fs-7 py-1 px-3 border border-secondary" style={{ pointerEvents: "none" }}>
                                  {p.stock}
                                </span>
                                <button
                                  onClick={() => adjustStock(p.id, 1)}
                                  className="btn btn-outline-warning py-1 px-2.5 font-bold"
                                  title="Increase Stock"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODULE 4: ORDERS */}
          {active === "orders" && (
            <div className="d-flex flex-column gap-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h2 className="fs-4 font-bold mb-0" style={{ color: "#202223" }}>All Orders</h2>
                </div>
              </div>

              {realOrders.length === 0 ? (
                <div style={{ background: "#ffffff", border: "1px dashed #dfe3e8", borderRadius: "8px", padding: "40px", textAlign: "center", margin: "16px 0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                  <div className="w-16 h-16 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ background: "rgba(255,87,34,0.1)", color: "#FF5722" }}>
                    <ShoppingCart size={34} />
                  </div>
                  <h2 className="fs-3 font-bold mb-2" style={{ color: "#202223" }}>No Store Orders Received Yet</h2>
                  <p className="fs-7 max-w-md mx-auto mb-4" style={{ color: "#6d7175", maxWidth: 480, lineHeight: 1.6 }}>
                    Your store has not received any customer orders yet. When customers purchase items from your storefront catalog, orders will appear here.
                  </p>
                </div>
              ) : (
                <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", overflow: "hidden" }}>
                  <div className="table-responsive">
                    <table className="table table-hover mb-0 align-middle border-0">
                      <thead>
                        <tr className="fs-8 fw-semibold" style={{ color: "#6d7175", borderBottom: "1px solid #dfe3e8" }}>
                          <th className="border-0 ps-4 py-3">Order No</th>
                          <th className="border-0 py-3">Customer Name</th>
                          <th className="border-0 py-3">Products</th>
                          <th className="border-0 py-3">Date</th>
                          <th className="border-0 py-3">Payment</th>
                          <th className="border-0 py-3">Total Amount</th>
                          <th className="border-0 py-3">Status</th>
                          <th className="border-0 text-end pe-4 py-3">Invoice</th>
                        </tr>
                      </thead>
                      <tbody>
                        {realOrders.map((o) => (
                          <tr key={o.id} style={{ borderBottom: "1px solid #f1f2f4" }}>
                            <td className="border-0 ps-4 fw-semibold" style={{ color: "#202223" }}>{o.id}</td>
                            <td className="border-0" style={{ color: "#202223" }}>{o.customer}</td>
                            <td className="border-0 fs-8 fw-medium" style={{ color: "#6d7175" }}>
                              {Array.isArray(o.items) ? o.items.map(i => `${i.quantity || 1}x ${i.product_name || i.name || 'Item'}`).join(', ') || 'Custom Order' : o.items || 'Custom Order'}
                            </td>
                            <td className="border-0 fs-8" style={{ color: "#6d7175" }}>{o.date}</td>
                            <td className="border-0 fs-8 fw-semibold" style={{ color: "#202223" }}>{o.pay}</td>
                            <td className="border-0 fw-semibold" style={{ color: "#202223" }}>{o.total}</td>
                            <td className="border-0">
                              <select
                                value={o.status}
                                onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                                className="form-select form-select-sm fs-8 py-1 px-2 border"
                                style={{ borderRadius: "8px", background: "#f1f2f4", color: "#202223", border: "1px solid #dfe3e8" }}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Processing">Processing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </td>
                            <td className="border-0 text-end pe-4">
                              <button onClick={() => setInvoiceModalOrder(o)} className="btn btn-sm btn-light border fs-8 py-1 px-2" style={{ color: "#6d7175" }}>
                                Invoice
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODULE 5: CUSTOMERS */}
          {active === "customers" && (
            <div className="d-flex flex-column gap-3">
              {/* Header with Search */}
              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
                <div>
                  <h2 className="fs-4 font-bold mb-0" style={{ color: "#202223" }}>Customers</h2>
                </div>
                <div className="topbar-search-box" style={{ width: 280 }}>
                  <span className="topbar-search-icon" style={{ color: "#6d7175" }}><Search size={14} /></span>
                  <input
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    placeholder="Search by customer name, email or product..."
                    style={{ background: "#ffffff", color: "#202223", border: "1px solid #dfe3e8" }}
                    className="form-control form-control-sm"
                  />
                </div>
              </div>

              {derivedCustomers.length === 0 ? (
                <div style={{ background: "#ffffff", border: "1px dashed #dfe3e8", borderRadius: "8px", padding: "40px", textAlign: "center", margin: "16px 0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                  <div className="w-16 h-16 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ background: "rgba(255,87,34,0.1)", color: "#FF5722" }}>
                    <Users size={34} />
                  </div>
                  <h2 className="fs-3 font-bold mb-2" style={{ color: "#202223" }}>No Customer Orders Yet</h2>
                  <p className="fs-7 max-w-md mx-auto mb-4" style={{ color: "#6d7175", maxWidth: 480, lineHeight: 1.6 }}>
                    No customers have placed orders in your store yet. Customer records and ordered product details will automatically populate here as orders are placed.
                  </p>
                </div>
              ) : (
                <>
                  {/* Stats Summary Bar */}
                  <div className="row g-3">
                    <div className="col-12 col-md-4">
                      <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "16px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                        <div className="fs-8 mb-1" style={{ color: "#6d7175" }}>Total Store Customers</div>
                        <div className="fs-4 font-bold" style={{ color: "#202223" }}>{derivedCustomers.length}</div>
                        <div className="fs-8 font-semibold mt-1" style={{ color: "#FF5722" }}>Purchasing Shoppers</div>
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "16px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                        <div className="fs-8 mb-1" style={{ color: "#6d7175" }}>VIP Customers</div>
                        <div className="fs-4 font-bold" style={{ color: "#202223" }}>{derivedCustomers.filter(c => c.tier === "VIP").length}</div>
                        <div className="fs-8 font-semibold mt-1" style={{ color: "#FF5722" }}>High Value</div>
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "16px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                        <div className="fs-8 mb-1" style={{ color: "#6d7175" }}>Products Purchased</div>
                        <div className="fs-4 font-bold" style={{ color: "#202223" }}>
                          {derivedCustomers.reduce((acc, c) => acc + (c.orderedProducts ? c.orderedProducts.length : 0), 0)}
                        </div>
                        <div className="fs-8 font-semibold mt-1" style={{ color: "#6d7175" }}>Item Deliveries</div>
                      </div>
                    </div>
                  </div>

                  {/* Customers Table */}
                  <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", overflow: "hidden" }}>
                    <div className="table-responsive">
                      <table className="table table-hover mb-0 align-middle border-0">
                        <thead>
                          <tr className="fs-8 fw-semibold" style={{ color: "#6d7175", borderBottom: "1px solid #dfe3e8" }}>
                            <th className="border-0 ps-4 py-3">Customer Name</th>
                            <th className="border-0 py-3">Email Address</th>
                            <th className="border-0 py-3">Ordered Products</th>
                            <th className="border-0 py-3">Total Orders</th>
                            <th className="border-0 py-3">Total Spent</th>
                            <th className="border-0 py-3">Tier</th>
                            <th className="border-0 text-end pe-4 py-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {derivedCustomers.filter(c =>
                            c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
                            c.email.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
                            (c.orderedProducts && c.orderedProducts.some(p => p.toLowerCase().includes(customerSearchQuery.toLowerCase())))
                          ).length === 0 ? (
                            <tr>
                              <td colSpan="7" className="text-center py-4 fs-7" style={{ color: "#6d7175" }}>
                                No customer found matching "{customerSearchQuery}".
                              </td>
                            </tr>
                          ) : (
                            derivedCustomers
                              .filter(c =>
                                c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
                                c.email.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
                                (c.orderedProducts && c.orderedProducts.some(p => p.toLowerCase().includes(customerSearchQuery.toLowerCase())))
                              )
                              .map((c) => (
                                <tr key={c.id} style={{ borderBottom: "1px solid #f1f2f4" }}>
                                  <td className="border-0 ps-4 fw-bold" style={{ color: "#202223" }}>
                                    <div className="d-flex align-items-center gap-2">
                                      <div className="w-8 h-8 rounded-circle d-flex align-items-center justify-content-center font-bold text-xs" style={{ background: "#f1f2f4", color: "#202223", border: "1px solid #dfe3e8" }}>
                                        {c.name ? c.name[0].toUpperCase() : "C"}
                                      </div>
                                      <div>
                                        <div style={{ color: "#202223" }}>{c.name}</div>
                                        <div className="fs-8" style={{ color: "#6d7175" }}>{c.id}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="border-0 fs-8 fw-semibold" style={{ color: "#6d7175" }}>{c.email}</td>
                                  <td className="border-0" style={{ maxWidth: 300 }}>
                                    <div className="d-flex flex-wrap gap-1">
                                      {c.orderedProducts && c.orderedProducts.length > 0 ? (
                                        c.orderedProducts.map((p, idx) => (
                                          <span key={idx} className="badge bg-light border text-dark fs-8 font-normal" style={{ borderColor: "#dfe3e8" }}>
                                            <Package size={10} className="me-1" />{p}
                                          </span>
                                        ))
                                      ) : (
                                        <span className="fs-8" style={{ color: "#6d7175" }}>No items yet</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="border-0 fw-semibold" style={{ color: "#202223" }}>{c.orders} orders</td>
                                  <td className="border-0 fw-bold" style={{ color: "#202223" }}>{c.spent}</td>
                                  <td className="border-0">
                                    <span style={{
                                      background: c.tier === "VIP" ? "#fef08a" : "#e1e3e5",
                                      color: c.tier === "VIP" ? "#854d0e" : "#202223",
                                      padding: "2px 8px",
                                      borderRadius: "12px",
                                      fontSize: "0.75rem",
                                      fontWeight: "600"
                                    }}>
                                      {c.tier}
                                    </span>
                                  </td>
                                  <td className="border-0 text-end pe-4">
                                    <button
                                      onClick={() => setSelectedCustomerModal(c)}
                                      className="btn btn-sm btn-light border fs-8 py-1 px-2 d-inline-flex align-items-center gap-1" style={{ color: "#6d7175" }}
                                    >
                                      <Eye size={13} /> View
                                    </button>
                                  </td>
                                </tr>
                              ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* MODULE 6: SETTINGS */}
          {active === "settings" && (
            <div className="d-flex flex-column gap-3">
              <h2 className="fs-4 font-bold mb-0" style={{ color: "#202223" }}>Store Settings</h2>
              {settingsSaved && (
                <div className="alert alert-success fs-7" style={{ background: "#FFE0D0", color: "#FF5722", border: "1px solid #FF5722" }}>
                  Store settings updated successfully!
                </div>
              )}
              <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "24px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }} className="col-12 col-md-6">
                <form onSubmit={handleSettingsSave} className="d-flex flex-column gap-3 fs-7">
                  <div>
                    <label className="mb-1 fs-8 fw-semibold" style={{ color: "#202223" }}>Store Name</label>
                    <input value={storeSettings.name} onChange={(e) => setStoreSettings({ ...storeSettings, name: e.target.value })} className="form-control" style={{ border: "1px solid #dfe3e8" }} />
                  </div>
                  <div>
                    <label className="mb-1 fs-8 fw-semibold" style={{ color: "#202223" }}>Support Email</label>
                    <input value={storeSettings.email} onChange={(e) => setStoreSettings({ ...storeSettings, email: e.target.value })} className="form-control" style={{ border: "1px solid #dfe3e8" }} />
                  </div>
                  <div>
                    <label className="mb-1 fs-8 fw-semibold" style={{ color: "#202223" }}>Currency</label>
                    <select value={storeSettings.currency} onChange={(e) => setStoreSettings({ ...storeSettings, currency: e.target.value })} className="form-select" style={{ border: "1px solid #dfe3e8" }}>
                      <option value="USD ($)">USD ($)</option>
                      <option value="INR (₹)">INR (₹)</option>
                      <option value="EUR (€)">EUR (€)</option>
                    </select>
                  </div>
                  <button type="submit" className="btn py-2 mt-2 text-white fw-bold" style={{ background: "#FF5722", borderRadius: "8px" }}>Save Settings</button>
                </form>
              </div>
            </div>
          )}

          {/* MODULE 7: CATEGORIES */}
          {active === "categories" && (
            <div className="d-flex flex-column gap-3">
              {/* Header */}
              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
                <div>
                  <h2 className="fs-4 font-bold mb-0" style={{ color: "#202223" }}>Collections</h2>
                  <p className="fs-8 mb-0" style={{ color: "#6d7175" }}>Create, edit, and organize product categories for your store catalog</p>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div className="topbar-search-box" style={{ width: 220 }}>
                    <span className="topbar-search-icon" style={{ color: "#6d7175" }}><Search size={14} /></span>
                    <input
                      value={categorySearchQuery}
                      onChange={(e) => setCategorySearchQuery(e.target.value)}
                      placeholder="Search collections..."
                      style={{ background: "#ffffff", color: "#202223", border: "1px solid #dfe3e8" }}
                      className="form-control form-control-sm"
                    />
                  </div>
                  <button onClick={openAddCategoryModal} className="btn px-3 py-1.5 text-nowrap d-flex align-items-center gap-1 text-white fw-bold" style={{ background: "#1c2226", borderRadius: "8px" }}>
                    <Plus size={16} /> Add Collection
                  </button>
                </div>
              </div>

              {/* Toast alert */}
              {categoryToast && (
                <div className="alert alert-success fs-7 d-flex align-items-center gap-2 mb-0 py-2" style={{ background: "#FFE0D0", color: "#FF5722", border: "1px solid #FF5722" }}>
                  <CheckCircle2 size={16} /> {categoryToast}
                </div>
              )}

              {categoriesList.length === 0 ? (
                <div style={{ background: "#ffffff", border: "1px dashed #dfe3e8", borderRadius: "8px", padding: "40px", textAlign: "center", margin: "16px 0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                  <div className="w-16 h-16 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ background: "rgba(255,87,34,0.1)", color: "#FF5722" }}>
                    <Tag size={34} />
                  </div>
                  <h2 className="fs-3 font-bold mb-2" style={{ color: "#202223" }}>No Collections Created Yet</h2>
                  <p className="fs-7 max-w-md mx-auto mb-4" style={{ color: "#6d7175", maxWidth: 480, lineHeight: 1.6 }}>
                    Your store catalog doesn't have any collections yet. Click the button below to add your first product collection with custom URL slug and description.
                  </p>
                  <button onClick={openAddCategoryModal} className="btn py-2.5 px-4 font-bold fs-7 d-inline-flex align-items-center gap-2 text-white" style={{ background: "#1c2226", borderRadius: "8px" }}>
                    <Plus size={18} /> + Add Your First Collection
                  </button>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {/* Data Table */}
                  <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", overflow: "hidden" }}>
                    <div className="table-responsive">
                      <table className="table table-hover mb-0 align-middle border-0">
                        <thead>
                          <tr className="fs-8 fw-semibold" style={{ color: "#6d7175", borderBottom: "1px solid #dfe3e8" }}>
                            <th className="border-0 ps-4 py-3">Collection Name</th>
                            <th className="border-0 py-3">Description</th>
                            <th className="border-0 py-3">Status</th>
                            <th className="border-0 text-end pe-4 py-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categoriesList.filter(c =>
                            c.name.toLowerCase().includes(categorySearchQuery.toLowerCase()) ||
                            (c.description && c.description.toLowerCase().includes(categorySearchQuery.toLowerCase()))
                          ).length === 0 ? (
                            <tr>
                              <td colSpan="4" className="text-center py-4 fs-7" style={{ color: "#6d7175" }}>
                                No collections found matching "{categorySearchQuery}".
                              </td>
                            </tr>
                          ) : (
                            categoriesList
                              .filter(c =>
                                c.name.toLowerCase().includes(categorySearchQuery.toLowerCase()) ||
                                (c.description && c.description.toLowerCase().includes(categorySearchQuery.toLowerCase()))
                              )
                              .map((cat) => (
                                <tr key={cat.id} style={{ borderBottom: "1px solid #f1f2f4" }}>
                                  <td className="border-0 ps-4 fw-bold" style={{ color: "#202223" }}>
                                    <div className="d-flex align-items-center gap-2">
                                      <div className="w-8 h-8 rounded-circle d-flex align-items-center justify-content-center" style={{ background: "#f1f2f4", color: "#202223", border: "1px solid #dfe3e8" }}>
                                        <Tag size={14} />
                                      </div>
                                      <a
                                        href={`${window.location.protocol}//${window.location.host}/store/${activeStore?.slug || activeStore?.subdomain || activeStore?.name?.toLowerCase().replace(/\s+/g, '') || 'teststore1'}/#${cat.name.toLowerCase().includes('women') ? 'women' : cat.name.toLowerCase().includes('men') ? 'men' : cat.name.toLowerCase().includes('kid') ? 'kids' : cat.name.toLowerCase().includes('accessories') ? 'accessories' : cat.name.toLowerCase().includes('tv') ? 'tv-appliances' : 'electronics'}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-decoration-underline"
                                        style={{ color: "#2874f0", cursor: "pointer" }}
                                        title={`View ${cat.name} in Storefront`}
                                      >
                                        {cat.name}
                                      </a>
                                    </div>
                                  </td>
                                  <td className="border-0 fs-8" style={{ color: "#6d7175", maxWidth: 260 }}>{cat.description || "—"}</td>
                                  <td className="border-0">
                                    {cat.featured ? (
                                      <span style={{ background: "#fef08a", color: "#854d0e", padding: "2px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "600" }}>⭐ Featured</span>
                                    ) : (
                                      <span style={{ background: "#e1e3e5", color: "#6d7175", padding: "2px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "600" }}>Standard</span>
                                    )}
                                  </td>
                                  <td className="border-0 text-end pe-4">
                                    <div className="d-flex justify-content-end gap-2">
                                      <button onClick={() => openEditCategoryModal(cat)} className="btn btn-sm btn-light border" style={{ color: "#6d7175" }} title="Edit Collection">
                                        <Edit size={14} />
                                      </button>
                                      <button onClick={() => confirmDeleteCategory(cat)} className="btn btn-sm btn-light border" style={{ color: "#d82c0d" }} title="Delete Collection">
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODULE 8: MY STORE MANAGEMENT */}
          {active === "stores" && (
            <div className="d-flex flex-column gap-4">
              {!hasRealStore ? (
                  <div className="bg-white w-100 rounded-3 shadow-sm border p-4" style={{ maxWidth: 800, borderColor: "#dfe3e8", margin: "0 auto" }}>
                    <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom" style={{ borderColor: "#dfe3e8" }}>
                      <h3 className="fs-5 font-bold mb-0 d-flex align-items-center gap-2" style={{ color: "#202223" }}>
                        <PlusCircle size={18} /> Create New Store
                      </h3>
                    </div>
                    <form onSubmit={handleCreateStoreSubmit} className="d-flex flex-column gap-3 fs-7">
                      <div>
                        <label className="mb-1 fs-8 fw-semibold" style={{ color: "#454f5b" }}>Store Name *</label>
                        <input required value={storeForm.name} onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })} className="form-control" style={{ border: "1px solid #dfe3e8", color: "#202223", backgroundColor: "#fafbfc" }} placeholder="e.g. ToastKart Luxury Living" />
                      </div>
                      <div className="row g-2">
                        <div className="col-6">
                          <label className="mb-1 fs-8 fw-semibold" style={{ color: "#454f5b" }}>Category</label>
                          <select value={storeForm.category} onChange={(e) => setStoreForm({ ...storeForm, category: e.target.value })} className="form-select" style={{ border: "1px solid #dfe3e8", color: "#202223", backgroundColor: "#fafbfc" }}>
                            <option value="Fashion & Apparel">Fashion & Apparel</option>
                            <option value="Jewellery">Jewellery</option>
                            <option value="Beauty & Cosmetics">Beauty & Cosmetics</option>
                            <option value="Home & Living">Home & Living</option>
                            <option value="Electronics">Electronics</option>
                            <option value="Footwear">Footwear</option>
                            <option value="Grocery & Food">Grocery & Food</option>
                            <option value="Gift Store">Gift Store</option>
                            <option value="General Retail">General Retail</option>
                          </select>
                        </div>
                        <div className="col-6">
                          <label className="mb-1 fs-8 fw-semibold" style={{ color: "#454f5b" }}>Currency</label>
                          <select value={storeForm.currency} onChange={(e) => setStoreForm({ ...storeForm, currency: e.target.value })} className="form-select" style={{ border: "1px solid #dfe3e8", color: "#202223", backgroundColor: "#fafbfc" }}>
                            <option value="USD ($)">USD ($)</option>
                            <option value="EUR (€)">EUR (€)</option>
                            <option value="INR (₹)">INR (₹)</option>
                            <option value="GBP (£)">GBP (£)</option>
                          </select>
                        </div>
                      </div>
                      <div className="row g-2">
                        <div className="col-6">
                          <label className="mb-1 fs-8 fw-semibold" style={{ color: "#454f5b" }}>Support Email</label>
                          <input type="email" value={storeForm.email} onChange={(e) => setStoreForm({ ...storeForm, email: e.target.value })} className="form-control" style={{ border: "1px solid #dfe3e8", color: "#202223", backgroundColor: "#fafbfc" }} placeholder="support@mybrand.com" />
                        </div>
                        <div className="col-6">
                          <label className="mb-1 fs-8 fw-semibold" style={{ color: "#454f5b" }}>Owner Name</label>
                          <input value={storeForm.ownerName} onChange={(e) => setStoreForm({ ...storeForm, ownerName: e.target.value })} className="form-control" style={{ border: "1px solid #dfe3e8", color: "#202223", backgroundColor: "#fafbfc" }} placeholder="Owner Name" />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 fs-8 fw-semibold" style={{ color: "#454f5b" }}>Store Description</label>
                        <textarea rows="3" value={storeForm.description} onChange={(e) => setStoreForm({ ...storeForm, description: e.target.value })} className="form-control" style={{ border: "1px solid #dfe3e8", color: "#202223", backgroundColor: "#fafbfc" }} placeholder="Describe store collection & brand story..." />
                      </div>
                      <div className="d-flex align-items-center justify-content-end gap-2 pt-3 border-top mt-1" style={{ borderColor: "#dfe3e8" }}>
                        <button type="submit" className="btn btn-dark btn-sm px-4 py-2" style={{ backgroundColor: "#202223", color: "#ffffff", border: "none" }}>Create Store</button>
                      </div>
                    </form>
                  </div>
              ) : (
                <>
                  {/* Executive Store Banner */}
                  <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "16px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-2 text-warning fw-bold fs-7 tracking-wider">
                          <Sparkles size={13} /> TOASTKART STORE MANAGEMENT SUITE
                        </div>
                        <h2 className="fs-4 font-bold mb-1" style={{ color: "#202223" }}>{activeStore.name}</h2>
                        <p className="fs-9 mb-0" style={{ color: "#6d7175" }}>
                          Configure store parameters, customize subdomains, update contact info, and manage store operational status.
                        </p>
                      </div>
                      <div className="d-flex flex-nowrap align-items-center gap-2 justify-content-end">
                        <button onClick={openCreateStoreModal} className="btn btn-sm px-2 py-1 d-flex align-items-center gap-1 text-white" style={{ background: "#1c2226", borderRadius: "4px", fontWeight: "600" }}>
                          <PlusCircle size={15} /> Create
                        </button>
                        <button onClick={openEditStoreModal} className="btn btn-sm btn-light border px-2 py-1 d-flex align-items-center gap-1" style={{ color: "#6d7175", fontWeight: "600" }}>
                          <Edit3 size={15} /> Edit
                        </button>
                        <button onClick={() => setShowDeleteStoreModal(true)} className="btn btn-sm btn-light border px-2 py-1 d-flex align-items-center gap-1" style={{ color: "#d82c0d", fontWeight: "600" }}>
                          <Trash2 size={15} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Inline Form for Edit / Create (when activeStore exists) */}
                  {(showCreateStoreModal || showEditStoreModal) ? (
                    <div className="bg-white w-100 rounded-3 shadow-sm border p-4 mb-4" style={{ borderColor: "#dfe3e8" }}>
                      <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom" style={{ borderColor: "#dfe3e8" }}>
                        <h3 className="fs-5 font-bold mb-0 d-flex align-items-center gap-2" style={{ color: "#202223" }}>
                          {showCreateStoreModal ? <PlusCircle size={18} /> : <Edit3 size={18} />}
                          {showCreateStoreModal ? "Create New Store" : "Edit Store"}
                        </h3>
                        <button onClick={() => { setShowCreateStoreModal(false); setShowEditStoreModal(false); }} className="btn btn-sm p-0 border-0 bg-transparent" style={{ color: "#6d7175" }}>✕</button>
                      </div>
                      <form onSubmit={showCreateStoreModal ? handleCreateStoreSubmit : handleEditStoreSubmit} className="d-flex flex-column gap-3 fs-7">
                        <div>
                          <label className="mb-1 fs-8 fw-semibold" style={{ color: "#454f5b" }}>Store Name *</label>
                          <input required value={storeForm.name} onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })} className="form-control" style={{ border: "1px solid #dfe3e8", color: "#202223", backgroundColor: "#fafbfc" }} placeholder="e.g. ToastKart Luxury Living" />
                        </div>
                        {/* Subdomain field removed as requested */}
                        <div className="row g-2">
                          <div className="col-6">
                            <label className="mb-1 fs-8 fw-semibold" style={{ color: "#454f5b" }}>Category</label>
                            <select value={storeForm.category} onChange={(e) => setStoreForm({ ...storeForm, category: e.target.value })} className="form-select" style={{ border: "1px solid #dfe3e8", color: "#202223", backgroundColor: "#fafbfc" }}>
                              <option value="Fashion & Apparel">Fashion & Apparel</option>
                              <option value="Jewellery">Jewellery</option>
                              <option value="Beauty & Cosmetics">Beauty & Cosmetics</option>
                              <option value="Home & Living">Home & Living</option>
                              <option value="Electronics">Electronics</option>
                              <option value="Footwear">Footwear</option>
                              <option value="Grocery & Food">Grocery & Food</option>
                              <option value="Gift Store">Gift Store</option>
                              <option value="General Retail">General Retail</option>
                            </select>
                          </div>
                          {showCreateStoreModal ? (
                            <div className="col-6">
                              <label className="mb-1 fs-8 fw-semibold" style={{ color: "#454f5b" }}>Currency</label>
                              <select value={storeForm.currency} onChange={(e) => setStoreForm({ ...storeForm, currency: e.target.value })} className="form-select" style={{ border: "1px solid #dfe3e8", color: "#202223", backgroundColor: "#fafbfc" }}>
                                <option value="USD ($)">USD ($)</option>
                                <option value="EUR (€)">EUR (€)</option>
                                <option value="INR (₹)">INR (₹)</option>
                                <option value="GBP (£)">GBP (£)</option>
                              </select>
                            </div>
                          ) : (
                            <div className="col-6">
                              <label className="mb-1 fs-8 fw-semibold" style={{ color: "#454f5b" }}>Store Status</label>
                              <select value={storeForm.status} onChange={(e) => setStoreForm({ ...storeForm, status: e.target.value })} className="form-select" style={{ border: "1px solid #dfe3e8", color: "#202223", backgroundColor: "#fafbfc" }}>
                                <option value="Active">🟢 Active (Open for Orders)</option>
                                <option value="Maintenance">🟡 Maintenance Mode</option>
                                <option value="Draft">🔴 Draft (Private)</option>
                              </select>
                            </div>
                          )}
                        </div>
                        <div className="row g-2">
                          <div className="col-6">
                            <label className="mb-1 fs-8 fw-semibold" style={{ color: "#454f5b" }}>Support Email</label>
                            <input type="email" value={storeForm.email} onChange={(e) => setStoreForm({ ...storeForm, email: e.target.value })} className="form-control" style={{ border: "1px solid #dfe3e8", color: "#202223", backgroundColor: "#fafbfc" }} placeholder="support@mybrand.com" />
                          </div>
                          {showCreateStoreModal ? (
                            <div className="col-6">
                              <label className="mb-1 fs-8 fw-semibold" style={{ color: "#454f5b" }}>Owner Name</label>
                              <input value={storeForm.ownerName} onChange={(e) => setStoreForm({ ...storeForm, ownerName: e.target.value })} className="form-control" style={{ border: "1px solid #dfe3e8", color: "#202223", backgroundColor: "#fafbfc" }} placeholder="Owner Name" />
                            </div>
                          ) : (
                            <div className="col-6">
                              <label className="mb-1 fs-8 fw-semibold" style={{ color: "#454f5b" }}>Support Phone</label>
                              <input value={storeForm.phone} onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })} className="form-control" style={{ border: "1px solid #dfe3e8", color: "#202223", backgroundColor: "#fafbfc" }} placeholder="Support Phone" />
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="mb-1 fs-8 fw-semibold" style={{ color: "#454f5b" }}>Store Description</label>
                          <textarea rows="3" value={storeForm.description} onChange={(e) => setStoreForm({ ...storeForm, description: e.target.value })} className="form-control" style={{ border: "1px solid #dfe3e8", color: "#202223", backgroundColor: "#fafbfc" }} placeholder="Describe store collection & brand story..." />
                        </div>
                        <div className="d-flex align-items-center justify-content-end gap-2 pt-3 border-top mt-1" style={{ borderColor: "#dfe3e8" }}>
                          <button type="button" onClick={() => { setShowCreateStoreModal(false); setShowEditStoreModal(false); }} className="btn btn-sm btn-light border px-3 py-2" style={{ color: "#202223", backgroundColor: "#ffffff" }}>Cancel</button>
                          <button type="submit" className="btn btn-dark btn-sm px-4 py-2" style={{ backgroundColor: "#202223", color: "#ffffff", border: "none" }}>{showCreateStoreModal ? "Create Store" : "Save Changes"}</button>
                        </div>
                      </form>
                    </div>
                  ) : (
                  <div className="row g-3">
                    <div className="col-12">
                      <div className="d-flex flex-column gap-4" style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "24px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                        <div className="d-flex align-items-start gap-3">
                          <div
                            className="w-16 h-16 rounded-3 d-flex align-items-center justify-content-center fs-4 font-bold flex-shrink-0"
                            style={{ background: "#f1f2f4", color: "#202223", border: "1px solid #dfe3e8" }}
                          >
                            {(activeStore.name || "S").charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                              <div>
                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                  <h3 className="fs-5 font-bold mb-0" style={{ color: "#202223" }}>{activeStore.name}</h3>
                                  <span
                                    title="Store ID in database"
                                    style={{
                                      background: "#f1f2f4",
                                      color: "#454f5b",
                                      border: "1px solid #dfe3e8",
                                      padding: "1px 8px",
                                      borderRadius: "6px",
                                      fontSize: "0.72rem",
                                      fontWeight: "700",
                                      fontFamily: "monospace",
                                      letterSpacing: "0.03em"
                                    }}
                                  >
                                    ID&nbsp;#{activeStore.id}
                                  </span>
                                </div>
                                <a href={`${window.location.protocol}//${window.location.host}/store/${activeStore.slug || activeStore.subdomain}`} target="_blank" rel="noopener noreferrer" className="fs-8 fw-semibold text-decoration-none d-block text-break" style={{ color: "#FF5722", wordBreak: "break-all" }}>
                                  {`${window.location.protocol}//${window.location.host}/store/${activeStore.slug || activeStore.subdomain}`}
                                </a>
                              </div>
                              <span style={{ background: "#FFE0D0", color: "#FF5722", padding: "2px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "600" }}>🟢 {activeStore.status || "Active"}</span>
                            </div>
                            <div className="text-muted fs-7 mb-2 line-clamp-2" style={{ minHeight: '40px' }}>
                              {activeStore.description || "Multi-vendor merchant store workspace on ToastKart platform."}
                            </div>
                          </div>
                        </div>

                        {/* Specifications Grid */}
                        <div className="row g-3 pt-3 border-top" style={{ borderColor: "#dfe3e8" }}>
                          <div className="col-6 col-md-3">
                            <span className="fs-8 d-block mb-1" style={{ color: "#6d7175" }}>Store ID</span>
                            <strong className="fs-7 d-flex align-items-center gap-1" style={{ color: "#202223", fontFamily: "monospace" }}>
                              <span
                                style={{
                                  background: "#FFF3E0",
                                  color: "#FF5722",
                                  border: "1px solid #c3e9df",
                                  padding: "2px 10px",
                                  borderRadius: "6px",
                                  fontWeight: "700",
                                  fontSize: "0.85rem",
                                  letterSpacing: "0.04em"
                                }}
                              >
                                #{activeStore.id}
                              </span>
                            </strong>
                          </div>
                          <div className="col-6 col-md-3">
                            <span className="fs-8 d-block mb-1" style={{ color: "#6d7175" }}>Category</span>
                            <strong className="fs-7" style={{ color: "#202223" }}>{activeStore.category || "General Merchant Store"}</strong>
                          </div>
                          <div className="col-6 col-md-3">
                            <span className="fs-8 d-block mb-1" style={{ color: "#6d7175" }}>Currency</span>
                            <strong className="fs-7" style={{ color: "#202223" }}>{activeStore.currency || "USD ($)"}</strong>
                          </div>
                          <div className="col-6 col-md-3">
                            <span className="fs-8 d-block mb-1" style={{ color: "#6d7175" }}>Support Contact</span>
                            <strong className="fs-7 d-block text-break" style={{ color: "#202223", wordBreak: "break-all" }}>{activeStore.email || "Not Provided"}</strong>
                          </div>
                        </div>

                        {/* Metrics Bar */}
                        <div className="row g-2 pt-2">
                          <div className="col-4">
                            <div className="p-2 rounded-3 text-center h-100 d-flex flex-column justify-content-center" style={{ background: "#f1f2f4", border: "1px solid #dfe3e8", overflow: "hidden" }}>
                              <div className="fs-5 font-bold" style={{ color: "#202223" }}>{categoriesList.length}</div>
                              <div className="fs-8 text-truncate" style={{ color: "#6d7175", fontSize: "0.75rem" }}>Collections</div>
                            </div>
                          </div>
                          <div className="col-4">
                            <div className="p-2 rounded-3 text-center h-100 d-flex flex-column justify-content-center" style={{ background: "#f1f2f4", border: "1px solid #dfe3e8", overflow: "hidden" }}>
                              <div className="fs-5 font-bold" style={{ color: "#202223" }}>{productsList.length}</div>
                              <div className="fs-8 text-truncate" style={{ color: "#6d7175", fontSize: "0.75rem" }}>Products</div>
                            </div>
                          </div>
                          <div className="col-4">
                            <div className="p-2 rounded-3 text-center h-100 d-flex flex-column justify-content-center" style={{ background: "#f1f2f4", border: "1px solid #dfe3e8", overflow: "hidden" }}>
                              <div className="fs-5 font-bold" style={{ color: "#202223" }}>{realOrders.length}</div>
                              <div className="fs-8 text-truncate" style={{ color: "#6d7175", fontSize: "0.75rem" }}>Orders</div>
                            </div>
                          </div>
                        </div>

                        {/* Storefront Link Banner Removed */}
                      </div>
                      </div>
                    </div>
                  )}

                  {/* ── COLLECTIONS PANEL ── */}
                  <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <div className="d-flex align-items-center justify-content-between px-3 px-sm-4 py-3 flex-wrap gap-2" style={{ borderBottom: "1px solid #f1f2f4" }}>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <Tag size={16} style={{ color: "#FF5722" }} />
                        <h4 className="fs-6 font-bold mb-0" style={{ color: "#202223" }}>Collections</h4>
                        <span style={{ background: "#f1f2f4", color: "#6d7175", padding: "1px 8px", borderRadius: "10px", fontSize: "0.72rem", fontWeight: 700 }}>
                          {categoriesList.length}
                        </span>
                        <span className="fs-9 fw-semibold" style={{ color: "#6d7175", fontSize: "0.7rem" }}>• Store ID #{activeStore.id}</span>
                      </div>
                      <button
                        onClick={() => setActive("categories")}
                        className="btn btn-sm d-flex align-items-center justify-content-center gap-1 fw-bold flex-shrink-0 px-2 px-sm-3"
                        style={{ background: "#1c2226", color: "#fff", borderRadius: "6px", fontSize: "0.75rem" }}
                      >
                        <Plus size={14} /> 
                        Add Collection
                      </button>
                    </div>

                    {categoriesList.length === 0 ? (
                      showInlineCategoryForm ? (
                        <div className="bg-white p-4" style={{ borderRadius: "8px", border: "1px solid #dfe3e8" }}>
                          <h4 className="fs-6 font-bold mb-3" style={{ color: "#202223" }}>Create First Collection</h4>
                          <form onSubmit={(e) => { handleCategorySubmit(e); setShowInlineCategoryForm(false); }} className="d-flex flex-column gap-3 fs-7">
                            
              <div>
                <label className="mb-1 fs-8 fw-semibold" style={{ color: "#454f5b" }}>Category Name *</label>
                <input
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="form-control"
                  style={{ border: "1px solid #dfe3e8", color: "#202223", backgroundColor: "#fafbfc" }}
                  placeholder="e.g. Luxury Handbags"
                />
                {categoryForm.name && (
                  <div className="fs-9 mt-1 fw-medium" style={{ color: "#6d7175" }}>
                    Slug URL preview: <span style={{ color: "#FF5722" }}>/{categoryForm.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 fs-8 fw-semibold" style={{ color: "#454f5b" }}>Description</label>
                <textarea
                  rows="3"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="form-control"
                  style={{ border: "1px solid #dfe3e8", color: "#202223", backgroundColor: "#fafbfc" }}
                  placeholder="Summary of products in this category..."
                />
              </div>

              <div className="form-check">
                <input
                  type="checkbox"
                  id="categoryFeaturedCheck"
                  checked={categoryForm.featured}
                  onChange={(e) => setCategoryForm({ ...categoryForm, featured: e.target.checked })}
                  className="form-check-input"
                />
                <label htmlFor="categoryFeaturedCheck" className="form-check-label fs-7 cursor-pointer" style={{ color: "#202223" }}>
                  Feature this category on store homepage & navigation
                </label>
              </div>

              <div className="d-flex align-items-center justify-content-end gap-2 mt-2 pt-3 border-top" style={{ borderColor: "#dfe3e8" }}>
                <button type="button" onClick={() => setShowInlineCategoryForm(false)} className="btn btn-sm px-3 py-2" style={{ background: "#f1f2f4", color: "#454f5b", border: "1px solid #dfe3e8", borderRadius: "6px", fontWeight: "600" }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm px-4 py-2 text-white fw-bold" style={{ background: "#1c2226", borderRadius: "6px" }}>
                  {editingCategory ? "Save Changes" : "Create Category"}
                </button>
              </div>
            
                          </form>
                        </div>
                      ) : (
                        <div className="text-center py-5 px-4">
                          <Tag size={32} style={{ color: "#c9cccf", marginBottom: 10 }} />
                          <p className="fs-8 mb-2" style={{ color: "#6d7175" }}>No collections found for Store ID #{activeStore.id}</p>
                          <button
                            onClick={() => { setShowInlineCategoryForm(true); setEditingCategory(null); setCategoryForm({ name: "", description: "", featured: false }); }}
                            className="btn btn-sm fw-bold"
                            style={{ background: "#FF5722", color: "#fff", borderRadius: "6px" }}
                          >
                            Create First Collection
                          </button>
                        </div>
                      )
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-hover mb-0 align-middle border-0">
                          <thead>
                            <tr className="fs-8 fw-semibold" style={{ color: "#6d7175", background: "#f9fafb", borderBottom: "1px solid #e4e5e7" }}>
                              <th className="border-0 ps-4 py-2">Collection Name</th>
                              <th className="border-0 py-2">Slug</th>
                              <th className="border-0 py-2">Products</th>
                              <th className="border-0 text-end pe-4 py-2">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {categoriesList.map((cat) => (
                              <tr key={cat.id} style={{ borderBottom: "1px solid #f1f2f4" }}>
                                <td className="border-0 ps-4 py-2">
                                  <div className="d-flex align-items-center gap-2">
                                    <div
                                      className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0 fw-bold"
                                      style={{ width: 30, height: 30, background: "#FFF3E0", color: "#FF5722", fontSize: "0.75rem", border: "1px solid #c3e9df" }}
                                    >
                                      {(cat.name || "C").charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <div className="fw-semibold fs-7" style={{ color: "#202223" }}>{cat.name}</div>
                                      {cat.description && (
                                        <div className="text-truncate" style={{ color: "#6d7175", maxWidth: 220, fontSize: "0.7rem" }}>{cat.description}</div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="border-0 py-2">
                                  <code style={{ background: "#f1f2f4", padding: "1px 6px", borderRadius: 4, fontSize: "0.72rem", color: "#454f5b" }}>
                                    {cat.slug || (cat.name || "").toLowerCase().replace(/\s+/g, "-")}
                                  </code>
                                </td>
                                <td className="border-0 py-2 fw-bold fs-7" style={{ color: "#202223" }}>{cat.products_count ?? 0}</td>
                                <td className="border-0 text-end pe-4 py-2">
                                  <div className="d-flex justify-content-end gap-1">
                                    <button
                                      onClick={() => { setEditingCategory(cat); setCategoryForm({ name: cat.name, description: cat.description || "", featured: !!cat.featured }); setShowCategoryModal(true); }}
                                      className="btn btn-sm btn-light border"
                                      style={{ color: "#6d7175", padding: "2px 8px" }}
                                      title="Edit collection"
                                    >
                                      <Edit size={13} />
                                    </button>
                                    <button
                                      onClick={() => confirmDeleteCategory(cat)}
                                      className="btn btn-sm btn-light border"
                                      style={{ color: "#d82c0d", padding: "2px 8px" }}
                                      title="Delete collection"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* ── PRODUCTS PANEL ── */}
                  <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <div className="d-flex align-items-center justify-content-between px-4 py-3" style={{ borderBottom: "1px solid #f1f2f4" }}>
                      <div className="d-flex align-items-center gap-2">
                        <Package size={16} style={{ color: "#FF5722" }} />
                        <h4 className="fs-6 font-bold mb-0" style={{ color: "#202223" }}>Products</h4>
                        <span style={{ background: "#f1f2f4", color: "#6d7175", padding: "1px 8px", borderRadius: "10px", fontSize: "0.72rem", fontWeight: 700 }}>
                          {productsList.length}
                        </span>
                        <span className="fs-9 fw-semibold" style={{ color: "#6d7175", fontSize: "0.7rem" }}>• Store ID #{activeStore.id}</span>
                      </div>
                      <button
                        onClick={() => openAddProductModal()}
                        className="btn btn-sm d-flex align-items-center gap-1 fw-bold"
                        style={{ background: "#1c2226", color: "#fff", borderRadius: "6px", fontSize: "0.78rem" }}
                      >
                        <Plus size={14} /> Add Product
                      </button>
                    </div>

                    {productsList.length === 0 ? (
                      showInlineProductForm ? (
                        <div className="bg-white p-4" style={{ borderRadius: "8px", border: "1px solid #dfe3e8" }}>
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h4 className="fs-6 font-bold mb-0" style={{ color: "#202223" }}>Add First Product</h4>
                            <button type="button" onClick={() => setShowInlineProductForm(false)} className="btn btn-sm btn-light border py-1">Cancel</button>
                          </div>
                          <form onSubmit={(e) => { handleAddProductSubmit(e); setShowInlineProductForm(false); }} className="d-flex flex-column gap-2 fs-7">
                            
              <div>
                <label className="mb-1 fs-8 fw-semibold" style={{ color: "#454f5b" }}>Product Name *</label>
                <input required value={newProd.name} onChange={(e) => setNewProd({ ...newProd, name: e.target.value })} className="form-control" style={{ border: "1px solid #dfe3e8", color: "#202223", backgroundColor: "#fafbfc" }} placeholder="e.g. Silk Scarf" />
              </div>
              <div className="row g-2">
                <div className="col-4">
                  <label className="mb-1 fs-8 fw-semibold" style={{ color: "#454f5b" }}>Price *</label>
                  <input required value={newProd.price} onChange={(e) => setNewProd({ ...newProd, price: e.target.value })} className="form-control" style={{ border: "1px solid #dfe3e8", color: "#202223", backgroundColor: "#fafbfc" }} placeholder={`${currencySymbol}34.00`} />
                </div>
                <div className="col-4">
                  <label className="mb-1 fs-8 fw-semibold" style={{ color: "#454f5b" }}>Original Price</label>
                  <input value={newProd.compare_price || ''} onChange={(e) => setNewProd({ ...newProd, compare_price: e.target.value })} className="form-control" style={{ border: "1px solid #dfe3e8", color: "#202223", backgroundColor: "#fafbfc" }} placeholder={`${currencySymbol}50.00`} />
                </div>
                <div className="col-4">
                  <label className="mb-1 fs-8 fw-semibold" style={{ color: "#454f5b" }}>Discount %</label>
                  <input type="number" min="0" max="100" value={newProd.discount_percentage || ''} onChange={(e) => {
                    const discount = e.target.value;
                    const cp = parseFloat(String(newProd.compare_price).replace(/[^0-9.]/g, ""));
                    let newPrice = newProd.price;
                    if (cp && discount) {
                      newPrice = (cp - (cp * (parseFloat(discount) / 100))).toFixed(2);
                    }
                    setNewProd({ ...newProd, discount_percentage: discount, price: newPrice });
                  }} className="form-control" style={{ border: "1px solid #dfe3e8", color: "#202223", backgroundColor: "#fafbfc" }} placeholder="e.g. 20" />
                </div>
              </div>
              <div className="row g-2">
                <div className="col-4">
                  <label className="mb-1 fs-8 fw-semibold" style={{ color: "#454f5b" }}>Stock</label>
                  <input type="number" min="0" value={newProd.stock} onChange={(e) => setNewProd({ ...newProd, stock: e.target.value })} className="form-control" style={{ border: "1px solid #dfe3e8", color: "#202223", backgroundColor: "#fafbfc" }} placeholder="10" />
                </div>
                <div className="col-8">
                  <div className="row g-2">
                    <div className="col-12">
                      <label className="mb-1 fs-8 fw-semibold" style={{ color: "#454f5b" }}>Colors</label>
                      <div className="d-flex flex-wrap gap-1">
                        {['Red', 'Blue', 'Green', 'Black', 'White', 'Grey', 'Pink', 'Yellow', 'Brown', 'Purple'].map(c => {
                          const currentColors = newProd.color ? newProd.color.split(',').map(s=>s.trim()).filter(Boolean) : [];
                          const isSelected = currentColors.includes(c);
                          return (
                            <button
                              key={c}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                if (isSelected) setNewProd({...newProd, color: currentColors.filter(x => x !== c).join(', ')});
                                else setNewProd({...newProd, color: [...currentColors, c].join(', ')});
                              }}
                              className="btn btn-sm"
                              style={{ 
                                borderRadius: '12px', padding: '2px 8px', fontSize: '11px',
                                background: isSelected ? '#1c2226' : '#fff',
                                color: isSelected ? '#fff' : '#454f5b',
                                border: `1px solid ${isSelected ? '#1c2226' : '#dfe3e8'}`
                              }}
                            >
                              {c}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="col-12 mt-2">
                      <label className="mb-1 fs-8 fw-semibold" style={{ color: "#454f5b" }}>Sizes</label>
                      <div className="d-flex flex-wrap gap-1">
                        {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'].map(s => {
                          const currentSizes = newProd.size ? newProd.size.split(',').map(x=>x.trim()).filter(Boolean) : [];
                          const isSelected = currentSizes.includes(s);
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                if (isSelected) setNewProd({...newProd, size: currentSizes.filter(x => x !== s).join(', ')});
                                else setNewProd({...newProd, size: [...currentSizes, s].join(', ')});
                              }}
                              className="btn btn-sm fw-bold"
                              style={{ 
                                borderRadius: '6px', padding: '2px 8px', fontSize: '11px', minWidth: '32px',
                                background: isSelected ? '#1c2226' : '#fff',
                                color: isSelected ? '#fff' : '#454f5b',
                                border: `1px solid ${isSelected ? '#1c2226' : '#dfe3e8'}`
                              }}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-1 fs-8 fw-semibold" style={{ color: "#454f5b" }}>Description</label>
                <textarea
                  value={newProd.description || ''}
                  onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      setNewProd({ ...newProd, description: (newProd.description || '') + '\n• ' });
                    }
                  }}
                  onFocus={(e) => {
                    if (!newProd.description) {
                      setNewProd({ ...newProd, description: '• ' });
                    }
                  }}
                  rows="3"
                  className="form-control"
                  style={{ border: "1px solid #dfe3e8", color: "#202223", backgroundColor: "#fafbfc" }}
                  placeholder="• Enter product description (press Enter for new bullet point)"
                />
              </div>
              <div>
                <label className="mb-1 fs-8 fw-semibold" style={{ color: "#454f5b" }}>Category</label>
                <select
                  value={newProd.category}
                  onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
                  className="form-select"
                  style={{ border: "1px solid #dfe3e8", color: "#202223", backgroundColor: "#fafbfc" }}
                  required
                >
                  <option value="">Select a Collection</option>
                  {categoriesList && categoriesList.map(cat => (
                    <option key={cat.id || cat.name} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                  <option value="Uncategorized">Uncategorized</option>
                </select>
              </div>
              <div>
                <label className="mb-1 fs-8 fw-semibold" style={{ color: "#454f5b" }}>Product Images Upload (Multiple)</label>
                <div className="mb-3">
                  <label 
                    className="position-relative d-flex flex-column align-items-center justify-content-center cursor-pointer w-100" 
                    style={{ height: 120, background: "#f8f9fa", border: "2px dashed #FF5722", borderRadius: "12px", transition: "all 0.2s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#e6f4ea"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#f8f9fa"; }}
                  >
                    <div className="d-flex align-items-center justify-content-center mb-2" style={{ width: 40, height: 40, borderRadius: "50%", background: "#e6f4ea" }}>
                      <Plus size={24} style={{ color: "#FF5722" }} />
                    </div>
                    <span className="fs-8 fw-semibold" style={{ color: "#FF5722" }}>Click here to upload images</span>
                    <span className="fs-9 mt-1" style={{ color: "#6c757d" }}>Supports JPG, PNG, WEBP files</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files);
                        if (!files.length) return;
                        const readers = files.map(file => new Promise((resolve) => {
                          const reader = new FileReader();
                          reader.onloadend = () => resolve(reader.result);
                          reader.readAsDataURL(file);
                        }));
                        const results = await Promise.all(readers);
                        const currentImages = newProd.images?.length > 0 ? newProd.images : (newProd.image ? [{ url: newProd.image, color: '' }] : []);
                        const newImages = [...currentImages, ...results.map(url => ({ url, color: '' }))];
                        setNewProd({ ...newProd, images: newImages, image: newImages[0]?.url || '' });
                        e.target.value = null;
                      }}
                      className="d-none"
                    />
                  </label>
                </div>
                
                <div className="d-flex flex-wrap gap-3 mt-3">
                  {(newProd.images?.length > 0 ? newProd.images : (newProd.image ? [{ url: newProd.image, color: '' }] : [])).map((imgObj, idx) => (
                    <div key={idx} className="position-relative p-2 rounded d-flex flex-column align-items-center" style={{ background: "#f9fafb", border: "1px dashed #dfe3e8" }}>
                      <img
                        src={normalizeProductImage(imgObj.url, newProd.name)}
                        alt={`Preview ${idx}`}
                        className="rounded object-cover mb-2"
                        style={{ width: 80, height: 80, border: "1px solid #dfe3e8" }}
                        onError={(e) => { e.target.src = getFallbackImageByName(newProd.name); }}
                      />
                      {newProd.color && (
                        <select 
                          className="form-select form-select-sm" 
                          style={{ fontSize: '0.75rem', padding: '0.1rem 1rem 0.1rem 0.4rem', minWidth: '80px' }}
                          value={imgObj.color || ''}
                          onChange={(e) => {
                            const updatedImages = [...newProd.images];
                            updatedImages[idx] = { ...updatedImages[idx], color: e.target.value };
                            setNewProd({ ...newProd, images: updatedImages });
                          }}
                        >
                          <option value="">No Color</option>
                          {newProd.color.split(',').map(c => c.trim()).filter(Boolean).map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      )}
                      <button 
                        type="button" 
                        onClick={() => {
                           const currentImages = newProd.images?.length > 0 ? newProd.images : (newProd.image ? [{ url: newProd.image, color: '' }] : []);
                           const updated = currentImages.filter((_, i) => i !== idx);
                           setNewProd({ ...newProd, images: updated, image: updated[0]?.url || '' });
                        }}
                        className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border-0" 
                        style={{ padding: '0.2rem 0.4rem', cursor: 'pointer' }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <button type="submit" className="btn text-white w-100 mt-3 py-2 fw-bold" style={{ background: "#1c2226", borderRadius: "8px" }}>{editingProduct ? "Save Changes" : "Add Product"}</button>
            
                          </form>
                        </div>
                      ) : (
                        <div className="text-center py-5 px-4">
                          <Package size={32} style={{ color: "#c9cccf", marginBottom: 10 }} />
                          <p className="fs-8 mb-2" style={{ color: "#6d7175" }}>No products found for Store ID #{activeStore.id}</p>
                          <button
                            onClick={() => { setShowInlineProductForm(true); resetProductForm(); }}
                            className="btn btn-sm fw-bold"
                            style={{ background: "#FF5722", color: "#fff", borderRadius: "6px" }}
                          >
                            Add First Product
                          </button>
                        </div>
                      )
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-hover mb-0 align-middle border-0">
                          <thead>
                            <tr className="fs-8 fw-semibold" style={{ color: "#6d7175", background: "#f9fafb", borderBottom: "1px solid #e4e5e7" }}>
                              <th className="border-0 ps-4 py-2">Product</th>
                              <th className="border-0 py-2">SKU</th>
                              <th className="border-0 py-2">Collection</th>
                              <th className="border-0 py-2">Color</th>
                              <th className="border-0 py-2">Size</th>
                              <th className="border-0 py-2">Price</th>
                              <th className="border-0 py-2">Stock</th>
                              <th className="border-0 py-2">Status</th>
                              <th className="border-0 text-end pe-4 py-2">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {productsList.map((p) => (
                              <tr key={p.id} style={{ borderBottom: "1px solid #f1f2f4" }}>
                                <td className="border-0 ps-4 py-2">
                                  <div className="d-flex align-items-center gap-2">
                                    <div className="rounded overflow-hidden flex-shrink-0" style={{ width: 36, height: 36, border: "1px solid #dfe3e8", background: "#f1f2f4" }}>
                                      <img
                                        src={normalizeProductImage(p.image, p.name)}
                                        alt={p.name}
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                        onError={(e) => { e.target.src = getFallbackImageByName(p.name); }}
                                      />
                                    </div>
                                    <span className="fw-semibold fs-7 text-truncate" style={{ color: "#202223", maxWidth: 160 }}>{p.name}</span>
                                  </div>
                                </td>
                                <td className="border-0 py-2">
                                  <code style={{ background: "#f1f2f4", padding: "1px 6px", borderRadius: 4, fontSize: "0.72rem", color: "#454f5b" }}>{p.sku || "—"}</code>
                                </td>
                                <td className="border-0 py-2 fs-8" style={{ color: "#6d7175" }}>{p.category || "—"}</td>
                                <td className="border-0 py-2 fs-8" style={{ color: "#6d7175" }}>{p.color || "—"}</td>
                                <td className="border-0 py-2 fs-8" style={{ color: "#6d7175" }}>{p.size || "—"}</td>
                                <td className="border-0 py-2">
                                  <div className="d-flex flex-column">
                                    <div className="d-flex align-items-baseline gap-1">
                                      <span className="fw-semibold fs-7" style={{ color: "#202223" }}>{p.price}</span>
                                      {(() => {
                                        try {
                                          if (!p.compare_price) return null;
                                          const cmp = parseFloat(String(p.compare_price).replace(/[^0-9.]/g, ""));
                                          const prc = parseFloat(String(p.price).replace(/[^0-9.]/g, ""));
                                          if (isNaN(cmp) || isNaN(prc) || cmp <= prc || cmp === 0) return null;
                                          const pct = Math.round(((cmp - prc) / cmp) * 100);
                                          return (
                                            <span style={{ color: "#388e3c", fontSize: "0.7rem", fontWeight: "600" }}>
                                              — {pct}% OFF
                                            </span>
                                          );
                                        } catch (e) { return null; }
                                      })()}
                                    </div>
                                    {(() => {
                                      try {
                                        if (!p.compare_price) return null;
                                        const cmp = parseFloat(String(p.compare_price).replace(/[^0-9.]/g, ""));
                                        const prc = parseFloat(String(p.price).replace(/[^0-9.]/g, ""));
                                        if (isNaN(cmp) || isNaN(prc) || cmp === prc) return null;
                                        return <span className="text-muted fs-8 text-decoration-line-through">{p.compare_price}</span>;
                                      } catch (e) { return null; }
                                    })()}
                                  </div>
                                </td>
                                <td className="border-0 py-2 fw-bold fs-7" style={{ color: "#202223" }}>{p.stock}</td>
                                <td className="border-0 py-2">
                                  <span style={{
                                    background: p.status === "In Stock" ? "#FFE0D0" : p.status === "Low Stock" ? "#fef08a" : "#ffd2cc",
                                    color: p.status === "In Stock" ? "#FF5722" : p.status === "Low Stock" ? "#854d0e" : "#d82c0d",
                                    padding: "2px 8px", borderRadius: "10px", fontSize: "0.7rem", fontWeight: 700
                                  }}>
                                    {p.status}
                                  </span>
                                </td>
                                <td className="border-0 text-end pe-4 py-2">
                                  <div className="d-flex justify-content-end gap-1">
                                    <button
                                      onClick={() => openEditProductModal(p)}
                                      className="btn btn-sm btn-light border"
                                      style={{ color: "#6d7175", padding: "2px 8px" }}
                                      title="Edit product"
                                    >
                                      <Edit size={13} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteProduct(p)}
                                      className="btn btn-sm btn-light border"
                                      style={{ color: "#d82c0d", padding: "2px 8px" }}
                                      title="Delete product"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                </>
              )}
            </div>
          )}



          {/* MODULE: PAYMENT GATEWAY (DUMMY) */}
          {active === "payment" && (
            <div className="d-flex flex-column gap-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h2 className="fs-4 font-bold mb-0" style={{ color: "#202223" }}>Payment Gateway</h2>
                  <p className="fs-8 mb-0" style={{ color: "#6d7175" }}>Configure your store payment providers.</p>
                </div>
              </div>
              <div style={{ background: "#ffffff", border: "1px dashed #dfe3e8", borderRadius: "8px", padding: "40px", textAlign: "center", margin: "16px 0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                <div className="w-16 h-16 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ background: "rgba(255,87,34,0.1)", color: "#FF5722" }}>
                  <CreditCard size={34} />
                </div>
                <h2 className="fs-3 font-bold mb-2" style={{ color: "#202223" }}>Payment Configuration</h2>
                <p className="fs-7 max-w-md mx-auto mb-4" style={{ color: "#6d7175", maxWidth: 480, lineHeight: 1.6 }}>
                  Stripe and Razorpay integrations are currently being provisioned. Once complete, you can configure your payment settings here.
                </p>
                <button className="btn py-2.5 px-4 font-bold fs-7 d-inline-flex align-items-center gap-2 text-white" style={{ background: "#1c2226", borderRadius: "8px" }} disabled>
                  Setup Payments
                </button>
              </div>
            </div>
          )}



          {/* MODULE: DISCOUNTS (DUMMY) */}
          {active === "discounts" && (
            <div className="d-flex flex-column gap-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h2 className="fs-4 font-bold mb-0" style={{ color: "#202223" }}>Discounts</h2>
                  <p className="fs-8 mb-0" style={{ color: "#6d7175" }}>Manage promotional codes and automatic discounts.</p>
                </div>
              </div>
              {(() => {
                const discountedProducts = productsList.filter(p => {
                  try {
                    if (!p.compare_price) return false;
                    const cmp = parseFloat(String(p.compare_price).replace(/[^0-9.]/g, ""));
                    const prc = parseFloat(String(p.price).replace(/[^0-9.]/g, ""));
                    return !isNaN(cmp) && !isNaN(prc) && cmp > prc;
                  } catch(e) {
                    return false;
                  }
                });

                return discountedProducts.length === 0 ? (
                  <div style={{ background: "#ffffff", border: "1px dashed #dfe3e8", borderRadius: "8px", padding: "40px", textAlign: "center", margin: "16px 0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <div className="w-16 h-16 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ background: "rgba(255,87,34,0.1)", color: "#FF5722" }}>
                      <Percent size={34} />
                    </div>
                    <h2 className="fs-3 font-bold mb-2" style={{ color: "#202223" }}>No active discounts</h2>
                    <p className="fs-7 max-w-md mx-auto mb-4" style={{ color: "#6d7175", maxWidth: 480, lineHeight: 1.6 }}>
                      You don't have any products with an active discount. Edit a product and set a compare-at price to create a discount.
                    </p>
                  </div>
                ) : (
                  <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", margin: "16px 0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <div className="table-responsive">
                      <table className="table table-hover mb-0 align-middle border-0">
                        <thead>
                          <tr className="fs-8 fw-semibold" style={{ color: "#6d7175", background: "#f9fafb", borderBottom: "1px solid #e4e5e7" }}>
                            <th className="border-0 ps-4 py-2">Product</th>
                            <th className="border-0 py-2">Original Price</th>
                            <th className="border-0 py-2">Discounted Price</th>
                            <th className="border-0 py-2">Discount Amount</th>
                            <th className="border-0 text-end pe-4 py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {discountedProducts.map(p => {
                            const cmp = parseFloat(String(p.compare_price).replace(/[^0-9.]/g, ""));
                            const prc = parseFloat(String(p.price).replace(/[^0-9.]/g, ""));
                            const discountAmount = cmp - prc;
                            const discountPercentage = Math.round((discountAmount / cmp) * 100);
                            
                            return (
                              <tr key={p.id} style={{ borderBottom: "1px solid #f1f2f4" }}>
                                <td className="border-0 ps-4 py-3">
                                  <div className="d-flex align-items-center gap-2">
                                    <div className="rounded overflow-hidden flex-shrink-0" style={{ width: 36, height: 36, border: "1px solid #dfe3e8", background: "#f1f2f4" }}>
                                      <img
                                        src={normalizeProductImage(p.image, p.name)}
                                        alt={p.name}
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                        onError={(e) => { e.target.src = getFallbackImageByName(p.name); }}
                                      />
                                    </div>
                                    <span className="fw-semibold fs-7 text-truncate" style={{ color: "#202223", maxWidth: 160 }}>{p.name}</span>
                                  </div>
                                </td>
                                <td className="border-0 py-3 text-decoration-line-through text-muted fs-8">
                                  {p.compare_price}
                                </td>
                                <td className="border-0 py-3 fw-bold fs-7 text-success">
                                  {p.price}
                                </td>
                                <td className="border-0 py-3">
                                  <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 rounded-pill px-2 py-1 fs-8">
                                    {discountPercentage}% OFF
                                  </span>
                                </td>
                                <td className="border-0 text-end pe-4 py-3">
                                  <span className="badge" style={{ background: "#FFF3E0", color: "#FF5722", borderRadius: 4, fontWeight: 600 }}>Active</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </main>
      </div>

      {/* ADD PRODUCT MODAL */}
      {showAddProduct && (
        <div className="position-fixed top-0 bottom-0 start-0 end-0 bg-dark bg-opacity-75 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1050 }}>
          <div className="bg-white rounded-3 shadow w-100 p-4" style={{ maxWidth: 460, border: "1px solid #dfe3e8", maxHeight: "90vh", overflowY: "auto", overflowX: "hidden" }}>
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3" style={{ borderColor: "#dfe3e8" }}>
              <h3 className="fs-5 font-bold mb-0" style={{ color: "#202223" }}>{editingProduct ? `Edit Product` : "Add New Product"}</h3>
              <button onClick={closeProductModal} className="btn btn-sm p-0 border-0 bg-transparent" style={{ color: "#6d7175" }}>✕</button>
            </div>
            <form onSubmit={handleAddProductSubmit} className="d-flex flex-column gap-2 fs-7">
              <div>
                <label className="mb-1 fs-8 fw-semibold" style={{ color: "#454f5b" }}>Product Name *</label>
                <input required value={newProd.name} onChange={(e) => setNewProd({ ...newProd, name: e.target.value })} className="form-control" style={{ border: "1px solid #dfe3e8", color: "#202223", backgroundColor: "#fafbfc" }} placeholder="e.g. Silk Scarf" />
              </div>
              <div className="row g-2">
                <div className="col-4">
                  <label className="mb-1 fs-8 fw-semibold" style={{ color: "#454f5b" }}>Price *</label>
                  <input required value={newProd.price} onChange={(e) => setNewProd({ ...newProd, price: e.target.value })} className="form-control" style={{ border: "1px solid #dfe3e8", color: "#202223", backgroundColor: "#fafbfc" }} placeholder={`${currencySymbol}34.00`} />
                </div>
                <div className="col-4">
                  <label className="mb-1 fs-8 fw-semibold" style={{ color: "#454f5b" }}>Original Price</label>
                  <input value={newProd.compare_price || ''} onChange={(e) => setNewProd({ ...newProd, compare_price: e.target.value })} className="form-control" style={{ border: "1px solid #dfe3e8", color: "#202223", backgroundColor: "#fafbfc" }} placeholder={`${currencySymbol}50.00`} />
                </div>
                <div className="col-4">
                  <label className="mb-1 fs-8 fw-semibold" style={{ color: "#454f5b" }}>Discount %</label>
                  <input type="number" min="0" max="100" value={newProd.discount_percentage || ''} onChange={(e) => {
                    const discount = e.target.value;
                    const cp = parseFloat(String(newProd.compare_price).replace(/[^0-9.]/g, ""));
                    let newPrice = newProd.price;
                    if (cp && discount) {
                      newPrice = (cp - (cp * (parseFloat(discount) / 100))).toFixed(2);
                    }
                    setNewProd({ ...newProd, discount_percentage: discount, price: newPrice });
                  }} className="form-control" style={{ border: "1px solid #dfe3e8", color: "#202223", backgroundColor: "#fafbfc" }} placeholder="e.g. 20" />
                </div>
              </div>
              <div className="row g-2">
                <div className="col-4">
                  <label className="mb-1 fs-8 fw-semibold" style={{ color: "#454f5b" }}>Stock</label>
                  <input type="number" min="0" value={newProd.stock} onChange={(e) => setNewProd({ ...newProd, stock: e.target.value })} className="form-control" style={{ border: "1px solid #dfe3e8", color: "#202223", backgroundColor: "#fafbfc" }} placeholder="10" />
                </div>
                <div className="col-8">
                  <div className="row g-2">
                    <div className="col-12">
                      <label className="mb-1 fs-8 fw-semibold" style={{ color: "#454f5b" }}>Colors</label>
                      <div className="d-flex flex-wrap gap-1">
                        {['Red', 'Blue', 'Green', 'Black', 'White', 'Grey', 'Pink', 'Yellow', 'Brown', 'Purple'].map(c => {
                          const currentColors = newProd.color ? newProd.color.split(',').map(s=>s.trim()).filter(Boolean) : [];
                          const isSelected = currentColors.includes(c);
                          return (
                            <button
                              key={c}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                if (isSelected) setNewProd({...newProd, color: currentColors.filter(x => x !== c).join(', ')});
                                else setNewProd({...newProd, color: [...currentColors, c].join(', ')});
                              }}
                              className="btn btn-sm"
                              style={{ 
                                borderRadius: '12px', padding: '2px 8px', fontSize: '11px',
                                background: isSelected ? '#1c2226' : '#fff',
                                color: isSelected ? '#fff' : '#454f5b',
                                border: `1px solid ${isSelected ? '#1c2226' : '#dfe3e8'}`
                              }}
                            >
                              {c}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="col-12 mt-2">
                      <label className="mb-1 fs-8 fw-semibold" style={{ color: "#454f5b" }}>Sizes</label>
                      <div className="d-flex flex-wrap gap-1">
                        {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'].map(s => {
                          const currentSizes = newProd.size ? newProd.size.split(',').map(x=>x.trim()).filter(Boolean) : [];
                          const isSelected = currentSizes.includes(s);
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                if (isSelected) setNewProd({...newProd, size: currentSizes.filter(x => x !== s).join(', ')});
                                else setNewProd({...newProd, size: [...currentSizes, s].join(', ')});
                              }}
                              className="btn btn-sm fw-bold"
                              style={{ 
                                borderRadius: '6px', padding: '2px 8px', fontSize: '11px', minWidth: '32px',
                                background: isSelected ? '#1c2226' : '#fff',
                                color: isSelected ? '#fff' : '#454f5b',
                                border: `1px solid ${isSelected ? '#1c2226' : '#dfe3e8'}`
                              }}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-1 fs-8 fw-semibold" style={{ color: "#454f5b" }}>Description</label>
                <textarea
                  value={newProd.description || ''}
                  onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      setNewProd({ ...newProd, description: (newProd.description || '') + '\n• ' });
                    }
                  }}
                  onFocus={(e) => {
                    if (!newProd.description) {
                      setNewProd({ ...newProd, description: '• ' });
                    }
                  }}
                  rows="3"
                  className="form-control"
                  style={{ border: "1px solid #dfe3e8", color: "#202223", backgroundColor: "#fafbfc" }}
                  placeholder="• Enter product description (press Enter for new bullet point)"
                />
              </div>
              <div>
                <label className="mb-1 fs-8 fw-semibold" style={{ color: "#454f5b" }}>Category</label>
                <select
                  value={newProd.category}
                  onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
                  className="form-select"
                  style={{ border: "1px solid #dfe3e8", color: "#202223", backgroundColor: "#fafbfc" }}
                  required
                >
                  <option value="">Select a Collection</option>
                  {categoriesList && categoriesList.map(cat => (
                    <option key={cat.id || cat.name} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                  <option value="Uncategorized">Uncategorized</option>
                </select>
              </div>
              <div>
                <label className="mb-1 fs-8 fw-semibold" style={{ color: "#454f5b" }}>Product Images Upload (Multiple)</label>
                <div className="mb-3">
                  <label 
                    className="position-relative d-flex flex-column align-items-center justify-content-center cursor-pointer w-100" 
                    style={{ height: 120, background: "#f8f9fa", border: "2px dashed #FF5722", borderRadius: "12px", transition: "all 0.2s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#e6f4ea"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#f8f9fa"; }}
                  >
                    <div className="d-flex align-items-center justify-content-center mb-2" style={{ width: 40, height: 40, borderRadius: "50%", background: "#e6f4ea" }}>
                      <Plus size={24} style={{ color: "#FF5722" }} />
                    </div>
                    <span className="fs-8 fw-semibold" style={{ color: "#FF5722" }}>Click here to upload images</span>
                    <span className="fs-9 mt-1" style={{ color: "#6c757d" }}>Supports JPG, PNG, WEBP files</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files);
                        if (!files.length) return;
                        const readers = files.map(file => new Promise((resolve) => {
                          const reader = new FileReader();
                          reader.onloadend = () => resolve(reader.result);
                          reader.readAsDataURL(file);
                        }));
                        const results = await Promise.all(readers);
                        const currentImages = newProd.images?.length > 0 ? newProd.images : (newProd.image ? [{ url: newProd.image, color: '' }] : []);
                        const newImages = [...currentImages, ...results.map(url => ({ url, color: '' }))];
                        setNewProd({ ...newProd, images: newImages, image: newImages[0]?.url || '' });
                        e.target.value = null;
                      }}
                      className="d-none"
                    />
                  </label>
                </div>
                
                <div className="d-flex flex-wrap gap-3 mt-3">
                  {(newProd.images?.length > 0 ? newProd.images : (newProd.image ? [{ url: newProd.image, color: '' }] : [])).map((imgObj, idx) => (
                    <div key={idx} className="position-relative p-2 rounded d-flex flex-column align-items-center" style={{ background: "#f9fafb", border: "1px dashed #dfe3e8" }}>
                      <img
                        src={normalizeProductImage(imgObj.url, newProd.name)}
                        alt={`Preview ${idx}`}
                        className="rounded object-cover mb-2"
                        style={{ width: 80, height: 80, border: "1px solid #dfe3e8" }}
                        onError={(e) => { e.target.src = getFallbackImageByName(newProd.name); }}
                      />
                      {newProd.color && (
                        <select 
                          className="form-select form-select-sm" 
                          style={{ fontSize: '0.75rem', padding: '0.1rem 1rem 0.1rem 0.4rem', minWidth: '80px' }}
                          value={imgObj.color || ''}
                          onChange={(e) => {
                            const updatedImages = [...newProd.images];
                            updatedImages[idx] = { ...updatedImages[idx], color: e.target.value };
                            setNewProd({ ...newProd, images: updatedImages });
                          }}
                        >
                          <option value="">No Color</option>
                          {newProd.color.split(',').map(c => c.trim()).filter(Boolean).map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      )}
                      <button 
                        type="button" 
                        onClick={() => {
                           const currentImages = newProd.images?.length > 0 ? newProd.images : (newProd.image ? [{ url: newProd.image, color: '' }] : []);
                           const updated = currentImages.filter((_, i) => i !== idx);
                           setNewProd({ ...newProd, images: updated, image: updated[0]?.url || '' });
                        }}
                        className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border-0" 
                        style={{ padding: '0.2rem 0.4rem', cursor: 'pointer' }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <button type="submit" className="btn text-white w-100 mt-3 py-2 fw-bold" style={{ background: "#1c2226", borderRadius: "8px" }}>{editingProduct ? "Save Changes" : "Add Product"}</button>
            </form>
          </div>
        </div>
      )}

      {/* PRINT INVOICE MODAL */}
      {invoiceModalOrder && (
        <div className="position-fixed top-0 bottom-0 start-0 end-0 bg-dark bg-opacity-75 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1050 }}>
          <div className="bg-white rounded-3 shadow w-100 p-4" style={{ maxWidth: 460, border: "1px solid #dfe3e8" }}>
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3" style={{ borderColor: "#dfe3e8" }}>
              <h3 className="fs-5 font-bold mb-0" style={{ color: "#202223" }}>Order Invoice: {invoiceModalOrder.id}</h3>
              <button onClick={() => setInvoiceModalOrder(null)} className="btn btn-sm p-0 border-0 bg-transparent" style={{ color: "#6d7175" }}>✕</button>
            </div>
            <div className="d-flex flex-column gap-3 fs-7 mb-4">
              <div className="d-flex justify-content-between"><span style={{ color: "#6d7175" }}>Customer:</span> <strong style={{ color: "#202223" }}>{invoiceModalOrder.customer}</strong></div>
              <div className="d-flex justify-content-between"><span style={{ color: "#6d7175" }}>Date:</span> <span style={{ color: "#202223" }}>{invoiceModalOrder.date}</span></div>
              <div className="d-flex justify-content-between"><span style={{ color: "#6d7175" }}>Items:</span> <strong style={{ color: "#202223" }}>{invoiceModalOrder.items}</strong></div>
              <div className="d-flex justify-content-between border-top pt-3 mt-1" style={{ borderColor: "#dfe3e8" }}>
                <span className="fw-bold" style={{ color: "#454f5b" }}>Total:</span> 
                <span className="fw-bold fs-6" style={{ color: "#FF5722" }}>{invoiceModalOrder.total}</span>
              </div>
            </div>
            <button onClick={() => { alert(`Printing invoice for ${invoiceModalOrder.id}...`); setInvoiceModalOrder(null); }} className="btn text-white w-100 py-2 fw-bold" style={{ background: "#1c2226", borderRadius: "8px" }}>
              <Printer size={16} className="me-2" /> Print Invoice
            </button>
          </div>
        </div>
      )}

      {/* ADD / EDIT CATEGORY MODAL */}
      {showCategoryModal && (
        <div className="position-fixed top-0 bottom-0 start-0 end-0 bg-dark bg-opacity-75 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1050 }}>
          <div className="bg-white rounded-3 shadow w-100 p-4" style={{ maxWidth: 460, border: "1px solid #dfe3e8" }}>
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3" style={{ borderColor: "#dfe3e8" }}>
              <h3 className="fs-5 font-bold mb-0" style={{ color: "#202223" }}>{editingCategory ? `Edit Category: ${editingCategory.name}` : "Add New Category"}</h3>
              <button onClick={closeCategoryModal} className="btn btn-sm p-0 border-0 bg-transparent" style={{ color: "#6d7175" }}>✕</button>
            </div>
            <form onSubmit={handleCategorySubmit} className="d-flex flex-column gap-3 fs-7">
              <div>
                <label className="mb-1 fs-8 fw-semibold" style={{ color: "#454f5b" }}>Category Name *</label>
                <input
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="form-control"
                  style={{ border: "1px solid #dfe3e8", color: "#202223", backgroundColor: "#fafbfc" }}
                  placeholder="e.g. Luxury Handbags"
                />
                {categoryForm.name && (
                  <div className="fs-9 mt-1 fw-medium" style={{ color: "#6d7175" }}>
                    Slug URL preview: <span style={{ color: "#FF5722" }}>/{categoryForm.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 fs-8 fw-semibold" style={{ color: "#454f5b" }}>Description</label>
                <textarea
                  rows="3"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="form-control"
                  style={{ border: "1px solid #dfe3e8", color: "#202223", backgroundColor: "#fafbfc" }}
                  placeholder="Summary of products in this category..."
                />
              </div>

              <div className="form-check">
                <input
                  type="checkbox"
                  id="categoryFeaturedCheck"
                  checked={categoryForm.featured}
                  onChange={(e) => setCategoryForm({ ...categoryForm, featured: e.target.checked })}
                  className="form-check-input"
                />
                <label htmlFor="categoryFeaturedCheck" className="form-check-label fs-7 cursor-pointer" style={{ color: "#202223" }}>
                  Feature this category on store homepage & navigation
                </label>
              </div>

              <div className="d-flex align-items-center justify-content-end gap-2 mt-2 pt-3 border-top" style={{ borderColor: "#dfe3e8" }}>
                <button type="button" onClick={closeCategoryModal} className="btn btn-sm px-3 py-2" style={{ background: "#f1f2f4", color: "#454f5b", border: "1px solid #dfe3e8", borderRadius: "6px", fontWeight: "600" }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm px-4 py-2 text-white fw-bold" style={{ background: "#1c2226", borderRadius: "6px" }}>
                  {editingCategory ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CATEGORY CONFIRMATION MODAL */}
      {deletingCategory && (
        <div className="position-fixed top-0 bottom-0 start-0 end-0 bg-dark bg-opacity-75 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1060 }}>
          <div className="bg-white rounded-3 shadow w-100 p-4" style={{ maxWidth: 420, border: "1px solid #dfe3e8" }}>
            <div className="d-flex align-items-center justify-content-between mb-2 pb-3 border-bottom" style={{ borderColor: "#dfe3e8" }}>
              <h3 className="fs-5 font-bold mb-0 d-flex align-items-center gap-2" style={{ color: "#d82c0d" }}>
                <AlertTriangle size={18} /> Delete Category
              </h3>
              <button onClick={() => setDeletingCategory(null)} className="btn btn-sm p-0 border-0 bg-transparent" style={{ color: "#6d7175" }}>✕</button>
            </div>
            <p className="fs-7 mt-3 mb-4" style={{ color: "#202223" }}>
              Are you sure you want to delete category <strong style={{ color: "#d82c0d" }}>"{deletingCategory.name}"</strong>?
              <br />
              <span className="fs-8 mt-1 d-block" style={{ color: "#6d7175" }}>Associated items in product catalog will be reassigned.</span>
            </p>
            <div className="d-flex align-items-center justify-content-end gap-2 pt-3 border-top" style={{ borderColor: "#dfe3e8" }}>
              <button onClick={() => setDeletingCategory(null)} className="btn btn-sm px-3 py-2" style={{ background: "#f1f2f4", color: "#454f5b", border: "1px solid #dfe3e8", borderRadius: "6px", fontWeight: "600" }}>
                Cancel
              </button>
              <button onClick={handleDeleteCategoryExecute} className="btn btn-sm px-4 py-2 text-white fw-bold" style={{ background: "#d82c0d", borderRadius: "6px" }}>
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER ORDERED PRODUCTS DETAILS MODAL */}
      {selectedCustomerModal && (
        <div className="position-fixed top-0 bottom-0 start-0 end-0 bg-dark bg-opacity-75 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1060 }}>
          <div className="gold-panel w-100" style={{ maxWidth: 500 }}>
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2" style={{ borderColor: "rgba(212,175,55,0.2)" }}>
              <div className="d-flex align-items-center gap-2">
                <div className="w-8 h-8 rounded-circle d-flex align-items-center justify-content-center font-bold text-xs" style={{ background: `linear-gradient(135deg, ${GOLD_DEEP}, ${GOLD_LIGHT})`, color: "#050505" }}>
                  {selectedCustomerModal.name ? selectedCustomerModal.name[0].toUpperCase() : "C"}
                </div>
                <div>
                  <h3 className="fs-6 font-bold text-warning mb-0">{selectedCustomerModal.name}</h3>
                  <span className="fs-8 text-muted">{selectedCustomerModal.id} • Joined {selectedCustomerModal.joined}</span>
                </div>
              </div>
              <button onClick={() => setSelectedCustomerModal(null)} className="btn btn-sm text-muted p-0 border-0 bg-transparent">✕</button>
            </div>

            <div className="d-flex flex-column gap-3 fs-7">
              {/* Customer Contact & Summary info */}
              <div className="p-3 rounded-3" style={{ background: "#0c0b09", border: "1px solid rgba(212,175,55,0.15)" }}>
                <div className="row g-2">
                  <div className="col-6">
                    <span className="fs-8 text-muted d-block">Email Address</span>
                    <strong className="text-white fs-7">{selectedCustomerModal.email}</strong>
                  </div>
                  <div className="col-6">
                    <span className="fs-8 text-muted d-block">Phone Number</span>
                    <strong className="text-white fs-7">{selectedCustomerModal.phone || "N/A"}</strong>
                  </div>
                  <div className="col-6 mt-2">
                    <span className="fs-8 text-muted d-block">Total Orders</span>
                    <strong className="text-warning fs-7">{selectedCustomerModal.orders} orders</strong>
                  </div>
                  <div className="col-6 mt-2">
                    <span className="fs-8 text-muted d-block">Total Spent</span>
                    <strong className="text-success fs-7">{selectedCustomerModal.spent}</strong>
                  </div>
                </div>
              </div>

              {/* Ordered Products List */}
              <div>
                <h4 className="fs-7 font-bold text-white mb-2 d-flex align-items-center justify-content-between">
                  <span>Ordered Products History</span>
                  <span className="badge bg-dark border border-warning text-warning fs-8">
                    {selectedCustomerModal.orderedProducts ? selectedCustomerModal.orderedProducts.length : 0} items
                  </span>
                </h4>

                <div className="d-flex flex-column gap-2" style={{ maxHeight: 220, overflowY: "auto" }}>
                  {selectedCustomerModal.orderedProducts && selectedCustomerModal.orderedProducts.length > 0 ? (
                    selectedCustomerModal.orderedProducts.map((prod, idx) => (
                      <div key={idx} className="d-flex align-items-center justify-content-between p-2 rounded-2" style={{ background: "#14110d", border: "1px solid rgba(212,175,55,0.1)" }}>
                        <div className="d-flex align-items-center gap-2">
                          <div className="p-1 rounded bg-dark border border-secondary text-warning">
                            <Package size={14} />
                          </div>
                          <span className="fw-semibold text-white fs-7">{prod}</span>
                        </div>
                        <span className="fs-8 text-success font-mono">Delivered</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-3 text-muted fs-8">No order items found for this customer.</div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-top text-end" style={{ borderColor: "rgba(212,175,55,0.15)" }}>
                <button onClick={() => setSelectedCustomerModal(null)} className="btn btn-gold-primary btn-sm px-4 py-2">
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* DELETE STORE CONFIRMATION MODAL */}
      {showDeleteStoreModal && (
        <div className="position-fixed top-0 bottom-0 start-0 end-0 bg-dark bg-opacity-75 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1060 }}>
          <div className="bg-white w-100 rounded-3 shadow-sm border" style={{ maxWidth: 430, borderColor: "#dfe3e8" }}>
            <div className="d-flex align-items-center justify-content-between p-3 border-bottom" style={{ borderColor: "#dfe3e8" }}>
              <h3 className="fs-5 font-bold mb-0 d-flex align-items-center gap-2 text-danger">
                <AlertTriangle size={18} /> Delete Store
              </h3>
              <button onClick={() => setShowDeleteStoreModal(false)} className="btn btn-sm p-0 border-0 bg-transparent" style={{ color: "#6d7175" }}>✕</button>
            </div>
            <div className="p-3">
              <p className="fs-7 mt-2 mb-3" style={{ color: "#202223" }}>
                Are you sure you want to delete store <strong style={{ color: "#202223" }}>"{activeStore?.name}"</strong>?
                <br />
                <span className="fs-8 mt-1 d-block" style={{ color: "#6d7175" }}>This action will remove the store workspace from your merchant dashboard.</span>
              </p>
              <div className="d-flex align-items-center justify-content-end gap-2 pt-3 border-top mt-1" style={{ borderColor: "#dfe3e8" }}>
                <button onClick={() => setShowDeleteStoreModal(false)} className="btn btn-sm btn-light border px-3 py-2" style={{ color: "#202223", backgroundColor: "#ffffff" }}>
                  Cancel
                </button>
                <button onClick={handleDeleteStoreExecute} className="btn btn-danger btn-sm px-3 py-2">
                  Delete Store
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

