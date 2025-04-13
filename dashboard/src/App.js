import React, { useState, useEffect } from 'react';
import { ChakraProvider, Box, theme as chakraTheme } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

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

// Import public pages (to be created)
import About from './pages/public/About';
import Documentation from './pages/public/Documentation';
import Contact from './pages/public/Contact';
import Pricing from './pages/public/Pricing';

// Import components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import PublicHeader from './components/PublicHeader';
import Footer from './components/Footer';
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

  // Authenticated application structure
  const AuthenticatedApp = ({ handleLogout }) => {    
    return (
      <Box display="flex" height="100vh" overflow="hidden">
        <Sidebar />
        <Box flexGrow={1} overflowY="auto">
          <Header onLogout={handleLogout} onNotificationsClick={toggleNotifications} />
          <Box p={4} pb={8}>
            <ErrorBoundary>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/trading" element={<Trading />} />
                <Route path="/wallets" element={<Wallets />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
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

  // Public application structure
  const PublicApp = ({ login }) => {
    return (
      <>
        <PublicHeader />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/docs" element={<Documentation />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/login" element={<Login onLogin={login} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <Footer />
      </>
    );
  };

  // Loading screen
  if (isLoading) {
    return (
      <ChakraProvider theme={theme}>
        <Box height="100vh" display="flex" alignItems="center" justifyContent="center">
          <LoadingSpinner text="Loading SolarBot..." />
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
              ) : isAuthenticated ? (
                <AuthenticatedApp handleLogout={logout} />
              ) : (
                <PublicApp login={login} />
              )}
            </Router>
          )}
        </AuthProvider>
      </ErrorBoundary>
    </ChakraProvider>
  );
}

export default App;
