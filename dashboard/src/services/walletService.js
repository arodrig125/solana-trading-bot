// WalletService.js - Custom hooks for wallet functionality and connection
import { useCallback, useMemo } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';

/**
 * Get RPC endpoint based on network
 * @param {string} network - 'mainnet', 'devnet', or 'testnet'
 * @returns {string} RPC endpoint URL
 */
export function getRpcEndpoint(network = 'mainnet') {
  switch (network) {
    case 'devnet':
      return 'https://api.devnet.solana.com';
    case 'testnet':
      return 'https://api.testnet.solana.com';
    case 'mainnet':
    default:
      return 'https://api.mainnet-beta.solana.com';
  }
}

/**
 * Create a Solana connection
 * @param {string} network - Network to connect to
 * @returns {Connection} Solana connection object
 */
export function createConnection(network = 'mainnet') {
  const endpoint = getRpcEndpoint(network);
  return new Connection(endpoint, 'confirmed');
}

/**
 * Custom hook for wallet helper functions
 * @returns {Object} Wallet helper functions and state
 */
export function useWalletHelpers() {
  const { 
    publicKey, 
    connected, 
    connecting,
    connect,
    disconnect,
    signTransaction,
    signAllTransactions,
    wallet,
    wallets,
    select
  } = useWallet();

  /**
   * Get connected wallet info
   * @returns {Object|null} Wallet info if connected, null otherwise
   */
  const getWalletInfo = useCallback(() => {
    if (!connected || !publicKey) return null;

    return {
      publicKey: publicKey.toString(),
      label: wallet?.adapter?.name || 'Unknown Wallet',
      icon: wallet?.adapter?.icon,
      isConnected: connected
    };
  }, [connected, publicKey, wallet]);

  /**
   * Format wallet address for display
   * @param {string} address - Full wallet address
   * @returns {string} Shortened address (e.g., Sola...1234)
   */
  const formatWalletAddress = useCallback((address) => {
    if (!address) return '';
    if (address.length <= 11) return address;
    
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }, []);

  /**
   * Get available wallet options
   * @returns {Array} Available wallet adapters
   */
  const getWalletOptions = useMemo(() => {
    return wallets.map(adapter => ({
      name: adapter.adapter.name,
      icon: adapter.adapter.icon,
      id: adapter.adapter.name.toLowerCase().replace(/\s/g, '-')
    }));
  }, [wallets]);

  return {
    publicKey,
    connected,
    connecting,
    connect,
    disconnect,
    signTransaction,
    signAllTransactions,
    wallet,
    wallets,
    select,
    getWalletInfo,
    formatWalletAddress,
    getWalletOptions
  };
}

/**
 * Custom hook for token balances
 * @param {string} network - Solana network
 * @returns {Object} Balance functions
 */
export function useTokenBalances(network = 'mainnet') {
  const { publicKey, connected } = useWallet();
  const connection = useMemo(() => createConnection(network), [network]);

  /**
   * Fetch SOL balance for connected wallet
   * @returns {Promise<number>} SOL balance
   */
  const getSolBalance = useCallback(async () => {
    if (!connected || !publicKey) return 0;

    try {
      const balance = await connection.getBalance(publicKey);
      return balance / 1e9; // Convert lamports to SOL
    } catch (error) {
      console.error('Error fetching SOL balance:', error);
      return 0;
    }
  }, [connection, connected, publicKey]);

  /**
   * Fetch SPL token balances for the connected wallet
   * @param {Array<string>} mintAddresses - Token mint addresses to check
   * @returns {Promise<Object>} Map of token balances by mint address
   */
  const getTokenBalances = useCallback(async (mintAddresses = []) => {
    if (!connected || !publicKey || mintAddresses.length === 0) {
      return {};
    }

    try {
      const accounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
      );

      const balances = {};
      
      accounts.value.forEach(account => {
        const parsedInfo = account.account.data.parsed.info;
        const mintAddress = parsedInfo.mint;
        const balance = parsedInfo.tokenAmount.uiAmount;

        if (mintAddresses.length === 0 || mintAddresses.includes(mintAddress)) {
          balances[mintAddress] = balance;
        }
      });

      return balances;
    } catch (error) {
      console.error('Error fetching token balances:', error);
      return {};
    }
  }, [connection, connected, publicKey]);

  return {
    getSolBalance,
    getTokenBalances
  };
}

// Default export for backward compatibility
const WalletService = {
  getRpcEndpoint,
  createConnection,
  useWalletHelpers,
  useTokenBalances
};

export default WalletService;
