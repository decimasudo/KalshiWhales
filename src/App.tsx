import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import TraderProfile from './pages/TraderProfile'
import Login from './pages/Login'
import './App.css'
// Note: We will replace the old backgrounds with the Enigma Grid in the next phase, 
// for now keeping imports to avoid build break
import CyberpunkBackground from './components/CyberpunkBackground'; 

function AppContent() {
  const { user, isGuest, loading } = useAuth();
  const location = useLocation();
  
  // Combine authenticated user OR guest mode
  const canAccessDashboard = user || isGuest;

  if (loading) {
    return (
      <div className="min-h-screen bg-background-page flex items-center justify-center">
        <div className="text-center">
          {/* Enigma style loader */}
          <div className="w-16 h-16 border-2 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-accent-500 font-mono animate-pulse">INITIALIZING SYSTEM...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={canAccessDashboard ? <Dashboard /> : <Landing onShowAuth={() => {}} />} />
      <Route path="/dashboard" element={canAccessDashboard ? <Dashboard /> : <Landing onShowAuth={() => {}} />} />
      <Route path="/profile/:walletAddress" element={canAccessDashboard ? <TraderProfile /> : <Landing onShowAuth={() => {}} />} />
      {/* Add direct route to login if needed, handled via modal mostly in Landing */}
      <Route path="/login" element={<Login />} /> 
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        {/* We will replace this background later */}
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

export default App