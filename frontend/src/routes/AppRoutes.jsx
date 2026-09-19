import React, { Suspense } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
} from 'react-router-dom';

import { AuthProvider, useAuth } from '../context/AuthContext';
import { StoreProvider } from '../context/StoreContext';
import { CartProvider } from '../context/CartContext';

const Home = React.lazy(() => import('../pages/Home'));
const Portfolio = React.lazy(() => import('../pages/Portfolio'));
const Login = React.lazy(() => import('../pages/Login'));
const Register = React.lazy(() => import('../pages/Register'));
const StoreOwnerDashboard = React.lazy(() => import('../pages/store-owner-dashboard'));
const CustomerDashboard = React.lazy(() => import('../pages/customer-dashboard'));
const AdminDashboard = React.lazy(() => import('../pages/admin-dashboard'));
const PlanSelection = React.lazy(() => import('../pages/PlanSelection'));
const AdminLayout = React.lazy(() => import('../layouts/AdminLayout'));
const StoresPage = React.lazy(() => import('../pages/Stores'));
const CategoriesPage = React.lazy(() => import('../pages/Categories'));
const ProductsPage = React.lazy(() => import('../pages/Products'));
const ProductDetailPage = React.lazy(() => import('../pages/ProductDetail'));
const InventoryPage = React.lazy(() => import('../pages/Inventory'));
const CustomersPage = React.lazy(() => import('../pages/Customers'));
const CartPage = React.lazy(() => import('../pages/Cart'));
const OrdersPage = React.lazy(() => import('../pages/Orders'));
const SettingsPage = React.lazy(() => import('../pages/Settings'));

const StorefrontApp = React.lazy(() => import('../pages/Storefront/StorefrontApp'));
const PortfolioBuilder = React.lazy(() => import('../pages/PortfolioBuilder'));
const PortfolioView = React.lazy(() => import('../pages/PortfolioView'));
const WhatsappWidget = React.lazy(() => import('../components/WhatsappWidget'));

const getSubdomain = () => {
  const host = window.location.hostname;
  const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(host);

  // Main platform domains
  const mainDomains = [
    'localhost',
    'toastkart.com',
    'www.toastkart.com',
  ];

  if (isIp || mainDomains.includes(host)) {
    return null;
  }

  const parts = host.split('.');

  if (parts.length >= 2 && parts[0] !== 'www') {
    return parts[0];
  }

  return null;
};

const StorefrontWrapper = () => {
  const { slug } = useParams();

  return <StorefrontApp subdomain={slug || 'demo'} />;
};

function AppRoutes() {
  const subdomain = getSubdomain();

  // Detect Android app
  const isAndroidApp = Capacitor.getPlatform() === 'android';

  // Clean up massive base64 images to prevent QuotaExceededError
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('aureum_owner_products');

      if (saved) {
        let products = JSON.parse(saved);
        let changed = false;

        products = products.map((p) => {
          if (
            p.image &&
            typeof p.image === 'string' &&
            p.image.startsWith('data:image/') &&
            p.image.length > 50000
          ) {
            changed = true;

            return {
              ...p,
              image: '',
            };
          }

          return p;
        });

        if (changed) {
          localStorage.setItem(
            'aureum_owner_products',
            JSON.stringify(products)
          );

          console.log(
            'Cleaned up massive base64 images from local storage to free quota.'
          );
        }
      }
    } catch (e) {
      console.error('Failed to clean up localStorage', e);
    }
  }, []);

  // Store subdomain / storefront
  if (subdomain) {
    return (
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>}>
            <StorefrontApp subdomain={subdomain} />
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    );
  }

  // Main application
  // AuthProvider must be ABOVE StoreProvider because
  // StoreContext uses useAuth().
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

              {/* Storefront Pages explicitly placed OUTSIDE StoreProvider to prevent duplicate stores request */}
              <Route
                path="/store/:slug/*"
                element={<StorefrontWrapper />}
              />
              <Route
                path="/storefront/*"
                element={<StorefrontWrapper />}
              />
              <Route path="*" element={
                <StoreProvider>
                  <CartProvider>
                    <Suspense fallback={<div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>}>
                      <Routes>

                      {/* Portal Landing Page */}
              <Route
                path="/"
                element={
                  isAndroidApp ? (
                    <Navigate to="/login" replace />
                  ) : (
                    <Home />
                  )
                }
              />

              <Route path="/portfolio" element={<Portfolio />} />

              <Route path="/portal" element={<Home />} />

              <Route path="/landing" element={<Home />} />

              {/* Storefront Pages moved above StoreProvider */}

              {/* Portfolio Pages */}
              <Route
                path="/portfolio-builder"
                element={<PortfolioBuilder />}
              />

              <Route
                path="/portfolio/:slug"
                element={<PortfolioView />}
              />

              {/* Subscription Plans Route */}
              <Route
                path="/plans"
                element={<PlanSelection />}
              />

              {/* Authentication Routes */}
              <Route
                path="/login"
                element={<Login />}
              />

              <Route
                path="/register"
                element={<Register />}
              />

              {/* Dashboard Routes */}
              <Route
                path="/dashboard"
                element={<StoreOwnerDashboard />}
              />

              <Route
                path="/owner"
                element={
                  <Navigate
                    to="/owner/dashboard"
                    replace
                  />
                }
              />

              <Route
                path="/owner/dashboard"
                element={<StoreOwnerDashboard />}
              />

              <Route
                path="/owner/dashboard/*"
                element={<StoreOwnerDashboard />}
              />

              <Route
                path="/store-owner"
                element={<StoreOwnerDashboard />}
              />

              <Route
                path="/store-owner-dashboard"
                element={<StoreOwnerDashboard />}
              />

              <Route
                path="/merchant/dashboard"
                element={<StoreOwnerDashboard />}
              />

              <Route
                path="/admin/dashboard"
                element={<AdminDashboard />}
              />

              <Route
                path="/customer-dashboard"
                element={<CustomerDashboard />}
              />

              <Route
                path="/customer/dashboard"
                element={<CustomerDashboard />}
              />

              {/* Merchant Admin Sub-pages */}
              <Route element={<AdminLayout />}>

                <Route
                  path="/stores"
                  element={<StoresPage />}
                />

                <Route
                  path="/owner/stores"
                  element={<StoresPage />}
                />

                <Route
                  path="/categories"
                  element={<CategoriesPage />}
                />

                <Route
                  path="/products"
                  element={<ProductsPage />}
                />

                <Route
                  path="/products/:id"
                  element={<ProductDetailPage />}
                />

                <Route
                  path="/inventory"
                  element={<InventoryPage />}
                />

                <Route
                  path="/customers"
                  element={<CustomersPage />}
                />

                <Route
                  path="/cart"
                  element={<CartPage />}
                />

                <Route
                  path="/orders"
                  element={<OrdersPage />}
                />

                <Route
                  path="/settings"
                  element={<SettingsPage />}
                />

              </Route>

              {/* Fallback */}
              <Route
                path="*"
                element={<Navigate to="/" replace />}
              />

                      </Routes>
                    </Suspense>
                  </CartProvider>
                </StoreProvider>
              } />
            </Routes>
        </AuthProvider>

      <React.Suspense fallback={null}>
        <WhatsappWidget />
      </React.Suspense>

    </BrowserRouter>
  );
}

export default AppRoutes;