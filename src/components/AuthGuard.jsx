import React from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import LoadingScreen from './LoadingScreen';

export default function AuthGuard({ children }) {
  const { loggedIn, authLoading } = useApp();

  if (authLoading) {
    return (
      <LoadingScreen
        label="Memuat kebun anda..."
        sublabel="Menyiapkan pandangan terbaik untuk kebun Anda…"
      />
    );
  }

  if (!loggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
