import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import useSEO from '../hooks/useSEO';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

const GOLD = "#d4af37";
const GOLD_LIGHT = "#f3d675";
const GOLD_DEEP = "#8a6d1f";
const INK = "#050505";
const CREAM = "#f6f1e4";

export default function Products() {
  const { user } = useAuth();
  const { stores, activeStore, formatPrice } = useStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem("aureum_owner_products");

    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p, idx) => ({
            id: p.id || idx + 1,
            name: p.name,
            sku: p.sku || "PROD-" + (idx + 1),
            category_id: p.category_id || null,
            category: {
              name: p.category || p.category?.name || "General"
            },
            price:
              typeof p.price === 'number'
                ? p.price
                : parseFloat(
                    String(p.price || 0).replace(/[^0-9.]/g, "")
                  ),
            stock_quantity: p.stock ?? 10,
            image:
              p.image ||
              "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
            description: p.description || "",
            color: p.color || "",
            size: p.size || "",
          }));
        }
      } catch (e) {
        console.error('Failed to load local products:', e);
      }
    }

    return [];
  });

  /*
   * IMPORTANT:
   * Do not use fake/hard-coded category IDs here.
   * Categories are loaded from the Laravel backend.
   */
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');

  const [selectedCat, setSelectedCat] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('categoryId') || '';
    }

    return '';
  });

  const [selectedStoreId, setSelectedStoreId] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('storeId') || '';
    }

    return '';
  });

  const [toastMessage, setToastMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    sku: '',
    price: '',
    compare_price: '',
    stock_quantity: 0,
    image: '',
    description: '',
    color: '',
    size: '',
  });

  useSEO({
    title: 'Product Catalog Management',
    description: 'Add, Edit, Delete Products, Price, and Stock Quantity.'
  });

  const showToast = (message) => {
    setToastMessage(message);

    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  const fetchProducts = async () => {
    setLoading(true);

    try {
      const storeId = selectedStoreId || activeStore?.id || 1;
      const ownerId = user?.id || user?.user_id || null;

      const [prodRes, catRes] = await Promise.all([
        api.get(`/products`, {
          params: {
            store_id: storeId,
            owner_id: ownerId,
            search,
            category_id: selectedCat
          }
        }),

        api.get(`/categories`, {
          params: {
            store_id: storeId,
            owner_id: ownerId
          }
        })
      ]);

      /*
       * Products from backend
       */
      if (Array.isArray(prodRes.data)) {
        setProducts(prodRes.data);
      }

      /*
       * Categories from backend
       *
       * Example backend response:
       * ID 1 -> kids clothing
       * ID 2 -> kids
       * ID 3 -> rings
       * ID 5 -> rings
       * ID 6 -> rings
       *
       * We do NOT create category ID 4 manually.
       */
      if (Array.isArray(catRes.data)) {
        setCategories(catRes.data);
      }
    } catch (err) {
      console.debug(
        'Failed to fetch products/categories from API. Using local products if available.',
        err
      );

      /*
       * Fallback only for products.
       * We do NOT create fake category IDs.
       */
      const saved = localStorage.getItem("aureum_owner_products");

      if (saved) {
        try {
          const parsed = JSON.parse(saved);

          if (Array.isArray(parsed)) {
            const mapped = parsed.map((p, idx) => ({
              id: p.id || idx + 1,
              name: p.name,
              sku: p.sku || "PROD-" + (idx + 1),

              /*
               * Keep the actual saved category_id if available.
               * Do not force category_id = 1.
               */
              category_id: p.category_id || null,

              category: {
                name:
                  p.category ||
                  p.category?.name ||
                  "General"
              },

              price:
                typeof p.price === 'number'
                  ? p.price
                  : parseFloat(
                      String(p.price || 0).replace(/[^0-9.]/g, "")
                    ),

              stock_quantity: p.stock ?? 10,

              image:
                p.image ||
                "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",

              description: p.description || "",
              color: p.color || "",
              size: p.size || "",
            }));

            setProducts(mapped);
          }
        } catch (e) {
          console.error('Failed to load fallback products:', e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    const categoryId = params.get('categoryId') || '';
    const storeId = params.get('storeId') || '';

    if (categoryId !== selectedCat) {
      setSelectedCat(categoryId);
    }

    if (storeId !== selectedStoreId) {
      setSelectedStoreId(storeId);
    }
  }, [location.search]);

  useEffect(() => {
    fetchProducts();
  }, [activeStore, search, selectedCat, selectedStoreId]);

  /*
   * Keep localStorage synchronized with products.
   */
  useEffect(() => {
    if (products.length > 0) {
      const saved = localStorage.getItem("aureum_owner_products");

      let existing = [];

      if (saved) {
        try {
          existing = JSON.parse(saved);
        } catch (e) {
          existing = [];
        }
      }

      const merged = [...existing];

      products.forEach((p) => {
        const idx = merged.findIndex(
          (e) => e.id === p.id || e.sku === p.sku
        );

        if (idx !== -1) {
          merged[idx] = {
            ...merged[idx],
            ...p
          };
        } else {
          merged.push(p);
        }
      });

      localStorage.setItem(
        "aureum_owner_products",
        JSON.stringify(merged)
      );
    }
  }, [products]);

  /*
   * Open Add Product modal
   */
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setErrorMsg('');

    /*
     * Use the first REAL backend category if available.
     * Otherwise leave it empty.
     */
    setFormData({
      name: '',
      category_id: categories[0]?.id || '',
      sku: 'SKU-' + Math.floor(100000 + Math.random() * 900000),
      price: '49.99',
      compare_price: '65.00',
      stock_quantity: 15,
      image:
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
      description: '',
      color: '',
      size: '',
    });

    setShowModal(true);
  };

  /*
   * Open Edit Product modal
   */
  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setErrorMsg('');

    setFormData({
      name: product.name || '',
      category_id: product.category_id || '',
      sku: product.sku || '',
      price: product.price || '',
      compare_price: product.compare_price || '',
      stock_quantity: product.stock_quantity ?? 10,
      image: product.image || '',
      description: product.description || '',
      color: product.color || '',
      size: product.size || '',
    });

    setShowModal(true);
  };

  /*
   * Save Product
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name || !formData.price || !formData.sku) {
      setErrorMsg(
        'Please fill in Product Name, SKU, and Price.'
      );
      return;
    }

    const storeId = activeStore?.id || 1;

    const catId = formData.category_id
      ? parseInt(formData.category_id, 10)
      : null;

    const priceVal =
      parseFloat(formData.price) || 0;

    const comparePriceVal =
      formData.compare_price
        ? parseFloat(formData.compare_price)
        : null;

    const stockVal =
      parseInt(formData.stock_quantity, 10) || 0;

    /*
     * Find the selected REAL backend category.
     */
    const matchedCat = categories.find(
      (c) => String(c.id) === String(catId)
    );

    /*
     * IMPORTANT:
     * Prevent invalid category IDs such as ID 4.
     */
    if (
      catId &&
      !categories.some(
        (c) => String(c.id) === String(catId)
      )
    ) {
      setErrorMsg(
        'Please select a valid collection. The selected collection does not exist in the database.'
      );
      return;
    }

    const payload = {
      store_id: storeId,
      name: formData.name,

      /*
       * Send only a valid backend category ID.
       */
      category_id: matchedCat ? catId : null,

      category: matchedCat
        ? { name: matchedCat.name }
        : { name: "General" },

      sku: formData.sku,
      price: priceVal,
      compare_price: comparePriceVal,
      stock_quantity: stockVal,

      image:
        formData.image ||
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',

      description: formData.description,
      color: formData.color,
      size: formData.size,
    };

    console.log('Saving product payload:', payload);

    try {
      if (editingProduct) {
        await api.put(
          `/products/${editingProduct.id}`,
          payload
        );
      } else {
        await api.post(
          '/products',
          payload
        );
      }

      setShowModal(false);

      showToast(
        `Product "${formData.name}" saved successfully!`
      );

      fetchProducts();
    } catch (err) {
      console.warn(
        'Backend API update failed:',
        err
      );

      /*
       * Show the actual backend error instead of
       * silently pretending that the database save worked.
       */
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.errors?.category_id?.[0] ||
        err.response?.data?.errors?.store_id?.[0] ||
        err.response?.data?.errors?.name?.[0] ||
        err.response?.data?.errors?.sku?.[0] ||
        err.message ||
        'Failed to save product to the database.';

      setErrorMsg(backendMessage);
    }
  };

  /*
   * Delete Product
   */
  const handleDelete = async (id) => {
    if (
      window.confirm(
        'Are you sure you want to delete this product?'
      )
    ) {
      try {
        await api.delete(`/products/${id}`);

        setProducts((prev) =>
          prev.filter((p) => p.id !== id)
        );

        showToast('Product deleted.');
      } catch (err) {
        console.warn(
          'API delete failed:',
          err
        );

        setErrorMsg(
          err.response?.data?.message ||
          'Failed to delete product.'
        );
      }
    }
  };

  /*
   * Filtered Products
   */
  const filteredProducts = products.filter((p) => {
    const productName = String(p.name || '');
    const productSku = String(p.sku || '');

    const matchesSearch =
      !search ||
      productName
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      productSku
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesCat =
      !selectedCat ||
      String(p.category_id) === String(selectedCat);

    return matchesSearch && matchesCat;
  });

  return (
    <div
      style={{
        background: INK,
        color: CREAM,
        minHeight: '100vh'
      }}
      className="p-4 md:p-8 flex flex-col gap-6"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3"
          style={{
            background: '#0e0d0b',
            border: `1px solid ${GOLD}`,
            color: GOLD_LIGHT
          }}
        >
          <CheckCircle2
            size={18}
            style={{ color: GOLD }}
          />

          <span className="font-semibold text-sm">
            {toastMessage}
          </span>
        </div>
      )}

      {/* Header Bar */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b"
        style={{
          borderColor:
            'rgba(212,175,55,0.18)'
        }}
      >
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 text-white">
            <Package
              size={24}
              style={{ color: GOLD }}
            />

            Product Catalog Management
          </h1>

          <p
            className="text-xs mt-1"
            style={{ color: '#a99f80' }}
          >
            Manage items, pricing, SKUs, and stock quantities for{' '}
            <strong
              style={{ color: GOLD_LIGHT }}
            >
              {activeStore?.name || 'Coastal Threads'}
            </strong>
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 rounded-xl text-xs font-bold transition-transform hover:scale-105 flex items-center justify-center gap-2 shadow-md"
          style={{
            background:
              `linear-gradient(135deg, ${GOLD_DEEP}, ${GOLD})`,
            color: INK
          }}
        >
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {/* Filter Toolbar */}
      <div
        className="p-4 rounded-2xl flex flex-col sm:flex-row gap-3 items-center"
        style={{
          background: '#0f0e0c',
          border:
            '1px solid rgba(212,175,55,0.18)'
        }}
      >
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 w-full bg-[#161310] border"
          style={{
            borderColor:
              'rgba(212,175,55,0.2)'
          }}
        >
          <Search
            size={15}
            style={{ color: '#8a7a4d' }}
          />

          <input
            type="text"
            placeholder="Search products by name, SKU..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="bg-transparent outline-none text-sm w-full text-white placeholder-[#8a7a4d]"
          />
        </div>

        {/* Store Select */}
        <select
          value={
            selectedStoreId ||
            activeStore?.id ||
            ''
          }
          onChange={(e) => {
            const value = e.target.value;

            setSelectedStoreId(value);

            const params =
              new URLSearchParams(
                location.search
              );

            if (value) {
              params.set('storeId', value);
            } else {
              params.delete('storeId');
            }

            navigate(
              {
                search: params.toString()
                  ? `?${params.toString()}`
                  : ''
              },
              {
                replace: true
              }
            );
          }}
          className="p-2.5 rounded-xl text-xs font-semibold outline-none w-full sm:w-48 text-white"
          style={{
            background: '#161310',
            border:
              '1px solid rgba(212, 175, 55, 0.2)'
          }}
        >
          {stores?.map((s) => (
            <option
              key={s.id}
              value={s.id}
            >
              {s.name}
            </option>
          ))}
        </select>

        {/* Category Filter */}
        <select
          value={selectedCat}
          onChange={(e) => {
            const value = e.target.value;

            setSelectedCat(value);

            const params =
              new URLSearchParams(
                location.search
              );

            if (value) {
              params.set(
                'categoryId',
                value
              );
            } else {
              params.delete(
                'categoryId'
              );
            }

            navigate(
              {
                search: params.toString()
                  ? `?${params.toString()}`
                  : ''
              },
              {
                replace: true
              }
            );
          }}
          className="p-2.5 rounded-xl text-xs font-semibold outline-none w-full sm:w-48 text-white"
          style={{
            background: '#161310',
            border:
              '1px solid rgba(212, 175, 55, 0.2)'
          }}
        >
          <option value="">
            All Collections
          </option>

          {categories.map((c) => (
            <option
              key={c.id}
              value={c.id}
            >
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table Card */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: '#0f0e0c',
          border:
            '1px solid rgba(212,175,55,0.18)'
        }}
      >
        {loading ? (
          <div
            className="text-center py-12"
            style={{
              color: GOLD_LIGHT
            }}
          >
            <Sparkles
              size={24}
              className="animate-spin mx-auto mb-2"
            />

            <span className="text-xs">
              Loading Catalog Products...
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="text-left border-b text-xs"
                  style={{
                    color: '#8a7a4d',
                    borderColor:
                      'rgba(212,175,55,0.15)'
                  }}
                >
                  <th className="font-medium pb-2">
                    Product
                  </th>

                  <th className="font-medium pb-2">
                    SKU
                  </th>

                  <th className="font-medium pb-2">
                    Collection
                  </th>

                  <th className="font-medium pb-2">
                    Price
                  </th>

                  <th className="font-medium pb-2">
                    Stock
                  </th>

                  <th className="font-medium pb-2">
                    Status
                  </th>

                  <th className="font-medium pb-2 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center py-6 text-xs"
                      style={{
                        color: '#a99f80'
                      }}
                    >
                      No products found in catalog matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((prod) => {
                    const isOut =
                      prod.stock_quantity <= 0;

                    const isLow =
                      prod.stock_quantity > 0 &&
                      prod.stock_quantity <= 5;

                    return (
                      <tr
                        key={prod.id}
                        className="border-t transition-colors hover:bg-amber-500/5 text-xs"
                        style={{
                          borderColor:
                            'rgba(212,175,55,0.12)'
                        }}
                      >
                        <td className="py-2">
                          <button
                            onClick={() =>
                              navigate(
                                `/products/${prod.id}`
                              )
                            }
                            className="flex items-center gap-2 text-left hover:opacity-90"
                          >
                            <img
                              src={
                                prod.image ||
                                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150&q=80'
                              }
                              alt={prod.name}
                              style={{
                                width: '250px',
                                height: '250px'
                              }}
                              className="rounded-2xl object-cover border border-[rgba(212,175,55,0.2)] flex-shrink-0 shadow-md"
                            />

                            <span className="font-bold text-white text-xs">
                              {prod.name}
                            </span>
                          </button>
                        </td>

                        <td
                          className="py-2 font-mono text-[11px]"
                          style={{
                            color: GOLD
                          }}
                        >
                          {prod.sku}
                        </td>

                        <td className="py-2">
                          <span
                            className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                            style={{
                              background:
                                'rgba(212, 175, 55, 0.12)',
                              color: GOLD_LIGHT
                            }}
                          >
                            {prod.category?.name ||
                              'Uncategorized'}
                          </span>
                        </td>

                        <td
                          className="py-2 font-bold text-xs"
                          style={{
                            color: GOLD_LIGHT
                          }}
                        >
                          {formatPrice
                            ? formatPrice(prod.price)
                            : `$${Number(
                                prod.price
                              ).toFixed(2)}`}
                        </td>

                        <td className="py-2 font-bold text-xs">
                          {prod.stock_quantity}
                        </td>

                        <td className="py-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              isOut
                                ? 'bg-red-500/15 text-red-400'
                                : isLow
                                ? 'bg-amber-500/15 text-amber-400'
                                : 'bg-emerald-500/15 text-emerald-400'
                            }`}
                          >
                            {isOut
                              ? 'Out of Stock'
                              : isLow
                              ? 'Low Stock'
                              : 'In Stock'}
                          </span>
                        </td>

                        <td className="py-2 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() =>
                                handleOpenEdit(prod)
                              }
                              className="p-1.5 rounded-lg transition-colors hover:opacity-80"
                              style={{
                                background: '#161310',
                                border:
                                  '1px solid rgba(212, 175, 55, 0.2)'
                              }}
                            >
                              <Edit
                                size={12}
                                style={{
                                  color: GOLD
                                }}
                              />
                            </button>

                            <button
                              onClick={() =>
                                handleDelete(
                                  prod.id
                                )
                              }
                              className="p-1.5 rounded-lg text-red-400 transition-colors hover:opacity-80"
                              style={{
                                background: '#161310',
                                border:
                                  '1px solid rgba(239, 68, 68, 0.2)'
                              }}
                            >
                              <Trash2 size={12} />
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
        )}
      </div>

      {/* Product Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div
            className="w-full max-w-lg rounded-2xl p-6 relative border max-h-[90vh] overflow-y-auto custom-scrollbar"
            style={{
              background: '#0f0e0c',
              borderColor:
                'rgba(212,175,55,0.25)'
            }}
          >
            <button
              onClick={() =>
                setShowModal(false)
              }
              className="absolute top-4 right-4 text-neutral-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold mb-1 text-white flex items-center gap-2">
              <Package
                size={18}
                style={{
                  color: GOLD
                }}
              />

              {editingProduct
                ? `Edit Product - ${editingProduct.name}`
                : 'Add New Product'}
            </h3>

            <p
              className="text-xs mb-4"
              style={{
                color: '#8a7a4d'
              }}
            >
              Enter product details into catalog inventory
            </p>

            {errorMsg && (
              <div className="p-3 rounded-xl mb-4 text-xs font-semibold bg-red-500/15 border border-red-500/30 text-red-400">
                {errorMsg}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 text-sm"
            >
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-8">
                  <label
                    className="text-[11px] font-bold uppercase tracking-wider block mb-1.5"
                    style={{
                      color: '#8a7a4d'
                    }}
                  >
                    Product Name *
                  </label>

                  <input
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        name: e.target.value
                      })
                    }
                    placeholder="e.g. Brass Diya Set"
                    style={{
                      background: '#161310',
                      color: '#ffffff',
                      border:
                        '1px solid rgba(212, 175, 55, 0.25)'
                    }}
                    className="w-full p-3 rounded-xl text-sm outline-none"
                  />
                </div>

                <div className="col-span-4">
                  <label
                    className="text-[11px] font-bold uppercase tracking-wider block mb-1.5"
                    style={{
                      color: '#8a7a4d'
                    }}
                  >
                    Collection
                  </label>

                  <select
                    value={formData.category_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category_id:
                          e.target.value
                      })
                    }
                    style={{
                      background: '#161310',
                      color: '#ffffff',
                      border:
                        '1px solid rgba(212, 175, 55, 0.25)'
                    }}
                    className="w-full p-3 rounded-xl text-sm outline-none"
                  >
                    <option value="">
                      Select Collection
                    </option>

                    {categories.map((c) => (
                      <option
                        key={c.id}
                        value={c.id}
                      >
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label
                    className="text-[11px] font-bold uppercase tracking-wider block mb-1.5"
                    style={{
                      color: '#8a7a4d'
                    }}
                  >
                    SKU Code *
                  </label>

                  <input
                    required
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sku: e.target.value
                      })
                    }
                    placeholder="BD-204"
                    style={{
                      background: '#161310',
                      color: '#ffffff',
                      border:
                        '1px solid rgba(212, 175, 55, 0.25)'
                    }}
                    className="w-full p-3 rounded-xl text-sm outline-none font-mono"
                  />
                </div>

                <div>
                  <label
                    className="text-[11px] font-bold uppercase tracking-wider block mb-1.5"
                    style={{
                      color: '#8a7a4d'
                    }}
                  >
                    Price ($) *
                  </label>

                  <input
                    required
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: e.target.value
                      })
                    }
                    placeholder="42.50"
                    style={{
                      background: '#161310',
                      color: '#ffffff',
                      border:
                        '1px solid rgba(212, 175, 55, 0.25)'
                    }}
                    className="w-full p-3 rounded-xl text-sm outline-none"
                  />
                </div>

                <div>
                  <label
                    className="text-[11px] font-bold uppercase tracking-wider block mb-1.5"
                    style={{
                      color: '#8a7a4d'
                    }}
                  >
                    Stock Quantity *
                  </label>

                  <input
                    required
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock_quantity:
                          e.target.value
                      })
                    }
                    style={{
                      background: '#161310',
                      color: '#ffffff',
                      border:
                        '1px solid rgba(212, 175, 55, 0.25)'
                    }}
                    className="w-full p-3 rounded-xl text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  className="text-[11px] font-bold uppercase tracking-wider block mb-1.5"
                  style={{
                    color: '#8a7a4d'
                  }}
                >
                  Image URL
                </label>

                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      image: e.target.value
                    })
                  }
                  placeholder="https://images.unsplash.com/photo-..."
                  style={{
                    background: '#161310',
                    color: '#ffffff',
                    border:
                      '1px solid rgba(212, 175, 55, 0.25)'
                  }}
                  className="w-full p-3 rounded-xl text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Colors */}
                <div>
                  <label
                    className="text-[11px] font-bold uppercase tracking-wider block mb-1.5"
                    style={{
                      color: '#8a7a4d'
                    }}
                  >
                    Colors
                  </label>

                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Red',
                      'Blue',
                      'Green',
                      'Black',
                      'White',
                      'Grey',
                      'Pink',
                      'Yellow',
                      'Brown',
                      'Purple'
                    ].map((c) => {
                      const currentColors =
                        formData.color
                          ? formData.color
                              .split(',')
                              .map((s) =>
                                s.trim()
                              )
                              .filter(Boolean)
                          : [];

                      const isSelected =
                        currentColors.includes(c);

                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();

                            if (isSelected) {
                              setFormData({
                                ...formData,
                                color:
                                  currentColors
                                    .filter(
                                      (x) =>
                                        x !== c
                                    )
                                    .join(', ')
                              });
                            } else {
                              setFormData({
                                ...formData,
                                color:
                                  [
                                    ...currentColors,
                                    c
                                  ].join(', ')
                              });
                            }
                          }}
                          className="text-[10px] px-2 py-1 rounded-full transition-colors"
                          style={{
                            background:
                              isSelected
                                ? GOLD
                                : '#161310',
                            color:
                              isSelected
                                ? INK
                                : '#ffffff',
                            border:
                              `1px solid ${
                                isSelected
                                  ? GOLD
                                  : 'rgba(212, 175, 55, 0.25)'
                              }`
                          }}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sizes */}
                <div>
                  <label
                    className="text-[11px] font-bold uppercase tracking-wider block mb-1.5"
                    style={{
                      color: '#8a7a4d'
                    }}
                  >
                    Sizes
                  </label>

                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'XS',
                      'S',
                      'M',
                      'L',
                      'XL',
                      'XXL',
                      'Free Size'
                    ].map((s) => {
                      const currentSizes =
                        formData.size
                          ? formData.size
                              .split(',')
                              .map((x) =>
                                x.trim()
                              )
                              .filter(Boolean)
                          : [];

                      const isSelected =
                        currentSizes.includes(s);

                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();

                            if (isSelected) {
                              setFormData({
                                ...formData,
                                size:
                                  currentSizes
                                    .filter(
                                      (x) =>
                                        x !== s
                                    )
                                    .join(', ')
                              });
                            } else {
                              setFormData({
                                ...formData,
                                size:
                                  [
                                    ...currentSizes,
                                    s
                                  ].join(', ')
                              });
                            }
                          }}
                          className="text-[10px] px-2 py-1 rounded-md font-bold transition-colors"
                          style={{
                            background:
                              isSelected
                                ? GOLD
                                : '#161310',
                            color:
                              isSelected
                                ? INK
                                : '#ffffff',
                            border:
                              `1px solid ${
                                isSelected
                                  ? GOLD
                                  : 'rgba(212, 175, 55, 0.25)'
                              }`
                          }}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label
                  className="text-[11px] font-bold uppercase tracking-wider block mb-1.5"
                  style={{
                    color: '#8a7a4d'
                  }}
                >
                  Description
                </label>

                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description:
                        e.target.value
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();

                      setFormData({
                        ...formData,
                        description:
                          (formData.description ||
                            '') +
                          '\n• '
                      });
                    }
                  }}
                  onFocus={() => {
                    if (!formData.description) {
                      setFormData({
                        ...formData,
                        description: '• '
                      });
                    }
                  }}
                  placeholder="• Enter product description (press Enter for new bullet point)"
                  style={{
                    background: '#161310',
                    color: '#ffffff',
                    border:
                      '1px solid rgba(212, 175, 55, 0.25)'
                  }}
                  className="w-full p-3 rounded-xl text-sm outline-none"
                />
              </div>

              {/* Buttons */}
              <div
                className="flex justify-end gap-2.5 mt-3 pt-3 border-t"
                style={{
                  borderColor:
                    'rgba(212, 175, 55, 0.15)'
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setShowModal(false)
                  }
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#161310] text-[#a99f80] border border-[rgba(212,175,55,0.15)] hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold shadow-md"
                  style={{
                    background:
                      `linear-gradient(135deg, ${GOLD_DEEP}, ${GOLD})`,
                    color: INK
                  }}
                >
                  Save Product Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}