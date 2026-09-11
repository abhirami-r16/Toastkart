import React, { useState } from 'react'; // Force HMR
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, ChevronDown, User, LogOut, Heart, Package, Menu, X } from 'lucide-react';
import { useStorefrontCart } from '../context/StorefrontCartContext';
import { useStorefrontAuth } from '../context/StorefrontAuthContext';
import { resolveStoreTheme } from '../utils/themeResolver';
import StorefrontLoginModal from '../components/StorefrontLoginModal';
import '../styles/theme-eflyer.css';

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
  const useModernHeader = ['theme-hexashop', 'theme-jewelry', 'theme-beauty', 'theme-home', 'theme-footwear'].includes(theme);
  const isEflyer = theme === 'theme-eflyer';

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
    <div className={`storefront-body ${theme} ${isHome ? 'is-home' : ''}`}>
      {isEflyer ? (
        <>
          {isHome && (
            <div className="eflyer-banner-wrapper">
              <header className="eflyer-header">
                <div className="eflyer-middle-bar">
                  <Link to={basePath} className="eflyer-logo">
                    {storeData?.name || 'Eflyer'}
                  </Link>
                </div>
                <div className="eflyer-bottom-bar">
                  <div className="eflyer-bottom-bar-content">
                    
                    <div className="eflyer-search-container">
                      <input
                        type="text"
                        placeholder={`Search for products...`}
                        className="eflyer-search-input"
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

                    <div className="eflyer-actions" style={{ justifyContent: 'space-between', width: '100%' }}>
                      {/* Mobile Hamburger Menu Toggle */}
                      <button 
                        className="eflyer-action-btn d-md-none" 
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
                      ) : (
                        <button className="eflyer-action-btn d-none d-md-flex" onClick={openLoginModal}>
                          <User size={24} />
                        </button>
                      )}
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
                        <button 
                          className="storefront-mobile-nav-item text-dark border-0 bg-transparent text-start" 
                          onClick={() => {
                            openLoginModal();
                            setIsCategoryOpen(false);
                          }}
                        >
                          <User size={16} className="me-2" /> Login / Create Account
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : useModernHeader ? (
        /* Hexashop/Modern-Style Header for Luxury/Minimal/Fashion Themes */
        <header className="storefront-header hexashop-header">
          <div className="hexashop-header-content">
            <div className="d-flex align-items-center">
              {/* Mobile Hamburger Menu Toggle */}
              <button 
                className="hexashop-icon-btn border-0 bg-transparent p-0 d-lg-none me-2" 
                onClick={() => setIsCategoryOpen(true)}
              >
                <Menu size={24} />
              </button>
              
              <div className="storefront-logo hexashop-logo" onClick={() => navigate(basePath)} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '55vw' }}>
                {storeData?.logo_url ? (
                  <img src={storeData.logo_url} alt={storeData.name} className="storefront-logo-img" />
                ) : (
                  <span className="storefront-logo-text" style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {storeData?.name || 'Store'}
                    {theme === 'theme-home' && <span className="furni-dot">.</span>}
                  </span>
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
                <button onClick={openLoginModal} className="hexashop-icon-btn border-0 bg-transparent p-0 d-none d-md-block" title="Login">
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
                    <button 
                      className="storefront-mobile-nav-item border-0 bg-transparent text-start" 
                      onClick={() => {
                        openLoginModal();
                        setIsCategoryOpen(false);
                      }}
                    >
                      <User size={16} className="me-2" /> Login / Create Account
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </header>
      ) : (
        <>
          {/* Standard Retail (Flipkart-Style) Header */}
          <header className="storefront-header">
            <div className="storefront-header-content">
              <div className="storefront-logo" onClick={() => navigate(basePath)}>
                <span className="storefront-logo-text" style={{ cursor: 'pointer' }}>
                  {storeData.name}
                  {theme === 'theme-home' && <span className="furni-dot">.</span>}
                </span>
                <div className="storefront-logo-sub">Explore <span className="plus-icon">Plus</span></div>
              </div>

              <div className="storefront-search-bar">
                <input
                  type="text"
                  placeholder={`Search for products, brands and more in ${storeData.name}`}
                  className="storefront-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      navigate(`${basePath}?search=${encodeURIComponent(searchQuery)}`);
                    }
                  }}
                />
                <button className="storefront-search-btn" onClick={() => navigate(`${basePath}?search=${encodeURIComponent(searchQuery)}`)}>
                  <Search size={18} style={{ color: '#2874f0' }} />
                </button>
              </div>

              <div className="storefront-nav-actions">
                {user && user.id ? (
                  <div className="d-flex align-items-center gap-3">
                    <span className="text-white fs-7 fw-semibold d-none d-md-block">Hello, {user.name}</span>
                    <button 
                      className="btn bg-white fw-bold px-3 rounded-1 shadow-sm text-danger" 
                      style={{ height: '36px', border: 'none' }}
                      onClick={logout}
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <button 
                    className="btn bg-white fw-bold px-4 rounded-1 shadow-sm d-flex align-items-center justify-content-center" 
                    style={{ color: '#2874f0', height: '36px', border: 'none' }}
                    onClick={openLoginModal}
                  >
                    Create account
                  </button>
                )}

                <Link to={`${basePath}/wishlist`} className="storefront-nav-item text-decoration-none">
                  Wishlist
                </Link>

                <Link to={`${basePath}/orders`} className="storefront-nav-item text-decoration-none">
                  My Orders
                </Link>

                <Link to={`${basePath}/cart`} className="storefront-nav-item cart-item text-decoration-none">
                  <div className="position-relative">
                    <ShoppingCart size={18} />
                    {cartCount > 0 && (
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.65rem', transform: 'translate(-30%, -30%)!important' }}>
                        {cartCount}
                      </span>
                    )}
                  </div>
                  <span>Cart</span>
                </Link>
              </div>
            </div>
          </header>

          {/* Categories Sub-header */}
          <div className="storefront-categories-nav">
            <div className="storefront-categories-content">
              {activeCategories && activeCategories.length > 0 ? (
                activeCategories.map(cat => {
                  const sectionId = cat.slug;
                  return (
                    <a
                      key={cat.id || cat.name}
                      href={`#${sectionId}`}
                      onClick={(e) => scrollToSection(e, sectionId)}
                      className="category-item text-decoration-none"
                    >
                      {cat.name} <ChevronDown size={12} />
                    </a>
                  );
                })
              ) : (
                <div className="category-placeholder">No categories defined</div>
              )}
            </div>
          </div>
        </>
      )}

      <StorefrontLoginModal />

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
