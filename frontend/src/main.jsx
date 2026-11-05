import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";

const getSubdomain = () => {
  const host = window.location.hostname.toLowerCase();
  const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
  const mainDomains = ['localhost', 'toastkart.com', 'www.toastkart.com', '127.0.0.1'];
  if (isIp || mainDomains.includes(host)) return null;
  const parts = host.split('.');
  if (parts.length >= 2) {
    if (parts[0] === 'www' && parts.length >= 3) {
      if (parts[1] === 'toastkart') return null;
      return parts[1];
    }
    if (parts[0] !== 'www') return parts[0];
  }
  return null;
};

const subdomain = getSubdomain();

// Immediate favicon & title update for Amiora storefront
const currentHost = window.location.hostname.toLowerCase();
const currentPath = window.location.pathname.toLowerCase();
const isAmioraSite =
  currentHost.includes('amiora') ||
  currentHost.includes('cocoa') ||
  currentPath.includes('/store/amiora') ||
  currentPath.includes('/store/cocoamiora') ||
  (subdomain && (subdomain.includes('amiora') || subdomain.includes('cocoa')));

const isNafiSite =
  currentPath.includes('/store/an-nafi') ||
  currentPath.includes('/store/nafi') ||
  (subdomain && subdomain.includes('nafi'));

if (isNafiSite) {
  const icon = document.querySelector("link[rel*='icon']");
  if (icon) icon.href = '/images/an-nafi-logo.png';
  const dynFav = document.getElementById('dynamic-favicon');
  if (dynFav) dynFav.href = '/images/an-nafi-logo.png';
  const appleIcon = document.querySelector("link[rel='apple-touch-icon']");
  if (appleIcon) appleIcon.href = '/images/an-nafi-logo.png';
  document.title = "AN' NAFI Baby Shop";
}

if (isAmioraSite) {
  const icon = document.querySelector("link[rel*='icon']");
  if (icon) icon.href = '/images/amiora-favicon.png';
  const appleIcon = document.querySelector("link[rel='apple-touch-icon']");
  if (appleIcon) appleIcon.href = '/images/amiora-favicon-badge.png';
  document.title = 'AMIORA';
}

import { GoogleOAuthProvider } from "@react-oauth/google";

if (subdomain) {
  // Storefront visitors NEVER load AppRoutes or AuthContext!
  const StorefrontApp = React.lazy(() => import('./pages/Storefront/StorefrontApp'));
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <BrowserRouter>
        <Suspense fallback={<div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>}>
          <StorefrontApp subdomain={subdomain} />
        </Suspense>
      </BrowserRouter>
    </React.StrictMode>
  );
} else {
  // Dashboard / Portal visitors
  const AppRoutes = React.lazy(() => import("./routes/AppRoutes"));
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <Suspense fallback={<div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>}>
          <AppRoutes />
        </Suspense>
      </GoogleOAuthProvider>
    </React.StrictMode>
  );
}