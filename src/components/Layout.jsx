import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Layout({ children, title }) {
  const { user, plants, logoutUser } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const warningCount = plants.filter((p) => p.status === 'warning').length;
  const initials = user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  const handleLogout = () => {
    if (window.confirm('Keluar dari akun ini?')) {
      logoutUser();
      navigate('/login');
    }
  };

  return (
    <div>
      {/* Sidebar Overlay (mobile) */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
        role="presentation"
      ></div>

      <div class="app-layout">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} role="navigation" aria-label="Navigasi aplikasi">
          <div className="sidebar-logo">
            <div className="sidebar-logo-mark" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div className="sidebar-logo-text">
              <div className="brand-name">Tanamanku</div>
              <div className="brand-tag">Pertanian Cerdas</div>
            </div>
          </div>

          <nav className="sidebar-nav" aria-label="Menu utama">
            <span className="nav-section-label">Menu Utama</span>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              </span>
              Dashboard
              {warningCount > 0 && (
                <span className="nav-badge" aria-label={`${warningCount} tanaman perlu perhatian`}>
                  {warningCount}
                </span>
              )}
            </NavLink>
            <NavLink
              to="/garden"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </span>
              Kebun Saya
            </NavLink>
            <NavLink
              to="/history"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </span>
              Riwayat
            </NavLink>

            <span className="nav-section-label">Kelola</span>
            <NavLink
              to="/manage-plants"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </span>
              Manajemen Tanaman
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              Profil & Pengaturan
            </NavLink>
          </nav>

          <div className="sidebar-footer">
            <div
              className="sidebar-user"
              onClick={() => navigate('/profile')}
              role="button"
              aria-label="Lihat profil"
              tabIndex={0}
            >
              <div className="user-avatar js-user-initials" aria-hidden="true">
                {initials}
              </div>
              <div className="user-info">
                <div className="user-name js-user-name">{user.name}</div>
                <div className="user-role js-user-role">{user.role}</div>
              </div>
            </div>
          </div>
        </aside>

        {/* App Content */}
        <div className="app-content">
          <header className="app-header" role="banner">
            <div className="flex items-center gap-4">
              <button
                className="hamburger"
                onClick={() => setSidebarOpen(true)}
                aria-label="Buka menu"
                aria-expanded={sidebarOpen}
              >
                <span></span>
                <span></span>
                <span></span>
              </button>
              <h1 className="app-header-title">{title}</h1>
            </div>
            <div className="app-header-actions">
              {warningCount === 0 ? (
                <span className="badge badge-green badge-dot" aria-live="polite">
                  Semua tanaman dalam kondisi baik
                </span>
              ) : (
                <span className="badge badge-yellow badge-dot" aria-live="polite">
                  {warningCount} tanaman butuh perhatian
                </span>
              )}
              <button className="btn btn-ghost btn-icon" aria-label="Notifikasi" onClick={() => alert('Fitur notifikasi akan hadir segera!')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </button>
            </div>
          </header>

          <main className="app-main" id="main-content">
            {children}
          </main>
        </div>
      </div>

      {/* Bottom Navigation (mobile) */}
      <nav className="bottom-nav" role="navigation" aria-label="Navigasi bawah">
        <div className="bottom-nav-inner">
          <NavLink to="/dashboard" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            Beranda
          </NavLink>
          <NavLink to="/garden" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Kebun
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Riwayat
          </NavLink>
          <NavLink to="/manage-plants" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Kelola
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Profil
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
