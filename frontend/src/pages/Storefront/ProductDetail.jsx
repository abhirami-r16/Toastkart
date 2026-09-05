import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, ArrowLeft, ArrowRight, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStorefrontCart } from '../../context/StorefrontCartContext';
import { useStorefrontAuth } from '../../context/StorefrontAuthContext';
import { normalizeProductImage } from '../../utils/imageUtils';

export default function ProductDetail({ storeData, products }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isInWishlist } = useStorefrontCart();
  const { requireAuth } = useStorefrontAuth();

  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  const product = products.find(p => String(p.id) === String(id) || String(p.backend_id) === String(id) || String(p.slug) === String(id));

  const getBasePath = () => {
    const p = window.location.pathname;
    if (p.startsWith('/store/')) return `/store/${p.split('/')[2]}`;
    return '/storefront';
  };
  const basePath = getBasePath();

  if (!product) {
    return (
      <div className="storefront-container py-5 text-center">
        <h2 className="fs-3 font-bold mb-3">Product not found</h2>
        <button className="btn btn-outline-secondary mt-3" onClick={() => navigate(basePath)}>
          Back to Store
        </button>
      </div>
    );
  }

  const categoryName = typeof product.category === 'object' ? product.category.name : product.category;
  const inWishlist = isInWishlist(product.id);

  // Size calculation
  const productSizes = product.size 
    ? String(product.size).toUpperCase().split(',').map(s => s.trim()).filter(Boolean) 
    : [];
  const standardSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const displaySizes = [...standardSizes];
  
  productSizes.forEach(sz => {
    if (!displaySizes.includes(sz)) {
      displaySizes.push(sz);
    }
  });

  // Set default size
  React.useEffect(() => {
    if (productSizes.length > 0 && !selectedSize) {
      setSelectedSize(productSizes[0]);
    }
  }, [productSizes, selectedSize]);

  // Color calculation
  const productColors = product.color 
    ? String(product.color).split(',').map(c => c.trim()).filter(Boolean)
    : [];

  const parsedImages = React.useMemo(() => {
    let imgs = [];
    if (typeof product.images === 'string') {
      try { imgs = JSON.parse(product.images); } catch(e) {}
    } else if (Array.isArray(product.images)) {
      imgs = product.images;
    }
    
    let normalizedImgs = imgs.map(img => typeof img === 'string' ? { url: img, color: '' } : img);
    
    const colors = product.color ? String(product.color).split(',').map(c => c.trim()).filter(Boolean) : [];
    
    if (colors.length > 0) {
      const finalImgs = [];
      colors.forEach(color => {
        const specificImg = normalizedImgs.find(img => img.color && img.color.toLowerCase() === color.toLowerCase());
        if (specificImg) {
          finalImgs.push(specificImg);
        } else {
          const baseImgUrl = normalizedImgs.length > 0 ? normalizedImgs[0].url : (product.image || product.image_url);
          finalImgs.push({ url: baseImgUrl, color: color });
        }
      });
      // Add any uncolored images
      normalizedImgs.forEach(img => {
        if (!img.color && !finalImgs.some(f => f.url === img.url)) {
          finalImgs.push(img);
        }
      });
      return finalImgs;
    }
    
    if (normalizedImgs.length === 0) {
      return [{ url: product.image || product.image_url, color: '' }];
    }
    
    return normalizedImgs;
  }, [product.images, product.color, product.image, product.image_url]);

  const [activeImage, setActiveImage] = React.useState('');
  const [isFading, setIsFading] = React.useState(false);

  const changeImageWithFade = (newUrl, newColorObj) => {
    if (normalizeProductImage(newUrl, product.name) === activeImage) return;
    setIsFading(true);
    setTimeout(() => {
      setActiveImage(normalizeProductImage(newUrl, product.name));
      if (newColorObj) {
        const match = productColors.find(c => c.toLowerCase().trim() === newColorObj.toLowerCase().trim());
        if (match) setSelectedColor(match);
      }
      setIsFading(false);
    }, 150);
  };

  React.useEffect(() => {
    setActiveImage(normalizeProductImage(parsedImages[0]?.url || product.image || product.image_url, product.name));
  }, [product.id, parsedImages, product.image, product.image_url, product.name]);

  // Set default color and handle image sync
  React.useEffect(() => {
    if (productColors.length > 0 && !selectedColor) {
      setSelectedColor(productColors[0]);
    }
    if (selectedColor && parsedImages.length > 0) {
      const match = parsedImages.find(img => img.color && img.color.toLowerCase().trim() === selectedColor.toLowerCase().trim());
      if (match) {
        setActiveImage(normalizeProductImage(match.url, product.name));
      }
    }
  }, [productColors, selectedColor, parsedImages, product.name]);

  const handleAddToCart = () => {
    requireAuth(() => addToCart({ ...product, selectedSize, selectedColor }, 1));
  };

  const handleBuyNow = () => {
    requireAuth(() => {
      addToCart({ ...product, selectedSize, selectedColor }, 1);
      navigate(`${basePath}/checkout`);
    });
  };

  const handleNextImage = () => {
    if (parsedImages.length <= 1) return;
    const currentIndex = parsedImages.findIndex(img => normalizeProductImage(img.url, product.name) === activeImage);
    const nextIndex = (currentIndex + 1) % parsedImages.length;
    const nextImg = parsedImages[nextIndex];
    changeImageWithFade(nextImg.url, nextImg.color);
  };

  const handlePrevImage = () => {
    if (parsedImages.length <= 1) return;
    const currentIndex = parsedImages.findIndex(img => normalizeProductImage(img.url, product.name) === activeImage);
    const prevIndex = (currentIndex - 1 + parsedImages.length) % parsedImages.length;
    const prevImg = parsedImages[prevIndex];
    changeImageWithFade(prevImg.url, prevImg.color);
  };

  return (
    <div className="storefront-container py-5">
      <button 
        className="btn btn-link text-decoration-none text-secondary mb-4 d-flex align-items-center gap-2 p-0"
        onClick={() => navigate(basePath)}
      >
        <ArrowLeft size={16} /> Back to Store
      </button>

      <div className="row g-5">
        <div className="col-md-6">
          <div className="product-image-container p-4 bg-white rounded-3 shadow-sm border border-light text-center h-100 d-flex flex-column align-items-center justify-content-center position-relative">
            {parsedImages.length > 1 && (
              <button 
                className="btn position-absolute start-0 top-50 translate-middle-y m-2 rounded-circle shadow-sm bg-white"
                style={{ width: '40px', height: '40px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, color: '#333' }}
                onClick={handlePrevImage}
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <img 
              src={activeImage} 
              alt={product.name} 
              className="img-fluid rounded" 
              style={{ maxHeight: '400px', objectFit: 'contain', transition: 'all 0.15s ease-in-out', opacity: isFading ? 0 : 1, transform: isFading ? 'scale(0.98)' : 'scale(1)' }}
            />
            {parsedImages.length > 1 && (
              <button 
                className="btn position-absolute end-0 top-50 translate-middle-y m-2 rounded-circle shadow-sm bg-white"
                style={{ width: '40px', height: '40px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, color: '#333' }}
                onClick={handleNextImage}
              >
                <ChevronRight size={20} />
              </button>
            )}
            {parsedImages.length > 0 && (
              <div className="d-flex flex-wrap gap-2 mt-4 justify-content-center w-100">
                {parsedImages.map((img, idx) => {
                  const imgUrl = normalizeProductImage(img.url, product.name);
                  return (
                    <div 
                      key={idx} 
                      className={`border rounded p-1 ${activeImage === imgUrl ? 'border-primary shadow-sm' : 'border-light opacity-75'}`}
                      style={{ width: '60px', height: '60px', cursor: 'pointer', transition: 'all 0.2s' }}
                      onClick={() => {
                        changeImageWithFade(img.url, img.color);
                      }}
                    >
                      <img src={imgUrl} alt="Thumbnail" className="w-100 h-100 rounded" style={{ objectFit: 'cover' }} />
                    </div>
                  );
                })}
              </div>
            )}
            <button 
              className="btn position-absolute top-0 end-0 m-3 rounded-circle shadow-sm bg-white"
              style={{ width: '40px', height: '40px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: inWishlist ? '#ff4757' : '#ced4da', zIndex: 10 }}
              onClick={() => requireAuth(() => toggleWishlist(product))}
            >
              <Heart size={20} fill={inWishlist ? '#ff4757' : 'none'} />
            </button>
          </div>
        </div>
        <div className="col-md-6">
          <div className="product-info-details">
            {categoryName && (
              <span className="text-uppercase text-muted fs-8 fw-bold mb-2 d-block tracking-wider">
                {categoryName}
              </span>
            )}
            <h1 className="display-6 fw-bold mb-3">{product.name}</h1>
            
            <div className="d-flex align-items-baseline gap-2 mb-4">
              {product.compare_price && Number(product.compare_price) > Number(product.price) ? (
                <>
                  <span className="fs-4 text-muted text-decoration-line-through">
                    ₹{Number(product.compare_price).toLocaleString('en-IN')}
                  </span>
                  <span className="fs-2 fw-bold text-dark">
                    ₹{Number(product.price).toLocaleString('en-IN')}
                  </span>
                  <span className="fs-5 fw-bold" style={{ color: '#388e3c' }}>
                    — {Math.round(((Number(product.compare_price) - Number(product.price)) / Number(product.compare_price)) * 100)}% OFF
                  </span>
                </>
              ) : (
                <span className="fs-2 fw-bold text-dark">
                  ₹{Number(product.price).toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {(() => {
              const desc = product.description || 'This premium product is part of our exclusive collection. Crafted with the finest materials and designed to exceed your expectations. Experience the perfect blend of style and functionality.';
              // Split by bullet characters or newlines
              const lines = desc.split(/•|\n/).map(line => line.trim()).filter(line => line.length > 0);
              
              if (lines.length > 1) {
                return (
                  <ul className="text-secondary fs-6 mb-4 lh-lg ps-4" style={{ listStyleType: 'disc' }}>
                    {lines.map((line, idx) => (
                      <li key={idx} className="mb-2">{line}</li>
                    ))}
                  </ul>
                );
              }
              
              return (
                <p className="text-secondary fs-6 mb-4 lh-lg">
                  {desc}
                </p>
              );
            })()}

            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-bold fs-6">Select Size</span>
                <span className="text-primary fs-8 cursor-pointer text-decoration-underline">Size Guide</span>
              </div>
              <div className="d-flex flex-wrap gap-2">
                {displaySizes.map((sz, idx) => {
                  const isAvailable = productSizes.includes(sz);
                  const isSelected = selectedSize === sz;
                  return (
                    <button
                      key={idx}
                      className={`btn border fw-bold d-flex align-items-center justify-content-center ${isSelected ? 'border-dark bg-dark text-white' : 'bg-white text-dark'} ${!isAvailable ? 'opacity-50 text-decoration-line-through' : ''}`}
                      style={{ width: '48px', height: '48px', borderRadius: '8px' }}
                      disabled={!isAvailable}
                      onClick={() => setSelectedSize(sz)}
                      title={!isAvailable ? 'Out of stock' : 'In stock'}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>

            {productColors.length > 0 && (
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-bold fs-6">Select Color</span>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {productColors.map((color, idx) => {
                    const isSelected = selectedColor === color;
                    return (
                      <button
                        key={idx}
                        className={`btn border fw-semibold d-flex align-items-center justify-content-center px-4 py-1 text-capitalize ${isSelected ? 'border-dark bg-dark text-white' : 'bg-white text-dark'}`}
                        style={{ borderRadius: '8px' }}
                        onClick={() => setSelectedColor(color)}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="d-flex flex-column gap-3 mb-5">
              <div className="d-flex flex-column flex-sm-row gap-3">
                <button 
                  className="btn btn-lg fw-bold d-flex align-items-center justify-content-center gap-2 flex-grow-1 py-3"
                  style={{ backgroundColor: '#ff9f00', color: '#fff', border: 'none', borderRadius: '8px' }}
                  onClick={handleAddToCart}
                >
                  <ShoppingCart size={20} /> Add to Cart
                </button>
                <button 
                  className="btn btn-lg fw-bold d-flex align-items-center justify-content-center gap-2 flex-grow-1 py-3"
                  style={{ backgroundColor: '#fb641b', color: '#fff', border: 'none', borderRadius: '8px' }}
                  onClick={handleBuyNow}
                >
                  <Zap size={20} /> Buy Now
                </button>
              </div>
            </div>

            <div className="border-top pt-4">
              <div className="d-flex flex-column gap-2 text-muted fs-7">
                <div className="d-flex gap-2">
                  <strong>Availability:</strong> 
                  <span className={product.stock > 0 || product.stock_quantity > 0 ? 'text-success' : 'text-danger'}>
                    {product.stock > 0 || product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
                {product.brand && (
                  <div className="d-flex gap-2">
                    <strong>Brand:</strong> {product.brand}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
