import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GameProvider } from './context/GameContext';
import Layout from './components/Layout';

import Auth from './pages/Auth';
import Bingo from './pages/Bingo';
import Community from './pages/Community';
import Dashboard from './pages/Dashboard';
import EcoVillage from './pages/EcoVillage';
import Events from './pages/Events';
import LandingPage from './pages/LandingPage';
import Learn from './pages/Learn';
import OceanCleanupGame from './pages/OceanCleanupGame';

/**
 * Protects routes that require authentication.
 * Shows a loading indicator while the Supabase session is being restored
 * to prevent a flash of redirect on page refresh.
 */
const Protected: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white text-xl">
        Loading...
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return <Layout>{children}</Layout>;
};

export default function App() {
  return (
    <AuthProvider>
      <GameProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Auth />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/ocean-cleanup-game" element={<Protected><OceanCleanupGame /></Protected>} />
            <Route path="/eco-village" element={<Protected><EcoVillage /></Protected>} />
            <Route path="/learn" element={<Protected><Learn /></Protected>} />
            <Route path="/bingo" element={<Protected><Bingo /></Protected>} />
            <Route path="/community" element={<Protected><Community /></Protected>} />
            <Route path="/events" element={<Protected><Events /></Protected>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </GameProvider>
    </AuthProvider>
  );
}
