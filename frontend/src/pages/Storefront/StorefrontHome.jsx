import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import { useStorefrontCart } from '../../context/StorefrontCartContext';
import { useStorefrontAuth } from '../../context/StorefrontAuthContext';
import { resolveStoreTheme } from '../../utils/themeResolver';
import { normalizeProductImage } from '../../utils/imageUtils';

const ThemeEflyerHero = React.lazy(() => import('../../components/themes/ThemeEflyerHero'));
const ThemeHexashopHero = React.lazy(() => import('../../components/themes/ThemeHexashopHero'));
const ThemeJewelryHero = React.lazy(() => import('../../components/themes/ThemeJewelryHero'));
const ThemeBeautyHero = React.lazy(() => import('../../components/themes/ThemeBeautyHero'));
const ThemeHomeHero = React.lazy(() => import('../../components/themes/ThemeHomeHero'));
const ThemeElectronicsHero = React.lazy(() => import('../../components/themes/ThemeElectronicsHero'));
const ThemeFootwearHero = React.lazy(() => import('../../components/themes/ThemeFootwearHero'));
const ThemeGroceryHero = React.lazy(() => import('../../components/themes/ThemeGroceryHero'));
const ThemeGiftHero = React.lazy(() => import('../../components/themes/ThemeGiftHero'));
const ThemeDefaultHero = React.lazy(() => import('../../components/themes/ThemeDefaultHero'));

export default function StorefrontHome({ storeData, products, categories = [] }) {
  const { requireAuth } = useStorefrontAuth();
  const location = useLocation();

  const searchQuery =
    new URLSearchParams(location.search).get('search')?.toLowerCase() || '';

  const [eflyerSlide, setEflyerSlide] = useState(0);
  const [aranozSlide, setAranozSlide] = useState(0);
  const [jewelrySlide, setJewelrySlide] = useState(0);
  const [beautySlide, setBeautySlide] = useState(0);

  const theme = resolveStoreTheme(storeData);

  /*
   * Hero slider
   */
  useEffect(() => {
    const timer = setInterval(() => {
      if (theme === 'theme-eflyer') setEflyerSlide((prev) => (prev + 1) % 3);
      else if (theme === 'theme-home') setAranozSlide((prev) => (prev + 1) % 3);
      else if (theme === 'theme-jewelry') setJewelrySlide((prev) => (prev + 1) % 6);
      else if (theme === 'theme-beauty') setBeautySlide((prev) => (prev + 1) % 6);
    }, 10000);

    return () => clearInterval(timer);
  }, [theme]);

  /*
   * Get store base path
   */
  const getBasePath = () => {
    const p = window.location.pathname;

    if (p.startsWith('/store/')) {
      return `/store/${p.split('/')[2]}`;
    }

    return '/storefront';
  };

  const basePath = getBasePath();

  /*
   * Filter products by search query
   */
  const filteredProducts = useMemo(() => {
    if (!searchQuery) {
      return products;
    }

    return products.filter(
      (p) =>
        String(p.name || '')
          .toLowerCase()
          .includes(searchQuery) ||
        String(p.description || '')
          .toLowerCase()
          .includes(searchQuery)
    );
  }, [products, searchQuery]);
  /*
   * Get unique category names from products
   */
  const productCategories = [];

  filteredProducts.forEach((p) => {
    const pCat =
      p.category && typeof p.category === 'object'
        ? p.category.name || 'Uncategorized'
        : p.category || 'Uncategorized';

    if (
      !productCategories.some(
        (existing) =>
          String(existing).toLowerCase() === String(pCat).toLowerCase()
      )
    ) {
      productCategories.push(pCat);
    }
  });

  /*
   * Create combined category list
   */
  const categoriesToRender = [];

  /*
   * First add custom categories
   */
  if (categories && categories.length > 0) {
    categories.forEach((cat) => {
      categoriesToRender.push({
        id: cat.id,
        name: cat.name,
        slug:
          cat.slug ||
          String(cat.name || '')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, ''),
        isCustom: true,
      });
    });
  }

  /*
   * Add categories found from products
   */
  productCategories.forEach((catName) => {
    if (
      !categoriesToRender.some(
        (c) =>
          String(c.name || '').toLowerCase() ===
          String(catName).toLowerCase() ||
          String(c.id) === String(catName)
      )
    ) {
      categoriesToRender.push({
        id: catName,
        name: catName,
        slug: String(catName)
          .toLowerCase()
          .replace(/[^a-z0-9]/g, ''),
        isCustom: false,
      });
    }
  });

  /*
   * Handle URL hash scrolling
   */
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.replace('#', '');
      const element = document.getElementById(id);

      if (element) {
        setTimeout(() => {
          element.scrollIntoView({
            behavior: 'smooth',
          });
        }, 100);
      }
    }
  }, []);

  const { addToCart, toggleWishlist, isInWishlist } =
    useStorefrontCart();

  /*
   * Get first available size
   */
  const getFirstAvailableSize = (product) => {
    if (!product.size) {
      return null;
    }

    const sizes = String(product.size)
      .toUpperCase()
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    return sizes.length > 0 ? sizes[0] : null;
  };

  /*
   * Get first available color
   */
  const getFirstAvailableColor = (product) => {
    if (!product.color) {
      return null;
    }

    const colors = String(product.color)
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    return colors.length > 0 ? colors[0] : null;
  };

  const parsePrice = (val) => {
    if (val === null || val === undefined || val === '') return 0;
    const num = Number(String(val).replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  /*
   * Product grid / horizontal product slider
   *
   * 1-4 products:
   *   Normal product grid
   *
   * 5+ products:
   *   Horizontal touch-scrollable slider
   */
  const renderProductGrid = (items) => {
    const displayItems = items && items.length > 0 ? items : [];

    return displayItems.length > 0 ? (
      <div
        className="storefront-product-grid-wrapper"
        style={{
          overflow: 'visible',
        }}
      >
        <div
          className={
            displayItems.length >= 5
              ? "storefront-product-slider"
              : "storefront-product-grid"
          }
        >
          {displayItems.map((product, idx) => (
            <div
              key={`${product.id}-${idx}`}
              className="storefront-product-card position-relative"
            >
              <Link
                to={`${basePath}/product/${product.id}`}
                className="text-decoration-none text-dark d-block"
              >
                <div className="storefront-product-image-container position-relative">
                  {product.compare_price &&
                    parsePrice(product.compare_price) > parsePrice(product.price) && (
                      <div className="storefront-discount-badge">
                        {Math.round(
                          ((parsePrice(product.compare_price) -
                            parsePrice(product.price)) /
                            parsePrice(product.compare_price)) *
                          100
                        )}
                        % OFF
                      </div>
                  )}
                  <img
                    src={normalizeProductImage(
                      product.image || product.image_url,
                      product.name,
                      400
                    )}
                    alt={product.name}
                    className="storefront-product-image"
                    loading="lazy"
                    decoding="async"
                  />
                </div>

                <div className="storefront-product-details pb-5">
                  {theme === 'theme-jewelry' && (
                    <span className="storefront-product-category">
                      {product.category?.name ||
                        product.category ||
                        'Luxury'}
                    </span>
                  )}

                  <div className="storefront-product-title">
                    {product.name}
                  </div>

                  <div className="storefront-product-price-row">
                    {product.compare_price &&
                      parsePrice(product.compare_price) >
                      parsePrice(product.price) ? (
                      <>
                        <span className="storefront-product-price">
                          ₹
                          {parsePrice(product.price).toLocaleString('en-IN')}
                        </span>
                        <span className="storefront-product-original-price">
                          ₹
                          {parsePrice(product.compare_price).toLocaleString(
                            'en-IN'
                          )}
                        </span>
                      </>
                    ) : (
                      <span className="storefront-product-price">
                        ₹
                        {parsePrice(product.price).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
              </Link>

              {/* Wishlist Button */}
              <button
                className="btn position-absolute top-0 end-0 m-2 rounded-circle shadow-sm bg-white"
                style={{
                  width: '32px',
                  height: '32px',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  toggleWishlist(product);
                }}
              >
                <Heart
                  size={16}
                  fill={
                    isInWishlist(product.id)
                      ? '#ff4757'
                      : 'none'
                  }
                  color={
                    isInWishlist(product.id)
                      ? '#ff4757'
                      : '#666666'
                  }
                />
              </button>

              {/* Add to Cart Button */}
              <div
                className={`add-to-cart-wrapper ${theme !== 'theme-default'
                    ? 'theme-cart-wrapper'
                    : 'position-absolute bottom-0 start-0 w-100 p-2'
                  }`}
                style={{
                  zIndex: 2,
                }}
              >
                <button
                  className={`btn w-100 fw-bold d-flex align-items-center justify-content-center gap-2 add-to-cart-btn ${theme !== 'theme-default'
                      ? 'theme-cart-btn'
                      : ''
                    }`}
                  style={
                    theme !== 'theme-default'
                      ? {}
                      : {
                        backgroundColor: '#ff9f00',
                        color: '#fff',
                        border: 'none',
                        fontSize: '0.85rem',
                        padding: '8px',
                      }
                  }
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    addToCart(
                      {
                        ...product,
                        selectedSize: getFirstAvailableSize(product),
                        selectedColor: getFirstAvailableColor(product),
                      },
                      1
                    );
                  }}
                >
                  <ShoppingCart size={16} />
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    ) : (
      <div className="storefront-empty-state">
        <p>No products found in this category.</p>
      </div>
    );
  };

  return (
    <div className="storefront-home">
      {!searchQuery && (
        <React.Suspense fallback={null}>
          {theme === 'theme-eflyer' && <ThemeEflyerHero eflyerSlide={eflyerSlide} />}
          {theme === 'theme-hexashop' && <ThemeHexashopHero />}
          {theme === 'theme-jewelry' && <ThemeJewelryHero jewelrySlide={jewelrySlide} />}
          {theme === 'theme-beauty' && <ThemeBeautyHero beautySlide={beautySlide} />}
          {theme === 'theme-home' && <ThemeHomeHero aranozSlide={aranozSlide} />}
          {theme === 'theme-electronics' && <ThemeElectronicsHero />}
          {theme === 'theme-footwear' && <ThemeFootwearHero />}
          {theme === 'theme-grocery' && <ThemeGroceryHero />}
          {theme === 'theme-gift' && <ThemeGiftHero />}
          {!['theme-eflyer', 'theme-hexashop', 'theme-jewelry', 'theme-beauty', 'theme-home', 'theme-electronics', 'theme-footwear', 'theme-grocery', 'theme-gift'].includes(theme) && (
            <ThemeDefaultHero />
          )}
        </React.Suspense>
      )}

      {searchQuery ? (
        <div className="storefront-section scroll-mt" style={{ paddingTop: '250px' }}>
          {filteredProducts.length > 0 ? (
            renderProductGrid(filteredProducts)
          ) : (
            <div className="storefront-empty-state text-center py-5">
              <p>No products found matching your search.</p>
            </div>
          )}
        </div>
      ) : categoriesToRender.length > 0 ? (
        categoriesToRender.map((cat) => {
          const catProducts = filteredProducts.filter((p) => {
            const pCat = String(
              (p.category && typeof p.category === 'object'
                ? p.category.name
                : p.category) || 'Uncategorized'
            ).toLowerCase();

            return (
              pCat === String(cat.id).toLowerCase() ||
              pCat === String(cat.name || '').toLowerCase() ||
              pCat === String(cat.slug || '').toLowerCase()
            );
          });

          if (catProducts.length === 0) {
            return null;
          }

          const sectionId = cat.slug;

          return (
            <div
              id={sectionId}
              key={cat.id || cat.name}
              className="storefront-section scroll-mt"
            >
              <div className="storefront-section-header">
                <h3>
                  {cat.isCustom
                    ? `Best of ${cat.name}`
                    : `Trending in ${cat.name}`}
                </h3>

                <button className="storefront-view-all-btn">
                  VIEW ALL
                </button>
              </div>

              {renderProductGrid(catProducts.slice(0, 8))}
            </div>
          );
        })
      ) : (
        <div
          className="storefront-empty-state"
          style={{
            padding: '60px 20px',
            textAlign: 'center',
          }}
        >
          <h2>Welcome to {storeData.name}</h2>

          <p>
            This store doesn't have any collections or products yet.
          </p>
        </div>
      )}
    </div>
  );
}