import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { ExternalLink } from 'lucide-react';
import '../styles/dashboard-premium.css';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { activeStore } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState('dark');
  const displayName = user?.name || 'Store Manager';
  const profileInitial = displayName.charAt(0).toUpperCase();

  const storeNavItems = [
    { label: 'Store Overview', path: '/owner/stores' },
    { label: 'Edit Store Details', path: '/owner/stores?tab=edit' },
    { label: 'Storefront Subdomain', path: '/owner/stores?tab=url' },
    { label: 'Store Settings', path: '/owner/stores?tab=settings' },
    { label: 'Create Store', path: '/owner/stores?tab=create' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  return (
    <div className="store-manager-layout d-flex" style={{ background: '#050505', color: '#f6f1e4', minHeight: '100vh' }}>
      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-grow-1 d-flex flex-column overflow-hidden" style={{ minWidth: 0 }}>
        {/* Sticky Top Header */}
        <header className="store-topbar" style={{ background: '#050505', borderBottom: '1px solid rgba(212,175,55,0.18)' }}>
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <div className="d-flex flex-wrap align-items-center gap-2 me-2">
              {storeNavItems.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.path}
                  className={({ isActive }) => `px-3 py-2 rounded-full text-xs fw-semibold text-decoration-none ${isActive ? 'active' : ''}`}
                  style={({ isActive }) => ({
                    background: isActive ? 'rgba(212,175,55,0.16)' : 'transparent',
                    color: isActive ? '#f3d675' : '#8a7a4d',
                    border: isActive ? '1px solid rgba(212,175,55,0.28)' : '1px solid transparent'
                  })}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>

            {/* Search Input Box */}
            <form onSubmit={handleSearchSubmit} className="topbar-search-box">
              <span className="topbar-search-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8a7a4d" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ background: '#0e0d0b', color: '#ffffff', borderColor: 'rgba(212,175,55,0.2)' }}
              />
            </form>
          </div>

          {/* Right Header Controls */}
          <div className="topbar-right-actions d-flex align-items-center gap-3">
            {/* View Store Button */}
            <a
              href={`http://${activeStore?.name?.toLowerCase().replace(/\s+/g, '') || 'teststore1'}.localhost${window.location.port ? ':' + window.location.port : ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm d-flex align-items-center gap-2 px-3 py-1.5 rounded-pill text-white border"
              style={{ background: 'rgba(212,175,55,0.15)', borderColor: 'rgba(212,175,55,0.3)', fontSize: '0.8rem' }}
            >
              <ExternalLink size={14} /> View Store
            </a>

            {/* User Profile Pill */}
            <div className="dropdown">
              <div className="user-profile-pill d-flex align-items-center gap-2" data-bs-toggle="dropdown" aria-expanded="false" style={{ cursor: 'pointer' }}>
                <div
                  className="w-8 h-8 rounded-circle d-flex align-items-center justify-content-center text-xs fw-bold"
                  style={{ background: 'linear-gradient(135deg, #d4af37, #8a6d1f)', color: '#050505' }}
                >
                  {profileInitial}
                </div>
                <span className="user-name text-white fs-7 font-semibold">{displayName}</span>
              </div>
              <ul className="dropdown-menu dropdown-menu-end shadow border border-amber-500/20 bg-dark text-white rounded-3 mt-2">
                <li>
                  <div className="dropdown-header text-white-75">
                    <div className="fw-bold text-warning fs-7">{displayName}</div>
                    <div className="text-muted fs-8">{user?.email || 'manager@aureum.local'}</div>
                  </div>
                </li>
                <li><hr className="dropdown-divider border-secondary" /></li>
                <li><NavLink className="dropdown-item text-white fs-7" to="/settings">⚙️ Settings</NavLink></li>
                <li><button className="dropdown-item text-danger fs-7" onClick={handleLogout}>🚪 Logout</button></li>
              </ul>
            </div>
          </div>
        </header>

        {/* Main Body View */}
        <main className="p-4 flex-grow-1 overflow-y-auto" style={{ background: '#050505' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
