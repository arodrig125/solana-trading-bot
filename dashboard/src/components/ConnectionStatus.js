import React from 'react';
import { useSolanaConnection } from './SolanaConnectionProvider';

const ConnectionStatus = () => {
  const { connectionStatus, error, reconnect } = useSolanaConnection();

  // Define status colors
  const statusColors = {
    connected: 'bg-green-500',
    connecting: 'bg-yellow-500',
    disconnected: 'bg-gray-500',
    error: 'bg-red-500'
  };

  // Define status messages
  const statusMessages = {
    connected: 'Connected to Solana',
    connecting: 'Connecting to Solana...',
    disconnected: 'Disconnected from Solana',
    error: `Connection Error: ${error || 'Unknown error'}`
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={`h-3 w-3 rounded-full ${statusColors[connectionStatus]}`}></div>
      <span className="text-sm text-gray-600">{statusMessages[connectionStatus]}</span>
      
      {connectionStatus === 'error' && (
        <button 
          onClick={reconnect}
          className="text-sm text-blue-500 hover:text-blue-700 ml-2"
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default ConnectionStatus;
