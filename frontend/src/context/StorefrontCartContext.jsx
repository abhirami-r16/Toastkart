import React, { createContext, useContext, useState, useEffect } from 'react';

const StorefrontCartContext = createContext();

export const useStorefrontCart = () => useContext(StorefrontCartContext);

export const StorefrontCartProvider = ({ children, storeId }) => {
  const cartKey = `toastkart_cart_${storeId || 'default'}`;
  const wishlistKey = `toastkart_wishlist_${storeId || 'default'}`;

  const [cartItems, setCartItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const stripLargeImages = (items) => {
    return items.map(item => {
      if (item.image && typeof item.image === 'string' && item.image.startsWith('data:image/') && item.image.length > 50000) {
        return { ...item, image: '' };
      }
      return item;
    });
  };

  // Load from local storage on mount or when storeId changes
  useEffect(() => {
    if (storeId) {
      try {
        const savedCart = localStorage.getItem(cartKey);
        if (savedCart) setCartItems(JSON.parse(savedCart));

        const savedWishlist = localStorage.getItem(wishlistKey);
        if (savedWishlist) setWishlistItems(JSON.parse(savedWishlist));
      } catch (e) {
        console.error('Error parsing cart data', e);
      }
      setIsLoaded(true);
    }
  }, [storeId, cartKey, wishlistKey]);

  // Save to local storage whenever cart or wishlist changes
  useEffect(() => {
    if (isLoaded && storeId) {
      try {
        localStorage.setItem(cartKey, JSON.stringify(stripLargeImages(cartItems)));
      } catch (e) {
        console.error('Error saving cart data', e);
        if (e.name === 'QuotaExceededError') {
          alert('Local storage is full. Cart item cannot be saved. Please remove some items.');
        }
      }
    }
  }, [cartItems, storeId, cartKey, isLoaded]);

  useEffect(() => {
    if (isLoaded && storeId) {
      try {
        localStorage.setItem(wishlistKey, JSON.stringify(stripLargeImages(wishlistItems)));
      } catch (e) {
        console.error('Error saving wishlist data', e);
        if (e.name === 'QuotaExceededError') {
          alert('Local storage is full. Wishlist item cannot be saved. Please remove some items.');
        }
      }
    }
  }, [wishlistItems, storeId, wishlistKey, isLoaded]);

  const addToCart = (product, quantity = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => String(item.id) === String(product.id));
      if (existing) {
        return prev.map(item =>
          String(item.id) === String(product.id) ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => String(item.id) !== String(productId)));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prev =>
      prev.map(item => (String(item.id) === String(productId) ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const toggleWishlist = (product) => {
    setWishlistItems(prev => {
      const exists = prev.some(item => String(item.id) === String(product.id));
      if (exists) {
        return prev.filter(item => String(item.id) !== String(product.id));
      }
      return [...prev, product];
    });
  };

  const isInWishlist = (productId) => {
    return wishlistItems.some(item => String(item.id) === String(productId));
  };

  const cartTotal = cartItems.reduce((total, item) => {
    const priceStr = String(item.price || '0').replace(/[^0-9.]/g, '');
    const price = parseFloat(priceStr) || 0;
    return total + price * item.quantity;
  }, 0);

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <StorefrontCartContext.Provider
      value={{
        cartItems,
        wishlistItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleWishlist,
        isInWishlist,
        cartTotal,
        cartCount,
        storeId
      }}
    >
      {children}
    </StorefrontCartContext.Provider>
  );
};
