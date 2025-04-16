import { Connection, clusterApiUrl } from '@solana/web3.js';

// List of fallback RPC endpoints
const RPC_ENDPOINTS = [
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL, // Primary endpoint from env variable
  clusterApiUrl('mainnet-beta'),          // Solana's public mainnet endpoint
  'https://api.mainnet-beta.solana.com',  // Alternative public endpoint
  'https://solana-api.projectserum.com',  // Serum's public endpoint
];

// Connection timeout in milliseconds
const CONNECTION_TIMEOUT = 30000; // 30 seconds

/**
 * Creates a Solana connection with fallback support and timeout handling
 * @returns {Connection} A configured Solana connection
 */
export const createConnection = () => {
  // Use the first available endpoint
  const endpoint = RPC_ENDPOINTS.find(url => url && url.startsWith('http')) || clusterApiUrl('mainnet-beta');
  
  // Create connection with commitment level and timeout
  const connection = new Connection(endpoint, {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: CONNECTION_TIMEOUT,
    disableRetryOnRateLimit: false,
  });
  
  return connection;
};

/**
 * Safely disconnects from an RPC endpoint with timeout handling
 * @param {Connection} connection - The Solana connection to disconnect
 */
export const safeDisconnect = async (connection) => {
  if (!connection) return;
  
  try {
    // Create a promise that will resolve when disconnect completes
    const disconnectPromise = connection.disconnect?.();
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Disconnect timeout'));
      }, 5000); // 5 second timeout for disconnect
    });
    
    // Race the disconnect against the timeout
    if (disconnectPromise) {
      await Promise.race([disconnectPromise, timeoutPromise]);
    }
  } catch (error) {
    console.warn('Error during RPC disconnect:', error.message);
    // We intentionally don't rethrow the error to prevent it from breaking the application
  }
};

/**
 * Handles RPC operations with proper error handling and fallbacks
 */
export const rpcHandler = {
  /**
   * Executes an RPC call with fallback and retry logic
   * @param {Function} rpcCall - Async function that makes the RPC call
   * @param {Object} options - Options for the RPC call
   * @returns {Promise<any>} - Result of the RPC call
   */
  executeCall: async (rpcCall, options = {}) => {
    const { retries = 3, fallbackToNextRpc = true } = options;
    let lastError;
    
    // Try each endpoint with retries
    for (let endpointIndex = 0; endpointIndex < (fallbackToNextRpc ? RPC_ENDPOINTS.length : 1); endpointIndex++) {
      const endpoint = RPC_ENDPOINTS[endpointIndex];
      if (!endpoint || !endpoint.startsWith('http')) continue;
      
      const connection = new Connection(endpoint, {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: CONNECTION_TIMEOUT,
      });
      
      // Try with retries on this endpoint
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          const result = await rpcCall(connection);
          return result;
        } catch (error) {
          lastError = error;
          console.warn(`RPC call failed (endpoint ${endpointIndex}, attempt ${attempt + 1}):`, error.message);
          
          // If this isn't the last attempt, wait before retrying
          if (attempt < retries - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt))); // Exponential backoff
          }
        }
      }
      
      // Try to disconnect safely before moving to next endpoint
      await safeDisconnect(connection);
    }
    
    // If we get here, all attempts failed
    throw lastError || new Error('All RPC endpoints failed');
  }
};

export default createConnection;
