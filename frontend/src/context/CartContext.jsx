import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { useStore } from './StoreContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { activeStore } = useStore();
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('toastkart_cart_items');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((item, index) => ({
        ...item,
        id: item.id || `cart_${index + 1}`,
        product_id: item.product_id ?? item.product?.backend_id ?? item.product?.id ?? null,
        product_backend_id: item.product_backend_id ?? item.product?.backend_id ?? item.product?.id ?? null,
        product: item.product || item,
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || Number(item.product?.price) || 0,
        store_id: item.store_id ?? item.product?.store_id ?? item.product?.store?.id ?? null,
        store_name: item.store_name ?? item.product?.store_name ?? item.product?.store?.name ?? null,
      }));
    } catch (error) {
      console.debug('Failed to restore cart items', error);
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('toastkart_cart_items', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    setCartItems(prev => {
      const hasBackendId = Boolean(product?.backend_id ?? product?.product_id ?? (product?.source === 'api' ? product?.id : null));
      const source = product?.source || (hasBackendId ? 'api' : 'local');
      const normalizedProduct = {
        ...product,
        id: product?.backend_id ?? product?.id ?? product?.product_id ?? null,
        backend_id: product?.backend_id ?? (product?.source === 'api' ? product?.id : null) ?? null,
        product_id: product?.backend_id ?? (product?.source === 'api' ? product?.id : null) ?? null,
        source,
        localOnly: product?.localOnly ?? (source !== 'api' && source !== 'backend' && !hasBackendId),
        price: Number(product?.price ?? product?.product?.price ?? 0),
        stock_quantity: Number(product?.stock_quantity ?? product?.stock ?? product?.product?.stock_quantity ?? 999),
      };

      const productId = normalizedProduct.backend_id ?? normalizedProduct.id;
      // Allow display‑only products to be added to the cart. The alert is kept for user awareness but the product will still be added.
      if (normalizedProduct.localOnly && !normalizedProduct.backend_id) {
        alert('This product is for display only and cannot be purchased at this time.');
        // Continue to add the product using its local ID.
      }
      const existing = prev.find(item =>
        item.product_id === productId ||
        item.product_backend_id === normalizedProduct.backend_id ||
        item.product?.backend_id === normalizedProduct.backend_id ||
        item.product?.id === productId ||
        item.product?.product_id === productId
      );
      if (existing) {
        const newQty = existing.quantity + quantity;
        if (normalizedProduct.stock_quantity < newQty) {
          alert(`Only ${normalizedProduct.stock_quantity} items in stock for ${normalizedProduct.name}`);
          return prev;
        }
        return prev.map(item =>
          (item.product_id === productId || item.product_backend_id === normalizedProduct.backend_id || item.product?.backend_id === normalizedProduct.backend_id || item.product?.id === productId || item.product?.product_id === productId)
            ? { ...item, quantity: newQty, product: { ...(item.product || {}), ...normalizedProduct }, price: Number(normalizedProduct.price) || Number(item.price) || 0 }
            : item
        );
      } else {
        if (normalizedProduct.stock_quantity < quantity) {
          alert(`Only ${normalizedProduct.stock_quantity} items in stock for ${normalizedProduct.name}`);
          return prev;
        }
        return [
          ...prev,
          {
            id: 'cart_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
            product_id: productId,
            product_backend_id: normalizedProduct.backend_id ?? null,
            product: normalizedProduct,
            quantity: quantity,
            price: Number(normalizedProduct.price) || 0,
            store_id: normalizedProduct.store_id || normalizedProduct.store?.id || null,
            store_name: normalizedProduct.store_name || normalizedProduct.store?.name || null,
          }
        ];
      }
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCartItems(prev => prev.map(item => {
      if (item.id === itemId) {
        if (item.product?.stock_quantity < quantity) {
          alert(`Only ${item.product.stock_quantity} available in stock.`);
          return item;
        }
        return { ...item, quantity };
      }
      return item;
    }));
  };

  const removeFromCart = (itemId) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartSubtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const placeOrder = async (customerData) => {
    if (cartItems.length === 0) {
      return { success: false, message: 'Your shopping cart is empty.' };
    }
    setLoading(true);
    try {
      const orderItems = cartItems
        .map(item => {
          const productId = item.product_backend_id || item.product_id || item.product?.backend_id || item.product?.product_id || item.product?.id;
          return productId ? { product_id: Number(productId), quantity: item.quantity } : null;
        })
        .filter(Boolean);

      if (orderItems.length === 0) {
        return { success: false, message: 'No purchasable items are available in your cart.' };
      }

      const orderPayload = {
        store_id: activeStore?.id || 1,
        customer_name: customerData.name,
        customer_email: customerData.email,
        customer_phone: customerData.phone,
        shipping_address: customerData.address,
        items: orderItems,
      };

      const res = await api.post('/orders', orderPayload);
      clearCart();
      setIsCartOpen(false);
      return { success: true, order: res.data };
    } catch (err) {
      console.debug('Order placement failed', err);
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to place order. Check stock availability.'
      };
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      cartSubtotal,
      totalCartCount,
      isCartOpen,
      setIsCartOpen,
      placeOrder,
      loading
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
