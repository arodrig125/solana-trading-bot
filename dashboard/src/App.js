import React, { useState, useEffect } from 'react';
import { ChakraProvider, Box, theme as chakraTheme } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import custom theme
import theme from './theme';

// Import auth context
import { AuthProvider } from './context/AuthContext';

// Import pages
import Dashboard from './pages/Dashboard';
import Trading from './pages/Trading';
import Wallets from './pages/Wallets';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Analytics from './pages/Analytics';
import LandingPage from './pages/LandingPage';

// Import components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ErrorBoundary from './components/common/ErrorBoundary';
import LoadingSpinner from './components/common/LoadingSpinner';
import NotificationsPanel from './components/common/NotificationsPanel';

function App() {
  // State for notifications panel
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Simulate initial loading
  useEffect(() => {
    // Simulate loading resources
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Toggle notifications panel
  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
  };

  // Main application structure
  const AppContent = ({ isAuthenticated, handleLogout }) => {
    if (!isAuthenticated) {
      return null; // Login page is rendered directly by AuthProvider
    }
    
    return (
      <Box display="flex" height="100vh" overflow="hidden">
        <Sidebar />
        <Box flexGrow={1} overflowY="auto">
          <Header onLogout={handleLogout} onNotificationsClick={toggleNotifications} />
          <Box p={4} pb={8}>
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/trading" element={<Trading />} />
                <Route path="/wallets" element={<Wallets />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/landing" element={<LandingPage />} />
              </Routes>
            </ErrorBoundary>
          </Box>
        </Box>
        
        {/* Notifications panel */}
        <NotificationsPanel 
          isOpen={isNotificationsOpen} 
          onClose={() => setIsNotificationsOpen(false)} 
        />
      </Box>
    );
  };

  // Loading screen
  if (isLoading) {
    return (
      <ChakraProvider theme={theme}>
        <Box height="100vh" display="flex" alignItems="center" justifyContent="center">
          <LoadingSpinner text="Loading SolarBot Dashboard..." />
        </Box>
      </ChakraProvider>
    );
  }

  return (
    <ChakraProvider theme={theme}>
      <ErrorBoundary>
        <AuthProvider>
          {({ isAuthenticated, loading, user, login, logout }) => (
            <Router>
              {loading ? (
                <LoadingSpinner text="Authenticating..." />
              ) : !isAuthenticated ? (
                <Login onLogin={login} />
              ) : (
                <AppContent isAuthenticated={isAuthenticated} handleLogout={logout} />
              )}
            </Router>
          )}
        </AuthProvider>
      </ErrorBoundary>
    </ChakraProvider>
  );
}

export default App;
