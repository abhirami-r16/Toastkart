import React, { useState, useEffect, useEffectEvent, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import MeeshoConnectionCard from './MeeshoConnectionCard';
import MeeshoProductSearchImport from './MeeshoProductSearchImport';
import ResellingProductTable from './ResellingProductTable';
import ProfitCalculator from './ProfitCalculator';
import ResellingOrders from './ResellingOrders';
import SyncHistory from './SyncHistory';

export default function MeeshoDropshippingView({ activeStore, onGoToProducts }) {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog', 'my-products', 'orders', 'calculator', 'logs'
  const [loading, setLoading] = useState(false);
  const [testingReefApi, setTestingReefApi] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [requestError, setRequestError] = useState(null);
  const sessionExpiredHandled = useRef(false);
  const refreshingStoreId = useRef(null);

  const [statusData, setStatusData] = useState(null);
  const [resellingProducts, setResellingProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [logs, setLogs] = useState([]);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleApiError = (err, fallback) => {
    const status = err.response?.status;
    const responseMessage = err.response?.data?.message;
    if (import.meta.env.DEV) {
      console.warn('[Meesho] Request failed:', { status: status || 'network error', message: responseMessage });
    }

    if (status === 401) {
      setRequestError({ type: 'auth', message: 'Your session has expired. Sign in again to continue.' });
      if (!sessionExpiredHandled.current) {
        sessionExpiredHandled.current = true;
        logout();
      }
      return 'Your session has expired. Sign in again to continue.';
    }
    if (status === 403) {
      const message = 'You do not have access to this store or Meesho workspace.';
      setRequestError({ type: 'forbidden', message });
      return message;
    }
    if (status >= 500) {
      const message = responseMessage || 'The Meesho service is temporarily unavailable. Please try again.';
      setRequestError({ type: 'error', message });
      return message;
    }

    let message = responseMessage || fallback;
    if (status === 422 && err.response?.data?.errors) {
      const errorList = Object.values(err.response.data.errors).flat();
      if (errorList.length > 0) {
        message = errorList.join(' ');
      }
    }
    setRequestError({ type: 'error', message });
    return message;
  };

  const loadStatus = async () => {
    try {
      const res = await api.get('/meesho/status', {
        headers: activeStore?.id ? { 'X-Store-Id': activeStore.id } : {},
      });
      setStatusData(res.data);
      return true;
    } catch (err) {
      handleApiError(err, 'Failed to load Meesho status.');
      return false;
    }
  };

  const loadResellingProducts = async () => {
    try {
      const res = await api.get('/meesho/products', {
        headers: activeStore?.id ? { 'X-Store-Id': activeStore.id } : {},
      });
      setResellingProducts(res.data || []);
    } catch (err) {
      handleApiError(err, 'Failed to load reselling products.');
    }
  };

  const loadOrders = async () => {
    try {
      const res = await api.get('/meesho/orders', {
        headers: activeStore?.id ? { 'X-Store-Id': activeStore.id } : {},
      });
      setOrders(res.data || []);
    } catch (err) {
      handleApiError(err, 'Failed to load reselling orders.');
    }
  };

  const loadLogs = async () => {
    try {
      const res = await api.get('/meesho/logs', {
        headers: activeStore?.id ? { 'X-Store-Id': activeStore.id } : {},
      });
      setLogs(res.data || []);
    } catch (err) {
      handleApiError(err, 'Failed to load sync history.');
    }
  };

  const refreshAll = async () => {
    if (authLoading) return;
    if (!user || !localStorage.getItem('toastkart_token')) {
      setRequestError({ type: 'auth', message: 'Sign in to access Meesho dropshipping.' });
      return;
    }
    if (!activeStore?.id) {
      setRequestError({ type: 'store', message: 'Select an authorized store to load Meesho data.' });
      return;
    }
    if (refreshingStoreId.current === String(activeStore.id)) return;

    refreshingStoreId.current = String(activeStore.id);
    setLoading(true);
    setRequestError(null);
    try {
      if (!await loadStatus()) return;
      await Promise.allSettled([loadResellingProducts(), loadOrders(), loadLogs()]);
    } finally {
      refreshingStoreId.current = null;
      setLoading(false);
    }
  };

  const refreshAllOnChange = useEffectEvent(() => refreshAll());

  useEffect(() => {
    if (!authLoading) refreshAllOnChange();
  }, [activeStore?.id, authLoading, user?.id]);

  const handleConnect = async (formData) => {
    setLoading(true);
    try {
      const res = await api.post('/meesho/connect', formData, {
        headers: activeStore?.id ? { 'X-Store-Id': activeStore.id } : {},
      });
      showToast(res.data.message || 'Connected successfully!');
      refreshAll();
    } catch (err) {
      showToast(handleApiError(err, 'Failed to connect account.'), 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect this Meesho account?')) return;
    setLoading(true);
    try {
      const res = await api.post('/meesho/disconnect', {}, {
        headers: activeStore?.id ? { 'X-Store-Id': activeStore.id } : {},
      });
      showToast(res.data.message || 'Disconnected.');
      refreshAll();
    } catch (err) {
      showToast(handleApiError(err, 'Failed to disconnect.'), 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleTestReefApi = async () => {
    setTestingReefApi(true);
    const isApify = statusData?.capabilities?.scraper_provider === 'apify';
    const endpoint = isApify ? '/meesho/apify/test' : '/meesho/reefapi/test';
    const providerName = isApify ? 'Apify Scraper' : 'ReefAPI';
    try {
      const response = await api.post(endpoint, {}, {
        headers: activeStore?.id ? { 'X-Store-Id': activeStore.id } : {},
      });
      showToast(response.data.message || `${providerName} connection succeeded.`);
    } catch (err) {
      showToast(handleApiError(err, `${providerName} connection test failed.`), 'danger');
    } finally {
      setTestingReefApi(false);
    }
  };

  const handleImportProduct = async (importData) => {
    setLoading(true);
    try {
      const res = await api.post('/meesho/import', importData, {
        headers: activeStore?.id ? { 'X-Store-Id': activeStore.id } : {},
      });
      showToast(res.data.message || 'Product imported to store!');
      refreshAll();
      window.dispatchEvent(new CustomEvent('toastkart:product-imported', { detail: res.data }));
      return true;
    } catch (err) {
      showToast(handleApiError(err, 'Failed to import product.'), 'danger');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePrice = async (productId, newPrice) => {
    setLoading(true);
    try {
      const res = await api.put(`/meesho/products/${productId}/price`, { selling_price: newPrice }, {
        headers: activeStore?.id ? { 'X-Store-Id': activeStore.id } : {},
      });
      showToast(res.data.message || 'Price updated.');
      loadResellingProducts();
      loadStatus();
    } catch (err) {
      showToast(handleApiError(err, 'Failed to update price.'), 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncProduct = async (productId) => {
    setLoading(true);
    try {
      const res = await api.post(`/meesho/products/${productId}/sync`, {}, {
        headers: activeStore?.id ? { 'X-Store-Id': activeStore.id } : {},
      });
      showToast(res.data.message || 'Product synced with supplier.');
      loadResellingProducts();
      loadLogs();
    } catch (err) {
      showToast(handleApiError(err, 'Sync failed.'), 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAll = async () => {
    setLoading(true);
    try {
      const res = await api.post('/meesho/sync-all', {}, {
        headers: activeStore?.id ? { 'X-Store-Id': activeStore.id } : {},
      });
      showToast(res.data.message || 'All products synced.');
      refreshAll();
    } catch (err) {
      showToast(handleApiError(err, 'Bulk sync failed.'), 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessOrder = async (orderId, processData) => {
    setLoading(true);
    try {
      const res = await api.post(`/meesho/orders/${orderId}/process`, processData, {
        headers: activeStore?.id ? { 'X-Store-Id': activeStore.id } : {},
      });
      showToast(res.data.message || 'Order placed with supplier.');
      loadOrders();
      loadStatus();
      loadLogs();
    } catch (err) {
      showToast(handleApiError(err, 'Failed to process order.'), 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTracking = async (orderId, trackingData) => {
    setLoading(true);
    try {
      const res = await api.put(`/meesho/orders/${orderId}/tracking`, trackingData, {
        headers: activeStore?.id ? { 'X-Store-Id': activeStore.id } : {},
      });
      showToast(res.data.message || 'Tracking updated.');
      loadOrders();
      loadStatus();
      loadLogs();
    } catch (err) {
      showToast(handleApiError(err, 'Failed to update tracking.'), 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (orderId, returnData) => {
    setLoading(true);
    try {
      const res = await api.post(`/meesho/orders/${orderId}/return`, returnData, {
        headers: activeStore?.id ? { 'X-Store-Id': activeStore.id } : {},
      });
      showToast(res.data.message || 'Return status updated.');
      loadOrders();
      loadStatus();
      loadLogs();
    } catch (err) {
      showToast(handleApiError(err, 'Failed to update return.'), 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryOrder = async (orderId) => {
    setLoading(true);
    try {
      const res = await api.post(`/meesho/orders/${orderId}/retry`, {}, {
        headers: activeStore?.id ? { 'X-Store-Id': activeStore.id } : {},
      });
      showToast(res.data.message || 'Supplier submission re-attempted.');
      loadOrders();
      loadStatus();
      loadLogs();
    } catch (err) {
      showToast(handleApiError(err, 'Failed to retry order.'), 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncTracking = async (orderId) => {
    setLoading(true);
    try {
      const res = await api.post(`/meesho/orders/${orderId}/sync-tracking`, {}, {
        headers: activeStore?.id ? { 'X-Store-Id': activeStore.id } : {},
      });
      showToast(res.data.message || 'Tracking synchronized.');
      loadOrders();
      loadStatus();
      loadLogs();
    } catch (err) {
      showToast(handleApiError(err, 'Failed to synchronize tracking.'), 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAllTracking = async () => {
    setLoading(true);
    try {
      const res = await api.post('/meesho/orders/sync-all-tracking', {}, {
        headers: activeStore?.id ? { 'X-Store-Id': activeStore.id } : {},
      });
      showToast(res.data.message || 'All tracking records synchronized.');
      loadOrders();
      loadStatus();
      loadLogs();
    } catch (err) {
      showToast(handleApiError(err, 'Bulk tracking sync failed.'), 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column gap-3">
      {requestError && (
        <div className={`alert alert-${requestError.type === 'auth' ? 'warning' : 'danger'} d-flex justify-content-between align-items-center py-2 px-3 mb-0`} role="alert">
          <span className="fs-8 fw-semibold">{requestError.message}</span>
          {requestError.type === 'auth' && (
            <button type="button" className="btn btn-sm btn-outline-dark ms-3" onClick={() => navigate('/login')}>
              Sign in
            </button>
          )}
        </div>
      )}

      {/* Toast alert */}
      {toastMessage && (
        <div className={`alert alert-${toastMessage.type === 'danger' ? 'danger' : 'success'} d-flex justify-content-between align-items-center py-2 px-3 rounded-3 shadow-sm mb-0`}>
          <span className="fs-8 fw-semibold">{toastMessage.text}</span>
          <button type="button" className="btn-close fs-9" onClick={() => setToastMessage(null)}></button>
        </div>
      )}

      {/* Hero Stats */}
      <div className="row g-3">
        <div className="col-6 col-lg-3">
          <div className="p-3 rounded-4 bg-white border shadow-sm">
            <div className="text-secondary fs-8 mb-1">Imported Products</div>
            <div className="fs-4 font-bold text-dark">{statusData?.stats?.imported_products_count ?? resellingProducts.length}</div>
            <div className="fs-9 text-muted mt-1">Live in your store</div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="p-3 rounded-4 bg-white border shadow-sm">
            <div className="text-secondary fs-8 mb-1">Reselling Orders</div>
            <div className="fs-4 font-bold text-dark">{statusData?.stats?.reselling_orders_count ?? orders.length}</div>
            <div className="fs-9 text-warning fw-semibold mt-1">
              {statusData?.stats?.pending_fulfillment_count ?? 0} Pending Supplier Booking
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="p-3 rounded-4 bg-white border shadow-sm">
            <div className="text-secondary fs-8 mb-1">Estimated Net Profit</div>
            <div className="fs-4 font-bold text-success">₹{(statusData?.stats?.estimated_profit ?? 0).toFixed(2)}</div>
            <div className="fs-9 text-muted mt-1">Pending delivery completion</div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="p-3 rounded-4 bg-white border shadow-sm">
            <div className="text-secondary fs-8 mb-1">Confirmed Profit</div>
            <div className="fs-4 font-bold text-primary">₹{(statusData?.stats?.confirmed_profit ?? 0).toFixed(2)}</div>
            <div className="fs-9 text-success fw-semibold mt-1">Delivered orders</div>
          </div>
        </div>
      </div>

      {/* Account Connection Header */}
      <MeeshoConnectionCard
        account={statusData?.account}
        capabilities={statusData?.capabilities}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onTestReefApi={handleTestReefApi}
        testingReefApi={testingReefApi}
        loading={loading}
      />

      {/* Workflow Navigation Tabs */}
      <div className="d-flex gap-2 border-bottom pb-2 overflow-auto">
        {[
          { key: 'catalog', label: 'Import Meesho Products' },
          { key: 'my-products', label: `My Reselling Products (${resellingProducts.length})` },
          { key: 'orders', label: `Customer Orders & Fulfilment (${orders.length})` },
          { key: 'calculator', label: 'Profit & Margin Calculator' },
          { key: 'logs', label: 'Sync & Audit History' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`btn btn-sm rounded-pill px-3 fs-8 fw-bold text-nowrap ${
              activeTab === tab.key
                ? 'btn-dark text-white'
                : 'btn-outline-secondary text-dark'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content Panes */}
      {activeTab === 'catalog' && (
        <MeeshoProductSearchImport
          onImport={handleImportProduct}
          onSearchError={(error) => handleApiError(error, 'Failed to search the staging catalog.')}
          loading={loading}
          enabled={!authLoading && Boolean(user && localStorage.getItem('toastkart_token') && activeStore?.id)}
          storeId={activeStore?.id}
          onGoToProducts={onGoToProducts}
          capabilities={statusData?.capabilities}
        />
      )}

      {activeTab === 'my-products' && (
        <ResellingProductTable
          products={resellingProducts}
          onUpdatePrice={handleUpdatePrice}
          onSyncProduct={handleSyncProduct}
          onSyncAll={handleSyncAll}
          loading={loading}
        />
      )}

      {activeTab === 'orders' && (
        <ResellingOrders
          orders={orders}
          onProcessOrder={handleProcessOrder}
          onRetryOrder={handleRetryOrder}
          onSyncTracking={handleSyncTracking}
          onSyncAllTracking={handleSyncAllTracking}
          onUpdateTracking={handleUpdateTracking}
          onHandleReturn={handleReturn}
          loading={loading}
        />
      )}

      {activeTab === 'calculator' && <ProfitCalculator />}

      {activeTab === 'logs' && <SyncHistory logs={logs} />}
    </div>
  );
}
