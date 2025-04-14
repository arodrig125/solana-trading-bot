import React, { createContext, useContext, useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { useToast } from '@chakra-ui/react';

const WalletContext = createContext();

export function WalletProvider({ children }) {
  const [wallets, setWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();

  // Initialize connection
  const connection = new Connection(process.env.REACT_APP_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');

  // Fetch wallets from the API
  const fetchWallets = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/wallets');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch wallets');
      }

      setWallets(data.wallets);
      
      // Select first wallet if none selected
      if (!selectedWallet && data.wallets.length > 0) {
        setSelectedWallet(data.wallets[0]);
      }
    } catch (err) {
      setError(err.message);
      toast({
        title: 'Error fetching wallets',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get wallet balance
  const getWalletBalance = async (publicKey) => {
    try {
      const balance = await connection.getBalance(new PublicKey(publicKey));
      return balance / 1e9; // Convert lamports to SOL
    } catch (err) {
      console.error('Error getting wallet balance:', err);
      return 0;
    }
  };

  // Add new wallet
  const addWallet = async (privateKey) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privateKey }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to add wallet');
      }

      setWallets(prev => [...prev, data.wallet]);
      toast({
        title: 'Wallet added',
        description: `Successfully added wallet ${data.wallet.displayAddress}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      setError(err.message);
      toast({
        title: 'Error adding wallet',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Remove wallet
  const removeWallet = async (publicKey) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/wallets/${publicKey}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to remove wallet');
      }

      setWallets(prev => prev.filter(w => w.publicKey !== publicKey));
      
      if (selectedWallet?.publicKey === publicKey) {
        setSelectedWallet(wallets[0] || null);
      }

      toast({
        title: 'Wallet removed',
        description: 'Successfully removed wallet',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      setError(err.message);
      toast({
        title: 'Error removing wallet',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update wallet balances
  const updateWalletBalances = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/wallets/update-balances', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to update wallet balances');
      }

      setWallets(data.wallets);
      toast({
        title: 'Balances updated',
        description: 'Successfully updated wallet balances',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      setError(err.message);
      toast({
        title: 'Error updating balances',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch wallets on mount
  useEffect(() => {
    fetchWallets();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value = {
    wallets,
    selectedWallet,
    setSelectedWallet,
    isLoading,
    error,
    addWallet,
    removeWallet,
    updateWalletBalances,
    getWalletBalance,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
