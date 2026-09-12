import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import { useStorefrontCart } from '../../context/StorefrontCartContext';
import { useStorefrontAuth } from '../../context/StorefrontAuthContext';
import { resolveStoreTheme } from '../../utils/themeResolver';
import { normalizeProductImage } from '../../utils/imageUtils';

export default function StorefrontHome({ storeData, products, categories = [] }) {
  const { requireAuth } = useStorefrontAuth();
  const location = useLocation();

  const searchQuery =
    new URLSearchParams(location.search).get('search')?.toLowerCase() || '';

  const [eflyerSlide, setEflyerSlide] = useState(0);
  const [aranozSlide, setAranozSlide] = useState(0);
  const [jewelrySlide, setJewelrySlide] = useState(0);

  /*
   * Hero slider
   */
  useEffect(() => {
    const timer = setInterval(() => {
      setEflyerSlide((prev) => (prev + 1) % 3);
      setAranozSlide((prev) => (prev + 1) % 3);
      setJewelrySlide((prev) => (prev + 1) % 8);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

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

  const theme = resolveStoreTheme(storeData);

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
          className="storefront-product-grid"
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
                <div className="storefront-product-image-container">
                  <img
                    src={normalizeProductImage(
                      product.image || product.image_url,
                      product.name
                    )}
                    alt={product.name}
                    className="storefront-product-image"
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

                  <div className="storefront-product-rating">
                    <span className="rating-badge">
                      {product.rating || '4.5'} ★
                    </span>
                  </div>

                  <div
                    className="storefront-product-price-row"
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '6px',
                    }}
                  >
                    {product.compare_price &&
                      Number(product.compare_price) >
                      Number(product.price) ? (
                      <>
                        <span
                          className="storefront-product-original-price"
                          style={{
                            textDecoration: 'line-through',
                            color: '#878787',
                            fontSize: '14px',
                          }}
                        >
                          ₹
                          {Number(product.compare_price).toLocaleString(
                            'en-IN'
                          )}
                        </span>

                        <span
                          className="storefront-product-price"
                          style={{
                            color: '#212121',
                            fontSize: '16px',
                            fontWeight: '500',
                          }}
                        >
                          ₹
                          {Number(product.price).toLocaleString('en-IN')}
                        </span>

                        <span
                          className="storefront-product-discount"
                          style={{
                            color: '#388e3c',
                            fontSize: '13px',
                            fontWeight: '500',
                          }}
                        >
                          —{' '}
                          {Math.round(
                            ((Number(product.compare_price) -
                              Number(product.price)) /
                              Number(product.compare_price)) *
                            100
                          )}
                          % OFF
                        </span>
                      </>
                    ) : (
                      <span
                        className="storefront-product-price"
                        style={{
                          color: '#212121',
                          fontSize: '16px',
                          fontWeight: '500',
                        }}
                      >
                        ₹
                        {Number(product.price).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  <div className="storefront-product-delivery">
                    Free delivery
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

                  requireAuth(() => toggleWishlist(product));
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

                    requireAuth(() =>
                      addToCart(
                        {
                          ...product,
                          selectedSize:
                            getFirstAvailableSize(product),
                          selectedColor:
                            getFirstAvailableColor(product),
                        },
                        1
                      )
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
      {!searchQuery && (() => {
        switch (theme) {
          /*
           * FLYER / FASHION THEME
           */
          case 'theme-eflyer': {
            const eflyerSlides = [
              {
                bg: 'https://themewagon.github.io/eflyer/images/banner-bg.png',
                title: 'GET START<br />YOUR FAVRIOT SHOPING',
                btn: 'Buy Now',
              },
              {
                bg: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=1600&h=800&fit=crop',
                title: "NEW ARRIVALS<br />MEN'S COLLECTION",
                btn: 'Shop Men',
              },
              {
                bg: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&h=800&fit=crop',
                title: 'EXCLUSIVE OFFERS<br />UP TO 50% OFF',
                btn: 'Explore Deals',
              },
            ];

            const slide = eflyerSlides[eflyerSlide];

            return (
              <div
                className="eflyer-hero position-relative overflow-hidden"
                style={{
                  background: 'transparent',
                }}
              >
                {eflyerSlides.map((s, idx) => (
                  <div
                    key={`bg-${idx}`}
                    className="position-absolute top-0 start-0 w-100 h-100"
                    style={{
                      backgroundImage: `url(${s.bg})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      opacity: eflyerSlide === idx ? 1 : 0,
                      transition: 'opacity 1s ease-in-out',
                      zIndex: 1,
                    }}
                  />
                ))}

                <div
                  className="eflyer-hero-content position-relative"
                  key={`content-${eflyerSlide}`}
                  style={{
                    zIndex: 2,
                  }}
                >
                  <h1
                    className="eflyer-hero-title"
                    dangerouslySetInnerHTML={{
                      __html: slide.title,
                    }}
                  />

                  <button className="eflyer-hero-btn">
                    {slide.btn}
                  </button>
                </div>
              </div>
            );
          }

          /*
           * HEXASHOP THEME
           */
          case 'theme-hexashop':
            return (
              <div className="hexashop-hero-section">
                <div className="hexashop-hero-left">
                  <div className="hexashop-hero-item large">
                    <img
                      src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=800&fit=crop"
                      alt="Fashion"
                    />

                    <div className="hexashop-hero-content">
                      <h2>We Are Hexashop</h2>
                      <span>
                        Awesome, clean &amp; creative fashion template
                      </span>

                      <button className="hexashop-btn">
                        Purchase Now!
                      </button>
                    </div>
                  </div>
                </div>

                <div className="hexashop-hero-right">
                  <div className="hexashop-hero-item">
                    <img
                      src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=400&fit=crop"
                      alt="Women"
                    />

                    <div className="hexashop-hero-content small-content">
                      <h4>Women</h4>
                      <span>Best Clothes</span>
                    </div>
                  </div>

                  <div className="hexashop-hero-item">
                    <img
                      src="https://images.unsplash.com/photo-1617137968427-85924c800a22?w=400&h=400&fit=crop"
                      alt="Men"
                    />

                    <div className="hexashop-hero-content small-content">
                      <h4>Men</h4>
                      <span>Best Clothes</span>
                    </div>
                  </div>

                  <div className="hexashop-hero-item">
                    <img
                      src="https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?w=400&h=400&fit=crop"
                      alt="Kids"
                    />

                    <div className="hexashop-hero-content small-content">
                      <h4>Kids</h4>
                      <span>Best Clothes</span>
                    </div>
                  </div>

                  <div className="hexashop-hero-item">
                    <img
                      src="https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400&h=400&fit=crop"
                      alt="Accessories"
                    />

                    <div className="hexashop-hero-content small-content">
                      <h4>Accessories</h4>
                      <span>Trend Accessories</span>
                    </div>
                  </div>
                </div>
              </div>
            );

          /*
           * JEWELRY THEME
           */
          case 'theme-jewelry': {
            const jewelryBgs = [
              'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1600&h=800&fit=crop',
              'https://images.unsplash.com/photo-1605100804763-247f67b2548e?w=1600&h=800&fit=crop',
              'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=1600&h=800&fit=crop',
              'https://images.unsplash.com/photo-1599643478514-4a4e03d3ce6b?w=1600&h=800&fit=crop',
              'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=1600&h=800&fit=crop',
              'https://images.unsplash.com/photo-1573408301145-b98c4af3066e?w=1600&h=800&fit=crop',
              'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=1600&h=800&fit=crop',
              'https://images.unsplash.com/photo-1622398925373-3f91b1e275f5?w=1600&h=800&fit=crop',
            ];

            return (
              <div className="jewelry-hero-section">
                {jewelryBgs.map((bg, idx) => (
                  <div
                    key={idx}
                    className={`jewelry-hero-bg ${idx === jewelrySlide ? 'active' : ''
                      }`}
                    style={{
                      backgroundImage: `url(${bg})`,
                    }}
                  />
                ))}

                <div className="jewelry-hero-content-wrapper">
                  <div className="jewelry-hero-text-block">
                    <span className="jewelry-hero-tag">
                      Exclusive Collection
                    </span>

                    <h1 className="jewelry-hero-title">
                      Timeless Beauty
                      <br />
                      <span>Crafted with Love</span>
                    </h1>

                    <button
                      className="jewelry-btn"
                      onClick={() => {
                        const el =
                          document.getElementById('products') ||
                          document.querySelector(
                            '.storefront-section'
                          );

                        if (el) {
                          el.scrollIntoView({
                            behavior: 'smooth',
                          });
                        }
                      }}
                    >
                      Purchase Now
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          /*
           * BEAUTY THEME
           */
          case 'theme-beauty':
            return (
              <div className="beauty-hero-section">
                <div className="beauty-hero-text">
                  <span className="beauty-tag">
                    NEW ARRIVALS
                  </span>

                  <h1 className="beauty-title">
                    Pure. Natural. Flawless.
                  </h1>

                  <p className="beauty-subtitle">
                    Elevate your skincare routine with our premium
                    organic essentials.
                  </p>

                  <button className="beauty-btn">
                    Shop Skincare
                  </button>
                </div>

                <div className="beauty-hero-image-container">
                  <img
                    src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=800&fit=crop"
                    className="beauty-hero-img"
                    alt="Cosmetics"
                  />
                </div>
              </div>
            );

          /*
           * HOME / ARANOZ THEME
           */
          case 'theme-home': {
            const aranozSlides = [
              {
                title: 'Wood & Cloth<br/>Sofa',
                subtitle:
                  'Incididunt ut labore et dolore magna aliqua quis ipsum suspendisse ultrices gravida. Risus commodo viverra',
                img: 'https://raw.githubusercontent.com/themewagon/aranoz/master/img/banner_img.png',
              },
              {
                title: 'Premium Quality<br/>Furniture',
                subtitle:
                  'Discover our new collection of comfortable and stylish living room furniture designed for modern homes.',
                img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=600&fit=crop',
              },
              {
                title: 'Minimalist<br/>Living',
                subtitle:
                  'Transform your space with our curated selection of minimalist decor and functional pieces.',
                img: 'https://images.unsplash.com/photo-1540574163026-643ea20d25b5?w=600&h=600&fit=crop',
              },
            ];

            const currentSlide = aranozSlides[aranozSlide];

            return (
              <div className="aranoz-hero-section">
                <div
                  className="aranoz-hero-container"
                  key={aranozSlide}
                >
                  <div className="aranoz-hero-text animated">
                    <h1
                      dangerouslySetInnerHTML={{
                        __html: currentSlide.title,
                      }}
                    />

                    <p>{currentSlide.subtitle}</p>

                    <button
                      className="btn_2"
                      onClick={() => {
                        const el =
                          document.getElementById('products');

                        if (el) {
                          el.scrollIntoView({
                            behavior: 'smooth',
                          });
                        }
                      }}
                    >
                      BUY NOW
                    </button>
                  </div>

                  <div className="aranoz-hero-img animated">
                    <img
                      src={currentSlide.img}
                      alt="Hero"
                      style={{
                        borderRadius: '15px',
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          }

          /*
           * ELECTRONICS THEME
           */
          case 'theme-electronics':
            return (
              <div className="tech-hero-section">
                <div className="tech-hero-grid">
                  <div className="tech-hero-main">
                    <div className="tech-hero-overlay">
                      <h2 className="tech-hero-title">
                        Next-Gen Tech
                      </h2>

                      <p>
                        Experience the future of personal electronics.
                      </p>

                      <button className="tech-btn">
                        Pre-Order Now
                      </button>
                    </div>

                    <img
                      src="https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1200&h=600&fit=crop"
                      alt="Tech"
                    />
                  </div>
                </div>
              </div>
            );

          /*
           * FOOTWEAR THEME
           */
          case 'theme-footwear':
            return (
              <div className="footwear-hero-section">
                <div className="footwear-hero-text">
                  <h1 className="footwear-title">
                    RUN
                    <br />
                    FASTER.
                  </h1>

                  <p className="footwear-subtitle">
                    Unleash your potential with our latest athletic
                    collection.
                  </p>

                  <button className="footwear-btn">
                    Shop Sneakers
                  </button>
                </div>

                <img
                  src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1000&h=800&fit=crop"
                  className="footwear-hero-img"
                  alt="Sneaker"
                />
              </div>
            );

          /*
           * GROCERY THEME
           */
          case 'theme-grocery':
            return (
              <div className="grocery-hero-section">
                <div className="grocery-hero-banner">
                  <img
                    src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=1600&h=500&fit=crop"
                    alt="Fresh Groceries"
                  />

                  <div className="grocery-hero-content">
                    <h2>Fresh & Organic</h2>

                    <p>
                      Farm-fresh produce delivered straight to your
                      door.
                    </p>

                    <button className="grocery-btn">
                      Shop Fresh
                    </button>
                  </div>
                </div>
              </div>
            );

          /*
           * GIFT THEME
           */
          case 'theme-gift':
            return (
              <div className="gift-hero-section">
                <div className="gift-hero-content">
                  <h2>The Perfect Gift</h2>

                  <p>
                    Curated surprises for every special occasion.
                  </p>

                  <button className="gift-btn">
                    Find Gifts
                  </button>
                </div>

                <img
                  src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&h=600&fit=crop"
                  alt="Gifts"
                  className="gift-hero-img"
                />
              </div>
            );

          /*
           * DEFAULT THEME
           */
          default:
            return (
              <div className="storefront-banner-slider">
                <img
                  src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=300&fit=crop"
                  alt="Store Banner"
                  className="storefront-banner-img"
                />
              </div>
            );
        }
      })()}

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

              {renderProductGrid(catProducts)}
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