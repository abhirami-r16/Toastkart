import React, { useEffect, useRef, useState } from 'react';
import {
  Search, Check, ShoppingBag, ArrowLeft, Loader2, Plus, Tag,
  Package, Star, AlertCircle, ExternalLink, RefreshCw, Info,
  ChevronRight, Sparkles, DollarSign, TrendingUp, Truck, Filter,
  SlidersHorizontal, X, Layers, Globe
} from 'lucide-react';
import api from '../../api/axios';

/* ─── Small helpers ─────────────────────────────────────────── */
const fmt = (n) => Number(n || 0).toLocaleString('en-IN');
const fmtFixed = (n) => Number(n || 0).toFixed(2);

function StagingBadge() {
  return (
    <span
      className="d-inline-flex align-items-center gap-1 badge rounded-pill px-2 py-1"
      style={{ background: '#fff8e1', color: '#b45309', fontSize: '0.7rem', fontWeight: 600 }}
    >
      <Info size={11} /> Sample / Staging Data — Not live Meesho inventory
    </span>
  );
}

function LiveBadge({ source }) {
  return <span className="badge bg-success-subtle text-success">{source || 'Live Meesho Search'}</span>;
}

export function detectMeeshoColorAndSize(product) {
  let detectedSize = product?.size || '';
  let detectedColor = product?.color || '';

  // 1. From variants
  if (!detectedSize && Array.isArray(product?.variants) && product.variants.length > 0) {
    const variantNames = product.variants
      .map((v) => (typeof v === 'string' ? v : v?.name || ''))
      .filter(Boolean);
    if (variantNames.length > 0) {
      detectedSize = variantNames.join(', ');
    }
  }

  // 2. From attributes
  if (Array.isArray(product?.attributes)) {
    product.attributes.forEach((attr) => {
      const key = (attr?.name || attr?.key || attr?.attribute_name || '').toLowerCase().trim();
      const val = (attr?.value || attr?.attribute_value || '').trim();
      if (!detectedColor && (key === 'color' || key === 'colour')) detectedColor = val;
      if (!detectedSize && (key === 'size' || key === 'sizes')) detectedSize = val;
    });
  }

  const desc = product?.description || '';
  // 3. From description for Color
  if (!detectedColor && desc) {
    const cm = desc.match(/(?:Color|Colour)\s*[:=-]\s*([^\n\r,;]+)/i);
    if (cm && cm[1]) detectedColor = cm[1].trim();
  }

  // 4. From description for Size
  if (!detectedSize && desc) {
    const sm = desc.match(/(?:Sizes?)\s*[:=-]\s*([^\n\r]+)/i);
    if (sm && sm[1] && sm[1].length < 80 && !/^\d+$/.test(sm[1].trim())) {
      detectedSize = sm[1].trim();
    }
    if (!detectedSize) {
      const sizeMatches = [...desc.matchAll(/(?:^|\n)\s*([SMLX|XXL|XXXL|Free Size|\d+]+)\s*\(/gi)];
      if (sizeMatches.length > 0) {
        const unique = [...new Set(sizeMatches.map((m) => m[1].trim()))];
        detectedSize = unique.join(', ');
      }
    }
  }

  // 5. From title, hero_product_name, slug, and description body
  if (!detectedColor) {
    const colors = [
      'Black & White', 'Black and White', 'Navy Blue', 'Royal Blue', 'Sky Blue', 'Light Blue',
      'Dark Green', 'Olive Green', 'Teal Green', 'Bottle Green', 'Mint Green', 'Baby Pink',
      'Rose Gold', 'Mustard Yellow', 'Wine Maroon', 'Off White', 'Pure White', 'Jet Black',
      'Black', 'White', 'Blue', 'Red', 'Green', 'Yellow', 'Pink', 'Gold', 'Maroon', 'Teal',
      'Purple', 'Orange', 'Grey', 'Gray', 'Silver', 'Beige', 'Cream', 'Brown', 'Rust',
      'Multicolor', 'Multi', 'Crimson', 'Coral', 'Khaki', 'Charcoal', 'Burgundy', 'Lavender',
      'Peach', 'Turquoise', 'Indigo', 'Magenta'
    ];
    const candidateTexts = [
      product?.title || '',
      product?.hero_product_name || '',
      product?.name || '',
      (product?.slug || '').replace(/[-_]/g, ' '),
      desc
    ];
    for (const text of candidateTexts) {
      if (!text) continue;
      for (const c of colors) {
        if (new RegExp(`\\b${c.replace(/&/g, '(&|and)')}\\b`, 'i').test(text)) {
          detectedColor = c;
          break;
        }
      }
      if (detectedColor) break;
    }
  }

  return { detectedColor, detectedSize };
}

/* ─── Step 1: Universal Search Across All Categories ────────── */
function SearchStep({ storeId, onSelect, capabilities }) {
  const [query, setQuery]                     = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [providerCategories, setProviderCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [sort, setSort]                       = useState('relevance');
  const [minPrice, setMinPrice]               = useState('');
  const [maxPrice, setMaxPrice]               = useState('');
  const [showFilters, setShowFilters]         = useState(false);

  const [results, setResults]                 = useState([]);
  const [searching, setSearching]             = useState(false);
  const [error, setError]                     = useState('');
  const [errorCode, setErrorCode]             = useState('');
  const [cooldown, setCooldown]               = useState(0);
  const [open, setOpen]                       = useState(false);
  const [hiIdx, setHiIdx]                     = useState(-1);
  const [isStaging, setIsStaging]             = useState(true);
  const [catalogSource, setCatalogSource]     = useState('');
  const [hasMore, setHasMore]                 = useState(false);
  const [loadingMore, setLoadingMore]         = useState(false);
  const [cursor, setCursor]                   = useState(null);
  const [page, setPage]                       = useState(1);
  const [retryCount, setRetryCount]           = useState(0);

  const inputRef     = useRef(null);
  const dropdownRef  = useRef(null);
  const debounce     = useRef(null);
  const moreRequest  = useRef(false);

  /* Active cooldown countdown timer for rate limit */
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  /* Load provider categories (ReefAPI or staging) */
  useEffect(() => {
    let active = true;
    setCategoriesLoading(true);
    api.get('/meesho/provider-categories', {
      headers: { 'X-Store-Id': storeId },
    }).then((res) => {
      if (active && Array.isArray(res.data?.categories)) {
        setProviderCategories(res.data.categories);
      }
    }).catch(() => {
      // Graceful fallback to default staging categories if error
    }).finally(() => {
      if (active) setCategoriesLoading(false);
    });
    return () => { active = false; };
  }, [storeId]);

  /* Debounced Universal Search across all categories */
  useEffect(() => {
    clearTimeout(debounce.current);
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      setSearching(false);
      setHasMore(false);
      setCursor(null);
      setPage(1);
      setError('');
      setErrorCode('');
      return;
    }

    const controller = new AbortController();
    setSearching(true);
    setError('');
    setErrorCode('');
    setHasMore(false);
    setCursor(null);
    setPage(1);

    debounce.current = setTimeout(async () => {
      try {
        const params = {
          query: q,
          limit: 20,
          page: 1,
        };
        if (selectedCategory && selectedCategory !== 'all') {
          params.category = selectedCategory;
        }
        if (sort && sort !== 'relevance') {
          params.sort = sort;
        }
        if (minPrice !== '' && !isNaN(minPrice)) {
          params.min_price = Number(minPrice);
        }
        if (maxPrice !== '' && !isNaN(maxPrice)) {
          params.max_price = Number(maxPrice);
        }

        const res = await api.get('/meesho/search', {
          params,
          headers: { 'X-Store-Id': storeId },
          signal: controller.signal,
        });

        const catalog = res.data.catalog || [];
        setResults(catalog);
        setIsStaging(res.data.is_staging !== false);
        setCatalogSource(res.data.catalog_source || '');
        setHasMore(Boolean(res.data.has_more));
        setCursor(res.data.cursor || null);
        setPage(res.data.page || 1);
        setOpen(true);
        setHiIdx(-1);
      } catch (err) {
        if (!controller.signal.aborted) {
          const code = err.response?.data?.code || '';
          setErrorCode(code);
          const isRateLimited = err.response?.status === 429 || code === 'RATE_LIMITED';
          if (isRateLimited) {
            const waitSecs = Number(err.response?.data?.retry_after || 5);
            setCooldown(waitSecs);
            setError(`ReefAPI rate limit reached. Cooldown active for ${waitSecs} seconds.`);
          } else {
            setError(
              err.response?.status === 401
                ? 'Session expired. Please sign in again.'
                : err.response?.status === 403
                ? 'No access to this store.'
                : err.response?.status === 504
                ? 'Provider upstream timed out. Retry shortly.'
                : (err.response?.data?.message || 'Could not load results. Try again.')
            );
          }
          setOpen(false);
        }
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 500);

    return () => {
      clearTimeout(debounce.current);
      controller.abort();
    };
  }, [query, selectedCategory, sort, minPrice, maxPrice, retryCount, storeId]);

  /* Load more with cursor preservation & filter preservation */
  const loadMore = async () => {
    if (moreRequest.current || !hasMore) return;
    moreRequest.current = true;
    setLoadingMore(true);
    try {
      const q = query.trim();
      const nextPage = page + 1;
      const params = {
        query: q,
        limit: 20,
        page: nextPage,
      };
      if (cursor) {
        params.cursor = cursor;
      }
      if (selectedCategory && selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      if (sort && sort !== 'relevance') {
        params.sort = sort;
      }
      if (minPrice !== '' && !isNaN(minPrice)) {
        params.min_price = Number(minPrice);
      }
      if (maxPrice !== '' && !isNaN(maxPrice)) {
        params.max_price = Number(maxPrice);
      }

      const res = await api.get('/meesho/search', {
        params,
        headers: { 'X-Store-Id': storeId },
      });

      const existingIds = new Set(results.map((item) => item.meesho_product_id));
      const newItems = (res.data.catalog || []).filter((item) => !existingIds.has(item.meesho_product_id));

      setResults((current) => [...current, ...newItems]);
      setHasMore(Boolean(res.data.has_more));
      setCursor(res.data.cursor || null);
      setPage(res.data.page || nextPage);
    } catch (err) {
      const code = err.response?.data?.code || '';
      setErrorCode(code);
      const isRateLimited = err.response?.status === 429 || code === 'RATE_LIMITED';
      if (isRateLimited) {
        const waitSecs = Number(err.response?.data?.retry_after || 5);
        setCooldown(waitSecs);
        setError(`ReefAPI rate limit reached while loading more. Cooldown active (${waitSecs}s).`);
      } else {
        setError(err.response?.data?.message || 'Could not load more results. Try again.');
      }
    } finally {
      moreRequest.current = false;
      setLoadingMore(false);
    }
  };

  /* Close dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        inputRef.current && !inputRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleKeyDown = (e) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHiIdx((p) => Math.min(p + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHiIdx((p) => Math.max(p - 1, 0)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const idx = hiIdx >= 0 ? hiIdx : 0;
      if (results[idx]) onSelect(results[idx]);
    } else if (e.key === 'Escape') setOpen(false);
  };

  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
    setCursor(null);
    setPage(1);
    setOpen(false);
  };

  const handleChipClick = (keyword, targetCat = 'all') => {
    setQuery(keyword);
    if (targetCat !== 'all') {
      setSelectedCategory(targetCat);
    }
    inputRef.current?.focus();
  };

  const resetFilters = () => {
    setSelectedCategory('all');
    setSort('relevance');
    setMinPrice('');
    setMaxPrice('');
    setCursor(null);
    setPage(1);
  };

  const hasActiveFilters = (selectedCategory !== 'all') || (sort !== 'relevance') || (minPrice !== '') || (maxPrice !== '');

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div>
          <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
            <Sparkles size={18} style={{ color: '#d81b60' }} />
            Universal Meesho Product Search
          </h5>
          <p className="text-secondary fs-8 mb-0 mt-1">
            Search all available Meesho products across any category (women's fashion, men's clothing, kids, electronics, kitchen & more) · view verified supplier costs · import into your store
          </p>
        </div>
        {query.trim().length >= 2 && (isStaging ? <StagingBadge /> : <LiveBadge source={catalogSource} />)}
      </div>

      {catalogSource && !isStaging && (
        <p className="text-success fs-8 mb-2">
          Source: {catalogSource}. Live third-party scraper results across all Meesho categories. Product availability subject to supplier listings.
        </p>
      )}

      {capabilities?.live_catalog_search_configured !== true && (
        <div className="alert alert-warning d-flex align-items-start gap-2 py-2 fs-8 mb-3" role="status">
          <Info size={16} className="flex-shrink-0 mt-1" />
          <span>
            {capabilities?.live_catalog_search_message || 'Live Meesho search is not configured. The results shown here are staging catalog data.'}
          </span>
        </div>
      )}

      {/* Main Search Control Bar with Integrated Category Selector */}
      <div className="position-relative mb-2">
        <div
          className="d-flex flex-column flex-md-row rounded-3 overflow-hidden border shadow-sm bg-white"
          style={{
            borderColor: open ? '#d81b60' : '#dee2e6',
            transition: 'border-color 0.2s',
          }}
        >
          {/* Category Selector Dropdown */}
          <div className="d-flex align-items-center border-end bg-light px-2 py-1" style={{ minWidth: 175 }}>
            <Layers size={15} className="text-secondary me-2 flex-shrink-0" />
            <select
              className="form-select form-select-sm border-0 bg-transparent shadow-none fw-semibold fs-8 text-dark"
              style={{ cursor: 'pointer' }}
              value={selectedCategory}
              onChange={(e) => handleCategorySelect(e.target.value)}
              aria-label="Filter by Meesho category"
            >
              <option value="all">All Categories</option>
              {providerCategories.map((c) => (
                <option key={c.id} value={c.name || c.id}>
                  {c.name || c.id}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input Box */}
          <div className="d-flex align-items-center flex-grow-1 px-2">
            <span className="ps-2 pe-1 text-secondary">
              {searching
                ? <Loader2 size={16} className="spinner text-secondary" />
                : <Search size={16} className="text-secondary" />}
            </span>
            <input
              ref={inputRef}
              type="search"
              className="form-control border-0 py-2 fs-7 shadow-none"
              placeholder="Search any product, keyword, brand, or category: women saree, men shirt, kids toys, kitchen storage, mobile accessories..."
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => { if (results.length > 0 || error) setOpen(true); }}
              onKeyDown={handleKeyDown}
              id="meesho-product-search"
            />
            {query && (
              <button
                type="button"
                className="btn btn-link text-secondary border-0 pe-2"
                onClick={() => { setQuery(''); setResults([]); setOpen(false); inputRef.current?.focus(); }}
                aria-label="Clear search"
                style={{ fontSize: 18, lineHeight: 1, textDecoration: 'none' }}
              >
                ×
              </button>
            )}
            <button
              type="button"
              className="btn btn-sm px-3 fw-semibold text-white ms-1 me-1 rounded-2 flex-shrink-0"
              style={{ background: '#d81b60', border: 'none' }}
              disabled={searching || query.trim().length < 2 || cooldown > 0}
              onClick={() => {
                if (query.trim().length >= 2 && !searching && cooldown <= 0) {
                  setError('');
                  setRetryCount((c) => c + 1);
                }
              }}
            >
              {searching ? <Loader2 size={14} className="spinner" /> : 'Search'}
            </button>
          </div>

          {/* Filters Toggle Button */}
          <div className="d-flex align-items-center border-start px-2 py-1 bg-light justify-content-end">
            <button
              type="button"
              className={`btn btn-sm d-flex align-items-center gap-1 fs-8 ${hasActiveFilters ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setShowFilters(!showFilters)}
              style={hasActiveFilters ? { background: '#d81b60', borderColor: '#d81b60' } : {}}
            >
              <SlidersHorizontal size={14} />
              <span>Filters</span>
              {hasActiveFilters && <span className="badge bg-white text-dark rounded-pill ms-1" style={{ fontSize: '0.65rem' }}>Active</span>}
            </button>
          </div>
        </div>

        {/* Floating Quick Dropdown for Instant Keyboard Navigation */}
        {open && query.trim().length >= 2 && results.length > 0 && (
          <div
            ref={dropdownRef}
            className="position-absolute w-100 bg-white border rounded-3 shadow-lg mt-1"
            style={{ zIndex: 1050, maxHeight: 320, overflowY: 'auto', top: '100%' }}
          >
            <div className="p-2 border-bottom bg-light d-flex justify-content-between align-items-center fs-8 text-secondary">
              <span>Matching live suggestions ({results.length}):</span>
              <span className="fs-9">Press ↑↓ to navigate · Enter to view</span>
            </div>
            {results.slice(0, 6).map((item, idx) => (
              <button
                type="button"
                key={item.meesho_product_id}
                className="d-flex align-items-center gap-3 px-3 py-2 w-100 text-start border-0 bg-white"
                style={{
                  cursor: 'pointer',
                  background: idx === hiIdx ? '#fce4ec' : 'transparent',
                  borderBottom: idx < 5 ? '1px solid #f5f5f5' : 'none',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={() => setHiIdx(idx)}
                onMouseLeave={() => setHiIdx(-1)}
                onClick={() => onSelect(item)}
              >
                {item.images?.[0]
                  ? <img src={item.images[0]} alt="" className="rounded-2 border object-fit-cover flex-shrink-0"
                      style={{ width: 40, height: 40 }}
                      onError={(e) => { e.target.style.display = 'none'; }} />
                  : <div className="rounded-2 border bg-light d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: 40, height: 40 }}>
                      <Package size={16} className="text-secondary" />
                    </div>
                }

                <div className="flex-grow-1 min-w-0">
                  <div className="fw-semibold text-dark fs-8 text-truncate">{item.title}</div>
                  <div className="text-secondary" style={{ fontSize: '0.74rem' }}>
                    {item.supplier_name || (item.is_live ? 'Supplier Verified' : 'Curated Supplier')}
                    {item.category ? ` · ${item.category}` : ''}
                    {item.rating ? ` · ★ ${item.rating}` : ''}
                  </div>
                </div>

                <div className="text-end flex-shrink-0">
                  <div className="fw-bold text-dark fs-8">₹{fmt(item.source_price)}</div>
                  {item.original_price != null && (
                    <div className="text-muted text-decoration-line-through" style={{ fontSize: '0.68rem' }}>
                      ₹{fmt(item.original_price)}
                    </div>
                  )}
                </div>

                {item.is_imported && (
                  <span className="badge bg-success-subtle text-success d-flex align-items-center gap-1 fs-9 flex-shrink-0">
                    <Check size={11} /> In Store
                  </span>
                )}
                <ChevronRight size={14} className="text-muted flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Advanced Filter Collapsible Bar */}
      {showFilters && (
        <div className="p-3 mb-3 bg-light border rounded-3">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-3">
              <label className="form-label fs-8 fw-semibold text-secondary mb-1">Sort By</label>
              <select
                className="form-select form-select-sm"
                value={sort}
                onChange={(e) => { setSort(e.target.value); setCursor(null); setPage(1); }}
              >
                <option value="relevance">Relevance</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating_desc">Highest Customer Rating</option>
              </select>
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label fs-8 fw-semibold text-secondary mb-1">Min Price (₹)</label>
              <input
                type="number"
                min="0"
                className="form-control form-control-sm"
                placeholder="e.g. 100"
                value={minPrice}
                onChange={(e) => { setMinPrice(e.target.value); setCursor(null); setPage(1); }}
              />
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label fs-8 fw-semibold text-secondary mb-1">Max Price (₹)</label>
              <input
                type="number"
                min="0"
                className="form-control form-control-sm"
                placeholder="e.g. 1500"
                value={maxPrice}
                onChange={(e) => { setMaxPrice(e.target.value); setCursor(null); setPage(1); }}
              />
            </div>
            <div className="col-12 col-md-3 d-flex align-items-end justify-content-end gap-2 pt-2 pt-md-0">
              {hasActiveFilters && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 fs-8"
                  onClick={resetFilters}
                >
                  <X size={13} /> Reset Filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Popular Multi-Category Quick Search Chips */}
      <div className="d-flex align-items-center gap-2 flex-wrap mt-2 mb-3">
        <span className="text-muted fs-8 fw-semibold">Popular Searches:</span>
        {[
          { label: 'Women Saree', q: 'women saree' },
          { label: 'Kurtis & Dresses', q: 'kurti' },
          { label: 'Men Shirt', q: 'men shirt' },
          { label: 'Kids Toys', q: 'kids toys' },
          { label: 'Footwear & Shoes', q: 'running shoes' },
          { label: 'Jewellery & Choker', q: 'choker necklace' },
          { label: 'Beauty & Skincare', q: 'lipstick' },
          { label: 'Kitchen Storage', q: 'kitchen storage' },
          { label: 'Mobile Accessories', q: 'mobile accessories' },
        ].map((chip) => (
          <button
            key={chip.label}
            type="button"
            className="btn btn-sm btn-outline-secondary rounded-pill fs-9 py-1 px-2"
            onClick={() => handleChipClick(chip.q, 'all')}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Error / Rate Limit Banner with Cooldown & Retry */}
      {error && (
        <div
          className={`alert ${errorCode === 'RATE_LIMITED' || cooldown > 0 ? 'alert-warning border-warning' : 'alert-danger'} d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 mb-3 rounded-3 shadow-sm`}
          role="alert"
        >
          <div className="d-flex align-items-center gap-2 fs-8">
            <AlertCircle size={20} className={`flex-shrink-0 ${errorCode === 'RATE_LIMITED' || cooldown > 0 ? 'text-warning' : 'text-danger'}`} />
            <div>
              <div className="fw-bold">
                {errorCode === 'RATE_LIMITED' || cooldown > 0 ? 'ReefAPI Rate Limit Reached' : 'Search Request Failed'}
              </div>
              <div className="text-secondary mt-1">
                {cooldown > 0
                  ? `Provider rate limit in effect. Cooldown active: you can retry in ${cooldown} seconds.`
                  : error}
              </div>
            </div>
          </div>
          <button
            type="button"
            className={`btn btn-sm ${errorCode === 'RATE_LIMITED' || cooldown > 0 ? 'btn-outline-warning text-dark' : 'btn-danger'} flex-shrink-0 px-3 fs-8 d-flex align-items-center gap-1`}
            disabled={cooldown > 0 || searching}
            onClick={() => {
              setError('');
              setRetryCount((c) => c + 1);
            }}
          >
            {cooldown > 0 ? (
              <>
                <Loader2 size={13} className="spinner" />
                Wait {cooldown}s
              </>
            ) : (
              <>
                <RefreshCw size={13} />
                Retry Now
              </>
            )}
          </button>
        </div>
      )}

      {/* Loading state indicator */}
      {searching && (
        <div className="text-center py-5">
          <Loader2 size={32} className="spinner text-primary mb-2" style={{ color: '#d81b60' }} />
          <p className="text-secondary fs-7 mb-0">
            Searching across {selectedCategory === 'all' ? 'all Meesho categories' : selectedCategory}...
          </p>
        </div>
      )}

      {/* Empty Results Banner */}
      {!searching && !error && query.trim().length >= 2 && results.length === 0 && (
        <div className="text-center py-5 border rounded-3 bg-light mb-3">
          <Package size={40} className="text-muted mb-2" />
          <h6 className="fw-semibold text-dark mb-1">No products found</h6>
          <p className="text-secondary fs-8 mb-3" style={{ maxWidth: 450, margin: '0 auto' }}>
            No matching products returned for &ldquo;{query.trim()}&rdquo;
            {selectedCategory !== 'all' ? ` in category "${selectedCategory}"` : ' across all categories'}.
          </p>
          {selectedCategory !== 'all' && (
            <button
              type="button"
              className="btn btn-sm btn-outline-primary fs-8"
              onClick={() => handleCategorySelect('all')}
            >
              Search &ldquo;{query.trim()}&rdquo; Across All Categories
            </button>
          )}
        </div>
      )}

      {/* Browsable Product Results Grid */}
      {!searching && results.length > 0 && (
        <div className="mt-4">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 pb-2 border-bottom">
            <div className="fs-8 text-secondary">
              Showing <strong className="text-dark">{results.length}</strong> products
              {selectedCategory !== 'all' ? <span> in <strong>{selectedCategory}</strong></span> : <span> across <strong>All Categories</strong></span>}
              {query && <span> for &ldquo;<strong>{query}</strong>&rdquo;</span>}
            </div>
            <div className="fs-9 text-muted">
              Click any product to inspect details and set store pricing
            </div>
          </div>

          <div className="row g-3 row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 mb-4">
            {results.map((item) => (
              <div key={item.meesho_product_id} className="col">
                <div
                  className="card h-100 border rounded-3 overflow-hidden shadow-sm d-flex flex-column"
                  style={{
                    transition: 'transform 0.15s, box-shadow 0.15s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '';
                  }}
                  onClick={() => onSelect(item)}
                >
                  {/* Image container */}
                  <div className="position-relative bg-light" style={{ height: 180, overflow: 'hidden' }}>
                    {item.images?.[0] ? (
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className="w-100 h-100 object-fit-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-100 h-100 d-flex align-items-center justify-content-center text-secondary">
                        <Package size={32} />
                      </div>
                    )}

                    {/* Category pill */}
                    {item.category && (
                      <span
                        className="position-absolute top-0 start-0 m-2 badge bg-dark bg-opacity-75 text-white fs-9"
                        style={{ backdropFilter: 'blur(2px)' }}
                      >
                        {item.category}
                      </span>
                    )}

                    {/* In Store Badge */}
                    {item.is_imported && (
                      <span className="position-absolute top-0 end-0 m-2 badge bg-success text-white d-flex align-items-center gap-1 fs-9 shadow-sm">
                        <Check size={11} /> In Store
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="card-body p-3 d-flex flex-column flex-grow-1">
                    <h6
                      className="card-title fw-bold text-dark fs-8 mb-1"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        height: '2.4rem',
                      }}
                      title={item.title}
                    >
                      {item.title}
                    </h6>

                    <div className="d-flex align-items-center justify-content-between text-secondary fs-9 mb-2">
                      <span className="text-truncate" style={{ maxWidth: '65%' }}>
                        {item.supplier_name || 'Verified Meesho Supplier'}
                      </span>
                      {item.rating && (
                        <span className="text-warning fw-semibold d-flex align-items-center gap-1">
                          ★ {item.rating}
                          {item.reviews_count ? <span className="text-muted fs-9">({item.reviews_count})</span> : null}
                        </span>
                      )}
                    </div>

                    {/* Pricing Box */}
                    <div className="mt-auto pt-2 border-top">
                      <div className="d-flex align-items-baseline justify-content-between">
                        <div>
                          <div className="text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Supplier Cost
                          </div>
                          <div className="fw-bold fs-7" style={{ color: '#d81b60' }}>
                            ₹{fmt(item.source_price)}
                          </div>
                        </div>

                        <div className="text-end">
                          <div className="text-muted" style={{ fontSize: '0.68rem' }}>
                            Maximum Selling
                          </div>
                          <div className="text-secondary fs-8">
                            {item.original_price != null ? `₹${fmt(item.original_price)}` : <span className="text-muted fs-9">Not provided</span>}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-sm w-100 mt-2 fw-semibold fs-8 rounded-2 d-flex align-items-center justify-content-center gap-1"
                        style={{
                          background: item.is_imported ? '#f3f4f6' : 'linear-gradient(135deg,#d81b60,#ad1457)',
                          color: item.is_imported ? '#374151' : '#fff',
                          border: item.is_imported ? '1px solid #d1d5db' : 'none',
                        }}
                      >
                        {item.is_imported ? 'Review Imported Product' : 'View Details & Import'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center my-4">
              <button
                type="button"
                className="btn btn-outline-secondary px-4 py-2 fs-7 rounded-3 d-inline-flex align-items-center gap-2 shadow-sm"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <Loader2 size={16} className="spinner" />
                    Loading more products...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Load More Products
                  </>
                )}
              </button>
            </div>
          )}

          {!hasMore && results.length > 0 && (
            <p className="text-center text-muted fs-8 my-4">
              ✓ All matching products loaded for this search.
            </p>
          )}
        </div>
      )}

      {query.trim().length < 2 && (
        <div className="py-4 text-center text-muted fs-8">
          Type at least 2 characters or select a popular search chip above to explore products.
        </div>
      )}
    </div>
  );
}

/* ─── Step 2: Product Detail Card ──────────────────────────── */
function ProductDetailStep({
  product: initialProduct,
  storeId,
  onImportClick,
  onDirectImport,
  onBack,
  loading: parentLoading,
}) {
  const [activeImg, setActiveImg] = useState(0);
  const [product, setProduct] = useState(initialProduct || null);
  const [loading, setLoading] = useState(!initialProduct);
  const [error, setError] = useState('');
  const [rateLimitedNotice, setRateLimitedNotice] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Category and Subcategory state
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(true);
  const [catError, setCatError] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [validationError, setValidationError] = useState('');

  // Editable Selling Price state
  const [sellingPrice, setSellingPrice] = useState(() => {
    const defaultSp = initialProduct?.suggested_price || initialProduct?.source_price || 0;
    return defaultSp ? String(defaultSp) : '';
  });
  const [priceError, setPriceError] = useState('');

  // Quick category creation state
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [creatingCat, setCreatingCat] = useState(false);
  const [directLoading, setDirectLoading] = useState(false);

  // Fetch product detail for background enrichment
  useEffect(() => {
    if (!initialProduct?.meesho_product_id) return;
    const controller = new AbortController();
    if (!product) {
      setLoading(true);
    }
    setError('');
    setRateLimitedNotice(false);

    api.get(`/meesho/product/${encodeURIComponent(initialProduct.meesho_product_id)}`, {
      headers: { 'X-Store-Id': storeId },
      signal: controller.signal,
    }).then((res) => {
      const p = res.data?.product;
      if (p) {
        setProduct((prev) => ({ ...(prev || {}), ...p }));
        setSellingPrice((prevSp) => {
          if (!prevSp || prevSp === '0') {
            const defaultSp = p.suggested_price || p.source_price || 0;
            return defaultSp ? String(defaultSp) : prevSp;
          }
          return prevSp;
        });
      }
    }).catch((err) => {
      if (controller.signal.aborted) return;
      const isRateLimited = err.response?.status === 429 || err.response?.data?.code === 'RATE_LIMITED';
      if (isRateLimited) {
        setRateLimitedNotice(true);
      }
      if (!initialProduct || !initialProduct.source_price) {
        setError(err.response?.status === 401 ? 'Session expired. Please sign in again.' :
          err.response?.status === 403 ? 'You do not have access to this store.' :
          err.response?.status === 404 ? 'This product is no longer available.' :
          (err.response?.data?.message || 'Could not load product details.'));
      }
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [initialProduct?.meesho_product_id, retryCount, storeId]);

  // Load categories from Toastkart existing backend/database
  const loadCategories = async () => {
    setCatLoading(true);
    setCatError('');
    try {
      const res = await api.get('/meesho/categories', {
        headers: { 'X-Store-Id': storeId },
      });
      const list = res.data.categories || [];
      setCategories(list);
    } catch (err) {
      setCatError(err.response?.data?.message || 'Could not load store categories.');
    } finally {
      setCatLoading(false);
    }
  };

  useEffect(() => {
    if (storeId) {
      loadCategories();
    }
  }, [storeId]);

  // Auto-match category if product has category and user hasn't chosen one yet
  useEffect(() => {
    if (product && categories.length > 0 && !selectedCategoryId) {
      const catToMatch = String(product.category || '').toLowerCase();
      if (catToMatch) {
        const found = categories.find((c) => c.name.toLowerCase() === catToMatch);
        if (found) {
          setSelectedCategoryId(String(found.id));
        }
      }
    }
  }, [product, categories, selectedCategoryId]);

  // Create new category using Toastkart's existing category API
  const handleCreateCategory = async (e) => {
    e?.preventDefault();
    const name = newCatName.trim();
    if (!name) return;
    setCreatingCat(true);
    try {
      const res = await api.post('/categories', {
        name,
        description: newCatDesc.trim(),
        store_id: storeId,
      }, {
        headers: { 'X-Store-Id': storeId },
      });
      const created = res.data;
      setCategories((prev) => [...prev, created]);
      setSelectedCategoryId(String(created.id));
      setSelectedSubcategory('');
      setNewCatName('');
      setNewCatDesc('');
      setShowNewCatInput(false);
      setValidationError('');
      try {
        const saved = JSON.parse(localStorage.getItem('aureum_owner_categories') || '[]');
        if (Array.isArray(saved) && !saved.some((c) => String(c.id) === String(created.id))) {
          localStorage.setItem('aureum_owner_categories', JSON.stringify([created, ...saved]));
        }
      } catch (storageErr) {}
      window.dispatchEvent(new CustomEvent('toastkart:category-created', { detail: created }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create category.');
    } finally {
      setCreatingCat(false);
    }
  };

  if (loading && !product) return <div className="py-5 text-center text-secondary"><Loader2 size={20} className="spinner me-2" />Loading product details…</div>;
  if (!product) return (
    <div>
      <button type="button" className="btn btn-link text-secondary ps-0 mb-3" onClick={onBack}>Back to search</button>
      <div className="alert alert-danger d-flex align-items-center justify-content-between gap-3 mb-0">
        <span>{error || 'Could not load product details.'}</span>
        <button type="button" className="btn btn-sm btn-outline-danger flex-shrink-0"
          onClick={() => setRetryCount((count) => count + 1)}>Retry</button>
      </div>
    </div>
  );

  const images = product.images?.filter(Boolean) || [];
  const sourceUrl = product.product_url || null;

  const sourcePrice = Number(product.source_price || 0);
  const parsedSellingPrice = parseFloat(sellingPrice) || 0;
  const estimatedProfit = parsedSellingPrice - sourcePrice;
  const marginPct = parsedSellingPrice > 0
    ? ((estimatedProfit / parsedSellingPrice) * 100).toFixed(1)
    : '0';

  const selectedCategoryObj = categories.find((c) => String(c.id) === String(selectedCategoryId));
  const availableSubcategories = selectedCategoryObj?.subcategories || [];

  const handleProceedToImport = () => {
    if (!selectedCategoryId) {
      setValidationError('Category is required. Please select a category before importing.');
      document.getElementById('meesho-detail-category')?.focus();
      return;
    }
    if (!parsedSellingPrice || parsedSellingPrice <= 0) {
      setPriceError('Enter a valid selling price greater than 0.');
      document.getElementById('meesho-detail-selling-price')?.focus();
      return;
    }
    if (parsedSellingPrice < sourcePrice) {
      setPriceError(`Selling price must be at least the supplier cost (₹${fmt(sourcePrice)}).`);
      document.getElementById('meesho-detail-selling-price')?.focus();
      return;
    }
    setValidationError('');
    setPriceError('');
    const { detectedColor, detectedSize } = detectMeeshoColorAndSize(product);
    onImportClick({
      ...product,
      color: product.color || detectedColor || null,
      size: product.size || detectedSize || null,
      selling_price: parsedSellingPrice,
      original_price: product.original_price != null && Number(product.original_price) > 0 ? Number(product.original_price) : null,
      category_id: selectedCategoryId,
      category_name: selectedCategoryObj?.name || '',
      subcategory: selectedSubcategory || '',
      supplier_price: sourcePrice,
      product_name: product.title,
      image_url: images[0] || product.image_url || null,
    });
  };

  const handleQuickImport = async () => {
    if (!selectedCategoryId) {
      setValidationError('Category is required. Please select a category before importing.');
      document.getElementById('meesho-detail-category')?.focus();
      return;
    }
    if (!parsedSellingPrice || parsedSellingPrice <= 0) {
      setPriceError('Enter a valid selling price greater than 0.');
      document.getElementById('meesho-detail-selling-price')?.focus();
      return;
    }
    if (parsedSellingPrice < sourcePrice) {
      setPriceError(`Selling price must be at least the supplier cost (₹${fmt(sourcePrice)}).`);
      document.getElementById('meesho-detail-selling-price')?.focus();
      return;
    }
    setValidationError('');
    setPriceError('');
    setDirectLoading(true);
    const { detectedColor, detectedSize } = detectMeeshoColorAndSize(product);
    try {
      await onDirectImport({
        meesho_product_id: product.meesho_product_id,
        color: product.color || detectedColor || null,
        size: product.size || detectedSize || null,
        selling_price: parsedSellingPrice,
        original_price: product.original_price != null && Number(product.original_price) > 0 ? Number(product.original_price) : null,
        custom_title: product.title,
        description: product.description || '',
        images: product.images || [],
        stock_quantity: Number(product.stock_quantity ?? 10),
        category_id: Number(selectedCategoryId),
        category: selectedCategoryObj?.name || product.category || '',
        subcategory: selectedSubcategory || null,
        supplier_price: sourcePrice,
        product_name: product.title,
        image_url: images[0] || product.image_url || null,
        is_active: true,
      });
    } finally {
      setDirectLoading(false);
    }
  };

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <button type="button" className="btn btn-link text-secondary ps-0 d-flex align-items-center gap-1 fs-8"
          onClick={onBack} style={{ textDecoration: 'none' }}>
          <ArrowLeft size={14} /> Back to search
        </button>
        {rateLimitedNotice && (
          <span className="badge bg-warning-subtle text-dark border border-warning fs-9 py-1 px-2">
            Catalog fallback active (provider rate limit)
          </span>
        )}
      </div>

      <div className="row g-4">
        {/* Image panel */}
        <div className="col-12 col-md-5">
          <div className="rounded-4 overflow-hidden border bg-light d-flex align-items-center justify-content-center"
            style={{ height: 260 }}>
            {images[activeImg]
              ? <img src={images[activeImg]} alt={product.title}
                  style={{ maxHeight: 260, maxWidth: '100%', objectFit: 'contain' }}
                  onError={(e) => { e.target.style.display = 'none'; }} />
              : <Package size={48} className="text-secondary opacity-50" />
            }
          </div>
          {images.length > 1 && (
            <div className="d-flex gap-2 mt-2 flex-wrap">
              {images.slice(0, 5).map((img, i) => (
                <img key={i} src={img} alt=""
                  className="rounded-2 border object-fit-cover"
                  style={{ width: 52, height: 52, cursor: 'pointer', opacity: activeImg === i ? 1 : 0.55, transition: 'opacity 0.15s' }}
                  onClick={() => setActiveImg(i)}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Info panel */}
        <div className="col-12 col-md-7 d-flex flex-column gap-3">
          {/* Title & badges */}
          <div>
            <div className="d-flex flex-wrap gap-2 mb-2">
              {product.category && <span className="badge bg-light text-dark border fs-9"><Tag size={11} className="me-1" />Meesho: {product.category}</span>}
              {product.is_imported && (
                <span className="badge bg-success-subtle text-success fs-9">
                  <Check size={11} className="me-1" />Already in your store
                </span>
              )}
              {product.is_live === false ? <StagingBadge /> : product.is_live && <LiveBadge />}
            </div>
            <h4 className="fw-bold text-dark mb-1 fs-6">{product.title}</h4>
            {product.supplier_name && (
              <p className="text-secondary fs-8 mb-1">Supplier: {product.supplier_name}</p>
            )}
            {product.brand && <p className="text-secondary fs-8 mb-1">Brand: {product.brand}</p>}
            {sourceUrl?.startsWith('https://') && (
              <a href={sourceUrl} target="_blank" rel="noreferrer" className="fs-8">
                View supplier listing <ExternalLink size={12} className="ms-1" />
              </a>
            )}
            {(() => {
              const { detectedColor, detectedSize } = detectMeeshoColorAndSize(product);
              if (!detectedColor && !detectedSize) return null;
              return (
                <div className="d-flex flex-wrap gap-2 mt-2 pt-2 border-top">
                  {detectedColor && (
                    <span className="badge bg-light text-dark border fs-9 px-2.5 py-1.5 d-inline-flex align-items-center gap-1.5">
                      <span className="d-inline-block rounded-circle border" style={{ width: 10, height: 10, backgroundColor: detectedColor.toLowerCase().replace(/[^a-z]/g, '') || '#bbb' }} />
                      Color: <strong>{detectedColor}</strong>
                    </span>
                  )}
                  {detectedSize && (
                    <span className="badge bg-light text-dark border fs-9 px-2.5 py-1.5 d-inline-flex align-items-center gap-1.5">
                      Size: <strong>{detectedSize}</strong>
                    </span>
                  )}
                </div>
              );
            })()}
            {product.rating && (
              <div className="d-flex align-items-center gap-1 fs-8">
                <Star size={13} fill="#f59e0b" stroke="#f59e0b" />
                <span className="fw-semibold">{product.rating}</span>
                <span className="text-muted">({product.reviews_count?.toLocaleString()} reviews)</span>
              </div>
            )}
          </div>

          {/* Pricing & Profit Calculator */}
          <div className="p-3 rounded-3 border bg-white shadow-sm">
            <div className="fw-semibold fs-8 text-dark mb-2 d-flex align-items-center gap-1">
              <DollarSign size={14} className="text-secondary" />
              Pricing &amp; Profit Calculator
            </div>
            <div className="row g-2 align-items-stretch">
              {/* 1. Supplier Cost */}
              <div className="col-6 col-sm-3">
                <div className="bg-light rounded-3 p-2 h-100 border text-center d-flex flex-column justify-content-center">
                  <div className="text-secondary fw-semibold fs-9 mb-1">Supplier Cost</div>
                  <div className="fw-bold text-dark fs-7">
                    ₹{fmt(product.source_price)}
                  </div>
                  <span className="text-muted" style={{ fontSize: '0.66rem' }}>Source cost from provider</span>
                </div>
              </div>

              {/* 2. Maximum Selling Price */}
              <div className="col-6 col-sm-3">
                <div className="bg-light rounded-3 p-2 h-100 border text-center d-flex flex-column justify-content-center">
                  <div className="text-secondary fw-semibold fs-9 mb-1">Maximum Selling Price</div>
                  {product.original_price != null && Number(product.original_price) > 0 ? (
                    <div className="fw-bold text-dark fs-7">
                      ₹{fmt(product.original_price)}
                    </div>
                  ) : (
                    <div className="text-muted fst-italic" style={{ fontSize: '0.72rem' }}>
                      Not provided by supplier
                    </div>
                  )}
                  <span className="text-muted" style={{ fontSize: '0.66rem' }}>Supplier verified MRP</span>
                </div>
              </div>

              {/* 3. Editable Selling Price */}
              <div className="col-6 col-sm-3">
                <div className="rounded-3 p-2 h-100 border text-center d-flex flex-column justify-content-center" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
                  <label className="text-primary fw-semibold fs-9 mb-1" htmlFor="meesho-detail-selling-price">
                    Selling Price *
                  </label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-white border-0 py-0 px-1 fw-bold text-primary">₹</span>
                    <input
                      id="meesho-detail-selling-price"
                      type="number"
                      step="0.01"
                      min="1"
                      className={`form-control form-control-sm text-center fw-bold ${priceError ? 'is-invalid' : ''}`}
                      value={sellingPrice}
                      onChange={(e) => {
                        setSellingPrice(e.target.value);
                        setPriceError('');
                      }}
                      style={{ color: '#1d4ed8', background: '#fff' }}
                    />
                  </div>
                  <span className="text-muted" style={{ fontSize: '0.66rem' }}>Your store selling price</span>
                </div>
              </div>

              {/* 4. Estimated Profit */}
              <div className="col-6 col-sm-3">
                <div
                  className="rounded-3 p-2 h-100 border text-center d-flex flex-column justify-content-center"
                  style={{
                    background: estimatedProfit >= 0 ? '#f0fdf4' : '#fff5f5',
                    borderColor: estimatedProfit >= 0 ? '#bbf7d0' : '#fecaca',
                  }}
                >
                  <div className="text-secondary fw-semibold fs-9 mb-1">Estimated Profit</div>
                  <div className={`fw-bold fs-7 ${estimatedProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                    {estimatedProfit >= 0 ? '+' : ''}₹{fmtFixed(estimatedProfit)}
                  </div>
                  <span style={{ fontSize: '0.66rem', color: estimatedProfit >= 0 ? '#15803d' : '#b91c1c' }}>
                    ({marginPct}% margin)
                  </span>
                </div>
              </div>
            </div>

            {priceError && (
              <div className="alert alert-danger py-1 px-2 fs-8 mt-2 mb-0 d-flex align-items-center gap-1">
                <AlertCircle size={13} /> {priceError}
              </div>
            )}

            {/* Profit Note */}
            <div className="p-2 rounded-2 mt-2" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.73rem', color: '#64748b', lineHeight: 1.5 }}>
              <strong>Estimated Profit = Selling Price − Supplier Cost.</strong> Note: Shipping, platform fees, payment gateway charges, returns, and other operating expenses are excluded unless configured.
            </div>
          </div>

          {/* Shipping + Stock */}
          <div className="d-flex gap-3 fs-8 text-secondary flex-wrap">
            {product.estimated_shipping != null && <span className="d-flex align-items-center gap-1"><Truck size={13} /> Est. Shipping ₹{fmt(product.estimated_shipping)}</span>}
            {product.in_stock != null
              ? <span className="d-flex align-items-center gap-1"><Package size={13} /> {product.in_stock ? 'In Stock' : 'Out of Stock'}</span>
              : product.stock_status && <span className="d-flex align-items-center gap-1"><Package size={13} />{product.stock_status}</span>}
          </div>

          {/* Variants */}
          {(product.variants || []).length > 0 && (
            <div>
              <div className="fw-semibold fs-8 text-dark mb-1">Available Variants</div>
              <div className="d-flex flex-wrap gap-1">
                {product.variants.map((variant, index) => (
                  <span key={variant.variant_id || index} className="badge bg-light text-dark border rounded-pill fs-9 px-2">
                    {typeof variant === 'string' ? variant : [
                      variant.name,
                      variant.price != null ? `₹${fmt(variant.price)}` : null,
                      variant.in_stock != null ? (variant.in_stock ? 'In stock' : 'Out of stock') : null,
                    ].filter(Boolean).join(' · ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <p className="text-secondary fs-8 mb-0" style={{ lineHeight: 1.6 }}>
              {product.description}
            </p>
          )}

          {/* Category & Subcategory Selection Card */}
          <div className="p-3 rounded-3 border bg-light">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <label className="fw-semibold fs-8 text-dark mb-0 d-flex align-items-center gap-1" htmlFor="meesho-detail-category">
                <Tag size={13} className="text-secondary" />
                Store Category <span className="text-danger">*</span>
              </label>
              {categories.length > 0 && (
                <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                  Select before importing
                </span>
              )}
            </div>

            {catLoading ? (
              <div className="text-secondary fs-8 py-1 d-flex align-items-center gap-2">
                <Loader2 size={14} className="spinner" /> Loading store categories…
              </div>
            ) : catError ? (
              <div className="alert alert-danger py-2 px-3 fs-8 mb-2 d-flex align-items-center justify-content-between">
                <span>{catError}</span>
                <button type="button" className="btn btn-sm btn-outline-danger" onClick={loadCategories}>Retry</button>
              </div>
            ) : (
              <>
                <div className="row g-2">
                  <div className="col-12 col-sm-6">
                    <select
                      id="meesho-detail-category"
                      className={`form-select form-select-sm ${validationError ? 'is-invalid' : ''}`}
                      value={selectedCategoryId}
                      onChange={(e) => {
                        setSelectedCategoryId(e.target.value);
                        setSelectedSubcategory('');
                        setValidationError('');
                      }}
                    >
                      <option value="">— Select Category (Required) —</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.products_count !== undefined ? `(${c.products_count})` : ''}
                        </option>
                      ))}
                    </select>
                    {validationError && (
                      <div className="text-danger mt-1" style={{ fontSize: '0.75rem' }}>
                        {validationError}
                      </div>
                    )}
                  </div>

                  <div className="col-12 col-sm-6">
                    <select
                      id="meesho-detail-subcategory"
                      className="form-select form-select-sm"
                      value={selectedSubcategory}
                      onChange={(e) => setSelectedSubcategory(e.target.value)}
                      disabled={availableSubcategories.length === 0}
                    >
                      {availableSubcategories.length === 0 ? (
                        <option value="">— No subcategories available —</option>
                      ) : (
                        <>
                          <option value="">— Select Subcategory (Optional) —</option>
                          {availableSubcategories.map((sub) => (
                            <option key={sub.id || sub.name} value={sub.id || sub.name}>
                              {sub.name}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                    <div className="text-muted mt-1" style={{ fontSize: '0.7rem' }}>
                      {availableSubcategories.length === 0
                        ? "Toastkart's current category structure is single-level."
                        : 'Select a subcategory (optional).'}
                    </div>
                  </div>
                </div>

                {/* Selected Category Description Preview */}
                {selectedCategoryObj && (
                  <div className="mt-2 p-2 rounded-2 border bg-light" style={{ fontSize: '0.78rem' }}>
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span className="fw-semibold text-dark">Category Description:</span>
                      {!selectedCategoryObj.description && (
                        <span className="text-muted fst-italic fs-9">No description added</span>
                      )}
                    </div>
                    {selectedCategoryObj.description ? (
                      <div className="text-secondary" style={{ lineHeight: 1.45 }}>
                        {selectedCategoryObj.description}
                      </div>
                    ) : (
                      <div className="text-muted fs-9">
                        This category has no description yet. It can be viewed or updated in Collections.
                      </div>
                    )}
                  </div>
                )}

                {/* Inline Category Quick Add */}
                {showNewCatInput ? (
                  <div className="mt-2 p-3 rounded-3 border bg-light">
                    <div className="fw-semibold fs-8 text-dark mb-2">Create New Store Category</div>
                    <div className="mb-2">
                      <label className="form-label fs-9 fw-semibold text-secondary mb-1">Category Name *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Kids Toys, Summer Clothing, Electronics..."
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className="mb-2">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <label className="form-label fs-9 fw-semibold text-secondary mb-0">Category Description</label>
                        {newCatName.trim() && (
                          <button
                            type="button"
                            className="btn btn-link btn-sm p-0 fs-9 text-decoration-none fw-bold"
                            style={{ color: "#d81b60" }}
                            onClick={() => {
                              const catTitle = newCatName.trim();
                              setNewCatDesc(`Explore our curated collection of ${catTitle.toLowerCase()}, crafted for premium quality, everyday comfort, and exceptional value.`);
                            }}
                          >
                            ✨ Auto-generate
                          </button>
                        )}
                      </div>
                      <textarea
                        rows="2"
                        className="form-control form-control-sm"
                        placeholder="Describe this category collection (shows in store collections)..."
                        value={newCatDesc}
                        onChange={(e) => setNewCatDesc(e.target.value)}
                      />
                    </div>
                    <div className="d-flex align-items-center justify-content-end gap-2 mt-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => {
                          setShowNewCatInput(false);
                          setNewCatName('');
                          setNewCatDesc('');
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm text-white fw-bold d-flex align-items-center gap-1"
                        style={{ background: '#d81b60', border: 'none' }}
                        onClick={handleCreateCategory}
                        disabled={creatingCat || !newCatName.trim()}
                      >
                        {creatingCat ? <Loader2 size={13} className="spinner" /> : 'Save Category'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2">
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0 fs-9 text-decoration-none"
                      onClick={() => setShowNewCatInput(true)}
                    >
                      + Create new store category
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* CTA Buttons */}
          {product.is_imported ? (
            <div className="d-flex align-items-center gap-2 text-success fw-semibold fs-7">
              <Check size={18} /> This product is already in your store.
            </div>
          ) : (
            <div className="d-flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                className="btn fw-bold py-2 px-4 d-flex align-items-center justify-content-center gap-2 rounded-3 fs-7"
                style={{ background: 'linear-gradient(135deg,#d81b60,#ad1457)', color: '#fff', border: 'none' }}
                onClick={handleProceedToImport}
              >
                <Plus size={18} /> Import to Store
              </button>
              {onDirectImport && (
                <button
                  type="button"
                  className="btn btn-outline-secondary fw-semibold py-2 px-3 rounded-3 fs-7 d-flex align-items-center gap-1"
                  onClick={handleQuickImport}
                  disabled={directLoading || parentLoading}
                >
                  {directLoading ? <Loader2 size={15} className="spinner" /> : <ShoppingBag size={15} />}
                  Quick Import (₹{fmt(parsedSellingPrice || product.source_price)})
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Step 3: Import Form ───────────────────────────────────── */
function ImportFormStep({ product, storeId, onImport, onBack, loading }) {
  const { detectedColor: initialDetectedColor, detectedSize: initialDetectedSize } = detectMeeshoColorAndSize(product);
  const [title, setTitle]           = useState(product.title || '');
  const [description, setDesc]      = useState(product.description || '');
  const [color, setColor]           = useState(product.color || initialDetectedColor || '');
  const [size, setSize]             = useState(product.size || initialDetectedSize || '');
  const [sellingPrice, setPrice]    = useState(String(product.selling_price || product.suggested_price || product.source_price || ''));
  const [imagesText, setImagesText] = useState((product.images || []).join('\n'));
  const [stockQuantity, setStockQuantity] = useState(String(product.stock_quantity ?? 10));
  const [marginMode, setMarginMode] = useState('amount');
  const [desiredMargin, setDesiredMargin] = useState(String(Math.max(0, Number(product.selling_price || product.suggested_price || 0) - Number(product.source_price || 0))));
  const [marginMarkup, setMarginMarkup] = useState(String(
    Number(product.source_price || 0) > 0
      ? (Math.max(0, Number(product.selling_price || product.suggested_price || 0) - Number(product.source_price || 0)) / Number(product.source_price) * 100).toFixed(2)
      : 0
  ));
  const [categoryId, setCategoryId] = useState(product.category_id ? String(product.category_id) : '');
  const [subcategory, setSubcategory] = useState(product.subcategory || '');
  const [isActive, setIsActive]     = useState(true);
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(true);
  const [catError, setCatError]     = useState('');
  const [errors, setErrors]         = useState({});

  const sourcePrice  = Number(product.source_price || 0);
  const sp           = parseFloat(sellingPrice) || 0;
  const margin       = sp - sourcePrice;
  const marginPct    = sp > 0 ? ((margin / sp) * 100).toFixed(1) : '0';

  /* Load store categories from Toastkart database */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/meesho/categories', { headers: { 'X-Store-Id': storeId } });
        if (!cancelled) {
          const list = res.data.categories || [];
          setCategories(list);
          if (!categoryId && product.category_id) {
            setCategoryId(String(product.category_id));
          } else if (!categoryId) {
            const matchingCategory = list.find(
              (category) => category.name.toLowerCase() === String(product.category_name || product.category || '').toLowerCase()
            );
            if (matchingCategory) setCategoryId(String(matchingCategory.id));
          }
          setCatLoading(false);
        }
      } catch (error) {
        if (!cancelled) {
          setCatError(error.response?.data?.message || 'Could not load this store’s categories.');
          setCatLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [storeId, categoryId, product.category_id, product.category_name, product.category]);

  const selectedCategoryObj = categories.find((c) => String(c.id) === String(categoryId));
  const availableSubcategories = selectedCategoryObj?.subcategories || [];

  const validate = () => {
    const e = {};
    if (!title.trim()) e.title = 'Product name is required.';
    if (!sellingPrice || !Number.isFinite(Number(sellingPrice)) || Number(sellingPrice) <= 0) {
      e.price = 'Enter a valid selling price greater than 0.';
    } else if (Number(sellingPrice) < sourcePrice) {
      e.price = 'Selling price must cover the supplier cost.';
    }
    if (marginMode === 'amount' && (!Number.isFinite(Number(desiredMargin)) || Number(desiredMargin) < 0)) {
      e.margin = 'Gross margin must be a non-negative amount.';
    }
    if (marginMode === 'percentage' && (!Number.isFinite(Number(marginMarkup)) || Number(marginMarkup) < 0)) {
      e.margin = 'Markup percentage must be non-negative.';
    }
    if (!categoryId) e.category = 'Category is required. Select a category from this store.';
    if (!Number.isInteger(Number(stockQuantity)) || Number(stockQuantity) < 0) e.stock = 'Enter a non-negative whole stock quantity.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const parsedImages = imagesText.split('\n').map((image) => image.trim()).filter(Boolean);
    await onImport({
      meesho_product_id: product.meesho_product_id,
      selling_price: parseFloat(sellingPrice),
      original_price: product.original_price != null && Number(product.original_price) > 0 ? Number(product.original_price) : null,
      custom_title: title,
      description,
      images: parsedImages,
      stock_quantity: Number(stockQuantity),
      category_id: Number(categoryId),
      category: selectedCategoryObj?.name || product.category || '',
      subcategory: subcategory || null,
      supplier_price: sourcePrice,
      product_name: title,
      image_url: parsedImages[0] || product.image_url || null,
      color: color.trim() || null,
      size: size.trim() || null,
      is_active: isActive,
    });
  };

  return (
    <div>
      <button type="button"
        className="btn btn-link text-secondary ps-0 mb-3 d-flex align-items-center gap-1 fs-8"
        onClick={onBack} style={{ textDecoration: 'none' }}>
        <ArrowLeft size={14} /> Back to product
      </button>

      <h5 className="fw-bold text-dark mb-1">Import to Store</h5>
      <p className="text-secondary fs-8 mb-4">
        Review and edit details below, then click Save. The product and its collection will be published live to your storefront.
      </p>

      {/* Product preview */}
      <div className="d-flex align-items-center gap-3 p-3 rounded-3 border bg-light mb-4">
        {product.images?.[0] && (
          <img src={product.images[0]} alt=""
            className="rounded-2 border object-fit-cover flex-shrink-0"
            style={{ width: 56, height: 56 }}
            onError={(e) => { e.target.style.display = 'none'; }} />
        )}
        <div className="flex-grow-1 min-w-0">
          <div className="fw-semibold text-dark fs-8 text-truncate">{product.title}</div>
          <div className="text-secondary fs-9">
            Supplier ID: {product.meesho_product_id} · Cost: ₹{fmt(sourcePrice)}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="d-flex flex-column gap-3">
          {/* Product name */}
          <div>
            <label className="fw-semibold fs-8 text-dark mb-1">Product Name *</label>
            <input
              type="text"
              className={`form-control fs-7 ${errors.title ? 'is-invalid' : ''}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
            />
            {errors.title && <div className="invalid-feedback">{errors.title}</div>}
          </div>

          {/* Description */}
          <div>
            <label className="fw-semibold fs-8 text-dark mb-1">Description (optional)</label>
            <textarea
              className="form-control fs-8"
              rows={3}
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div>
            <label className="fw-semibold fs-8 text-dark mb-1">Product images (one URL per line)</label>
            <textarea className="form-control fs-8" rows={3} value={imagesText}
              onChange={(e) => setImagesText(e.target.value)} />
          </div>

          {/* Pricing */}
          <div className="row g-2">
            <div className="col-6 col-sm-3">
              <label className="fw-semibold fs-8 text-dark mb-1">Supplier Cost</label>
              <div className="input-group input-group-sm">
                <span className="input-group-text">₹</span>
                <input type="text" className="form-control bg-light text-muted" disabled value={fmtFixed(sourcePrice)} />
              </div>
              <span className="text-muted" style={{ fontSize: '0.66rem' }}>Source cost</span>
            </div>

            <div className="col-6 col-sm-3">
              <label className="fw-semibold fs-8 text-dark mb-1">Maximum Selling Price</label>
              {product.original_price != null && Number(product.original_price) > 0 ? (
                <div className="input-group input-group-sm">
                  <span className="input-group-text">₹</span>
                  <input type="text" className="form-control bg-light text-muted" disabled value={fmtFixed(product.original_price)} />
                </div>
              ) : (
                <div className="form-control form-control-sm bg-light text-muted fst-italic" style={{ fontSize: '0.74rem' }}>
                  Not provided by supplier
                </div>
              )}
              <span className="text-muted" style={{ fontSize: '0.66rem' }}>Verified MRP</span>
            </div>

            <div className="col-6 col-sm-3">
              <label className="fw-semibold fs-8 text-dark mb-1">Selling Price *</label>
              <div className={`input-group input-group-sm ${errors.price ? 'is-invalid' : ''}`}>
                <span className="input-group-text">₹</span>
                <input
                  type="number" step="0.01" min="1"
                  className={`form-control fw-bold ${errors.price ? 'is-invalid' : ''}`}
                  value={sellingPrice}
                  onChange={(e) => {
                    const value = e.target.value;
                    setPrice(value);
                    if (value !== '' && Number(value) >= sourcePrice) {
                      const amount = Number(value) - sourcePrice;
                      setDesiredMargin(amount.toFixed(2));
                      setMarginMarkup(sourcePrice > 0 ? (amount / sourcePrice * 100).toFixed(2) : '0');
                    }
                  }}
                  style={{ color: '#2563eb' }}
                />
              </div>
              {errors.price && <div className="text-danger" style={{ fontSize: '0.75rem' }}>{errors.price}</div>}
              <span className="text-muted" style={{ fontSize: '0.66rem' }}>Storefront price</span>
            </div>

            <div className="col-6 col-sm-3">
              <label className="fw-semibold fs-8 text-dark mb-1">Estimated Profit</label>
              <div className={`p-1 rounded-2 border text-center ${margin >= 0 ? 'border-success' : 'border-danger'}`}
                style={{ background: margin >= 0 ? '#f0fdf4' : '#fff5f5' }}>
                <div className={`fw-bold fs-7 ${margin >= 0 ? 'text-success' : 'text-danger'}`}>
                  {margin >= 0 ? '+' : ''}₹{fmtFixed(margin)}
                </div>
                <div className="text-muted" style={{ fontSize: '0.66rem' }}>{marginPct}% of selling price</div>
              </div>
            </div>
          </div>

          <div className="row g-2 align-items-end">
            <div className="col-12 col-sm-4">
              <label className="fw-semibold fs-8 text-dark mb-1">Set profit margin by</label>
              <select className="form-select form-select-sm" value={marginMode} onChange={(e) => setMarginMode(e.target.value)}>
                <option value="amount">Amount (₹)</option>
                <option value="percentage">Markup on supplier cost (%)</option>
              </select>
            </div>
            <div className="col-12 col-sm-8">
              {marginMode === 'amount' ? (
                <>
                  <label className="fw-semibold fs-8 text-dark mb-1">Desired profit margin amount</label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text">₹</span>
                    <input type="number" min="0" step="0.01" className="form-control" value={desiredMargin}
                      onChange={(e) => {
                        const value = e.target.value;
                        setDesiredMargin(value);
                        if (value !== '' && Number(value) >= 0) setPrice((sourcePrice + Number(value)).toFixed(2));
                      }} />
                  </div>
                </>
              ) : (
                <>
                  <label className="fw-semibold fs-8 text-dark mb-1">Markup on supplier cost</label>
                  <div className="input-group input-group-sm">
                    <input type="number" min="0" step="0.01" className="form-control" value={marginMarkup}
                      onChange={(e) => {
                        const value = e.target.value;
                        setMarginMarkup(value);
                        if (value !== '' && Number(value) >= 0) {
                          const amount = sourcePrice * Number(value) / 100;
                          setDesiredMargin(amount.toFixed(2));
                          setPrice((sourcePrice + amount).toFixed(2));
                        }
                      }} />
                    <span className="input-group-text">%</span>
                  </div>
                </>
              )}
            </div>
          </div>
          <p className="small text-muted mb-0">
            {marginMode === 'amount'
              ? 'Selling price = supplier cost + desired profit margin amount.'
              : 'Markup % is calculated on supplier cost: profit margin = supplier cost × markup %, then selling price = cost + profit margin.'}
          </p>
          {errors.margin && <div className="text-danger fs-8">{errors.margin}</div>}

          {/* Margin disclaimer */}
          <div className="p-2 rounded-2" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.73rem', color: '#64748b', lineHeight: 1.5 }}>
            <strong>Estimated Profit = Selling Price − Supplier Cost.</strong> Note: Shipping, platform fees, payment gateway charges, returns, and other operating expenses are excluded unless configured.
          </div>

          {/* Category & Subcategory selection */}
          <div className="row g-2">
            <div className="col-12 col-sm-6">
              <label className="fw-semibold fs-8 text-dark mb-1" htmlFor="meesho-form-category">
                Category *
              </label>
              {catLoading ? (
                <div className="text-secondary fs-8"><Loader2 size={14} className="spinner me-1" />Loading categories…</div>
              ) : catError ? (
                <div className="text-danger fs-8">{catError}</div>
              ) : (
                <select
                  id="meesho-form-category"
                  className={`form-select fs-7 ${errors.category ? 'is-invalid' : ''}`}
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    setSubcategory('');
                    setErrors((prev) => ({ ...prev, category: undefined }));
                  }}
                >
                  <option value="">— Select Category (Required) —</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              )}
              {errors.category && <div className="text-danger mt-1" style={{ fontSize: '0.75rem' }}>{errors.category}</div>}
            </div>

            <div className="col-12 col-sm-6">
              <label className="fw-semibold fs-8 text-dark mb-1" htmlFor="meesho-form-subcategory">
                Subcategory (Optional)
              </label>
              <select
                id="meesho-form-subcategory"
                className="form-select fs-7"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                disabled={availableSubcategories.length === 0}
              >
                {availableSubcategories.length === 0 ? (
                  <option value="">— No subcategories available —</option>
                ) : (
                  <>
                    <option value="">— Select Subcategory (Optional) —</option>
                    {availableSubcategories.map((sub) => (
                      <option key={sub.id || sub.name} value={sub.id || sub.name}>{sub.name}</option>
                    ))}
                  </>
                )}
              </select>
              <div className="text-muted mt-1" style={{ fontSize: '0.7rem' }}>
                {availableSubcategories.length === 0
                  ? "Toastkart's current category structure is single-level."
                  : 'Select a subcategory (optional).'}
              </div>
            </div>
          </div>

          {/* Color & Size from Meesho */}
          <div className="row g-2">
            <div className="col-12 col-sm-6">
              <label className="fw-semibold fs-8 text-dark mb-1">
                Color (from Meesho)
              </label>
              <input
                type="text"
                className="form-control fs-7"
                placeholder="e.g. Navy Blue, Dark Green, White, Black & White"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
              <div className="d-flex flex-wrap gap-1 mt-1">
                {['Black', 'White', 'Black & White', 'Dark Green', 'Navy Blue', 'Red', 'Blue', 'Grey', 'Yellow', 'Pink', 'Multicolor'].map((qc) => (
                  <button
                    key={qc}
                    type="button"
                    onClick={() => setColor(qc)}
                    className={`btn btn-xs py-0 px-1 border rounded-pill ${color === qc ? 'bg-dark text-white' : 'bg-white text-muted'}`}
                    style={{ fontSize: '0.68rem', lineHeight: '1.4' }}
                  >
                    {qc}
                  </button>
                ))}
              </div>
              <span className="text-muted d-block mt-0.5" style={{ fontSize: '0.68rem' }}>Direct color detail from supplier</span>
            </div>
            <div className="col-12 col-sm-6">
              <label className="fw-semibold fs-8 text-dark mb-1">
                Size / Available Sizes (from Meesho)
              </label>
              <input
                type="text"
                className="form-control fs-7"
                placeholder="e.g. S, M, L, XL, XXL or Free Size"
                value={size}
                onChange={(e) => setSize(e.target.value)}
              />
              <span className="text-muted" style={{ fontSize: '0.68rem' }}>Comma-separated sizes (S, M, L, XL...)</span>
            </div>
          </div>

          <div>
            <label className="fw-semibold fs-8 text-dark mb-1">Available stock</label>
            <input type="number" min="0" step="1" className={`form-control fs-7 ${errors.stock ? 'is-invalid' : ''}`}
              value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} />
            {errors.stock && <div className="invalid-feedback">{errors.stock}</div>}
          </div>

          {/* Storefront Visibility Toggle */}
          <div className="p-3 rounded-3 border bg-light d-flex align-items-center justify-content-between">
            <div>
              <div className="fw-semibold fs-8 text-dark d-flex align-items-center gap-1.5">
                <Globe size={14} className="text-primary" />
                Publish to storefront immediately
              </div>
              <div className="text-secondary fs-9">
                Show this product and its collection on your storefront right away.
              </div>
            </div>
            <div className="form-check form-switch m-0">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="meesho-publish-toggle"
                style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="d-flex gap-3 pt-1">
            <button type="button" className="btn btn-light rounded-3 fw-semibold fs-7 px-4" onClick={onBack}>
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn fw-bold py-2 px-5 rounded-3 fs-7 d-flex align-items-center gap-2"
              style={{ background: 'linear-gradient(135deg,#d81b60,#ad1457)', color: '#fff', border: 'none' }}
            >
              {loading
                ? <><Loader2 size={16} className="spinner" /> Saving…</>
                : <><ShoppingBag size={16} /> Save to Store</>
              }
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

/* ─── Step 4: Success Screen ────────────────────────────────── */
function SuccessStep({ product, onGoToProducts, onImportAnother }) {
  return (
    <div className="text-center py-4">
      <div className="mb-3 d-inline-flex align-items-center justify-content-center rounded-circle"
        style={{ width: 72, height: 72, background: '#d1fae5' }}>
        <Check size={36} color="#16a34a" />
      </div>
      <h4 className="fw-bold text-dark mb-2">Product Imported!</h4>
      <p className="text-secondary fs-7 mb-1">
        <strong>{product.title}</strong> has been added to your store.
      </p>
      <p className="text-muted fs-8 mb-4">
        The product and its collection are now live on your storefront! You can also manage details in <strong>Products</strong>.
      </p>
      <div className="d-flex justify-content-center gap-3 flex-wrap">
        <button
          type="button"
          className="btn fw-bold px-4 py-2 rounded-3 fs-7 d-flex align-items-center gap-2"
          style={{ background: 'linear-gradient(135deg,#1e3a8a,#1d4ed8)', color: '#fff', border: 'none' }}
          onClick={onGoToProducts}
        >
          <ExternalLink size={16} /> Go to Products
        </button>
        <button
          type="button"
          className="btn btn-outline-secondary fw-bold px-4 py-2 rounded-3 fs-7 d-flex align-items-center gap-2"
          onClick={onImportAnother}
        >
          <RefreshCw size={16} /> Import Another
        </button>
      </div>
    </div>
  );
}

/* ─── Main export ───────────────────────────────────────────── */
export default function MeeshoProductSearchImport({
  onImport,
  onSearchError,
  loading,
  enabled,
  storeId,
  onGoToProducts,
  capabilities,
}) {
  // step: 'search' | 'detail' | 'form' | 'success'
  const [step, setStep]             = useState('search');
  const [selectedProduct, setSelected] = useState(null);
  const [importedProduct, setImported] = useState(null);

  const handleSelect = (item) => {
    setSelected(item);
    setStep('detail');
  };

  const handleImportClick = (productWithCategory) => {
    setSelected(productWithCategory);
    setStep('form');
  };

  const handleImport = async (importData) => {
    const success = await onImport(importData);
    if (success !== false) {
      setImported({ ...selectedProduct, title: importData.custom_title || selectedProduct.title });
      setStep('success');
    }
  };

  const handleImportAnother = () => {
    setSelected(null);
    setImported(null);
    setStep('search');
  };

  if (!enabled) {
    return (
      <section className="bg-white border rounded-4 p-4">
        <div className="d-flex align-items-center gap-2 text-warning">
          <AlertCircle size={18} />
          <span className="fw-semibold fs-7">Sign in and select a store to search Meesho products.</span>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white border rounded-4 overflow-hidden">
      <div className="p-4">
        {step === 'search' && (
          <SearchStep
            storeId={storeId}
            onSelect={handleSelect}
            capabilities={capabilities}
          />
        )}

        {step === 'detail' && selectedProduct && (
          <ProductDetailStep
            product={selectedProduct}
            storeId={storeId}
            onImportClick={handleImportClick}
            onDirectImport={handleImport}
            onBack={() => setStep('search')}
            loading={loading}
          />
        )}

        {step === 'form' && selectedProduct && (
          <ImportFormStep
            product={selectedProduct}
            storeId={storeId}
            onImport={handleImport}
            onBack={() => setStep('detail')}
            loading={loading}
          />
        )}

        {step === 'success' && importedProduct && (
          <SuccessStep
            product={importedProduct}
            onGoToProducts={onGoToProducts || (() => {})}
            onImportAnother={handleImportAnother}
          />
        )}
      </div>
    </section>
  );
}