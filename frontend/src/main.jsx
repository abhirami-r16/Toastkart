import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";

const getSubdomain = () => {
  const host = window.location.hostname;
  const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
  const mainDomains = ['localhost', 'toastkart.com', 'www.toastkart.com'];
  if (isIp || mainDomains.includes(host)) return null;
  const parts = host.split('.');
  if (parts.length >= 2 && parts[0] !== 'www') return parts[0];
  return null;
};

const subdomain = getSubdomain();

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
      <Suspense fallback={<div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>}>
        <AppRoutes />
      </Suspense>
    </React.StrictMode>
  );
}