import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import TraderProfile from './pages/TraderProfile'
import './App.css'
import CyberpunkBackground from './components/CyberpunkBackground';
import PulsingGlowBackground from './components/PulsingGlowBackground';

function AppContent() {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // Debug: Log current path
  React.useEffect(() => {
    if (location.pathname.startsWith('/profile/')) {
      const walletAddress = location.pathname.split('/')[2];
      console.log('App.tsx - Profile route active, walletAddress:', walletAddress);
    }
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Dashboard /> : <Landing onShowAuth={() => {}} />} />
      <Route path="/dashboard" element={user ? <Dashboard /> : <Landing onShowAuth={() => {}} />} />
      <Route path="/profile/:walletAddress" element={user ? <TraderProfile /> : <Landing onShowAuth={() => {}} />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <PulsingGlowBackground/>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

export default App
