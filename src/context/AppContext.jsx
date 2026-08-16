import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { getMeApi, loginApi, fetchPlants } from '../services/plantService';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [plants, setPlants] = useState([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [authLoading, setAuthLoading] = useState(true);

  // Cek sesi saat aplikasi pertama kali dibuka
  useEffect(() => {
    const token = localStorage.getItem('tmk_token');
    if (!token) {
      setAuthLoading(false);
      return;
    }
    getMeApi()
      .then((userData) => {
        setUser(userData);
        setLoggedIn(true);
      })
      .catch(() => {
        localStorage.removeItem('tmk_token');
        setLoggedIn(false);
      })
      .finally(() => {
        setAuthLoading(false);
      });
  }, []);

  // Load tanaman dari API setiap kali user login
  const loadPlants = useCallback(async () => {
    if (!loggedIn) return;
    try {
      const data = await fetchPlants();
      setPlants(data);
    } catch (err) {
      console.error('Gagal load tanaman:', err.message);
    }
  }, [loggedIn]);

  useEffect(() => {
    if (loggedIn) {
      loadPlants();
    } else {
      setPlants([]);
    }
  }, [loggedIn, loadPlants]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.map(t => t.id === id ? { ...t, out: true } : t));
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 300);
    }, 3500);
  };

  const loginUser = async (email, password) => {
    const data = await loginApi(email, password);
    setUser(data.user);
    setLoggedIn(true);
    showToast('Selamat datang kembali! 🌱', 'success');
    return data;
  };

  const logoutUser = () => {
    localStorage.removeItem('tmk_token');
    setLoggedIn(false);
    setUser(null);
    setPlants([]);
    showToast('Berhasil keluar akun', 'success');
  };

  const updatePlant = (updatedPlant) => {
    setPlants((prev) => prev.map(p => p.id === updatedPlant.id ? updatedPlant : p));
  };

  return (
    <AppContext.Provider value={{
      user,
      setUser,
      plants,
      setPlants,
      loggedIn,
      setLoggedIn,
      toasts,
      showToast,
      loginUser,
      logoutUser,
      updatePlant,
      loadPlants,
      authLoading,
    }}>
      {children}
      {/* Global Toast UI */}
      <div id="toast-container" className="toast-container">
        {toasts.map((toast) => {
          const colors = { success: 'var(--color-primary)', warning: 'var(--color-warning)', error: 'var(--color-danger)' };
          const icons = {
            success: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ),
            warning: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            ),
            error: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            )
          };
          return (
            <div
              key={toast.id}
              className={`toast ${toast.type} ${toast.out ? 'toast-out' : ''}`}
              style={{ color: colors[toast.type] }}
            >
              {icons[toast.type]}
              <span style={{ color: 'var(--color-text)' }}>{toast.message}</span>
            </div>
          );
        })}
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
