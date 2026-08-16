import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import AuthGuard from './components/AuthGuard';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import GardenOverviewPage from './pages/GardenOverviewPage';
import PlantDetailPage from './pages/PlantDetailPage';
import HistoryPage from './pages/HistoryPage';
import ManagePlantsPage from './pages/ManagePlantsPage';
import ProfilePage from './pages/ProfilePage';

// Import CSS Design system
import './css/style.css';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Authenticated Routes */}
          <Route
            path="/dashboard"
            element={
              <AuthGuard>
                <DashboardPage />
              </AuthGuard>
            }
          />
          <Route
            path="/garden"
            element={
              <AuthGuard>
                <GardenOverviewPage />
              </AuthGuard>
            }
          />
          <Route
            path="/plant-detail"
            element={
              <AuthGuard>
                <PlantDetailPage />
              </AuthGuard>
            }
          />
          <Route
            path="/history"
            element={
              <AuthGuard>
                <HistoryPage />
              </AuthGuard>
            }
          />
          <Route
            path="/manage-plants"
            element={
              <AuthGuard>
                <ManagePlantsPage />
              </AuthGuard>
            }
          />
          <Route
            path="/profile"
            element={
              <AuthGuard>
                <ProfilePage />
              </AuthGuard>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
