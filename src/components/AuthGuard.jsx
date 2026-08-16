import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function AuthGuard({ children }) {
  const { loggedIn, authLoading } = useApp();

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--color-bg)' }}>
        <span className="spinner" style={{ width: '32px', height: '32px', borderColor: 'var(--color-border)', borderTopColor: 'var(--color-primary)' }}></span>
      </div>
    );
  }

  if (!loggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
