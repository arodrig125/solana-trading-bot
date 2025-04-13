/**
 * Utility functions for formatting values in the dashboard
 */

// Format currency values
export const formatCurrency = (value, currency = 'USD', decimals = 2) => {
  if (value === undefined || value === null) return '--';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

// Format percentage values
export const formatPercent = (value, decimals = 2) => {
  if (value === undefined || value === null) return '--';
  
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
};

// Format token amount based on the token type
export const formatTokenAmount = (amount, tokenSymbol, decimals = null) => {
  if (amount === undefined || amount === null) return '--';
  
  // Determine appropriate decimals based on token
  let tokenDecimals;
  switch (tokenSymbol.toUpperCase()) {
    case 'SOL':
      tokenDecimals = 4;
      break;
    case 'BTC':
    case 'ETH':
      tokenDecimals = 6;
      break;
    case 'USDC':
    case 'USDT':
    case 'DAI':
      tokenDecimals = 2;
      break;
    case 'BONK':
    case 'SAMO':
      // Show K, M, B for meme tokens with large amounts
      return formatLargeNumber(amount);
    default:
      tokenDecimals = 4;
  }
  
  // Use passed decimals if provided
  if (decimals !== null) {
    tokenDecimals = decimals;
  }
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: tokenDecimals,
    maximumFractionDigits: tokenDecimals,
  }).format(amount);
};

// Format large numbers with K, M, B suffixes
export const formatLargeNumber = (num) => {
  if (num === undefined || num === null) return '--';
  
  if (num < 1000) {
    return num.toFixed(2);
  }
  
  const units = ['', 'K', 'M', 'B', 'T'];
  
  const order = Math.floor(Math.log10(num) / 3);
  const unitValue = num / Math.pow(1000, order);
  
  return unitValue.toFixed(1) + units[order];
};

// Format date/time
export const formatDate = (dateString, includeTime = false) => {
  if (!dateString) return '--';
  
  const date = new Date(dateString);
  const options = {
    year: 'numeric', 
    month: 'short', 
    day: 'numeric'
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return new Intl.DateTimeFormat('en-US', options).format(date);
};

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (dateString) => {
  if (!dateString) return '--';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHr = Math.round(diffMin / 60);
  const diffDays = Math.round(diffHr / 24);
  
  if (diffSec < 60) {
    return `${diffSec} second${diffSec !== 1 ? 's' : ''} ago`;
  } else if (diffMin < 60) {
    return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  } else if (diffHr < 24) {
    return `${diffHr} hour${diffHr !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 30) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return formatDate(dateString);
  }
};

// Format wallet address (truncate middle)
export const formatWalletAddress = (address, visibleChars = 4) => {
  if (!address) return '--';
  
  if (address.length <= visibleChars * 2) {
    return address;
  }
  
  return `${address.substring(0, visibleChars)}...${address.substring(address.length - visibleChars)}`;
};

// Format transaction hash (truncate middle)
export const formatTxHash = (hash, visibleChars = 6) => {
  return formatWalletAddress(hash, visibleChars);
};

// Generate Solana Explorer URL for transaction
export const getSolanaExplorerUrl = (txHash, cluster = 'mainnet-beta') => {
  return `https://explorer.solana.com/tx/${txHash}?cluster=${cluster}`;
};

// Generate Solana Explorer URL for address
export const getSolanaAddressUrl = (address, cluster = 'mainnet-beta') => {
  return `https://explorer.solana.com/address/${address}?cluster=${cluster}`;
};
