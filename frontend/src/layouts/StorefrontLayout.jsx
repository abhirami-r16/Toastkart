import React, { useState } from 'react'; // Force HMR
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, ChevronDown, User, LogOut, Heart, Package, Menu, X } from 'lucide-react';
import { useStorefrontCart } from '../context/StorefrontCartContext';
import { useStorefrontAuth } from '../context/StorefrontAuthContext';
import { resolveStoreTheme } from '../utils/themeResolver';
const StorefrontLoginModal = React.lazy(() => import('../components/StorefrontLoginModal'));
// Themes are now dynamically loaded in useEffect below to drastically cut initial CSS payload
// import '../styles/theme-eflyer.css';

export default function StorefrontLayout({ storeData, categories = [], products = [] }) {
  const { cartCount } = useStorefrontCart();
  const { user, logout, openLoginModal } = useStorefrontAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState(new URLSearchParams(location.search).get('search') || '');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All Category');

  const getBasePath = () => {
    const p = window.location.pathname;
    if (p.startsWith('/store/')) return `/store/${p.split('/')[2]}`;
    return '/storefront';
  };
  const basePath = getBasePath();

  const theme = resolveStoreTheme(storeData);

  const isEflyer = theme === 'theme-eflyer';

  const [themeLoaded, setThemeLoaded] = useState(false);

  // Dynamically load only the required theme CSS to prevent downloading massive unused CSS
  // Wait for the import to finish to prevent Flash of Unstyled Content (FOUC)
  React.useEffect(() => {
    let mounted = true;
    const loadTheme = async () => {
      try {
        switch (theme) {
          case 'theme-home': await import('../styles/theme-home.css'); break;
          case 'theme-beauty': await import('../styles/theme-beauty.css'); break;
          case 'theme-electronics': await import('../styles/theme-electronics.css'); break;
          case 'theme-footwear': await import('../styles/theme-footwear.css'); break;
          case 'theme-gift': await import('../styles/theme-gift.css'); break;
          case 'theme-grocery': await import('../styles/theme-grocery.css'); break;
          case 'theme-jewelry': await import('../styles/theme-jewelry.css'); break;
          case 'theme-eflyer': await import('../styles/theme-eflyer.css'); break;
          case 'theme-perfume': await import('../styles/theme-perfume.css'); break;
          default: break;
        }
      } catch (e) {
        console.error('Failed to load theme CSS', e);
      } finally {
        if (mounted) setThemeLoaded(true);
      }
    };
    loadTheme();
    return () => { mounted = false; };
  }, [theme]);

  if (!themeLoaded) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary"></div>
      </div>
    );
  }

  // Compute the combined list of categories (same logic as StorefrontHome)
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
        slug: cat.slug || String(cat.name || '').toLowerCase().replace(/[^a-z0-9]/g, ''),
        isCustom: true
      });
    });
  }

  productCategories.forEach(catName => {
    if (!categoriesToRender.some(c => String(c.name || '').toLowerCase() === String(catName).toLowerCase() || String(c.id) === String(catName))) {
      categoriesToRender.push({
        id: catName,
        name: catName,
        slug: String(catName).toLowerCase().replace(/[^a-z0-9]/g, ''),
        isCustom: false
      });
    }
  });

  // Filter out empty categories
  const activeCategories = categoriesToRender.filter(cat => {
    const catProducts = products.filter(p => {
      const pCat = String((p.category && typeof p.category === 'object' ? p.category.name : p.category) || 'Uncategorized').toLowerCase();
      return pCat === String(cat.id).toLowerCase() || pCat === String(cat.name || '').toLowerCase() || pCat === String(cat.slug || '').toLowerCase();
    });
    return catProducts.length > 0;
  });

  const scrollToSection = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  const isHome = location.pathname === basePath || location.pathname === `${basePath}/`;

  return (
    <div className={`storefront-body ${theme} ${(isHome && !searchQuery) ? 'is-home' : ''}`}>
      {isEflyer ? (
        <>
          {isHome && (
            <div className="eflyer-banner-wrapper">
              <header className="eflyer-header" style={{ backgroundColor: (!isHome || searchQuery) ? '#eab41f' : 'transparent', paddingBottom: '10px' }}>
                <div className="eflyer-middle-bar">
                  <Link to={basePath} className="eflyer-logo">
                    {storeData?.name || 'Eflyer'}
                  </Link>
                </div>
                <div className="eflyer-bottom-bar">
                  <div className="eflyer-bottom-bar-content w-100">

                    {/* Spacer to balance the layout on desktop so search bar is perfectly centered */}
                    <div className="d-none d-lg-block" style={{ flex: 1 }}></div>

                    <div className="eflyer-search-container">
                      <input
                        type="text"
                        placeholder={`Search for products...`}
                        className="eflyer-search-input w-100"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            navigate(`${basePath}?search=${encodeURIComponent(searchQuery)}`);
                          }
                        }}
                      />
                      <button className="eflyer-search-btn" onClick={() => navigate(`${basePath}?search=${encodeURIComponent(searchQuery)}`)}>
                        <Search size={18} />
                      </button>
                    </div>

                    <div className="eflyer-actions d-flex align-items-center justify-content-end" style={{ gap: '24px', flex: 1 }}>
                      {/* Mobile & Desktop Hamburger Menu Toggle */}
                      <button
                        className="eflyer-action-btn"
                        onClick={() => setIsCategoryOpen(true)}
                        style={{ marginRight: 'auto' }}
                      >
                        <Menu size={26} />
                      </button>

                      <Link to={`${basePath}/wishlist`} className="eflyer-action-btn position-relative">
                        <Heart size={24} />
                      </Link>
                      <Link to={`${basePath}/orders`} className="eflyer-action-btn position-relative d-none d-md-flex" title="My Orders">
                        <Package size={24} />
                      </Link>
                      <Link to={`${basePath}/cart`} className="eflyer-action-btn position-relative">
                        <ShoppingCart size={24} />
                        {cartCount > 0 && (
                          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.65rem' }}>
                            {cartCount}
                          </span>
                        )}
                      </Link>
                      {user && user.id ? (
                        <>
                          <span className="eflyer-welcome-text fw-bold text-white text-nowrap d-none d-xl-inline-block me-3" style={{ alignSelf: 'center' }}>
                            Welcome, {user.name.split(' ')[0]}
                          </span>
                          <button className="eflyer-action-btn d-none d-md-flex" onClick={logout}>
                            <LogOut size={24} />
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              </header>

              {/* Mobile Sidebar Menu (Shared) */}
              {isCategoryOpen && (
                <div className="storefront-mobile-menu-overlay" onClick={() => setIsCategoryOpen(false)}>
                  <div className="storefront-mobile-menu" onClick={e => e.stopPropagation()}>
                    <div className="storefront-mobile-menu-header">
                      <span className="fw-bold fs-5 text-dark">{storeData?.name || 'Menu'}</span>
                      <button className="btn p-0 border-0 text-dark" onClick={() => setIsCategoryOpen(false)}>
                        <X size={24} />
                      </button>
                    </div>
                    <div className="storefront-mobile-menu-body text-dark">
                      <Link
                        to={basePath}
                        className="storefront-mobile-nav-item text-dark"
                        onClick={() => setIsCategoryOpen(false)}
                      >
                        Home
                      </Link>
                      <div className="storefront-mobile-nav-title mt-4 mb-2 text-muted fw-bold" style={{ fontSize: '12px', paddingLeft: '15px' }}>
                        CATEGORIES
                      </div>
                      {activeCategories && activeCategories.map(cat => (
                        <a
                          key={cat.id || cat.name}
                          href={`#${cat.slug}`}
                          onClick={(e) => {
                            setIsCategoryOpen(false);
                            scrollToSection(e, cat.slug);
                          }}
                          className="storefront-mobile-nav-item text-dark"
                        >
                          {cat.name}
                        </a>
                      ))}

                      <div className="storefront-mobile-nav-title mt-4 mb-2 text-muted fw-bold" style={{ fontSize: '12px', paddingLeft: '15px' }}>
                        ACCOUNT
                      </div>
                      {user && user.id ? (
                        <>
                          <div className="storefront-mobile-nav-item text-primary" style={{ borderBottom: 'none' }}>
                            Hi, {user.name}
                          </div>
                          <Link to={`${basePath}/orders`} className="storefront-mobile-nav-item text-dark" onClick={() => setIsCategoryOpen(false)}>
                            <Package size={16} className="me-2" /> My Orders
                          </Link>
                          <Link to={`${basePath}/wishlist`} className="storefront-mobile-nav-item text-dark" onClick={() => setIsCategoryOpen(false)}>
                            <Heart size={16} className="me-2" /> Wishlist
                          </Link>
                          <button
                            className="storefront-mobile-nav-item text-danger border-0 bg-transparent text-start"
                            onClick={() => {
                              logout();
                              setIsCategoryOpen(false);
                            }}
                          >
                            <LogOut size={16} className="me-2" /> Logout
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="storefront-mobile-nav-item text-dark border-0 bg-transparent text-start w-100"
                            onClick={() => { setIsCategoryOpen(false); openLoginModal(); }}
                          >
                            Login
                          </button>
                          <button
                            className="storefront-mobile-nav-item text-dark border-0 bg-transparent text-start w-100"
                            onClick={() => { setIsCategoryOpen(false); openLoginModal(); }}
                          >
                            Create Account
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* Hexashop/Modern-Style Header for Luxury/Minimal/Fashion Themes */
        <>
          {theme === 'theme-perfume' && (
            <div style={{ backgroundColor: '#000000', color: '#ffffff', padding: '10px 0', width: '100%' }}>
              <marquee scrollamount="8" behavior="scroll" direction="left" style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '0.9rem', letterSpacing: '0.5px' }}>
                <span className="mx-5">Limited Deal: Pick 5 for Just ₹3,899</span>
                <span className="mx-5">Limited Deal: Pick 5 for Just ₹3,899</span>
                <span className="mx-5">Limited Deal: Pick 5 for Just ₹3,899</span>
                <span className="mx-5">Limited Deal: Pick 5 for Just ₹3,899</span>
                <span className="mx-5">Limited Deal: Pick 5 for Just ₹3,899</span>
                <span className="mx-5">Limited Deal: Pick 5 for Just ₹3,899</span>
                <span className="mx-5">Limited Deal: Pick 5 for Just ₹3,899</span>
              </marquee>
            </div>
          )}
          <header className="storefront-header hexashop-header">
          <div className="hexashop-header-content">
            <div className="d-flex align-items-center position-relative">
              {/* Hamburger Menu Toggle (Mobile & Desktop) */}
              <button
                className="hexashop-icon-btn border-0 bg-transparent p-0 me-3 position-absolute"
                style={{ left: '-20px' }}
                onClick={() => setIsCategoryOpen(true)}
              >
                <Menu size={24} />
              </button>

              <div className="storefront-logo hexashop-logo ms-4" onClick={() => navigate(basePath)} style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '55vw' }}>
                {storeData?.logo_url ? (
                  <img src={storeData.logo_url} alt={storeData.name} className="storefront-logo-img" />
                ) : (
                  <div className="d-flex align-items-center gap-3">
                    {theme === 'theme-perfume' && (
                      <div 
                        className="d-flex flex-column align-items-center justify-content-center" 
                        style={{ 
                          fontWeight: 'bold', 
                          fontSize: '1.6rem', 
                          lineHeight: '0.9', 
                          borderRight: '1px solid #e0e0e0', 
                          paddingRight: '12px', 
                          fontFamily: 'var(--perfume-font-heading, serif)',
                          background: 'linear-gradient(135deg, #d4af37 0%, #aa841f 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}
                      >
                        <span style={{ letterSpacing: '4px', marginLeft: '4px' }}>CY</span>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ letterSpacing: '0px' }}>
                            <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              O
                              <svg 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="#d4af37" 
                                strokeWidth="1.5" 
                                style={{ 
                                  position: 'absolute', 
                                  width: '0.45em', 
                                  height: '0.45em', 
                                  top: '50%', 
                                  left: '50%', 
                                  transform: 'translate(-50%, -50%)',
                                  WebkitTextFillColor: 'initial' /* Prevent text fill transparent from breaking SVG */
                                }}
                              >
                                <circle cx="12" cy="15" r="5" />
                                <path d="M10 10V7h4v3" />
                                <rect x="9" y="4" width="6" height="3" rx="1" />
                                <path d="M12 12v5" strokeWidth="1" opacity="0.7" />
                              </svg>
                            </span>
                          </span>
                          <span style={{ letterSpacing: '0px', marginLeft: '2px' }}>P</span>
                        </div>
                      </div>
                    )}
                    <span className="storefront-logo-text" style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {storeData?.name || 'Store'}
                      {theme === 'theme-home' && <span className="furni-dot">.</span>}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hexashop-nav d-none d-lg-flex">
              <Link to={basePath} className="hexashop-nav-item">Home</Link>
              {activeCategories && activeCategories.map(cat => (
                <a
                  key={cat.id || cat.name}
                  href={`#${cat.slug}`}
                  onClick={(e) => scrollToSection(e, cat.slug)}
                  className="hexashop-nav-item"
                >
                  {cat.name}
                </a>
              ))}
            </nav>

            <div className="hexashop-nav-actions">
              {/* These are hidden on mobile to prevent overlap, except the cart */}
              {user && user.id ? (
                <div className="align-items-center gap-3 d-none d-md-flex">
                  <span className="fs-7 fw-semibold d-none d-lg-block" style={{ color: '#2a2a2a' }}>Hi, {user.name}</span>
                  <button onClick={logout} className="hexashop-icon-btn text-danger border-0 bg-transparent p-0" title="Logout">
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <button onClick={openLoginModal} className="hexashop-icon-btn border-0 bg-transparent p-0 d-none d-md-flex" title="Login">
                  <User size={20} />
                </button>
              )}

              <Link to={`${basePath}/wishlist`} className="hexashop-icon-btn text-decoration-none">
                <Heart size={20} />
              </Link>
              <Link to={`${basePath}/orders`} className="hexashop-icon-btn text-decoration-none d-none d-md-block" title="Orders">
                <Package size={20} />
              </Link>
              <Link to={`${basePath}/cart`} className="hexashop-icon-btn text-decoration-none position-relative">
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-dark" style={{ fontSize: '0.65rem' }}>
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Mobile Sidebar Menu */}
          {isCategoryOpen && (
            <div className="storefront-mobile-menu-overlay" onClick={() => setIsCategoryOpen(false)}>
              <div className="storefront-mobile-menu" onClick={e => e.stopPropagation()}>
                <div className="storefront-mobile-menu-header">
                  <span className="fw-bold fs-5">{storeData?.name || 'Menu'}</span>
                  <button className="btn p-0 border-0" onClick={() => setIsCategoryOpen(false)}>
                    <X size={24} />
                  </button>
                </div>
                <div className="storefront-mobile-menu-body">
                  <Link
                    to={basePath}
                    className="storefront-mobile-nav-item"
                    onClick={() => setIsCategoryOpen(false)}
                  >
                    Home
                  </Link>
                  <div className="storefront-mobile-nav-title mt-4 mb-2 text-muted fw-bold" style={{ fontSize: '12px', paddingLeft: '15px' }}>
                    CATEGORIES
                  </div>
                  {activeCategories && activeCategories.map(cat => (
                    <a
                      key={cat.id || cat.name}
                      href={`#${cat.slug}`}
                      onClick={(e) => {
                        setIsCategoryOpen(false);
                        scrollToSection(e, cat.slug);
                      }}
                      className="storefront-mobile-nav-item"
                    >
                      {cat.name}
                    </a>
                  ))}

                  <div className="storefront-mobile-nav-title mt-4 mb-2 text-muted fw-bold" style={{ fontSize: '12px', paddingLeft: '15px' }}>
                    ACCOUNT
                  </div>
                  {user && user.id ? (
                    <>
                      <div className="storefront-mobile-nav-item text-primary" style={{ borderBottom: 'none' }}>
                        Hi, {user.name}
                      </div>
                      <Link to={`${basePath}/orders`} className="storefront-mobile-nav-item" onClick={() => setIsCategoryOpen(false)}>
                        <Package size={16} className="me-2" /> My Orders
                      </Link>
                      <Link to={`${basePath}/wishlist`} className="storefront-mobile-nav-item" onClick={() => setIsCategoryOpen(false)}>
                        <Heart size={16} className="me-2" /> Wishlist
                      </Link>
                      <button
                        className="storefront-mobile-nav-item text-danger border-0 bg-transparent text-start"
                        onClick={() => {
                          logout();
                          setIsCategoryOpen(false);
                        }}
                      >
                        <LogOut size={16} className="me-2" /> Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="storefront-mobile-nav-item border-0 bg-transparent text-start w-100"
                        onClick={() => { setIsCategoryOpen(false); openLoginModal(); }}
                      >
                        Login
                      </button>
                      <button
                        className="storefront-mobile-nav-item border-0 bg-transparent text-start w-100"
                        onClick={() => { setIsCategoryOpen(false); openLoginModal(); }}
                      >
                        Create Account
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </header>
        </>
      )}

      <React.Suspense fallback={null}>
        <StorefrontLoginModal />
      </React.Suspense>

      <main className="storefront-main-content">
        <Outlet />
      </main>

      <footer className="storefront-footer">
        <div className="storefront-footer-content">
          <div className="footer-col">
            <h4>ABOUT</h4>
            <p>Contact Us</p>
            <p>About Us</p>
            <p>Careers</p>
          </div>
          <div className="footer-col">
            <h4>HELP</h4>
            <p>Payments</p>
            <p>Shipping</p>
            <p>Cancellation & Returns</p>
          </div>
          <div className="footer-col">
            <h4>POLICY</h4>
            <p>Return Policy</p>
            <p>Terms Of Use</p>
            <p>Security</p>
          </div>
          <div className="footer-col border-left">
            <h4>Mail Us:</h4>
            <p>{storeData.name} Internet Private Limited,</p>
            <p>Buildings Alyssa, Begonia &</p>
            <p>Clove Embassy Tech Village,</p>
            <p>Bengaluru, 560103,</p>
            <p>Karnataka, India</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
