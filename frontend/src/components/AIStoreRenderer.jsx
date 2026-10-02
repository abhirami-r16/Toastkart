import React, { useMemo, useState, useEffect } from 'react';
import { ShoppingCart, Heart } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { normalizeProductImage } from '../utils/imageUtils';
import { useStorefrontCart } from '../context/StorefrontCartContext';

export default function AIStoreRenderer({ storeData, products, categories, config }) {
  const { addToCart, toggleWishlist, isInWishlist } = useStorefrontCart();
  const location = useLocation();

  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  useEffect(() => {
    // Image rotation is disabled as per new ONE hero image architecture
  }, [config?.style?.heroImages]);

  const getBasePath = () => {
    const p = window.location.pathname;
    if (p.startsWith('/store/')) {
      return `/store/${p.split('/')[2]}`;
    }
    return '/storefront';
  };

  const basePath = getBasePath();

  const styleObj = useMemo(() => {
    return {
      '--ai-primary': config?.colors?.primary || '#1c2226',
      '--ai-secondary': config?.colors?.secondary || '#f1f2f4',
      '--ai-accent': config?.colors?.accent || '#FF5722',
      '--ai-bg': config?.colors?.background || '#ffffff',
      '--ai-surface': config?.colors?.surface || '#ffffff',
      '--ai-text': config?.colors?.text || '#202223',
      '--ai-muted': config?.colors?.mutedText || '#6c757d',
      '--ai-btn-bg': config?.colors?.buttonBackground || config?.colors?.primary || '#1c2226',
      '--ai-btn-text': config?.colors?.buttonText || '#ffffff',
      '--ai-border': config?.colors?.border || '#e9ecef',
      '--ai-hover': config?.colors?.hover || config?.colors?.secondary || '#e63a61',
      '--ai-heading-font': config?.typography?.headingFont || 'Inter, sans-serif',
      '--ai-body-font': config?.typography?.bodyFont || 'Inter, sans-serif',
      '--ai-border-radius': config?.style?.borderRadius || '12px',
      fontFamily: 'var(--ai-body-font)',
      backgroundColor: 'var(--ai-bg)',
      color: 'var(--ai-text)'
    };
  }, [config]);

  if (!config) {
    return <div className="p-5 text-center">Invalid Store Configuration</div>;
  }

  const renderSection = (section, idx) => {
    switch (section.type) {
      case 'hero':
        const hasImages = config?.style?.heroImages && Array.isArray(config.style.heroImages) && config.style.heroImages.length > 0;
        const imagesToRender = hasImages ? config.style.heroImages : (config?.style?.heroImage ? [config.style.heroImage] : []);

        return (
          <div key={idx} className="d-flex align-items-center justify-content-center text-center p-5 mb-5 position-relative overflow-hidden" 
            style={{ 
              minHeight: '60vh', 
              color: 'var(--ai-bg)',
              borderBottomLeftRadius: 'var(--ai-border-radius)',
              borderBottomRightRadius: 'var(--ai-border-radius)'
            }}>
            
            {/* Background Images Slider */}
            {imagesToRender.length > 0 ? imagesToRender.map((img, i) => (
                <div 
                  key={i}
                  className="position-absolute w-100 h-100 top-0 start-0"
                  style={{
                    backgroundImage: `url(${img})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: i === currentHeroIndex ? 1 : 0,
                    transition: 'opacity 1.5s ease-in-out',
                    zIndex: 0
                  }}
                />
            )) : (
                <div 
                  className="position-absolute w-100 h-100 top-0 start-0"
                  style={{
                    background: `linear-gradient(135deg, var(--ai-primary) 0%, var(--ai-secondary) 100%)`,
                    zIndex: 0
                  }}
                />
            )}

            {/* Add a subtle overlay so text pops */}
            <div className="position-absolute w-100 h-100 top-0 start-0" style={{ background: 'rgba(0, 0, 0, 0.4)', zIndex: 1 }}></div>
            <div className="ai-hero-text-container" style={{ position: 'relative', maxWidth: 800, zIndex: 100 }}>
              <style>{`
                .storefront-app-root .ai-hero-text-container h1,
                .storefront-app-root .ai-hero-text-container p,
                .storefront-app-root .ai-hero-text-container span {
                  color: #ffffff !important;
                }
              `}</style>
              <h1 className="display-3 fw-bold mb-4" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                {section.title || storeData.name}
              </h1>
              <p className="lead mb-4" style={{ textShadow: '0 1px 5px rgba(0,0,0,0.8)' }}>
                {section.subtitle || storeData.description}
              </p>
              <div className="d-flex gap-3 justify-content-center mt-4">
                <a href="#shop" className="btn btn-lg fw-bold px-5 py-3 shadow" style={{ background: 'var(--ai-accent)', color: '#ffffff', borderRadius: 'var(--ai-border-radius)', border: 'none' }}>
                  {section.cta || 'Shop Now'}
                </a>
                <a href="#shop" className="btn btn-lg fw-bold px-5 py-3 shadow" style={{ background: 'transparent', color: '#ffffff', borderRadius: 'var(--ai-border-radius)', border: '2px solid #ffffff' }}>
                  Explore Collection
                </a>
              </div>
            </div>
          </div>
        );
      case 'categories':
        return null;
      case 'featured_products': {
        const renderProductCard = (product) => (
          <div key={product.id} className="col-12 col-md-4 col-lg-3">
            <div className="card h-100 border-0" style={{ cssText: config?.style?.cardStyle || '', borderRadius: 'var(--ai-border-radius)', overflow: 'hidden' }}>
              <Link to={{ pathname: `${basePath}/product/${product.id}`, search: window.location.search }} className="text-decoration-none">
                <div className="position-relative" style={{ paddingBottom: '100%', background: '#f8f9fa' }}>
                  <img 
                    src={normalizeProductImage(product.image, product.name)} 
                    alt={product.name}
                    className="position-absolute w-100 h-100"
                    style={{ objectFit: 'cover', top: 0, left: 0 }}
                  />
                </div>
              </Link>
              <button 
                className="btn position-absolute top-0 end-0 m-2 rounded-circle shadow-sm bg-white"
                style={{ width: '35px', height: '35px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isInWishlist(product.id) ? '#ff4757' : '#ced4da', zIndex: 10 }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleWishlist(product);
                }}
              >
                <Heart size={18} fill={isInWishlist(product.id) ? '#ff4757' : 'none'} />
              </button>
              <div className="card-body p-4 d-flex flex-column" style={{ background: 'var(--ai-bg)' }}>
                <Link to={{ pathname: `${basePath}/product/${product.id}`, search: window.location.search }} className="text-decoration-none">
                  <h5 className="card-title text-truncate fw-bold mb-2" style={{ color: 'var(--ai-text)' }}>{product.name}</h5>
                </Link>
                
                {product.size && (
                  <div className="mb-2 text-muted" style={{ fontSize: '0.85rem' }}>
                    <span className="fw-bold">Size:</span> {product.size}
                  </div>
                )}

                <div className="d-flex align-items-center mb-3 mt-auto">
                  <span className="fw-bold fs-5 me-2" style={{ color: 'var(--ai-text)' }}>₹{product.price}</span>
                  {product.compare_price && (
                    <span className="text-muted text-decoration-line-through" style={{ fontSize: '0.9rem' }}>₹{product.compare_price}</span>
                  )}
                </div>
                <button 
                  onClick={() => addToCart(product, 1)}
                  className="btn mt-auto w-100 fw-bold d-flex align-items-center justify-content-center gap-2"
                  style={{ background: 'var(--ai-primary)', color: 'var(--ai-bg)', borderRadius: 'var(--ai-border-radius)' }}
                >
                  <ShoppingCart size={18} /> Add to Cart
                </button>
              </div>
            </div>
          </div>
        );

        const productCategories = [];
        products.forEach(p => {
          const pCat = p.category && typeof p.category === 'object' ? (p.category.name || 'Uncategorized') : (p.category || 'Uncategorized');
          if (!productCategories.some(existing => String(existing).toLowerCase() === String(pCat).toLowerCase())) {
            productCategories.push(pCat);
          }
        });

        const categoriesToRender = [];
        if (categories && categories.length > 0) {
          categories.forEach(cat => {
            categoriesToRender.push({
              id: cat.id,
              name: cat.name,
              slug: cat.slug || String(cat.name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
            });
          });
        }
        productCategories.forEach(catName => {
          if (!categoriesToRender.some(c => String(c.name || '').toLowerCase() === String(catName).toLowerCase() || String(c.id) === String(catName))) {
            categoriesToRender.push({
              id: catName,
              name: catName,
              slug: String(catName).toLowerCase().replace(/[^a-z0-9]/g, '')
            });
          }
        });

        const activeCategories = categoriesToRender.filter(cat => {
          return products.some(p => {
            const pCat = String((p.category && typeof p.category === 'object' ? p.category.name : p.category) || 'Uncategorized').toLowerCase();
            return pCat === String(cat.id).toLowerCase() || pCat === String(cat.name || '').toLowerCase() || pCat === String(cat.slug || '').toLowerCase();
          });
        });

        if (activeCategories.length > 0) {
          return (
            <div key={idx} style={{ backgroundColor: '#ffffff', width: '100%', padding: '60px 0' }}>
              <div className="container mb-5 pb-5">
                {activeCategories.map((cat, i) => {
                  const catProducts = products.filter(p => {
                    const pCat = String((p.category && typeof p.category === 'object' ? p.category.name : p.category) || 'Uncategorized').toLowerCase();
                    return pCat === String(cat.id).toLowerCase() || pCat === String(cat.name || '').toLowerCase() || pCat === String(cat.slug || '').toLowerCase();
                  });
                  
                  if (catProducts.length === 0) return null;
                  
                  return (
                    <div key={cat.id || cat.name} id={cat.slug} className="mb-5 pt-4" style={{ scrollMarginTop: '100px' }}>
                      <h2 className="text-start mb-4 fw-bold text-uppercase" style={{ fontFamily: 'var(--ai-heading-font)', color: '#1a1a1a', letterSpacing: '1px' }}>
                        {cat.name}
                      </h2>
                      <div className="row g-4">
                        {catProducts.map(renderProductCard)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        return (
          <div key={idx} style={{ backgroundColor: '#ffffff', width: '100%', padding: '60px 0' }}>
            <div id="shop" className="container mb-5 pb-5" style={{ scrollMarginTop: '100px' }}>
              <h2 className="text-start mb-4 fw-bold text-uppercase" style={{ fontFamily: 'var(--ai-heading-font)', color: '#1a1a1a', letterSpacing: '1px' }}>{section.title || 'Featured Products'}</h2>
              <div className="row g-4">
                {products.slice(0, 8).map(renderProductCard)}
              </div>
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div style={styleObj} className="min-vh-100">
      <style>{`
        body, .storefront-body, .storefront-main-content {
          background-color: var(--ai-bg) !important;
          color: var(--ai-text) !important;
        }
        .storefront-header, .hexashop-header, .eflyer-header {
          background-color: var(--ai-surface) !important;
          color: var(--ai-text) !important;
          border-bottom: none !important;
        }
        .storefront-footer {
          background-color: #1e3a8a !important; /* Premium dark blue */
          color: #ffffff !important;
          border-top: none !important;
        }
        .storefront-footer h4, .storefront-footer p {
          color: #ffffff !important;
          opacity: 0.9;
        }
        .hexashop-nav-item, .storefront-nav-item, .hexashop-icon-btn, .storefront-icon-btn {
          color: var(--ai-text) !important;
        }
        .hexashop-nav-item:hover, .storefront-nav-item:hover, .hexashop-icon-btn:hover {
          color: var(--ai-primary) !important;
        }
        .card, .storefront-product-card {
          background-color: var(--ai-surface) !important;
          border: 1px solid var(--ai-border) !important;
        }
        .card-body {
          background-color: var(--ai-surface) !important;
        }
        .btn-ai, .add-to-cart-btn {
          background-color: var(--ai-btn-bg) !important;
          color: var(--ai-btn-text) !important;
          border-color: var(--ai-btn-bg) !important;
        }
        .btn-ai:hover, .add-to-cart-btn:hover {
          background-color: var(--ai-hover) !important;
          border-color: var(--ai-hover) !important;
        }
        .text-muted {
          color: var(--ai-muted) !important;
        }
      `}</style>
      {/* Dynamic Render based on configuration sections */}
      {config.sections && config.sections.map((section, idx) => renderSection(section, idx))}
    </div>
  );
}