import React, { createContext, useContext, useEffect, useState } from 'react';
import { createConnection, safeDisconnect, rpcHandler } from '../utils/rpcConnection';

// Create a context for the Solana connection
const SolanaConnectionContext = createContext(null);

/**
 * Provider component that manages Solana RPC connection lifecycle
 */
export const SolanaConnectionProvider = ({ children }) => {
  const [connection, setConnection] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [error, setError] = useState(null);

  // Initialize connection on component mount
  useEffect(() => {
    let isMounted = true;
    let conn = null;

    const initConnection = async () => {
      try {
        setConnectionStatus('connecting');
        
        // Create a new connection
        conn = createConnection();
        
        // Test the connection with a simple RPC call
        await rpcHandler.executeCall(async (testConn) => {
          const version = await testConn.getVersion();
          return version;
        });
        
        if (isMounted) {
          setConnection(conn);
          setConnectionStatus('connected');
          setError(null);
        }
      } catch (err) {
        console.error('Failed to initialize Solana connection:', err);
        if (isMounted) {
          setConnectionStatus('error');
          setError(err.message);
        }
      }
    };

    initConnection();

    // Clean up on unmount
    return () => {
      isMounted = false;
      if (conn) {
        // Use our safe disconnect method
        safeDisconnect(conn).catch(err => {
          console.warn('Error during cleanup disconnect:', err.message);
        });
      }
    };
  }, []);

  // Provide a method to manually reconnect
  const reconnect = async () => {
    if (connection) {
      await safeDisconnect(connection).catch(console.warn);
    }
    
    setConnectionStatus('connecting');
    
    try {
      const newConnection = createConnection();
      await rpcHandler.executeCall(async (testConn) => {
        const version = await testConn.getVersion();
        return version;
      });
      
      setConnection(newConnection);
      setConnectionStatus('connected');
      setError(null);
    } catch (err) {
      console.error('Failed to reconnect:', err);
      setConnectionStatus('error');
      setError(err.message);
    }
  };

  // The value provided by the context
  const contextValue = {
    connection,
    connectionStatus,
    error,
    reconnect,
    executeRpcCall: (rpcCall, options) => rpcHandler.executeCall(rpcCall, options)
  };

  return (
    <SolanaConnectionContext.Provider value={contextValue}>
      {children}
    </SolanaConnectionContext.Provider>
  );
};

// Custom hook to use the Solana connection
export const useSolanaConnection = () => {
  const context = useContext(SolanaConnectionContext);
  if (!context) {
    throw new Error('useSolanaConnection must be used within a SolanaConnectionProvider');
  }
  return context;
};

export default SolanaConnectionProvider;
