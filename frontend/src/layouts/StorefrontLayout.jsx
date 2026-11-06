import React, { useState } from 'react'; // Force HMR



import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';



import { Search, ShoppingCart, ChevronDown, User, LogOut, Heart, Package, Menu, X } from 'lucide-react';



import { useStorefrontCart } from '../context/StorefrontCartContext';



import { useStorefrontAuth } from '../context/StorefrontAuthContext';



import { resolveStoreTheme } from '../utils/themeResolver';



const StorefrontLoginModal = React.lazy(() => import('../components/StorefrontLoginModal'));



// Themes are now dynamically loaded in useEffect below to drastically cut initial CSS payload



// import '../styles/theme-eflyer.css';







const NEWBORN_ITEMS = [
  'Bed',
  'Carry bag',
  'Motherbag',
  'Maternity pillow',
  'Feeding pillow',
  'Hooded towel',
  'Plain towel',
  'Dress',
  'Napkin',
  'Diaper',
  'Romber set',
];

export default function StorefrontLayout({ storeData, categories = [], products = [] }) {
  const { cartCount } = useStorefrontCart();
  const { user, logout, openLoginModal } = useStorefrontAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState(new URLSearchParams(location.search).get('search') || '');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All Category');
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [openMobileDropdownIds, setOpenMobileDropdownIds] = useState({});

  const getCategoryDropdownItems = (cat) => {
    if (Array.isArray(cat?.dropdown_items) && cat.dropdown_items.length > 0) {
      return cat.dropdown_items;
    }
    if (typeof cat?.dropdown_items === 'string' && cat.dropdown_items.trim()) {
      try {
        const parsed = JSON.parse(cat.dropdown_items);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        const parts = cat.dropdown_items.split(',').map(s => s.trim()).filter(Boolean);
        if (parts.length > 0) return parts;
      }
    }
    if (String(cat?.slug || '').toLowerCase() === 'newborn' || String(cat?.name || '').toLowerCase() === 'newborn') {
      return NEWBORN_ITEMS;
    }
    return [];
  };







  const getBasePath = () => {



    const p = window.location.pathname;



    if (p.startsWith('/store/')) return `/store/${p.split('/')[2]}`;



    return '/storefront';



  };



  const basePath = getBasePath();







  const theme = resolveStoreTheme(storeData);







  const isEflyer = false; // User requested modern layout for all themes







  const [themeLoaded, setThemeLoaded] = useState(false);

  // Dynamically load only the required theme CSS
  React.useEffect(() => {
    let mounted = true;
    const loadThemeCss = async () => {
      try {
        switch (theme) {
          case 'theme-coconut':
            await import('../styles/theme-coconut.css');
            break;
          case 'theme-baby':
            await import('../styles/theme-baby.css');
            break;
          case 'theme-beauty':
            await import('../styles/theme-beauty.css');
            break;
          case 'theme-jewelry':
            await import('../styles/theme-jewelry.css');
            break;
          case 'theme-perfume':
            await import('../styles/theme-perfume.css');
            break;
          case 'theme-footwear':
            await import('../styles/theme-footwear.css');
            break;
          case 'theme-gift':
            await import('../styles/theme-gift.css');
            break;
          case 'theme-electronics':
            await import('../styles/theme-electronics.css');
            break;
          case 'theme-grocery':
            await import('../styles/theme-grocery.css');
            break;
          case 'theme-home':
            await import('../styles/theme-home.css');
            break;
          default:
            await import('../styles/theme-eflyer.css');
            break;
        }
      } catch (e) {
        console.error('Failed to dynamically load theme CSS', e);
      } finally {
        if (mounted) setThemeLoaded(true);
      }
    };
    loadThemeCss();
    return () => { mounted = false; };
  }, [theme]);

  React.useEffect(() => {
    const isNafi =
      theme === 'theme-baby' ||
      String(storeData?.name || '').toLowerCase().includes('nafi') ||
      String(storeData?.slug || '').toLowerCase().includes('nafi') ||
      window.location.pathname.toLowerCase().includes('nafi');

    const isAmiora =
      !isNafi && (
        theme === 'theme-coconut' ||
        String(storeData?.name || '').toLowerCase().includes('amiora') ||
        String(storeData?.subdomain || '').toLowerCase().includes('amiora') ||
        String(storeData?.category || '').toLowerCase().includes('coconut') ||
        window.location.hostname.toLowerCase().includes('amiora') ||
        window.location.hostname.toLowerCase().includes('cocoa')
      );

    const storeLogo = storeData?.logo_url || storeData?.logo || (isNafi ? '/images/an-nafi-logo.png' : '/favicon.png');
    const faviconUrl = isNafi
      ? (storeData?.logo_url || storeData?.logo || '/images/an-nafi-logo.png')
      : (isAmiora
        ? '/images/amiora-favicon.png'
        : (storeLogo || '/favicon.png'));

    // Update standard icon & force reload to avoid cached favicon
    try {
      const head = document.head || document.getElementsByTagName('head')[0];
      const existingIcons = head.querySelectorAll("link[rel*='icon']");
      existingIcons.forEach(el => el.parentNode && el.parentNode.removeChild(el));

      const link = document.createElement('link');
      link.type = 'image/png';
      link.rel = 'shortcut icon';
      link.id = 'dynamic-favicon';
      link.href = faviconUrl;
      head.appendChild(link);

      const standardLink = document.createElement('link');
      standardLink.type = 'image/png';
      standardLink.rel = 'icon';
      standardLink.href = faviconUrl;
      head.appendChild(standardLink);

      const appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      appleLink.id = 'dynamic-apple-icon';
      appleLink.href = faviconUrl;
      head.appendChild(appleLink);
    } catch (e) {
      console.debug('Favicon set error:', e);
    }

    // Update title
    if (isNafi) {
      document.title = `${storeData?.name || "AN' NAFI"} Baby Shop`;
    } else if (isAmiora) {
      document.title = 'AMIORA';
    } else if (storeData?.name && storeData.id !== 'loading') {
      document.title = `${storeData.name} - Online Store`;
    }
  }, [storeData, theme]);







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
        dropdown_items: cat.dropdown_items || [],
        isCustom: true
      });



    });
  }

  if (theme === 'theme-baby') {
    const babyDefaults = [
      { id: 40, name: 'Toys', slug: 'toys', isCustom: true },
      { id: 41, name: 'Newborn', slug: 'newborn', isCustom: true },
      { id: 42, name: 'Cosmetics', slug: 'cosmetics', isCustom: true },
    ];
    babyDefaults.forEach(def => {
      if (!categoriesToRender.some(c => String(c.slug || '').toLowerCase() === def.slug || String(c.name || '').toLowerCase() === def.name.toLowerCase())) {
        categoriesToRender.push(def);
      }
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







  // Include custom store categories, baby theme categories, or categories with active products in navbar
  const activeCategories = categoriesToRender.filter(cat => {
    if (cat.isCustom) return true;
    if (theme === 'theme-baby') return true;
    if (cat.store_id || cat.storeId) return true;

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



                  <Link to={{ pathname: basePath, search: location.search }} className="eflyer-logo">



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







                      <Link to={{ pathname: `${basePath}/wishlist`, search: location.search }} className="eflyer-action-btn position-relative">



                        <Heart size={24} />



                      </Link>



                      <Link to={{ pathname: `${basePath}/orders`, search: location.search }} className="eflyer-action-btn position-relative d-none d-md-flex" title="My Orders">



                        <Package size={24} />



                      </Link>



                      <Link to={{ pathname: `${basePath}/cart`, search: location.search }} className="eflyer-action-btn position-relative">



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



                        to={{ pathname: basePath, search: location.search }}



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



                          <Link to={{ pathname: `${basePath}/orders`, search: location.search }} className="storefront-mobile-nav-item text-dark" onClick={() => setIsCategoryOpen(false)}>



                            <Package size={16} className="me-2" /> My Orders



                          </Link>



                          <Link to={{ pathname: `${basePath}/wishlist`, search: location.search }} className="storefront-mobile-nav-item text-dark" onClick={() => setIsCategoryOpen(false)}>



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



          {theme === 'theme-coconut' && (



            <div className="coconut-top-bar" style={{ backgroundColor: '#14271C', color: '#FDFBF7', padding: '10px 0', width: '100%' }}>



              <marquee scrollamount="7" behavior="scroll" direction="left" style={{ color: '#FDFBF7', fontWeight: 'bold', fontSize: '0.88rem', letterSpacing: '0.5px' }}>



                <span className="mx-5">🌴 100% Organic & Cold-Pressed Kerala Coconut Treasures</span>



                <span className="mx-5">🥥 Direct From Coastal Farm Groves</span>



                <span className="mx-5">✨ Zero Chemical Refining • Traditional Wood Extraction</span>



                <span className="mx-5">🌿 Sustainable Artisanal Living from God's Own Country</span>



              </marquee>



            </div>



          )}



          {/* Baby top bar removed per request */}



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







              <div className="storefront-logo hexashop-logo ms-4" onClick={() => navigate({ pathname: basePath, search: location.search })} style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '55vw', cursor: 'pointer' }}>



                {theme === 'theme-coconut' ? (



                  <div className="d-flex align-items-center" style={{ maxHeight: '65px' }}>



                    <img 



                      src="/images/amiora-logo.png" 



                      alt={storeData?.name || "AMIORA"} 



                      className="coconut-brand-logo"



                      style={{



                        height: '52px',



                        maxWidth: '220px',



                        width: 'auto',



                        objectFit: 'contain',



                        display: 'block'



                      }} 



                    />



                  </div>



                ) : theme === 'theme-baby' ? (



                  <div className="d-flex align-items-center gap-2" style={{ maxHeight: '65px' }}>



                    <img 



                      src={storeData?.logo_url || storeData?.logo || "/images/an-nafi-logo.png"} 



                      alt={storeData?.name || "AN' NAFI Baby shop"} 



                      className="baby-brand-logo"



                      style={{



                        height: '48px',



                        maxWidth: '56px',



                        width: 'auto',



                        objectFit: 'contain',



                        display: 'block'



                      }} 



                    />



                    <div className="d-flex flex-column justify-content-center text-start">



                      <span 



                        className="baby-store-title"



                        style={{



                          fontFamily: "'Outfit', 'Comfortaa', -apple-system, sans-serif",



                          fontWeight: 800,



                          fontSize: 'clamp(1.1rem, 1.8vw, 1.4rem)',



                          letterSpacing: '0.2px',



                          color: '#2D2A26',



                          lineHeight: 1.15,



                          whiteSpace: 'nowrap'



                        }}



                      >



                        {storeData?.name?.toLowerCase() === 'an nafi' ? "AN' NAFI" : (storeData?.name || "AN' NAFI")}



                      </span>



                      <span



                        className="baby-store-subtitle"



                        style={{



                          fontFamily: "'Quicksand', -apple-system, sans-serif",



                          fontSize: '0.70rem',



                          fontWeight: 700,



                          letterSpacing: '1.4px',



                          textTransform: 'uppercase',



                          color: '#C9933B',



                          lineHeight: 1.1,



                          marginTop: '2px'



                        }}



                      >



                        Baby shop



                      </span>



                    </div>



                  </div>



                ) : storeData?.logo_url ? (



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



                    {theme === 'theme-baby' && (



                      <div className="baby-logo-icon me-2">



                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E06D8C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">



                          <path d="M12 2a5 5 0 0 0-5 5v2a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5z"/>



                          <path d="M12 14a8 8 0 0 0-8 8h16a8 8 0 0 0-8-8z"/>



                        </svg>



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
            <nav className="hexashop-nav d-none d-lg-flex" style={{ alignItems: 'center' }}>
              <Link to={{ pathname: basePath, search: location.search }} className="hexashop-nav-item">Home</Link>
              {activeCategories && activeCategories.map(cat => {
                const catKey = String(cat.id || cat.slug || cat.name);
                const dropdownItems = getCategoryDropdownItems(cat);
                const hasDropdown = dropdownItems && dropdownItems.length > 0;
                const isOpen = openDropdownId === catKey;

                if (hasDropdown) {
                  return (
                    <div
                      key={catKey}
                      className="baby-nav-dropdown-wrapper position-relative"
                      onMouseEnter={() => setOpenDropdownId(catKey)}
                      onMouseLeave={() => setOpenDropdownId(null)}
                      style={{ display: 'inline-flex', alignItems: 'center' }}
                    >
                      <a
                        href={`#${cat.slug}`}
                        onClick={(e) => scrollToSection(e, cat.slug)}
                        className="hexashop-nav-item baby-nav-dropdown-trigger d-inline-flex align-items-center gap-1"
                        style={{ cursor: 'pointer' }}
                      >
                        <span>{cat.name}</span>
                        <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }} />
                      </a>
                      {isOpen && (
                        <div
                          className="baby-nav-dropdown-menu shadow-lg rounded-3 py-2"
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            minWidth: '220px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #FCD4E1',
                            boxShadow: '0 12px 30px rgba(212, 93, 126, 0.15)',
                            zIndex: 1050,
                            display: 'flex',
                            flexDirection: 'column',
                          }}
                        >
                          <div className="px-3 py-1 text-uppercase fw-bold" style={{ fontSize: '0.68rem', color: '#D45D7E', letterSpacing: '1px', borderBottom: '1px solid #FFF0F5' }}>
                            {cat.name} Essentials
                          </div>
                          {dropdownItems.map((item) => (
                            <a
                              key={item}
                              href={`#${cat.slug}`}
                              onClick={(e) => {
                                setOpenDropdownId(null);
                                scrollToSection(e, cat.slug);
                              }}
                              className="baby-dropdown-item px-3 py-2 text-decoration-none"
                              style={{
                                color: '#542337',
                                fontSize: '0.88rem',
                                fontWeight: 500,
                                transition: 'all 0.15s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#FFF0F5';
                                e.currentTarget.style.color = '#D45D7E';
                                e.currentTarget.style.paddingLeft = '18px';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#542337';
                                e.currentTarget.style.paddingLeft = '16px';
                              }}
                            >
                              <span>{item}</span>
                              <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>›</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <a
                    key={catKey}
                    href={`#${cat.slug}`}
                    onClick={(e) => scrollToSection(e, cat.slug)}
                    className="hexashop-nav-item"
                  >
                    {cat.name}
                  </a>
                );
              })}
            </nav>







            <div className="hexashop-nav-actions">



              {theme !== 'theme-baby' && (

                <a



                href="#shop"



                onClick={(e) => {



                  e.preventDefault();



                  scrollToSection(e, 'shop');



                }}



                className="hexashop-icon-btn text-decoration-none"



                title="Search"



              >



                <Search size={20} />



              </a>

              )}



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







              <Link to={{ pathname: `${basePath}/wishlist`, search: location.search }} className="hexashop-icon-btn text-decoration-none">



                <Heart size={20} />



              </Link>



              <Link to={{ pathname: `${basePath}/orders`, search: location.search }} className="hexashop-icon-btn text-decoration-none d-none d-md-block" title="Orders">



                <Package size={20} />



              </Link>



              <Link to={{ pathname: `${basePath}/cart`, search: location.search }} className="hexashop-icon-btn text-decoration-none position-relative">



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



                  {theme === 'theme-coconut' ? (



                    <img 



                      src="/images/amiora-logo.png" 



                      alt={storeData?.name || "AMIORA"} 



                      style={{ height: '36px', maxWidth: '160px', width: 'auto', objectFit: 'contain' }} 



                    />



                  ) : theme === 'theme-baby' ? (



                    <div className="d-flex align-items-center gap-2">



                      <img 



                        src={storeData?.logo_url || storeData?.logo || "/images/an-nafi-logo.png"} 



                        alt={storeData?.name || "AN' NAFI Baby shop"} 



                        style={{ height: '40px', maxWidth: '48px', width: 'auto', objectFit: 'contain' }} 



                      />



                      <div className="d-flex flex-column text-start">



                        <span className="fw-bold" style={{ fontSize: '1.05rem', color: '#2D2A26', lineHeight: 1.15 }}>



                          {storeData?.name?.toLowerCase() === 'an nafi' ? "AN' NAFI" : (storeData?.name || "AN' NAFI")}



                        </span>



                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#C9933B', textTransform: 'uppercase', letterSpacing: '1.2px', marginTop: '2px' }}>



                          Baby shop



                        </span>



                      </div>



                    </div>



                  ) : (



                    <span className="fw-bold fs-5">{storeData?.name || 'Menu'}</span>



                  )}



                  <button className="btn p-0 border-0" onClick={() => setIsCategoryOpen(false)}>



                    <X size={24} />



                  </button>



                </div>



                <div className="storefront-mobile-menu-body">



                  <Link



                    to={{ pathname: basePath, search: location.search }}



                    className="storefront-mobile-nav-item"



                    onClick={() => setIsCategoryOpen(false)}



                  >



                    Home



                  </Link>



                  <div className="storefront-mobile-nav-title mt-4 mb-2 text-muted fw-bold" style={{ fontSize: '12px', paddingLeft: '15px' }}>



                    CATEGORIES



                  </div>



                  {activeCategories && activeCategories.map(cat => {
                    const catKey = String(cat.id || cat.slug || cat.name);
                    const dropdownItems = getCategoryDropdownItems(cat);
                    const hasDropdown = dropdownItems && dropdownItems.length > 0;
                    const isOpen = Boolean(openMobileDropdownIds[catKey]);

                    if (hasDropdown) {
                      return (
                        <div key={catKey} className="mobile-baby-accordion-item">
                          <div className="d-flex align-items-center justify-content-between storefront-mobile-nav-item">
                            <a
                              href={`#${cat.slug}`}
                              onClick={(e) => {
                                setIsCategoryOpen(false);
                                scrollToSection(e, cat.slug);
                              }}
                              className="text-decoration-none text-dark flex-grow-1"
                            >
                              {cat.name}
                            </a>
                            <button
                              type="button"
                              onClick={() => setOpenMobileDropdownIds(prev => ({ ...prev, [catKey]: !prev[catKey] }))}
                              className="btn btn-sm btn-link p-0 text-muted"
                              style={{ color: '#D45D7E' }}
                            >
                              <ChevronDown size={18} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                            </button>
                          </div>
                          {isOpen && (
                            <div className="ps-3 py-1 border-start ms-3 mb-2" style={{ borderColor: '#FCD4E1' }}>
                              {dropdownItems.map((item) => (
                                <a
                                  key={item}
                                  href={`#${cat.slug}`}
                                  onClick={(e) => {
                                    setIsCategoryOpen(false);
                                    scrollToSection(e, cat.slug);
                                  }}
                                  className="d-block py-1 text-decoration-none"
                                  style={{ color: '#542337', fontSize: '0.85rem' }}
                                >
                                  {item}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }
                    return (
                      <a
                        key={catKey}
                        href={`#${cat.slug}`}
                        onClick={(e) => {
                          setIsCategoryOpen(false);
                          scrollToSection(e, cat.slug);
                        }}
                        className="storefront-mobile-nav-item"
                      >
                        {cat.name}
                      </a>
                    );
                  })}







                  <div className="storefront-mobile-nav-title mt-4 mb-2 text-muted fw-bold" style={{ fontSize: '12px', paddingLeft: '15px' }}>



                    ACCOUNT



                  </div>



                  {user && user.id ? (



                    <>



                      <div className="storefront-mobile-nav-item text-primary" style={{ borderBottom: 'none' }}>



                        Hi, {user.name}



                      </div>



                      <Link to={{ pathname: `${basePath}/orders`, search: location.search }} className="storefront-mobile-nav-item" onClick={() => setIsCategoryOpen(false)}>



                        <Package size={16} className="me-2" /> My Orders



                      </Link>



                      <Link to={{ pathname: `${basePath}/wishlist`, search: location.search }} className="storefront-mobile-nav-item" onClick={() => setIsCategoryOpen(false)}>



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







      {theme !== 'theme-baby' && (



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



      )}



    </div>



  );



}



