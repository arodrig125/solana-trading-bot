// TradingContext.js - Context provider for trading state management
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import JupiterService from '../services/jupiterService';
import WalletService from '../services/walletService';

// Create the Trading Context
const TradingContext = createContext();

/**
 * TradingProvider component that wraps the app and provides trading state and functions
 */
export const TradingProvider = ({ children }) => {
  // Opportunities state
  const [opportunities, setOpportunities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    minProfit: 0.5,
    risk: 'all',
    type: 'all',
    tokenSymbol: ''
  });
  
  // Wallet state
  const [connectedWallet, setConnectedWallet] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [selectedWalletId, setSelectedWalletId] = useState(null);
  
  // Trading state
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshIntervalState] = useState(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  
  // UI state
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  
  // Analytics state
  const [recentTrades, setRecentTrades] = useState([]);
  const [dexPerformance, setDexPerformance] = useState({});
  const [tradingStats, setTradingStats] = useState({
    totalTrades: 0,
    successfulTrades: 0,
    totalProfit: 0,
    averageProfit: 0,
    bestTrade: null,
    worstTrade: null
  });
  
  const toast = useToast();
  
  // Use wallet helpers from WalletService
  const { 
    publicKey, 
    connected,
    getWalletInfo,
    formatWalletAddress 
  } = WalletService.useWalletHelpers();
  
  // Token balance helpers
  const { getSolBalance, getTokenBalances } = WalletService.useTokenBalances();
  
  /**
   * Fetch recent trades and performance metrics
   */
  const fetchTradingAnalytics = useCallback(async () => {
    try {
      const [trades, performance, stats] = await Promise.all([
        JupiterService.getRecentTrades(),
        JupiterService.getDexPerformance(),
        JupiterService.getTradingStats()
      ]);
      
      setRecentTrades(trades);
      setDexPerformance(performance);
      setTradingStats(stats);
    } catch (err) {
      console.error('Error fetching trading analytics:', err);
    }
  }, []);

  /**
   * Fetch trading opportunities based on current filters
   */
  const fetchOpportunities = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await JupiterService.getOpportunities(filters);
      
      setOpportunities(data);
      setLastRefreshTime(new Date());
      
      return data;
    } catch (err) {
      setError(err.message || 'Error fetching opportunities');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [filters]);
  
  /**
   * Update filters and refetch opportunities
   * @param {Object} newFilters - New filter values
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      ...newFilters
    }));
  }, []);
  
  /**
   * Toggle auto-refresh mode
   * @param {boolean} enabled - Whether auto-refresh should be enabled
   * @param {number} intervalMs - Refresh interval in milliseconds (default: 30000)
   */
  const toggleAutoRefresh = useCallback((enabled, intervalMs = 30000) => {
    setAutoRefresh(enabled);
    
    if (enabled) {
      // Clear existing interval if any
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      
      // Set up new interval
      const interval = setInterval(() => {
        fetchOpportunities().then(() => {
          toast({
            title: 'Opportunities updated',
            status: 'info',
            duration: 2000,
            isClosable: true,
            position: 'bottom-right',
          });
        });
      }, intervalMs);
      
      setRefreshIntervalState(interval);
      
      return () => clearInterval(interval);
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshIntervalState(null);
    }
  }, [fetchOpportunities, refreshInterval, toast]);
  
  /**
   * Simulate a trade before execution
   * @param {Object} opportunity - The opportunity to simulate
   * @param {number} amount - Amount to trade
   * @returns {Promise<Object>} Simulation results
   */
  const simulateTrade = useCallback(async (opportunity, amount) => {
    try {
      return await JupiterService.simulateTrade(opportunity, amount);
    } catch (err) {
      throw new Error(err.message || 'Failed to simulate trade');
    }
  }, []);
  
  /**
   * Execute a trade
   * @param {Object} opportunity - The opportunity to trade
   * @param {string} walletId - Wallet ID to use
   * @param {number} amount - Amount to trade
   * @param {Object} options - Trading options
   * @returns {Promise<Object>} Trade result
   */
  const executeTrade = useCallback(async (opportunity, walletId, amount, options = {}) => {
    try {
      return await JupiterService.executeTrade(opportunity, walletId, amount, options);
    } catch (err) {
      throw new Error(err.message || 'Failed to execute trade');
    }
  }, []);
  
  /**
   * Fetch available wallets for trading
   */
  const fetchWallets = useCallback(async () => {
    try {
      const data = await JupiterService.getWallets();
      setWallets(data);
      
      // Set first wallet as selected by default if available
      if (data.length > 0 && !selectedWalletId) {
        setSelectedWalletId(data[0].id);
      }
      
      return data;
    } catch (err) {
      console.error('Error fetching wallets:', err);
      return [];
    }
  }, [selectedWalletId]);
  
  // Effect to fetch initial data
  useEffect(() => {
    fetchOpportunities();
    fetchWallets();
    fetchTradingAnalytics();
    
    // Set up regular analytics updates
    const analyticsInterval = setInterval(fetchTradingAnalytics, 60000); // Update every minute
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      clearInterval(analyticsInterval);
    };
  }, [fetchOpportunities, fetchWallets, fetchTradingAnalytics, refreshInterval]);
  
  // Effect to update connected wallet when Solana wallet changes
  useEffect(() => {
    if (connected && publicKey) {
      const walletInfo = getWalletInfo();
      setConnectedWallet(walletInfo);
    } else {
      setConnectedWallet(null);
    }
  }, [connected, publicKey, getWalletInfo]);
  
  // Context value
  const value = {
    // Analytics
    recentTrades,
    dexPerformance,
    tradingStats,
    fetchTradingAnalytics,
    // Opportunities
    opportunities,
    isLoading,
    error,
    filters,
    updateFilters,
    fetchOpportunities,
    lastRefreshTime,
    
    // Wallets
    connectedWallet,
    wallets,
    selectedWalletId,
    setSelectedWalletId,
    formatWalletAddress,
    getSolBalance,
    getTokenBalances,
    
    // Trading actions
    simulateTrade,
    executeTrade,
    
    // UI state
    viewMode,
    setViewMode,
    autoRefresh,
    toggleAutoRefresh
  };
  
  return (
    <TradingContext.Provider value={value}>
      {children}
    </TradingContext.Provider>
  );
};

/**
 * Hook to use the trading context
 * @returns {Object} Trading context
 */
export const useTrading = () => {
  const context = useContext(TradingContext);
  
  if (!context) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  
  return context;
};

export default TradingContext;
