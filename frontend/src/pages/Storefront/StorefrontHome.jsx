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
const ThemePerfumeHero = React.lazy(() => import('../../components/themes/ThemePerfumeHero'));
const ThemeDefaultHero = React.lazy(() => import('../../components/themes/ThemeDefaultHero'));
const ThemeHomeFooter = React.lazy(() => import('../../components/themes/ThemeHomeFooter'));
const AIStoreRenderer = React.lazy(() => import('../../components/AIStoreRenderer'));

export default function StorefrontHome({ storeData, products, categories = [], loading }) {
  const { requireAuth } = useStorefrontAuth();
  const location = useLocation();

  const searchQuery =
    new URLSearchParams(location.search).get('search')?.toLowerCase() || '';

  const [eflyerSlide, setEflyerSlide] = useState(0);
  const [aranozSlide, setAranozSlide] = useState(0);
  const [jewelrySlide, setJewelrySlide] = useState(0);
  const [beautySlide, setBeautySlide] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

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
            theme === 'theme-perfume' || displayItems.length >= 5
              ? "storefront-product-slider"
              : "storefront-product-grid"
          }
        >
          {displayItems.map((product, idx) => (
            <div
              key={`${product.id}-${idx}`}
              className={`storefront-product-card position-relative ${theme === 'theme-home' ? 'storefront-home-theme-card' : ''}`}
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

                <div className="storefront-product-details pb-3 px-3 mt-3 d-flex flex-column" style={{ flexGrow: 1 }}>
                  {theme === 'theme-perfume' ? (
                    <div className="perfume-card-details d-flex flex-column h-100">
                      <div className="storefront-product-title text-uppercase mb-0 fw-bold" style={{ fontSize: '1.05rem', color: '#333' }}>
                        {product.name}
                      </div>
                      <div className="storefront-product-category text-uppercase text-muted mt-1 mb-2" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>
                        {product.category?.name || product.category || 'WOODY | ALLDAY | UNISEX'}
                      </div>
                      
                      <div className="storefront-product-price-row fw-bold mb-1" style={{ color: '#000', fontSize: '1.1rem' }}>
                        <span className="storefront-product-price">
                          ₹{parsePrice(product.price).toLocaleString('en-IN')}.00
                        </span>
                      </div>
                      
                      <div className="perfume-variants d-flex gap-2 flex-wrap mb-4 mt-auto">
                        {product.size ? (
                          String(product.size).split(',').map((sz, i) => (
                            <span key={i} className={`btn btn-outline-dark ${i === 0 ? 'border-2 border-dark fw-bold' : ''} btn-sm rounded-1 px-2 py-1`} style={{ fontSize: '0.7rem' }}>
                              {sz.trim()}
                            </span>
                          ))
                        ) : (
                          <span className="btn btn-outline-dark border-2 border-dark btn-sm rounded-1 fw-bold px-2 py-1" style={{ fontSize: '0.7rem' }}>100ml</span>
                        )}
                        <span className="btn btn-outline-dark btn-sm rounded-1 px-2 py-1 d-flex align-items-center gap-1" style={{ fontSize: '0.7rem' }}>
                          <i className="bi bi-gift-fill" style={{ fontSize: '0.7rem' }}></i> Personalized
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
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

                      {theme === 'theme-home' && (
                        <div className="rating-stars">★★★★★ <span className="text-muted" style={{fontSize: '11px'}}>(128)</span></div>
                      )}

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
                    </>
                  )}
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
              {theme === 'theme-perfume' ? (
                <div className="px-3 pb-3 mt-auto w-100">
                  <button
                    className="btn btn-dark w-100 rounded-pill fw-bold text-uppercase d-flex align-items-center justify-content-center gap-2"
                    style={{ fontSize: '0.8rem', padding: '12px' }}
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
              ) : (
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
                      } ${theme === 'theme-home' ? 'text-uppercase' : ''}`}
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
              )}
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

  const isAiPreview = new URLSearchParams(location.search).get('preview_ai') === 'true';
  const configId = new URLSearchParams(location.search).get('config_id');
  const aiConfigs = storeData?.ai_configurations || storeData?.aiConfigurations;
  const hasAiConfig = aiConfigs && aiConfigs.length > 0;
  
  let aiConfig = null;
  if (hasAiConfig && (isAiPreview || aiConfigs[0].status === 'published')) {
    const configObj = configId ? aiConfigs.find(c => String(c.id) === String(configId)) || aiConfigs[0] : aiConfigs[0];
    try {
      aiConfig = typeof configObj.configuration === 'string' ? JSON.parse(configObj.configuration) : configObj.configuration;
    } catch (e) { console.error('Failed to parse AI configuration', e); }
  }

  const aiStyleObj = useMemo(() => {
    if (!aiConfig) return {};
    return {
      '--theme-primary': aiConfig?.colors?.primary || '#1c2226',
      '--theme-secondary': aiConfig?.colors?.secondary || '#f1f2f4',
      '--theme-bg': aiConfig?.colors?.background || '#ffffff',
      '--theme-text': aiConfig?.colors?.text || '#202223',
      '--theme-accent': aiConfig?.colors?.accent || '#FF5722',
      '--theme-surface': aiConfig?.colors?.surface || '#ffffff',
      '--theme-btn-bg': aiConfig?.colors?.buttonBackground || aiConfig?.colors?.primary || '#1c2226',
      '--theme-btn-text': aiConfig?.colors?.buttonText || '#ffffff',
      '--theme-border': aiConfig?.colors?.border || '#e9ecef',
      '--theme-hover': aiConfig?.colors?.hover || aiConfig?.colors?.secondary || '#e63a61',
      '--theme-heading-font': aiConfig?.typography?.headingFont || 'Inter, sans-serif',
      '--theme-body-font': aiConfig?.typography?.bodyFont || 'Inter, sans-serif',
      '--theme-border-radius': aiConfig?.style?.borderRadius || '12px'
    };
  }, [aiConfig]);

  const renderAiHero = () => {
    if (!aiConfig || !aiConfig.sections) return null;
    const heroSection = aiConfig.sections.find(s => s.type === 'hero');
    if (!heroSection) return null;
    
    const hasImages = aiConfig?.style?.heroImages && Array.isArray(aiConfig.style.heroImages) && aiConfig.style.heroImages.length > 0;
    const imagesToRender = hasImages ? aiConfig.style.heroImages : (aiConfig?.style?.heroImage ? [aiConfig.style.heroImage] : []);

    return (
      <div className="d-flex align-items-center justify-content-center text-center p-5 mb-5 position-relative overflow-hidden" 
        style={{ 
          minHeight: '60vh', 
          color: 'var(--theme-bg)',
          borderBottomLeftRadius: 'var(--theme-border-radius)',
          borderBottomRightRadius: 'var(--theme-border-radius)'
        }}>
        
        {imagesToRender.length > 0 ? imagesToRender.map((img, i) => {
            const imageUrl = img.startsWith('http')
              ? img
              : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:8000'}${img}`;

            return (
              <div 
                key={i}
                className="position-absolute w-100 h-100 top-0 start-0"
                style={{
                  backgroundImage: `url(${imageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: i === 0 ? 1 : 0,
                  zIndex: 0
                }}
              />
            );
        }) : (
            <div 
              className="position-absolute w-100 h-100 top-0 start-0"
              style={{
                background: `linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-secondary) 100%)`,
                zIndex: 0
              }}
            />
        )}

        <div className="position-absolute w-100 h-100 top-0 start-0" style={{ background: 'rgba(0, 0, 0, 0.4)', zIndex: 1 }}></div>
        <div className="ai-hero-text-container" style={{ position: 'relative', maxWidth: 800, zIndex: 100 }}>
          <h1 className="display-3 fw-bold mb-4" style={{ color: '#ffffff', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
            {heroSection.title || storeData.name}
          </h1>
          <p className="lead mb-4" style={{ color: '#ffffff', textShadow: '0 1px 5px rgba(0,0,0,0.8)' }}>
            {heroSection.subtitle || storeData.description}
          </p>
          <div className="d-flex gap-3 justify-content-center mt-4">
            <a href="#shop" className="btn btn-lg fw-bold px-5 py-3 shadow" style={{ background: 'var(--theme-accent)', color: '#ffffff', borderRadius: 'var(--theme-border-radius)', border: 'none' }}>
              {heroSection.cta || 'Shop Now'}
            </a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="storefront-home" style={aiStyleObj}>
      {aiConfig && (
        <style>{`
          .storefront-home, .storefront-body, .storefront-main-content {
            background-color: #ffffff !important;
            color: var(--theme-text) !important;
            font-family: var(--theme-body-font) !important;
          }
          .storefront-home h1, .storefront-home h2, .storefront-home h3, .storefront-home h4 {
            font-family: var(--theme-heading-font) !important;
          }
          /* Force solid headers that don't overlap the AI hero banner */
          .storefront-header, .eflyer-header, .hexashop-header {
            background-color: var(--theme-surface) !important;
            position: sticky !important;
            top: 0;
            z-index: 1000 !important;
          }
          .eflyer-header {
            position: relative !important; /* Eflyer absolute positioning fix */
          }
          .eflyer-banner-wrapper {
            background: none !important;
          }
          /* Ensure text/icons contrast correctly on the surface background */
          .eflyer-logo, .eflyer-action-btn, .eflyer-welcome-text, .eflyer-hamburger-icon {
            color: var(--theme-text) !important;
            background-color: transparent !important;
          }
          .eflyer-hamburger-icon {
            background-color: var(--theme-text) !important;
          }
          .card, .storefront-product-card {
            background-color: #ffffff !important;
            color: #2b2a29 !important;
            border-radius: var(--theme-border-radius) !important;
            ${aiConfig?.style?.cardStyle ? `box-shadow: ${aiConfig.style.cardStyle} !important; border: none !important;` : `border: 1px solid var(--theme-border) !important;`}
          }
          .storefront-product-card .storefront-product-title,
          .storefront-product-card .storefront-product-price {
            color: #2b2a29 !important;
          }
          .storefront-view-all-btn, .btn, .btn-primary {
            background-color: var(--theme-btn-bg) !important;
            color: var(--theme-btn-text) !important;
            border-radius: var(--theme-border-radius) !important;
            border-color: var(--theme-btn-bg) !important;
          }
          .storefront-view-all-btn:hover, .btn:hover, .btn-primary:hover {
            background-color: var(--theme-hover) !important;
            border-color: var(--theme-hover) !important;
          }
        `}</style>
      )}

      {!searchQuery && (
        <React.Suspense fallback={null}>
          {aiConfig ? renderAiHero() : (
            <>
              {theme === 'theme-eflyer' && <ThemeEflyerHero eflyerSlide={eflyerSlide} />}
              {theme === 'theme-hexashop' && <ThemeHexashopHero />}
              {theme === 'theme-jewelry' && <ThemeJewelryHero jewelrySlide={jewelrySlide} />}
              {theme === 'theme-beauty' && <ThemeBeautyHero beautySlide={beautySlide} />}
              {theme === 'theme-home' && <ThemeHomeHero aranozSlide={aranozSlide} />}
              {theme === 'theme-electronics' && <ThemeElectronicsHero />}
              {theme === 'theme-footwear' && <ThemeFootwearHero />}
              {theme === 'theme-grocery' && <ThemeGroceryHero />}
              {theme === 'theme-gift' && <ThemeGiftHero />}
              {theme === 'theme-perfume' && <ThemePerfumeHero />}
            </>
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
              <div className="storefront-section-header align-items-end mb-4">
                {theme === 'theme-perfume' ? (
                  <h3 style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '2rem' }}>
                    <span style={{ fontWeight: 'bold' }}>DISCOVER </span>
                    <span className="perfume-highlight" style={{ fontWeight: 'bold' }}>{cat.name}</span>
                  </h3>
                ) : theme === 'theme-home' ? (
                  <div>
                    <div className="text-uppercase text-muted fw-bold mb-1" style={{ fontSize: '11px', letterSpacing: '1px' }}>Bestsellers</div>
                    <h2 className="fw-bold m-0" style={{ fontFamily: 'Georgia, serif' }}>Our Most Loved Furniture</h2>
                  </div>
                ) : (
                  <h3>
                    {cat.isCustom
                      ? `Best of ${cat.name}`
                      : `Trending in ${cat.name}`}
                  </h3>
                )}

                <button className="storefront-view-all-btn">
                  VIEW ALL
                </button>
              </div>

              {renderProductGrid(catProducts.slice(0, 8))}
            </div>
          );
        })
      ) : loading ? (
          <div className="storefront-loading-section" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div className="spinner-border text-primary" role="status" style={{ width: '2rem', height: '2rem' }}>
              <span className="visually-hidden">Loading products...</span>
            </div>
            <p className="mt-3 text-muted">Loading products...</p>
          </div>
        ) : (
          <div
            className="storefront-empty-state"
            style={{
              padding: '80px 20px',
              textAlign: 'center',
            }}
          >
            <div className="text-uppercase text-muted fw-bold mb-2" style={{ fontSize: '11px', letterSpacing: '2px' }}>Welcome To Our Store</div>
            <h2 className="fw-bold mb-3" style={{ fontFamily: 'Georgia, serif', fontSize: '2.5rem', color: '#1a1a1a' }}>Discover {storeData.name}</h2>
            <p className="text-muted" style={{ fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' }}>
              There are no products yet. We are currently curating our collection of beautiful, thoughtfully designed pieces. Please check back soon.
            </p>
          </div>
      )}

      {/* Footer sections for Nordic Theme */}
      {theme === 'theme-home' && !searchQuery && (
        <React.Suspense fallback={null}>
          <ThemeHomeFooter />
        </React.Suspense>
      )}

      {/* Video Section for Perfume Theme */}
      {theme === 'theme-perfume' && !searchQuery && (
        <div className="perfume-video-section" style={{ marginTop: '6rem', position: 'relative', width: '100%', height: '70vh', minHeight: '500px', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden' }}>
            {isVideoPlaying ? (
              <iframe 
                src="https://www.youtube.com/embed/jlsfs5jCB7k?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&playlist=jlsfs5jCB7k" 
                style={{ width: '100vw', height: '56.25vw', minHeight: '100vh', minWidth: '177.77vh', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', border: 'none' }}
                allow="autoplay; encrypted-media"
                title="Clean Aesthetic Perfume Commercial"
              />
            ) : (
              <div 
                style={{ width: '100%', height: '100%', backgroundImage: 'url(https://img.youtube.com/vi/jlsfs5jCB7k/maxresdefault.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => setIsVideoPlaying(true)}
              >
                <div style={{ width: '80px', height: '80px', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <div style={{ width: 0, height: 0, borderTop: '15px solid transparent', borderBottom: '15px solid transparent', borderLeft: '25px solid white', marginLeft: '10px' }}></div>
                </div>
              </div>
            )}
          </div>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1, pointerEvents: 'none' }}></div>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 2, textAlign: 'center', width: '100%', padding: '0 20px', pointerEvents: 'none' }}>
            <h2 style={{ color: 'white', fontSize: '3.5rem', fontFamily: 'var(--perfume-font-heading, sans-serif)', letterSpacing: '4px', textTransform: 'uppercase', textShadow: '2px 4px 12px rgba(0,0,0,0.9), 0px 0px 4px rgba(255,255,255,0.5)', fontWeight: 'bold' }}>Discover Your Essence</h2>
          </div>
        </div>
      )}

      {/* About Section for Perfume Theme */}
      {theme === 'theme-perfume' && !searchQuery && (
        <div className="perfume-about-section container" style={{ marginTop: '6rem', marginBottom: '4rem' }}>
          <div className="row align-items-center">
            <div className="col-lg-6 mb-4 mb-lg-0">
              <div style={{ borderRadius: '24px', overflow: 'hidden', height: '100%', minHeight: '500px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
                <img 
                  src="https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80" 
                  alt="Craft Your Own Perfume" 
                  loading="lazy"
                  decoding="async"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: '500px' }} 
                />
              </div>
            </div>
            <div className="col-lg-6 ps-lg-5">
              <h2 style={{ fontSize: '3.5rem', fontWeight: '700', marginBottom: '1.5rem', lineHeight: '1.1', fontFamily: 'var(--perfume-font-heading, sans-serif)', letterSpacing: '-0.5px' }}>
                <span style={{ color: '#ff7b00' }}>WHY WE DO,</span> <span style={{ color: '#000000' }}>WHAT<br/>WE DO</span>
              </h2>
              <p style={{ color: '#666', fontSize: '1.1rem', lineHeight: '1.8', marginBottom: '2.5rem', fontFamily: 'var(--perfume-font-body, sans-serif)' }}>
                Craft Your Own Perfume, CYOP is India's premier perfume bar known for <span style={{ color: '#ff7b00', fontWeight: '500' }}>high-quality, long-lasting</span> fragrances with unparalleled expertise in the art and science of perfumery. CYOP perfumes, reformulated with <span style={{ color: '#ff7b00', fontWeight: '500' }}>50% fragrance oil concentration</span> last longer in tropical weather conditions. Our experts can guide the customer to not just select the right perfume, but also provide them with the unique experience of mixing perfumes to create a <span style={{ color: '#ff7b00', fontWeight: '500' }}>fully personalised olfactory experience.</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}