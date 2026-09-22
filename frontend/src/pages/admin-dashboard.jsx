import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { fetchStores, fetchStoreOwners, fetchUsers, fetchProducts, fetchCategories, fetchOrders, fetchInventory } from "../api/admin";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  LayoutDashboard, Store, Users, Boxes, Tag, CreditCard, FileText,
  Settings, Bell, Search, TrendingUp, TrendingDown, DollarSign,
  Clock, LogOut, Crown, Activity, Package, CheckCircle, AlertTriangle,
  Plus, Trash2, Eye, Shield, RefreshCw, Download, Check, X, ShieldAlert,
  Server, Zap, Globe, Sliders
} from "lucide-react";
import "../styles/dashboard-premium.css";


const GOLD = "#d4af37";
const GOLD_LIGHT = "#f3d675";
const GOLD_DEEP = "#8a6d1f";

const adminLinks = [
  { key: "dashboard", label: "Overview", icon: LayoutDashboard },
  { key: "stores", label: "Stores", icon: Store },
  { key: "users", label: "Users", icon: Users },
  { key: "categories", label: "Categories", icon: Tag },
  { key: "analytics", label: "Analytics", icon: Activity },
  { key: "reports", label: "Reports", icon: Activity },
  { key: "settings", label: "Settings", icon: Settings },
];

const platformRevenue = [
  { m: "Jan", v: 42000, gmv: 340000 },
  { m: "Feb", v: 48000, gmv: 390000 },
  { m: "Mar", v: 51000, gmv: 420000 },
  { m: "Apr", v: 58000, gmv: 490000 },
  { m: "May", v: 62000, gmv: 540000 },
  { m: "Jun", v: 71000, gmv: 620000 },
  { m: "Jul", v: 84210, gmv: 780000 },
];

const topCategoriesData = [
  { name: "Apparel", v: 42 },
  { name: "Electronics", v: 38 },
  { name: "Home Decor", v: 28 },
  { name: "Textiles", v: 19 },
];

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    if (Array.isArray(value.data)) return value.data;
    if (Array.isArray(value.items)) return value.items;
    if (Array.isArray(value.products)) return value.products;
    if (Array.isArray(value.stores)) return value.stores;
    if (Array.isArray(value.owners)) return value.owners;
  }
  return [];
};

// Dummy data removed; data will be fetched from backend APIs

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [active, setActive] = useState("dashboard");

  // State Collections
  const [storesList, setStoresList] = useState([]);
  const [ownersList, setOwnersList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [payoutsList, setPayoutsList] = useState([]);

  // Modals
  // Fetch data from API on mount
  useEffect(() => {
    fetchStores()
      .then(res => {
        const stores = toArray(res?.data ?? res);
        setStoresList(mergeStoresWithLocal(stores));
      })
      .catch(err => {
        console.error('Error fetching stores', err);
        setStoresList(loadLocalOwnerStores());
      });
    fetchStoreOwners()
      .then(res => setOwnersList(toArray(res?.data ?? res)))
      .catch(err => {
        console.debug('Store owners endpoint unavailable; using local fallback', err);
        setOwnersList([]);
      });
    fetchUsers()
      .then(res => setUsersList(toArray(res?.data ?? res)))
      .catch(err => {
        console.error('Error fetching users', err);
        setUsersList([]);
      });
    fetchCategories()
      .then(res => {
        const categories = toArray(res?.data ?? res);
        setCategoriesList(categories.map(normalizeAdminCategory));
      })
      .catch(err => {
        console.error('Error fetching categories', err);
        setCategoriesList([]);
      });
    fetchProducts()
      .then(res => setProductsList(toArray(res?.data ?? res).map(normalizeAdminProduct)))
      .catch(err => {
        console.error('Error fetching products', err);
        setProductsList(loadLocalOwnerProducts());
      });
    fetchOrders()
      .then(res => setOrdersList(toArray(res?.data ?? res)))
      .catch(err => {
        console.error('Error fetching orders', err);
        setOrdersList([]);
      });
    // Assuming payouts are separate endpoint; keep existing if needed
  }, []);

  const normalizeAdminProduct = (product) => {
    const stockQuantity = product.stock_quantity ?? product.stock ?? product.quantity ?? 0;
    const stockStatus = product.status
      ? product.status
      : stockQuantity <= 0
        ? 'Out of Stock'
        : stockQuantity <= 5
          ? 'Low Stock'
          : 'In Stock';

    return {
      ...product,
      name: product.name || product.title || '',
      price: typeof product.price === 'number' ? product.price : parseFloat(String(product.price || '').replace(/[^0-9.]/g, '')) || 0,
      description: product.description || '',
      stock_quantity: stockQuantity,
      status: stockStatus,
      category: product.category?.name ? { name: product.category.name } : (typeof product.category === 'string' ? { name: product.category } : product.category || { name: 'Uncategorized' }),
      store_name: product.store_name || product.store?.name || product.owner_name || '',
      image: product.image || product.photo || product.picture || '',
    };
  };

  const getProductOwnerMatch = (product, ownerFilter) => {
    if (!ownerFilter || ownerFilter === 'all') return true;

    const selectedOwnerId = ownerFilter?.id ?? ownerFilter?.owner_id ?? ownerFilter?.user_id ?? null;
    const selectedOwnerName = String(ownerFilter?.name || ownerFilter?.full_name || ownerFilter?.display_name || '').trim().toLowerCase();
    const selectedOwnerEmail = String(ownerFilter?.email || '').trim().toLowerCase();

    const productOwnerId = product?.owner_id ?? product?.user_id ?? product?.store?.user_id ?? product?.store?.owner_id ?? null;
    const productOwnerName = String(product?.owner_name || product?.owner?.name || product?.store?.owner_name || product?.store?.owner || product?.user_name || product?.user?.name || '').trim().toLowerCase();
    const productOwnerEmail = String(product?.owner_email || product?.owner?.email || product?.user_email || product?.user?.email || '').trim().toLowerCase();

    const ownerIdMatches = selectedOwnerId != null && productOwnerId != null && String(productOwnerId) === String(selectedOwnerId);
    const ownerNameMatches = Boolean(selectedOwnerName && productOwnerName && (productOwnerName === selectedOwnerName || productOwnerName.includes(selectedOwnerName) || selectedOwnerName.includes(productOwnerName)));
    const ownerEmailMatches = Boolean(selectedOwnerEmail && productOwnerEmail && (productOwnerEmail === selectedOwnerEmail || productOwnerEmail.includes(selectedOwnerEmail) || selectedOwnerEmail.includes(productOwnerEmail)));

    return ownerIdMatches || ownerNameMatches || ownerEmailMatches;
  };

  const normalizeAdminCategory = (category) => {
    const normalizedStatus = category?.status || (category?.featured ? 'Featured' : 'Active');

    return {
      ...category,
      id: category?.id ?? category?.category_id ?? 0,
      name: category?.name || category?.title || 'Unnamed Category',
      count: category?.count ?? category?.products_count ?? category?.product_count ?? 0,
      status: normalizedStatus,
    };
  };

  const normalizeAdminStore = (store) => {
    const ownerName = store?.owner_name || store?.owner?.name || store?.user?.name || store?.owner?.full_name || store?.user?.full_name || store?.owner || store?.owner_name || 'Unassigned';
    const categoryName = store?.category?.name || store?.category_name || store?.category || store?.type || 'General';

    return {
      ...store,
      id: store?.id ?? store?.store_id ?? 0,
      name: store?.name || store?.store_name || 'Unnamed Store',
      owner: ownerName,
      category: categoryName,
      status: store?.status || 'Active',
      domain: store?.domain || store?.subdomain || 'n/a',
      gmv: store?.gmv || store?.total_revenue || store?.revenue || '$0.00',
    };
  };

  const loadLocalOwnerStores = () => {
    try {
      const saved = localStorage.getItem('aureum_owner_stores');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((store) => normalizeAdminStore({
        ...store,
        store_name: store.name || store.store_name,
        slug: store.slug || store.subdomain || (store.name || 'store').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        subdomain: store.subdomain || store.slug || (store.name || 'store').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        category: store.category || store.category_name || 'General',
        owner_name: store.owner_name || store.owner || '',
      }));
    } catch (err) {
      console.debug('Failed to load local owner stores for admin view', err);
      return [];
    }
  };

  const mergeStoresWithLocal = (backendStores = []) => {
    const backendNormalized = Array.isArray(backendStores) ? backendStores.map(normalizeAdminStore) : [];
    const localStores = loadLocalOwnerStores();
    const seen = new Set();
    const merged = [...backendNormalized];

    backendNormalized.forEach((store) => {
      const key = store.id ? `id:${store.id}` : `${store.name}-${store.owner}`.toLowerCase();
      seen.add(key);
    });

    localStores.forEach((store) => {
      const key = store.id ? `id:${store.id}` : `${store.name}-${store.owner}`.toLowerCase();
      if (!seen.has(key)) {
        merged.push(store);
        seen.add(key);
      }
    });

    return merged;
  };

  const loadLocalOwnerProducts = (ownerFilter = null) => {
    try {
      const saved = localStorage.getItem('aureum_owner_products');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((product) => getProductOwnerMatch(product, ownerFilter))
        .map((product) => {
          const localProduct = {
            ...product,
            store: product.store || { name: product.store_name || product.store?.name || product.owner_name || '' },
            category: product.category && typeof product.category === 'string'
              ? product.category
              : product.category?.name || product.category || 'Uncategorized',
            owner_name: product.owner_name || product.store?.owner_name || '',
          };
          return normalizeAdminProduct(localProduct);
        });
    } catch (err) {
      console.debug('Failed to load local owner products for admin view', err);
      return [];
    }
  };

  const mergeProductsWithLocal = (backendProducts = [], ownerFilter = null) => {
    const backendNormalized = Array.isArray(backendProducts) ? backendProducts.map(normalizeAdminProduct).filter((product) => getProductOwnerMatch(product, ownerFilter)) : [];
    const localProducts = loadLocalOwnerProducts(ownerFilter);
    const seenKeys = new Set();

    const merged = [...backendNormalized];
    backendNormalized.forEach((product) => {
      const key = product.id ? `id:${product.id}` : `${product.name}-${product.store_name}`.toLowerCase();
      seenKeys.add(key);
    });

    localProducts.forEach((product) => {
      const key = product.id ? `id:${product.id}` : `${product.name}-${product.store_name}`.toLowerCase();
      if (!seenKeys.has(key)) {
        merged.push(product);
        seenKeys.add(key);
      }
    });

    return merged;
  };

  const refreshProductsList = async (ownerFilter = null) => {
    try {
      const res = await fetchProducts(ownerFilter?.id ?? null);
      const backendProducts = toArray(res?.data ?? res);
      setProductsList(mergeProductsWithLocal(backendProducts, ownerFilter));
    } catch (err) {
      console.error('Error refreshing products', err);
      setProductsList(loadLocalOwnerProducts(ownerFilter));
    }
  };

  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatFee, setNewCatFee] = useState("4.0%");
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("All");
  const [productStoreFilter, setProductStoreFilter] = useState("All Stores");
  const [ownerOnlyProducts, setOwnerOnlyProducts] = useState(false);
  const [selectedOwnerFilter, setSelectedOwnerFilter] = useState('all');

  useEffect(() => {
    if (active === "products") {
      refreshProductsList(selectedOwnerFilter === 'all' ? null : selectedOwnerFilter);
    }
  }, [active, selectedOwnerFilter]);

  // Settings state
  const [platformConfig, setPlatformConfig] = useState({
    name: "AUREUM Multi-Vendor E-Commerce Platform",
    commission: "4.5%",
    payoutCycle: "Weekly (Mondays)",
    supportEmail: "admin-support@aureum.local",
    maintenanceMode: false,
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  const [orderToast, setOrderToast] = useState("");

  const handleLogout = () => {
    navigate("/login");
  };

  const buildProductPlaceholderImage = (product) => {
    const name = String(product?.name || product?.title || "").toLowerCase();
    if (name.includes("sneaker") || name.includes("shoe") || name.includes("footwear")) {
      return "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=500";
    }
    if (name.includes("watch") || name.includes("chronograph") || name.includes("luxury")) {
      return "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500";
    }
    if (name.includes("tote") || name.includes("bag") || name.includes("leather")) {
      return "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500";
    }
    if (name.includes("earbud") || name.includes("headphone") || name.includes("audio") || name.includes("tech") || name.includes("wireless")) {
      return "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500";
    }
    if (name.includes("vase") || name.includes("decor") || name.includes("ceramic") || name.includes("home")) {
      return "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=500";
    }
    if (name.includes("kurta") || name.includes("apparel") || name.includes("shirt") || name.includes("dress") || name.includes("cloth")) {
      return "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500";
    }
    return "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500";
  };

  const getProductImageUrl = (product) => {
    if (product?.image && typeof product.image === 'string' && product.image.trim()) {
      return product.image;
    }
    return buildProductPlaceholderImage(product);
  };

  const handleOrderStatusChange = async (orderId, newStatus) => {
    setOrdersList(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    setOrderToast(`Order ${orderId} status updated to "${newStatus}"`);
    setTimeout(() => setOrderToast(""), 3500);

    try {
      const numericId = String(orderId).replace(/[^0-9]/g, "");
      if (numericId) {
        await api.put(`/orders/${numericId}/status`, { status: newStatus });
      }
    } catch (err) {
      console.debug("Backend API order status update fallback to local state", err);
    }
  };

  const handleStoreStatusToggle = (storeId, currentStatus) => {
    const nextStatus = currentStatus === "Active" ? "Suspended" : "Active";
    setStoresList(prev => prev.map(s => s.id === storeId ? { ...s, status: nextStatus } : s));
  };

  const handleOwnerStatusToggle = (ownerId, currentStatus) => {
    const nextStatus = currentStatus === "Active" ? "Suspended" : "Active";
    setOwnersList(prev => prev.map(o => o.id === ownerId ? { ...o, status: nextStatus } : o));
  };

  const handleAddCategorySubmit = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const cat = {
      id: Date.now(),
      name: newCatName,
      count: 0,
      commission: newCatFee.endsWith("%") ? newCatFee : `${newCatFee}%`,
      status: "Active"
    };
    setCategoriesList([...categoriesList, cat]);
    setShowAddCatModal(false);
    setNewCatName("");
  };

  const handlePayoutProcess = (payoutId) => {
    setPayoutsList(prev => prev.map(p => p.id === payoutId ? { ...p, status: "Processed" } : p));
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3500);
  };

  return (
    <div style={{ background: "#f1f2f4", color: "#202223", minHeight: "100vh" }} className="admin-root d-flex w-100">

      {/* 1. SUPER ADMIN SIDEBAR */}
      <aside className="store-sidebar d-flex flex-column justify-between p-3" style={{ width: 250, minWidth: 250, background: "#f7f7f7", borderRight: "1px solid #dfe3e8", minHeight: "100vh" }}>
        <div>
          {/* Brand Header */}
          <div className="d-flex align-items-center gap-2 p-2 mb-3 border-bottom" style={{ borderColor: "#dfe3e8", paddingBottom: "1rem" }}>
            <div className="brand-icon-box" style={{ background: "#ffffff", border: "1px solid #dfe3e8", color: "#202223", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, fontWeight: "bold" }}>
              A
            </div>
            <span className="brand-title fs-5 fw-bolder tracking-wide" style={{ color: "#202223", letterSpacing: "2px" }}>AUREUM</span>
          </div>

          {/* Role Subtitle */}
          <div className="px-2 pb-3 text-uppercase fs-8 font-medium tracking-wider" style={{ color: "#6d7175" }}>
            Super Admin Portal
          </div>

          {/* Nav List */}
          <nav className="d-flex flex-column gap-1">
            {adminLinks.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActive(item.key)}
                  className={`sidebar-link d-flex align-items-center gap-3 p-2.5 rounded-3 border-0 transition-all ${isActive ? "active" : ""}`}
                  style={{
                    background: isActive ? "rgba(0,127,95,0.1)" : "transparent",
                    color: isActive ? "#007f5f" : "#454f5b",
                    fontWeight: isActive ? "bold" : "600",
                    borderLeft: isActive ? "3px solid #007f5f" : "3px solid transparent",
                    textAlign: "left"
                  }}
                >
                  <Icon size={18} style={{ color: isActive ? "#007f5f" : "#6d7175" }} />
                  <span style={{ color: isActive ? "#007f5f" : "#454f5b" }}>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sign Out */}
        <div className="pt-3 border-top" style={{ borderColor: "#dfe3e8" }}>
          <button onClick={handleLogout} className="btn btn-sm btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT VIEW */}
      <div className="flex-grow-1 d-flex flex-column overflow-hidden" style={{ minWidth: 0 }}>

        {/* TOPBAR HEADER */}
        <header className="store-topbar d-flex align-items-center justify-content-between px-4 py-3" style={{ background: "#f7f7f7", borderBottom: "1px solid #dfe3e8" }}>
          <div>
            <div className="fs-8 text-uppercase tracking-wider" style={{ color: "#6d7175" }}>Executive Dashboard</div>
            <h1 className="fs-5 font-bold text-dark mb-0">Platform Overview & Management</h1>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="topbar-search-box d-none d-md-block">
              <span className="topbar-search-icon"><Search size={14} /></span>
              <input placeholder="Search platform..." style={{ background: "#ffffff", color: "#202223", border: "1px solid #dfe3e8" }} />
            </div>
            <div className="topbar-icon-btn">
              <Bell size={16} />
            </div>
            <div className="w-8 h-8 rounded-circle d-flex align-items-center justify-center font-bold text-xs" style={{ background: `linear-gradient(135deg, $"#007f5f", #8a6d1f)`, color: "#050505" }}>
              SA
            </div>
          </div>
        </header>

        {/* MAIN BODY AREA */}
        <main className="p-4 flex-grow-1 overflow-y-auto" style={{ background: "#f1f2f4" }}>

          {/* MODULE 1: DASHBOARD OVERVIEW */}
          {active === "dashboard" && (
            <div className="d-flex flex-column gap-4">

              {/* 6 METRIC STATS CARDS */}
              <div className="row g-3">
                <div className="col-6 col-md-4 col-lg-2">
                  <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "16px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <div className="fs-8 text-secondary mb-1">Platform Revenue</div>
                    <div className="fs-5 font-bold text-dark">$84,210</div>
                    <div className="fs-8 text-success font-semibold mt-1">+14.2% MTD</div>
                  </div>
                </div>
                <div className="col-6 col-md-4 col-lg-2">
                  <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "16px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <div className="fs-8 text-secondary mb-1">Total Stores</div>
                    <div className="fs-5 font-bold text-dark">{storesList.length}</div>
                    <div className="fs-8 text-success font-semibold mt-1">1,284 Active</div>
                  </div>
                </div>
                <div className="col-6 col-md-4 col-lg-2">
                  <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "16px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <div className="fs-8 text-secondary mb-1">Store Merchants</div>
                    <div className="fs-5 font-bold text-dark">{ownersList.length}</div>
                    <div className="fs-8 text-warning font-semibold mt-1">1 Pending</div>
                  </div>
                </div>
                <div className="col-6 col-md-4 col-lg-2">
                  <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "16px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <div className="fs-8 text-secondary mb-1">Total Users</div>
                    <div className="fs-5 font-bold text-dark">45,890</div>
                    <div className="fs-8 text-success font-semibold mt-1">+18.8%</div>
                  </div>
                </div>
                <div className="col-6 col-md-4 col-lg-2">
                  <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "16px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <div className="fs-8 text-secondary mb-1">Total GMV</div>
                    <div className="fs-5 font-bold text-dark">$2.48M</div>
                    <div className="fs-8 text-success font-semibold mt-1">+22.4%</div>
                  </div>
                </div>
                <div className="col-6 col-md-4 col-lg-2">
                  <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "16px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <div className="fs-8 text-secondary mb-1">System Uptime</div>
                    <div className="fs-5 font-bold text-dark">99.99%</div>
                    <div className="fs-8 text-emerald-400 font-semibold mt-1">Healthy</div>
                  </div>
                </div>
              </div>

              {/* CHARTS ROW */}
              <div className="row g-3">
                <div className="col-12 col-lg-8">
                  <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "20px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div>
                        <h3 className="fs-6 font-bold text-dark mb-0">Platform Revenue & GMV Growth</h3>
                        <p className="fs-8 text-secondary mb-0">Monthly commission fees collected from all stores</p>
                      </div>
                      <span className="badge bg-warning text-dark">YTD 2026</span>
                    </div>
                    <ResponsiveContainer width="100%" height={230}>
                      <AreaChart data={platformRevenue}>
                        <defs>
                          <linearGradient id="adminRevGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#007f5f" stopOpacity={0.45} />
                            <stop offset="100%" stopColor="#007f5f" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#dfe3e8" vertical={false} />
                        <XAxis dataKey="m" tick={{ fontSize: 11, fill: "#8a7a4d" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#8a7a4d" }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: 8, fontSize: 12, color: "#202223" }} />
                        <Area type="monotone" dataKey="v" stroke="#007f5f" strokeWidth={2.5} fill="url(#adminRevGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="col-12 col-lg-4">
                  <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "20px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <h3 className="fs-6 font-bold text-dark mb-1">Category Share</h3>
                    <p className="fs-8 text-secondary mb-3">GMV distribution by category</p>
                    <ResponsiveContainer width="100%" height={230}>
                      <BarChart data={topCategoriesData} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#8a7a4d" }} axisLine={false} tickLine={false} width={90} />
                        <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: 8, fontSize: 12, color: "#202223" }} />
                        <Bar dataKey="v" fill="#007f5f" radius={[0, 4, 4, 0]} barSize={16} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* RECENT STORES & MERCHANTS TABLE */}
              <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "20px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h3 className="fs-6 font-bold text-dark mb-0">Merchant Network Overview</h3>
                  <button onClick={() => setActive("stores")} className="btn btn-link text-warning fs-8 p-0 text-decoration-none">Manage Stores</button>
                </div>
                <div className="table-responsive">
                  <table className="table table-light table-hover mb-0 align-middle">
                    <thead>
                      <tr className="text-secondary fs-8">
                        <th>Store</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {storesList.map((s) => (
                        <tr key={s.id}>
                          <td className="fw-bold text-warning">{s.name}</td>
                          <td className="fs-8 text-secondary">{s.category}</td>
                          <td>
                            <span className={s.status === "Active" ? "badge bg-success text-white" : s.status === "Pending" ? "badge bg-warning text-dark" : "badge bg-danger text-white"}>
                              {s.status}
                            </span>
                          </td>
                          <td className="text-end">
                            <button onClick={() => handleStoreStatusToggle(s.id, s.status)} className="btn btn-sm btn-outline-warning fs-8 py-1 px-2">
                              {s.status === "Active" ? "Suspend" : "Approve"}
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

          {/* MODULE 2: PRODUCTS */}
          {active === "products" && (
            <div className="d-flex flex-column gap-3">
              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                <div>
                  <h2 className="fs-4 font-bold text-dark mb-0">Global Product Directory</h2>
                  <p className="fs-8 text-secondary mb-0">Browse products across all stores with search and filters.</p>
                </div>

              </div>

              <div className="d-flex flex-wrap gap-2">
                {['All', ...categoriesList.map((cat) => cat.name)].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setProductCategoryFilter(cat)}
                    className={`btn btn-sm px-3 py-1 rounded-pill fs-8 text-nowrap ${productCategoryFilter === cat ? 'btn-warning text-dark font-bold' : 'btn-outline-secondary text-dark'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="row g-3">
                {productsList.filter((product) => {
                  const name = String(product.name || product.title || '').toLowerCase();
                  const storeName = String(product.store_name || product.store?.name || product.owner_name || '').toLowerCase();
                  const categoryName = String(product.category?.name || product.category || product.category_name || '').toLowerCase();
                  const query = String(productSearchQuery || '').trim().toLowerCase();
                  const normalizedStoreFilter = String(productStoreFilter || '').trim().toLowerCase();
                  const normalizedCategoryFilter = String(productCategoryFilter || '').trim().toLowerCase();
                  const matchesSearch = !query || name.includes(query) || storeName.includes(query) || categoryName.includes(query);
                  const matchesStore = normalizedStoreFilter === 'all stores' || storeName.includes(normalizedStoreFilter) || String(product.store_name || product.store?.name || '').trim().toLowerCase().includes(normalizedStoreFilter);
                  const matchesCategory = normalizedCategoryFilter === 'all' || categoryName.includes(normalizedCategoryFilter) || String(product.category?.name || product.category || product.category_name || '').trim().toLowerCase().includes(normalizedCategoryFilter);
                  const selectedOwner = selectedOwnerFilter === 'all' ? null : ownersList.find((owner) => String(owner.id || owner.email) === String(selectedOwnerFilter)) || null;
                  const matchesOwnerSelection = getProductOwnerMatch(product, selectedOwner);
                  const isOwnerProduct = Boolean(product.store?.user_id || product.user_id || product.owner_id);
                  const matchesOwner = !ownerOnlyProducts || isOwnerProduct;
                  return matchesSearch && matchesStore && matchesCategory && matchesOwner && matchesOwnerSelection;
                }).map((product) => (
                  <div key={product.id || product.product_id || `${product.name}-${product.store_name}`} className="col-12 col-sm-6 col-lg-4">
                    <div className=" p-3 h-100 d-flex flex-column justify-between" style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "20px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                      <div>
                        <img
                          src={getProductImageUrl(product)}
                          alt={product.name || product.title || 'Product'}
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = buildProductPlaceholderImage(product); }}
                          className="w-100 rounded-3 mb-3 object-cover"
                          style={{ height: 200, background: '#161310', border: '1px solid rgba(212,175,55,0.22)' }}
                        />
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="fs-8 text-warning font-semibold">{product.category?.name || product.category || product.category_name || 'Uncategorized'}</span>
                          <span className={`fs-8 ${product.status === 'Out of Stock' ? 'text-danger' : product.status === 'Low Stock' ? 'text-warning' : 'text-success'}`}>
                            {product.status}
                          </span>
                        </div>
                        <h4 className="fs-6 font-bold text-dark mb-1">{product.name || product.title || 'Unnamed Product'}</h4>
                        <p className="fs-8 text-secondary mb-3 line-clamp-2">{product.description || 'High-quality product available on the Aureum platform.'}</p>
                      </div>
                      <div className="d-flex gap-2 align-items-center justify-content-between">
                        <div>
                          <div className="fw-bold text-warning">{typeof product.price === 'number' ? `$${product.price.toFixed(2)}` : product.price || 'N/A'}</div>
                          <div className="fs-8 text-dark">{product.store_name || product.store?.name || 'Unknown Store'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {productsList.filter((product) => {
                  const name = String(product.name || product.title || '').toLowerCase();
                  const storeName = String(product.store_name || product.store?.name || product.owner_name || '').toLowerCase();
                  const categoryName = String(product.category?.name || product.category || product.category_name || '').toLowerCase();
                  const query = String(productSearchQuery || '').trim().toLowerCase();
                  const normalizedStoreFilter = String(productStoreFilter || '').trim().toLowerCase();
                  const normalizedCategoryFilter = String(productCategoryFilter || '').trim().toLowerCase();
                  const matchesSearch = !query || name.includes(query) || storeName.includes(query) || categoryName.includes(query);
                  const matchesStore = normalizedStoreFilter === 'all stores' || storeName.includes(normalizedStoreFilter) || String(product.store_name || product.store?.name || '').trim().toLowerCase().includes(normalizedStoreFilter);
                  const matchesCategory = normalizedCategoryFilter === 'all' || categoryName.includes(normalizedCategoryFilter) || String(product.category?.name || product.category || product.category_name || '').trim().toLowerCase().includes(normalizedCategoryFilter);
                  const selectedOwner = selectedOwnerFilter === 'all' ? null : ownersList.find((owner) => String(owner.id || owner.email) === String(selectedOwnerFilter)) || null;
                  const matchesOwnerSelection = getProductOwnerMatch(product, selectedOwner);
                  const isOwnerProduct = Boolean(product.store?.user_id || product.user_id || product.owner_id);
                  const matchesOwner = !ownerOnlyProducts || isOwnerProduct;
                  return matchesSearch && matchesStore && matchesCategory && matchesOwner && matchesOwnerSelection;
                }).length === 0 && (
                    <div className="col-12">
                      <div className=" text-center py-5" style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "20px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                        <p className="fs-8 text-secondary mb-0">No products match your search or filters.</p>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* MODULE 3: STORES */}
          {active === "stores" && (
            <div className="d-flex flex-column gap-3">
              <div className="d-flex align-items-center justify-content-between">
                <h2 className="fs-4 font-bold text-dark mb-0">Registered Stores</h2>
                <span className="badge bg-warning text-dark">{storesList.length} Total Stores</span>
              </div>
              <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "20px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                <div className="table-responsive">
                  <table className="table table-light table-hover mb-0 align-middle">
                    <thead>
                      <tr className="text-secondary fs-8">
                        <th>Store ID</th>
                        <th>Store Name</th>
                        <th>Status</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {storesList.map((s) => (
                        <tr key={s.id}>
                          <td className="fs-8 text-secondary">STR-{s.id}</td>
                          <td className="fw-bold text-warning">{s.name}</td>
                          <td>
                            <span className={s.status === "Active" ? "badge bg-success text-white" : s.status === "Pending" ? "badge bg-warning text-dark" : "badge bg-danger text-white"}>
                              {s.status}
                            </span>
                          </td>
                          <td className="text-end">
                            <button onClick={() => handleStoreStatusToggle(s.id, s.status)} className="btn btn-sm btn-outline-warning fs-8 py-1 px-2">
                              {s.status === "Active" ? "Suspend" : "Approve"}
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

          {/* MODULE 4: STORE OWNERS */}
          {active === "owners" && (
            <div className="d-flex flex-column gap-3">
              <h2 className="fs-4 font-bold text-dark mb-0">Merchant Network</h2>
              <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "20px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                <div className="table-responsive">
                  <table className="table table-light table-hover mb-0 align-middle">
                    <thead>
                      <tr className="text-secondary fs-8">
                        <th>Merchant Name</th>
                        <th>Email</th>
                        <th>Assigned Store</th>
                        <th>Commission Fee</th>
                        <th>MRR</th>
                        <th>Status</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ownersList.map((o) => (
                        <tr key={o.id}>
                          <td className="fw-bold text-dark">{o.name}</td>
                          <td className="fs-8 text-secondary">{o.email}</td>
                          <td className="text-warning fs-8">{o.store}</td>
                          <td className="fs-8">{o.commission}</td>
                          <td className="fw-bold text-warning">{o.mrr}</td>
                          <td>
                            <span className={o.status === "Active" ? "badge bg-success text-white" : o.status === "Pending" ? "badge bg-warning text-dark" : "badge bg-danger text-white"}>
                              {o.status}
                            </span>
                          </td>
                          <td className="text-end">
                            <button onClick={() => handleOwnerStatusToggle(o.id, o.status)} className="btn btn-sm btn-outline-warning fs-8 py-1 px-2">
                              {o.status === "Active" ? "Suspend" : "Approve"}
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

          {/* MODULE 5: USERS */}
          {active === "users" && (
            <div className="d-flex flex-column gap-3">
              <div className="d-flex align-items-center justify-content-between">
                <h2 className="fs-4 font-bold text-dark mb-0">Platform User Accounts</h2>
                <span className="badge bg-warning text-dark">{usersList.length} Registered Users</span>
              </div>
              <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "20px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                <div className="table-responsive">
                  <table className="table table-light table-hover mb-0 align-middle">
                    <thead>
                      <tr className="text-secondary fs-8">
                        <th>User ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Registered Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersList.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center text-secondary py-4 fs-8">
                            No registered users found.
                          </td>
                        </tr>
                      ) : (
                        usersList.map((u) => (
                          <tr key={u.id}>
                            <td className="fs-8 text-secondary">#{u.id}</td>
                            <td className="fw-bold text-dark">{u.name}</td>
                            <td className="fs-8">{u.email}</td>
                            <td>
                              <span className={u.role === "Admin" ? "gold-badge-blue" : u.role === "Owner" ? "badge bg-warning text-dark" : "badge bg-success text-white"}>
                                {u.role}
                              </span>
                            </td>
                            <td className="fs-8 text-secondary">{u.registered || "—"}</td>
                            <td><span className={u.status === "Active" ? "badge bg-success text-white" : "badge bg-danger text-white"}>{u.status}</span></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* MODULE 6: CATEGORIES */}
          {active === "categories" && (
            <div className="d-flex flex-column gap-3">
              <div className="d-flex align-items-center justify-content-between">
                <h2 className="fs-4 font-bold text-dark mb-0">Platform Categories</h2>
                <button onClick={() => setShowAddCatModal(true)} className="btn btn-gold-primary btn-sm px-3 py-2">
                  <Plus size={16} className="me-1" /> Add Category
                </button>
              </div>
              <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "20px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                <div className="table-responsive">
                  <table className="table table-light table-hover mb-0 align-middle">
                    <thead>
                      <tr className="text-secondary fs-8">
                        <th>Category ID</th>
                        <th>Category Name</th>
                        <th>Listed Products</th>
                        <th>Status</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoriesList.map((c) => (
                        <tr key={c.id}>
                          <td className="fs-8 text-secondary">CAT-{c.id}</td>
                          <td className="fw-bold text-dark">{c.name}</td>
                          <td className="fw-semibold">{c.count} items</td>
                          <td>
                            <span className={c.status === "Active" ? "badge bg-success text-white" : c.status === "Featured" ? "badge bg-warning text-dark" : "badge bg-danger text-white"}>
                              {c.status}
                            </span>
                          </td>
                          <td className="text-end">
                            <button onClick={() => setCategoriesList(categoriesList.filter(x => x.id !== c.id))} className="btn btn-sm btn-outline-danger p-1">
                              <Trash2 size={14} />
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

          {/* MODULE 7: ORDERS */}
          {active === "orders" && (
            <div className="d-flex flex-column gap-3">
              <div className="d-flex align-items-center justify-content-between">
                <h2 className="fs-4 font-bold text-dark mb-0">Global Orders Log</h2>
                <span className="badge bg-warning text-dark">{ordersList.length} Platform Orders</span>
              </div>

              {orderToast && (
                <div className="alert alert-success bg-white text-warning border-warning fs-7 d-flex align-items-center gap-2 mb-0 py-2">
                  <CheckCircle size={16} /> {orderToast}
                </div>
              )}

              <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "20px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                <div className="table-responsive">
                  <table className="table table-light table-hover mb-0 align-middle">
                    <thead>
                      <tr className="text-secondary fs-8">
                        <th>Order ID</th>
                        <th>Store</th>
                        <th>Total</th>
                        <th>Platform Fee</th>
                        <th>Date</th>
                        <th>Status Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordersList.map((o) => (
                        <tr key={o.id}>
                          <td className="fw-bold text-warning">{o.id}</td>
                          <td className="text-dark fw-semibold">{o.store}</td>
                          <td className="fw-bold text-dark">{o.total}</td>
                          <td className="text-warning font-semibold">{o.fee}</td>
                          <td className="fs-8 text-secondary">{o.date}</td>
                          <td>
                            <select
                              value={o.status}
                              onChange={(e) => handleOrderStatusChange(o.id, e.target.value)}
                              className="form-select form-select-sm text-dark fs-8 py-1 px-2 border-light"
                              style={{
                                background: o.status === "Delivered" || o.status === "Completed" ? "rgba(16,185,129,0.2)" : o.status === "Cancelled" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)",
                                color: o.status === "Delivered" || o.status === "Completed" ? "#10b981" : o.status === "Cancelled" ? "#ef4444" : "#f59e0b",
                                borderColor: "#dfe3e8",
                                fontWeight: "bold",
                                cursor: "pointer",
                                minWidth: 135
                              }}
                            >
                              <option value="Pending" style={{ background: "#ffffff", color: "#f59e0b" }}>🟡 Pending</option>
                              <option value="Processing" style={{ background: "#ffffff", color: "#60a5fa" }}>🔵 Processing</option>
                              <option value="Shipped" style={{ background: "#ffffff", color: "#a855f7" }}>🟣 Shipped</option>
                              <option value="Delivered" style={{ background: "#ffffff", color: "#10b981" }}>🟢 Delivered</option>
                              <option value="Completed" style={{ background: "#ffffff", color: "#10b981" }}>🟢 Completed</option>
                              <option value="Cancelled" style={{ background: "#ffffff", color: "#ef4444" }}>🔴 Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* MODULE 8: PAYMENTS & PAYOUTS */}
          {active === "payments" && (
            <div className="d-flex flex-column gap-3">
              <h2 className="fs-4 font-bold text-dark mb-0">Merchant Payouts & Transfers</h2>
              <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "20px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                <div className="table-responsive">
                  <table className="table table-light table-hover mb-0 align-middle">
                    <thead>
                      <tr className="text-secondary fs-8">
                        <th>Payout ID</th>
                        <th>Store</th>
                        <th>Merchant</th>
                        <th>Payout Amount</th>
                        <th>Platform Fee</th>
                        <th>Status</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payoutsList.map((p) => (
                        <tr key={p.id}>
                          <td className="fs-8 text-secondary">{p.id}</td>
                          <td className="fw-bold text-warning">{p.store}</td>
                          <td>{p.owner}</td>
                          <td className="fw-bold text-dark">{p.amount}</td>
                          <td className="text-warning fs-8">{p.fee}</td>
                          <td><span className={p.status === "Processed" ? "badge bg-success text-white" : "badge bg-warning text-dark"}>{p.status}</span></td>
                          <td className="text-end">
                            {p.status === "Pending" && (
                              <button onClick={() => handlePayoutProcess(p.id)} className="btn btn-sm btn-gold-primary fs-8 py-1 px-2">
                                Process Transfer
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* MODULE 8: ANALYTICS */}
          {active === "analytics" && (
            <div className="d-flex flex-column gap-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h2 className="fs-4 font-bold text-dark mb-0">Platform Analytics</h2>
                  <p className="fs-8 mb-0 text-secondary">Comprehensive performance insights across stores, merchants, revenue, and category demand.</p>
                </div>
                <button onClick={() => alert("Exporting analytics snapshot...")} className="btn btn-outline-warning btn-sm">
                  <Download size={16} className="me-1" /> Export Analytics
                </button>
              </div>

              <div className="row g-3">
                <div className="col-6 col-lg-3">
                  <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "16px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <div className="fs-8 text-secondary mb-1">Net Revenue</div>
                    <div className="fs-5 font-bold text-dark">$84,210</div>
                    <div className="fs-8 text-success font-semibold mt-1">+14.2% vs last month</div>
                  </div>
                </div>
                <div className="col-6 col-lg-3">
                  <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "16px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <div className="fs-8 text-secondary mb-1">Orders Processed</div>
                    <div className="fs-5 font-bold text-dark">{ordersList.length}</div>
                    <div className="fs-8 text-warning font-semibold mt-1">Live platform orders</div>
                  </div>
                </div>
                <div className="col-6 col-lg-3">
                  <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "16px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <div className="fs-8 text-secondary mb-1">Active Stores</div>
                    <div className="fs-5 font-bold text-dark">{storesList.length}</div>
                    <div className="fs-8 text-success font-semibold mt-1">Healthy merchant base</div>
                  </div>
                </div>
                <div className="col-6 col-lg-3">
                  <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "16px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <div className="fs-8 text-secondary mb-1">Avg. Order Value</div>
                    <div className="fs-5 font-bold text-dark">$1,840</div>
                    <div className="fs-8 text-emerald-400 font-semibold mt-1">High-value basket</div>
                  </div>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-12 col-lg-8">
                  <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "20px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div>
                        <h3 className="fs-6 font-bold text-dark mb-0">Revenue Trend</h3>
                        <p className="fs-8 text-secondary mb-0">Monthly growth across the platform.</p>
                      </div>
                      <span className="badge bg-warning text-dark">YTD 2026</span>
                    </div>
                    <ResponsiveContainer width="100%" height={240}>
                      <AreaChart data={platformRevenue}>
                        <defs>
                          <linearGradient id="analyticsRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#007f5f" stopOpacity={0.42} />
                            <stop offset="100%" stopColor="#007f5f" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#dfe3e8" vertical={false} />
                        <XAxis dataKey="m" tick={{ fontSize: 11, fill: "#8a7a4d" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#8a7a4d" }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: 8, fontSize: 12, color: "#202223" }} />
                        <Area type="monotone" dataKey="v" stroke="#007f5f" strokeWidth={2.5} fill="url(#analyticsRevenueGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="col-12 col-lg-4">
                  <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "20px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <h3 className="fs-6 font-bold text-dark mb-1">Category Demand</h3>
                    <p className="fs-8 text-secondary mb-3">Top categories by platform activity.</p>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={topCategoriesData} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#8a7a4d" }} axisLine={false} tickLine={false} width={90} />
                        <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: 8, fontSize: 12, color: "#202223" }} />
                        <Bar dataKey="v" fill="#007f5f" radius={[0, 4, 4, 0]} barSize={16} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-12 col-lg-6">
                  <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "20px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <h3 className="fs-6 font-bold text-dark mb-3">Top Merchant Performance</h3>
                    <div className="d-flex flex-column gap-2">
                      {storesList.slice(0, 4).map((store, index) => (
                        <div key={store.id} className="d-flex align-items-center justify-content-between rounded-2 p-2" style={{ background: "rgba(212,175,55,0.08)", border: "1px solid #dfe3e8" }}>
                          <div>
                            <div className="fw-semibold text-dark">{store.name}</div>
                            <div className="fs-8 text-secondary">{store.category || "Premium Store"}</div>
                          </div>
                          <div className="text-end">
                            <div className="fw-bold text-warning">#{index + 1}</div>
                            <div className="fs-8 text-secondary">{store.status || "Active"}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="col-12 col-lg-6">
                  <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "20px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <h3 className="fs-6 font-bold text-dark mb-3">Revenue Split</h3>
                    <div style={{ width: "100%", height: 220 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Apparel", value: 42 },
                              { name: "Electronics", value: 28 },
                              { name: "Home Decor", value: 20 },
                              { name: "Textiles", value: 10 },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            <Cell fill="#d4af37" />
                            <Cell fill="#f3d675" />
                            <Cell fill="#8a6d1f" />
                            <Cell fill="#bfa24a" />
                          </Pie>
                          <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: 8, fontSize: 12, color: "#202223" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="d-flex flex-wrap gap-2 mt-2">
                      <span className="badge bg-warning text-dark">Apparel 42%</span>
                      <span className="badge bg-warning text-dark">Electronics 28%</span>
                      <span className="badge bg-warning text-dark">Home Decor 20%</span>
                      <span className="badge bg-warning text-dark">Textiles 10%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODULE 9: REPORTS */}
          {active === "reports" && (
            <div className="d-flex flex-column gap-3">
              <div className="d-flex align-items-center justify-content-between">
                <h2 className="fs-4 font-bold text-dark mb-0">Platform Audit Reports</h2>
                <button onClick={() => alert("Downloading Platform Financial Audit Report CSV...")} className="btn btn-outline-warning btn-sm">
                  <Download size={16} className="me-1" /> Export CSV Report
                </button>
              </div>
              <div className="row g-3">
                <div className="col-md-6">
                  <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "20px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <h3 className="fs-6 font-bold text-dark mb-2">Platform Financial Summary</h3>
                    <div className="fs-7 text-secondary mb-3">Gross GMV processed: <strong className="text-dark">$2,480,000.00</strong></div>
                    <div className="fs-7 text-secondary mb-3">Platform Net Revenue: <strong className="text-warning">$84,210.00</strong></div>
                    <div className="fs-7 text-secondary">Active Merchants Payouts: <strong className="text-dark">$2,395,790.00</strong></div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "20px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <h3 className="fs-6 font-bold text-dark mb-2">Tax & Compliance Status</h3>
                    <div className="fs-7 text-emerald-400 mb-2">✓ 100% Tax Compliant</div>
                    <div className="fs-7 text-secondary">All vendor payouts undergo 256-bit SSL encryption & Stripe Connect verification.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODULE 10: SETTINGS */}
          {active === "settings" && (
            <div className="d-flex flex-column gap-3">
              <h2 className="fs-4 font-bold text-dark mb-0">Super Admin Global Settings</h2>
              {settingsSaved && (
                <div className="alert alert-success bg-white text-success border-success fs-7">
                  Platform global settings saved successfully!
                </div>
              )}
              <div className=" col-12 col-md-6" style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "20px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                <form onSubmit={handleSaveConfig} className="d-flex flex-column gap-3 fs-7">
                  <div>
                    <label className="text-secondary mb-1 fs-8">Platform Title</label>
                    <input value={platformConfig.name} onChange={(e) => setPlatformConfig({ ...platformConfig, name: e.target.value })} className="form-control" />
                  </div>
                  <div>
                    <label className="text-secondary mb-1 fs-8">Default Merchant Commission Fee (%)</label>
                    <input value={platformConfig.commission} onChange={(e) => setPlatformConfig({ ...platformConfig, commission: e.target.value })} className="form-control" />
                  </div>
                  <div>
                    <label className="text-secondary mb-1 fs-8">Payout Cycle Schedule</label>
                    <select value={platformConfig.payoutCycle} onChange={(e) => setPlatformConfig({ ...platformConfig, payoutCycle: e.target.value })} className="form-select">
                      <option value="Weekly (Mondays)">Weekly (Mondays)</option>
                      <option value="Bi-Weekly">Bi-Weekly</option>
                      <option value="Monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-secondary mb-1 fs-8">Super Admin Email</label>
                    <input value={platformConfig.supportEmail} onChange={(e) => setPlatformConfig({ ...platformConfig, supportEmail: e.target.value })} className="form-control" />
                  </div>
                  <button type="submit" className="btn btn-gold-primary py-2 mt-2">Save Global Configuration</button>
                </form>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ADD CATEGORY MODAL */}
      {showAddCatModal && (
        <div className="position-fixed top-0 bottom-0 start-0 end-0 bg-white bg-opacity-75 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1050 }}>
          <div className=" w-100" style={{ background: "#ffffff", border: "1px solid #dfe3e8", borderRadius: "8px", padding: "20px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", maxWidth: 400 }}>
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2" style={{ borderColor: "rgba(212,175,55,0.2)" }}>
              <h3 className="fs-6 font-bold text-warning mb-0">Create Global Category</h3>
              <button onClick={() => setShowAddCatModal(false)} className="btn btn-sm text-secondary p-0">✕</button>
            </div>
            <form onSubmit={handleAddCategorySubmit} className="d-flex flex-column gap-2 fs-7">
              <div>
                <label className="text-secondary mb-1 fs-8">Category Title *</label>
                <input required value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="form-control" placeholder="e.g. Fine Jewelry" />
              </div>
              <div>
                <label className="text-secondary mb-1 fs-8">Platform Fee (%)</label>
                <input value={newCatFee} onChange={(e) => setNewCatFee(e.target.value)} className="form-control" placeholder="4.5%" />
              </div>
              <button type="submit" className="btn btn-gold-primary w-100 mt-3 py-2">Add Category</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
