import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';

import { AuthProvider, useAuth } from '../context/AuthContext';
import { StoreProvider } from '../context/StoreContext';
import { CartProvider } from '../context/CartContext';

import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import StoreOwnerDashboard from '../pages/store-owner-dashboard';
import CustomerDashboard from '../pages/customer-dashboard';
import AdminDashboard from '../pages/admin-dashboard';
import AdminLayout from '../layouts/AdminLayout';
import StoresPage from '../pages/Stores';
import CategoriesPage from '../pages/Categories';
import ProductsPage from '../pages/Products';
import ProductDetailPage from '../pages/ProductDetail';
import InventoryPage from '../pages/Inventory';
import CustomersPage from '../pages/Customers';
import CartPage from '../pages/Cart';
import OrdersPage from '../pages/Orders';
import SettingsPage from '../pages/Settings';

import StorefrontApp from '../pages/Storefront/StorefrontApp';
import PortfolioBuilder from '../pages/PortfolioBuilder';
import PortfolioView from '../pages/PortfolioView';

const getSubdomain = () => {
  const host = window.location.hostname;
  const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
  
  // Define your main platform domains here (where the Aureum landing page should show)
  const mainDomains = [
  'localhost',
  'toastkart.com',
  'www.toastkart.com'
  ];

  if (isIp || mainDomains.includes(host)) {
    return null; // Not a store subdomain, show the main landing page
  }

  const parts = host.split('.');
  if (parts.length >= 2 && parts[0] !== 'www') {
    return parts[0]; // Extract 'mystore' from 'mystore.domain.com'
  }
  return null;
};

const StorefrontWrapper = () => {
  const { slug } = useParams();
  return <StorefrontApp subdomain={slug || 'demo'} />;
};

function AppRoutes() {
  const subdomain = getSubdomain();

  // Clean up massive base64 images to prevent QuotaExceededError
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('aureum_owner_products');
      if (saved) {
        let products = JSON.parse(saved);
        let changed = false;
        products = products.map(p => {
          if (p.image && typeof p.image === 'string' && p.image.startsWith('data:image/') && p.image.length > 50000) {
            changed = true;
            return { ...p, image: '' };
          }
          return p;
        });
        if (changed) {
          localStorage.setItem('aureum_owner_products', JSON.stringify(products));
          console.log('Cleaned up massive base64 images from local storage to free quota.');
        }
      }
    } catch (e) {
      console.error('Failed to clean up localStorage', e);
    }
  }, []);

  if (subdomain) {
    return (
      <BrowserRouter>
        <AuthProvider>
          <StorefrontApp subdomain={subdomain} />
        </AuthProvider>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <StoreProvider>
        <CartProvider>
          <AuthProvider>
            <Routes>
              {/* Portal Landing Page (Aureum) as Main Root "/" */}
              <Route path="/" element={<Home />} />
              <Route path="/portal" element={<Home />} />
              <Route path="/landing" element={<Home />} />

              {/* Storefront Pages */}
              <Route path="/storefront/*" element={<StorefrontWrapper />} />
              <Route path="/store/:slug/*" element={<StorefrontWrapper />} />
              
              {/* Portfolio Pages */}
              <Route path="/portfolio-builder" element={<PortfolioBuilder />} />
              <Route path="/portfolio/:slug" element={<PortfolioView />} />

              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Standalone Dashboard Routes */}
              <Route path="/dashboard" element={<StoreOwnerDashboard />} />
              <Route path="/owner" element={<Navigate to="/owner/dashboard" replace />} />
              <Route path="/owner/dashboard" element={<StoreOwnerDashboard />} />
              <Route path="/owner/dashboard/*" element={<StoreOwnerDashboard />} />
              <Route path="/store-owner" element={<StoreOwnerDashboard />} />
              <Route path="/store-owner-dashboard" element={<StoreOwnerDashboard />} />
              <Route path="/merchant/dashboard" element={<StoreOwnerDashboard />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/customer-dashboard" element={<CustomerDashboard />} />
              <Route path="/customer/dashboard" element={<CustomerDashboard />} />

              {/* Merchant Admin Sub-pages */}
              <Route element={<AdminLayout />}>
                <Route path="/stores" element={<StoresPage />} />
                <Route path="/owner/stores" element={<StoresPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/:id" element={<ProductDetailPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </CartProvider>
      </StoreProvider>
    </BrowserRouter>
  );
}

export default AppRoutes;