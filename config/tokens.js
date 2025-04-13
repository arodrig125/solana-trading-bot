/**
 * Token configuration for the Solana arbitrage bot
 * This file contains token addresses and configuration for the bot to use
 */

// Common Solana tokens
const TOKENS = {
  // Stablecoins
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
    category: 'stablecoin',
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    priority: 100
  },
  USDT: {
    symbol: 'USDT',
    name: 'USDT',
    mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    decimals: 6,
    category: 'stablecoin',
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg',
    priority: 90
  },
  
  // Major tokens
  SOL: {
    symbol: 'SOL',
    name: 'Wrapped SOL',
    mint: 'So11111111111111111111111111111111111111112',
    decimals: 9,
    category: 'major',
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    priority: 110
  },
  BTC: {
    symbol: 'BTC',
    name: 'Jupiter BTC',
    mint: '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E',
    decimals: 6,
    category: 'major',
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E/logo.png',
    priority: 80
  },
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum (Wormhole)',
    mint: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
    decimals: 8,
    category: 'major',
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs/logo.png',
    priority: 70
  },
  
  // DeFi tokens
  JUP: {
    symbol: 'JUP',
    name: 'Jupiter',
    mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    decimals: 6,
    category: 'defi',
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN/logo.png',
    priority: 60
  },
  RAY: {
    symbol: 'RAY',
    name: 'Raydium',
    mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    decimals: 6,
    category: 'defi',
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png',
    priority: 50
  },
  BONK: {
    symbol: 'BONK',
    name: 'Bonk',
    mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    decimals: 5,
    category: 'meme',
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263/logo.png',
    priority: 40
  },
  WIF: {
    symbol: 'WIF',
    name: 'Dogwifhat',
    mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
    decimals: 6,
    category: 'meme',
    logoURI: 'https://arweave.net/gGOcS7N0obnySnhQJgKcj7v4fJJMXQSFNYpQzhvHjpg',
    priority: 39
  },
  ORCA: {
    symbol: 'ORCA',
    name: 'Orca',
    mint: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
    decimals: 6,
    category: 'defi',
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE/logo.png',
    priority: 55
  },
  MNGO: {
    symbol: 'MNGO',
    name: 'Mango',
    mint: 'MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac',
    decimals: 6,
    category: 'defi',
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac/logo.png',
    priority: 45
  },
  PYTH: {
    symbol: 'PYTH',
    name: 'Pyth Network',
    mint: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3',
    decimals: 6,
    category: 'defi',
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3/logo.png',
    priority: 48
  },
  RNDR: {
    symbol: 'RNDR',
    name: 'Render Token',
    mint: 'rndrizKT3MK1iimdxRdWabcF7Zg7LF7zzH5JwwNr7Sw',
    decimals: 8,
    category: 'defi',
    logoURI: 'https://assets.coingecko.com/coins/images/11636/small/rndr.png',
    priority: 47
  },
  MOON: {
    symbol: 'MOON',
    name: 'MoonCoin',
    mint: 'moonXBsihQGmd8XZRgHWf9yabTnGRYSZK3bLwZRVnKh5',
    decimals: 9,
    category: 'meme',
    logoURI: 'https://assets.coingecko.com/coins/images/33809/small/1718195566407.png',
    priority: 38
  },
  BOME: {
    symbol: 'BOME',
    name: 'Book of Meme',
    mint: 'GHCnAcRr11C3GQ5PMJxReqe5zLfNQkLXynZn8KaEuKLc',
    decimals: 6,
    category: 'meme',
    logoURI: 'https://assets.coingecko.com/coins/images/33361/small/book_of_meme_logo.jpg',
    priority: 41
  },
  GUAC: {
    symbol: 'GUAC',
    name: 'Guacamole',
    mint: 'GUAehGcXzrLZFHmfZVzBZZjgKKMbz85H7ZHNiP8K5Czr',
    decimals: 8,
    category: 'meme',
    logoURI: 'https://assets.coingecko.com/coins/images/33851/small/Guacamole.jpg',
    priority: 42
  },

  // Additional Recommended Stablecoins
  DAI: {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    mint: 'EjmyN6qEC1Tf1JxiG1ae7UTJhUxSwk1TCWNWqxWV4J6o',
    decimals: 8,
    category: 'stablecoin',
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EjmyN6qEC1Tf1JxiG1ae7UTJhUxSwk1TCWNWqxWV4J6o/logo.png',
    priority: 85
  },
  USDH: {
    symbol: 'USDH',
    name: 'USDH Stablecoin',
    mint: 'USDH1SM1ojwWUga67PGrgFWUHibbjqMvuMaDkRJTgkX',
    decimals: 6,
    category: 'stablecoin',
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/USDH1SM1ojwWUga67PGrgFWUHibbjqMvuMaDkRJTgkX/logo.svg',
    priority: 83
  },

  // DeFi Blue Chips
  MSOL: {
    symbol: 'mSOL',
    name: 'Marinade staked SOL',
    mint: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
    decimals: 9,
    category: 'defi',
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So/logo.png',
    priority: 65
  },
  MEAN: {
    symbol: 'MEAN',
    name: 'Mean DAO',
    mint: 'MEANeD3XDdUmNMsRGjASkSWdC8prLYsoRJ61pPeHctD',
    decimals: 6,
    category: 'defi',
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/MEANeD3XDdUmNMsRGjASkSWdC8prLYsoRJ61pPeHctD/logo.svg',
    priority: 52
  },
  STEP: {
    symbol: 'STEP',
    name: 'Step Finance',
    mint: 'StepAscQoEioFxxWGnh2sLBDFp9d8rvKz2Yp39iDpyT',
    decimals: 9,
    category: 'defi',
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/StepAscQoEioFxxWGnh2sLBDFp9d8rvKz2Yp39iDpyT/logo.png',
    priority: 54
  },
  HADES: {
    symbol: 'HADES',
    name: 'Hades Money',
    mint: 'HadesXsVQAwahrZQCLiZdZzKWPmX88fBYz7fJr8MBvpp',
    decimals: 9,
    category: 'defi',
    logoURI: 'https://dexscreener.com/img/projects/hades.png',
    priority: 46
  },

  // Newer DeFi Protocols
  JITO: {
    symbol: 'JITO',
    name: 'Jito',
    mint: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
    decimals: 9,
    category: 'defi',
    logoURI: 'https://assets.coingecko.com/coins/images/31548/small/jito.png',
    priority: 58
  },
  FRAKT: {
    symbol: 'FRAKT',
    name: 'Frakt Protocol',
    mint: 'FRAktLLR59sRsGk1hJGzYJTrKNG8QcnE3wuyDbeM3QuF',
    decimals: 6,
    category: 'defi',
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/FRAktLLR59sRsGk1hJGzYJTrKNG8QcnE3wuyDbeM3QuF/logo.png',
    priority: 49
  },
  PRISM: {
    symbol: 'PRISM',
    name: 'Prism DEX',
    mint: 'PRSMcmrLsruyYbHJJNLHNPAKzyYg5En5m1Z1Fgz8SvY',
    decimals: 6,
    category: 'defi',
    logoURI: 'https://assets.coingecko.com/coins/images/33469/small/prism_dex.jpeg',
    priority: 49
  },
  SBONK: {
    symbol: 'sBONK',
    name: 'Staked BONK',
    mint: 'sKUZuwQkWBh9mHrJsHFHQWDwSmJsx5ZMYvwquEP9L91',
    decimals: 5,
    category: 'defi',
    logoURI: 'https://assets.coingecko.com/coins/images/32592/small/staked-bonk.png',
    priority: 44
  },

  // NFT & Gaming Tokens
  DUST: {
    symbol: 'DUST',
    name: 'Star Atlas DUST',
    mint: 'DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ',
    decimals: 6,
    category: 'gaming',
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ/logo.png',
    priority: 43
  },
  GARI: {
    symbol: 'GARI',
    name: 'Gari Network',
    mint: 'CKaKtYvz6dKPyMvYq9Rh3UBrnNqYZAyd7iF4hJtjUvks',
    decimals: 9,
    category: 'social',
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/CKaKtYvz6dKPyMvYq9Rh3UBrnNqYZAyd7iF4hJtjUvks/logo.png',
    priority: 43
  },
  FORGE: {
    symbol: 'FORGE',
    name: 'Forge',
    mint: 'FORGEkuMU9Y25WXcKjBqFJHJ2JRXsJ4tanV6UYf7YYdC',
    decimals: 9,
    category: 'gaming',
    logoURI: 'https://assets.coingecko.com/coins/images/32422/small/forge.png',
    priority: 40
  },
  ATLAS: {
    symbol: 'ATLAS',
    name: 'Star Atlas',
    mint: 'ATLASXmbPQxBUYbxPsV97usA3fPQYEqzQBUHgiFCUsXx',
    decimals: 8,
    category: 'gaming',
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/ATLASXmbPQxBUYbxPsV97usA3fPQYEqzQBUHgiFCUsXx/logo.png',
    priority: 45
  }
};

// Token pairs to monitor for arbitrage opportunities
const TOKEN_PAIRS = [
  // Stablecoin pairs
  { inputMint: TOKENS.USDC.mint, outputMint: TOKENS.USDT.mint, name: 'USDC-USDT', minProfitPercent: 0.1, maxSlippagePercent: 0.1 },
  
  // Major token pairs
  { inputMint: TOKENS.SOL.mint, outputMint: TOKENS.USDC.mint, name: 'SOL-USDC', minProfitPercent: 0.5, maxSlippagePercent: 0.5 },
  { inputMint: TOKENS.BTC.mint, outputMint: TOKENS.USDC.mint, name: 'BTC-USDC', minProfitPercent: 0.5, maxSlippagePercent: 0.5 },
  { inputMint: TOKENS.ETH.mint, outputMint: TOKENS.USDC.mint, name: 'ETH-USDC', minProfitPercent: 0.5, maxSlippagePercent: 0.5 },
  
  // DeFi token pairs
  { inputMint: TOKENS.JUP.mint, outputMint: TOKENS.USDC.mint, name: 'JUP-USDC', minProfitPercent: 1.0, maxSlippagePercent: 1.0 },
  { inputMint: TOKENS.RAY.mint, outputMint: TOKENS.USDC.mint, name: 'RAY-USDC', minProfitPercent: 1.0, maxSlippagePercent: 1.0 },
  { inputMint: TOKENS.BONK.mint, outputMint: TOKENS.USDC.mint, name: 'BONK-USDC', minProfitPercent: 1.5, maxSlippagePercent: 1.5 },
  
  // Cross pairs
  { inputMint: TOKENS.SOL.mint, outputMint: TOKENS.BTC.mint, name: 'SOL-BTC', minProfitPercent: 0.8, maxSlippagePercent: 0.8 },
  { inputMint: TOKENS.SOL.mint, outputMint: TOKENS.ETH.mint, name: 'SOL-ETH', minProfitPercent: 0.8, maxSlippagePercent: 0.8 },
  { inputMint: TOKENS.BTC.mint, outputMint: TOKENS.ETH.mint, name: 'BTC-ETH', minProfitPercent: 0.8, maxSlippagePercent: 0.8 },

  // Additional pairs
  { inputMint: TOKENS.JUP.mint, outputMint: TOKENS.SOL.mint, name: 'JUP-SOL', minProfitPercent: 1.0, maxSlippagePercent: 1.0 },
  { inputMint: TOKENS.RAY.mint, outputMint: TOKENS.SOL.mint, name: 'RAY-SOL', minProfitPercent: 1.0, maxSlippagePercent: 1.0 },
  { inputMint: TOKENS.BONK.mint, outputMint: TOKENS.SOL.mint, name: 'BONK-SOL', minProfitPercent: 1.5, maxSlippagePercent: 1.5 },
  { inputMint: TOKENS.JUP.mint, outputMint: TOKENS.ETH.mint, name: 'JUP-ETH', minProfitPercent: 1.2, maxSlippagePercent: 1.2 },
  { inputMint: TOKENS.RAY.mint, outputMint: TOKENS.ETH.mint, name: 'RAY-ETH', minProfitPercent: 1.2, maxSlippagePercent: 1.2 },
  
  // New meme token pairs
  { inputMint: TOKENS.WIF.mint, outputMint: TOKENS.USDC.mint, name: 'WIF-USDC', minProfitPercent: 1.5, maxSlippagePercent: 1.5 },
  { inputMint: TOKENS.WIF.mint, outputMint: TOKENS.SOL.mint, name: 'WIF-SOL', minProfitPercent: 1.5, maxSlippagePercent: 1.5 },
  { inputMint: TOKENS.WIF.mint, outputMint: TOKENS.BONK.mint, name: 'WIF-BONK', minProfitPercent: 2.0, maxSlippagePercent: 2.0 },
  
  // New DeFi token pairs
  { inputMint: TOKENS.ORCA.mint, outputMint: TOKENS.USDC.mint, name: 'ORCA-USDC', minProfitPercent: 1.0, maxSlippagePercent: 1.0 },
  { inputMint: TOKENS.ORCA.mint, outputMint: TOKENS.SOL.mint, name: 'ORCA-SOL', minProfitPercent: 1.0, maxSlippagePercent: 1.0 },
  { inputMint: TOKENS.ORCA.mint, outputMint: TOKENS.JUP.mint, name: 'ORCA-JUP', minProfitPercent: 1.2, maxSlippagePercent: 1.2 },
  
  { inputMint: TOKENS.MNGO.mint, outputMint: TOKENS.USDC.mint, name: 'MNGO-USDC', minProfitPercent: 1.2, maxSlippagePercent: 1.2 },
  { inputMint: TOKENS.MNGO.mint, outputMint: TOKENS.SOL.mint, name: 'MNGO-SOL', minProfitPercent: 1.2, maxSlippagePercent: 1.2 },
  
  { inputMint: TOKENS.PYTH.mint, outputMint: TOKENS.USDC.mint, name: 'PYTH-USDC', minProfitPercent: 1.0, maxSlippagePercent: 1.0 },
  { inputMint: TOKENS.PYTH.mint, outputMint: TOKENS.SOL.mint, name: 'PYTH-SOL', minProfitPercent: 1.0, maxSlippagePercent: 1.0 },
  { inputMint: TOKENS.PYTH.mint, outputMint: TOKENS.JUP.mint, name: 'PYTH-JUP', minProfitPercent: 1.5, maxSlippagePercent: 1.5 },

  // New trending tokens
  { inputMint: TOKENS.RNDR.mint, outputMint: TOKENS.USDC.mint, name: 'RNDR-USDC', minProfitPercent: 1.0, maxSlippagePercent: 1.0 },
  { inputMint: TOKENS.RNDR.mint, outputMint: TOKENS.SOL.mint, name: 'RNDR-SOL', minProfitPercent: 1.0, maxSlippagePercent: 1.0 },
  { inputMint: TOKENS.RNDR.mint, outputMint: TOKENS.ETH.mint, name: 'RNDR-ETH', minProfitPercent: 1.2, maxSlippagePercent: 1.2 },

  { inputMint: TOKENS.MOON.mint, outputMint: TOKENS.USDC.mint, name: 'MOON-USDC', minProfitPercent: 2.0, maxSlippagePercent: 2.0 },
  { inputMint: TOKENS.MOON.mint, outputMint: TOKENS.SOL.mint, name: 'MOON-SOL', minProfitPercent: 2.0, maxSlippagePercent: 2.0 },
  { inputMint: TOKENS.MOON.mint, outputMint: TOKENS.BONK.mint, name: 'MOON-BONK', minProfitPercent: 2.5, maxSlippagePercent: 2.5 },
  { inputMint: TOKENS.MOON.mint, outputMint: TOKENS.WIF.mint, name: 'MOON-WIF', minProfitPercent: 2.5, maxSlippagePercent: 2.5 },

  { inputMint: TOKENS.BOME.mint, outputMint: TOKENS.USDC.mint, name: 'BOME-USDC', minProfitPercent: 2.0, maxSlippagePercent: 2.0 },
  { inputMint: TOKENS.BOME.mint, outputMint: TOKENS.SOL.mint, name: 'BOME-SOL', minProfitPercent: 2.0, maxSlippagePercent: 2.0 },
  { inputMint: TOKENS.BOME.mint, outputMint: TOKENS.WIF.mint, name: 'BOME-WIF', minProfitPercent: 2.5, maxSlippagePercent: 2.5 },

  { inputMint: TOKENS.GUAC.mint, outputMint: TOKENS.USDC.mint, name: 'GUAC-USDC', minProfitPercent: 2.0, maxSlippagePercent: 2.0 },
  { inputMint: TOKENS.GUAC.mint, outputMint: TOKENS.SOL.mint, name: 'GUAC-SOL', minProfitPercent: 2.0, maxSlippagePercent: 2.0 },
  { inputMint: TOKENS.GUAC.mint, outputMint: TOKENS.BONK.mint, name: 'GUAC-BONK', minProfitPercent: 2.5, maxSlippagePercent: 2.5 },

  // Stablecoin Cross-Pairs
  { inputMint: TOKENS.USDC.mint, outputMint: TOKENS.DAI.mint, name: 'USDC-DAI', minProfitPercent: 0.1, maxSlippagePercent: 0.1 },
  { inputMint: TOKENS.USDT.mint, outputMint: TOKENS.DAI.mint, name: 'USDT-DAI', minProfitPercent: 0.1, maxSlippagePercent: 0.1 },
  { inputMint: TOKENS.USDC.mint, outputMint: TOKENS.USDH.mint, name: 'USDC-USDH', minProfitPercent: 0.1, maxSlippagePercent: 0.1 },
  { inputMint: TOKENS.USDT.mint, outputMint: TOKENS.USDH.mint, name: 'USDT-USDH', minProfitPercent: 0.1, maxSlippagePercent: 0.1 },
  { inputMint: TOKENS.DAI.mint, outputMint: TOKENS.USDH.mint, name: 'DAI-USDH', minProfitPercent: 0.2, maxSlippagePercent: 0.2 },

  // DeFi Blue Chip Pairs
  { inputMint: TOKENS.MSOL.mint, outputMint: TOKENS.USDC.mint, name: 'MSOL-USDC', minProfitPercent: 0.5, maxSlippagePercent: 0.5 },
  { inputMint: TOKENS.MSOL.mint, outputMint: TOKENS.SOL.mint, name: 'MSOL-SOL', minProfitPercent: 0.3, maxSlippagePercent: 0.3 },
  { inputMint: TOKENS.MEAN.mint, outputMint: TOKENS.USDC.mint, name: 'MEAN-USDC', minProfitPercent: 1.0, maxSlippagePercent: 1.0 },
  { inputMint: TOKENS.MEAN.mint, outputMint: TOKENS.SOL.mint, name: 'MEAN-SOL', minProfitPercent: 1.0, maxSlippagePercent: 1.0 },
  { inputMint: TOKENS.STEP.mint, outputMint: TOKENS.USDC.mint, name: 'STEP-USDC', minProfitPercent: 1.0, maxSlippagePercent: 1.0 },
  { inputMint: TOKENS.STEP.mint, outputMint: TOKENS.SOL.mint, name: 'STEP-SOL', minProfitPercent: 1.0, maxSlippagePercent: 1.0 },
  { inputMint: TOKENS.HADES.mint, outputMint: TOKENS.USDC.mint, name: 'HADES-USDC', minProfitPercent: 1.2, maxSlippagePercent: 1.2 },
  { inputMint: TOKENS.HADES.mint, outputMint: TOKENS.SOL.mint, name: 'HADES-SOL', minProfitPercent: 1.2, maxSlippagePercent: 1.2 },

  // Newer DeFi Pairs
  { inputMint: TOKENS.JITO.mint, outputMint: TOKENS.USDC.mint, name: 'JITO-USDC', minProfitPercent: 0.7, maxSlippagePercent: 0.7 },
  { inputMint: TOKENS.JITO.mint, outputMint: TOKENS.SOL.mint, name: 'JITO-SOL', minProfitPercent: 0.5, maxSlippagePercent: 0.5 },
  { inputMint: TOKENS.FRAKT.mint, outputMint: TOKENS.USDC.mint, name: 'FRAKT-USDC', minProfitPercent: 1.2, maxSlippagePercent: 1.2 },
  { inputMint: TOKENS.FRAKT.mint, outputMint: TOKENS.SOL.mint, name: 'FRAKT-SOL', minProfitPercent: 1.2, maxSlippagePercent: 1.2 },
  { inputMint: TOKENS.PRISM.mint, outputMint: TOKENS.USDC.mint, name: 'PRISM-USDC', minProfitPercent: 1.2, maxSlippagePercent: 1.2 },
  { inputMint: TOKENS.PRISM.mint, outputMint: TOKENS.SOL.mint, name: 'PRISM-SOL', minProfitPercent: 1.2, maxSlippagePercent: 1.2 },
  { inputMint: TOKENS.SBONK.mint, outputMint: TOKENS.USDC.mint, name: 'SBONK-USDC', minProfitPercent: 1.5, maxSlippagePercent: 1.5 },
  { inputMint: TOKENS.SBONK.mint, outputMint: TOKENS.BONK.mint, name: 'SBONK-BONK', minProfitPercent: 0.8, maxSlippagePercent: 0.8 },

  // NFT & Gaming Token Pairs
  { inputMint: TOKENS.DUST.mint, outputMint: TOKENS.USDC.mint, name: 'DUST-USDC', minProfitPercent: 1.2, maxSlippagePercent: 1.2 },
  { inputMint: TOKENS.DUST.mint, outputMint: TOKENS.SOL.mint, name: 'DUST-SOL', minProfitPercent: 1.2, maxSlippagePercent: 1.2 },
  { inputMint: TOKENS.GARI.mint, outputMint: TOKENS.USDC.mint, name: 'GARI-USDC', minProfitPercent: 1.5, maxSlippagePercent: 1.5 },
  { inputMint: TOKENS.GARI.mint, outputMint: TOKENS.SOL.mint, name: 'GARI-SOL', minProfitPercent: 1.5, maxSlippagePercent: 1.5 },
  { inputMint: TOKENS.FORGE.mint, outputMint: TOKENS.USDC.mint, name: 'FORGE-USDC', minProfitPercent: 1.5, maxSlippagePercent: 1.5 },
  { inputMint: TOKENS.FORGE.mint, outputMint: TOKENS.SOL.mint, name: 'FORGE-SOL', minProfitPercent: 1.5, maxSlippagePercent: 1.5 },
  { inputMint: TOKENS.ATLAS.mint, outputMint: TOKENS.USDC.mint, name: 'ATLAS-USDC', minProfitPercent: 1.0, maxSlippagePercent: 1.0 },
  { inputMint: TOKENS.ATLAS.mint, outputMint: TOKENS.SOL.mint, name: 'ATLAS-SOL', minProfitPercent: 1.0, maxSlippagePercent: 1.0 },

  // Cross Category Pairs
  { inputMint: TOKENS.JITO.mint, outputMint: TOKENS.MSOL.mint, name: 'JITO-MSOL', minProfitPercent: 0.5, maxSlippagePercent: 0.5 },
  { inputMint: TOKENS.MSOL.mint, outputMint: TOKENS.ETH.mint, name: 'MSOL-ETH', minProfitPercent: 0.8, maxSlippagePercent: 0.8 },
  { inputMint: TOKENS.ATLAS.mint, outputMint: TOKENS.DUST.mint, name: 'ATLAS-DUST', minProfitPercent: 1.2, maxSlippagePercent: 1.2 }
];

// Triangular arbitrage paths to check
const TRIANGULAR_PATHS = [
  // USDC -> SOL -> BTC -> USDC
  { a: TOKENS.USDC.mint, b: TOKENS.SOL.mint, c: TOKENS.BTC.mint, name: 'USDC-SOL-BTC', minProfitPercent: 1.0, maxSlippagePercent: 0.5 },
  // USDC -> SOL -> ETH -> USDC
  { a: TOKENS.USDC.mint, b: TOKENS.SOL.mint, c: TOKENS.ETH.mint, name: 'USDC-SOL-ETH', minProfitPercent: 1.0, maxSlippagePercent: 0.5 },
  // USDC -> JUP -> SOL -> USDC
  { a: TOKENS.USDC.mint, b: TOKENS.JUP.mint, c: TOKENS.SOL.mint, name: 'USDC-JUP-SOL', minProfitPercent: 1.2, maxSlippagePercent: 1.0 },
  // USDC -> BONK -> SOL -> USDC
  { a: TOKENS.USDC.mint, b: TOKENS.BONK.mint, c: TOKENS.SOL.mint, name: 'USDC-BONK-SOL', minProfitPercent: 1.5, maxSlippagePercent: 1.5 },
  
  // Additional triangular paths
  // USDC -> ETH -> BTC -> USDC
  { a: TOKENS.USDC.mint, b: TOKENS.ETH.mint, c: TOKENS.BTC.mint, name: 'USDC-ETH-BTC', minProfitPercent: 1.0, maxSlippagePercent: 0.5 },
  // USDC -> JUP -> ETH -> USDC
  { a: TOKENS.USDC.mint, b: TOKENS.JUP.mint, c: TOKENS.ETH.mint, name: 'USDC-JUP-ETH', minProfitPercent: 1.2, maxSlippagePercent: 1.0 },
  // USDC -> RAY -> SOL -> USDC
  { a: TOKENS.USDC.mint, b: TOKENS.RAY.mint, c: TOKENS.SOL.mint, name: 'USDC-RAY-SOL', minProfitPercent: 1.2, maxSlippagePercent: 1.0 },
  // USDC -> RAY -> ETH -> USDC
  { a: TOKENS.USDC.mint, b: TOKENS.RAY.mint, c: TOKENS.ETH.mint, name: 'USDC-RAY-ETH', minProfitPercent: 1.2, maxSlippagePercent: 1.0 },
  
  // New triangular paths with WIF
  { a: TOKENS.USDC.mint, b: TOKENS.WIF.mint, c: TOKENS.SOL.mint, name: 'USDC-WIF-SOL', minProfitPercent: 1.5, maxSlippagePercent: 1.5 },
  { a: TOKENS.USDC.mint, b: TOKENS.WIF.mint, c: TOKENS.BONK.mint, name: 'USDC-WIF-BONK', minProfitPercent: 2.0, maxSlippagePercent: 2.0 },
  { a: TOKENS.SOL.mint, b: TOKENS.WIF.mint, c: TOKENS.BONK.mint, name: 'SOL-WIF-BONK', minProfitPercent: 2.0, maxSlippagePercent: 2.0 },
  
  // New triangular paths with ORCA
  { a: TOKENS.USDC.mint, b: TOKENS.ORCA.mint, c: TOKENS.SOL.mint, name: 'USDC-ORCA-SOL', minProfitPercent: 1.2, maxSlippagePercent: 1.0 },
  { a: TOKENS.USDC.mint, b: TOKENS.ORCA.mint, c: TOKENS.JUP.mint, name: 'USDC-ORCA-JUP', minProfitPercent: 1.5, maxSlippagePercent: 1.2 },
  
  // New triangular paths with MNGO
  { a: TOKENS.USDC.mint, b: TOKENS.MNGO.mint, c: TOKENS.SOL.mint, name: 'USDC-MNGO-SOL', minProfitPercent: 1.5, maxSlippagePercent: 1.2 },
  
  // New triangular paths with PYTH
  { a: TOKENS.USDC.mint, b: TOKENS.PYTH.mint, c: TOKENS.SOL.mint, name: 'USDC-PYTH-SOL', minProfitPercent: 1.2, maxSlippagePercent: 1.0 },
  { a: TOKENS.USDC.mint, b: TOKENS.PYTH.mint, c: TOKENS.JUP.mint, name: 'USDC-PYTH-JUP', minProfitPercent: 1.5, maxSlippagePercent: 1.2 },
  
  // Cross-DEX opportunities
  { a: TOKENS.USDC.mint, b: TOKENS.ORCA.mint, c: TOKENS.PYTH.mint, name: 'USDC-ORCA-PYTH', minProfitPercent: 1.5, maxSlippagePercent: 1.2 },
  { a: TOKENS.USDC.mint, b: TOKENS.JUP.mint, c: TOKENS.ORCA.mint, name: 'USDC-JUP-ORCA', minProfitPercent: 1.5, maxSlippagePercent: 1.2 },

  // New triangular paths with RNDR
  { a: TOKENS.USDC.mint, b: TOKENS.RNDR.mint, c: TOKENS.SOL.mint, name: 'USDC-RNDR-SOL', minProfitPercent: 1.2, maxSlippagePercent: 1.0 },
  { a: TOKENS.USDC.mint, b: TOKENS.RNDR.mint, c: TOKENS.ETH.mint, name: 'USDC-RNDR-ETH', minProfitPercent: 1.5, maxSlippagePercent: 1.2 },

  // New meme token triangular paths
  { a: TOKENS.USDC.mint, b: TOKENS.MOON.mint, c: TOKENS.SOL.mint, name: 'USDC-MOON-SOL', minProfitPercent: 2.0, maxSlippagePercent: 2.0 },
  { a: TOKENS.USDC.mint, b: TOKENS.MOON.mint, c: TOKENS.WIF.mint, name: 'USDC-MOON-WIF', minProfitPercent: 2.5, maxSlippagePercent: 2.5 },
  { a: TOKENS.USDC.mint, b: TOKENS.MOON.mint, c: TOKENS.BONK.mint, name: 'USDC-MOON-BONK', minProfitPercent: 2.5, maxSlippagePercent: 2.5 },

  { a: TOKENS.USDC.mint, b: TOKENS.BOME.mint, c: TOKENS.SOL.mint, name: 'USDC-BOME-SOL', minProfitPercent: 2.0, maxSlippagePercent: 2.0 },
  { a: TOKENS.USDC.mint, b: TOKENS.BOME.mint, c: TOKENS.WIF.mint, name: 'USDC-BOME-WIF', minProfitPercent: 2.5, maxSlippagePercent: 2.5 },

  { a: TOKENS.USDC.mint, b: TOKENS.GUAC.mint, c: TOKENS.SOL.mint, name: 'USDC-GUAC-SOL', minProfitPercent: 2.0, maxSlippagePercent: 2.0 },
  { a: TOKENS.USDC.mint, b: TOKENS.GUAC.mint, c: TOKENS.BONK.mint, name: 'USDC-GUAC-BONK', minProfitPercent: 2.5, maxSlippagePercent: 2.5 },

  // Cross-category opportunities
  { a: TOKENS.USDC.mint, b: TOKENS.WIF.mint, c: TOKENS.GUAC.mint, name: 'USDC-WIF-GUAC', minProfitPercent: 2.5, maxSlippagePercent: 2.5 },
  { a: TOKENS.USDC.mint, b: TOKENS.BONK.mint, c: TOKENS.MOON.mint, name: 'USDC-BONK-MOON', minProfitPercent: 2.5, maxSlippagePercent: 2.5 },

  // Stablecoin Triangular Paths
  { a: TOKENS.USDC.mint, b: TOKENS.USDT.mint, c: TOKENS.DAI.mint, name: 'USDC-USDT-DAI', minProfitPercent: 0.15, maxSlippagePercent: 0.1 },
  { a: TOKENS.USDC.mint, b: TOKENS.DAI.mint, c: TOKENS.USDH.mint, name: 'USDC-DAI-USDH', minProfitPercent: 0.2, maxSlippagePercent: 0.15 },
  { a: TOKENS.USDT.mint, b: TOKENS.USDH.mint, c: TOKENS.DAI.mint, name: 'USDT-USDH-DAI', minProfitPercent: 0.2, maxSlippagePercent: 0.15 },

  // DeFi Blue Chip Triangular Paths
  { a: TOKENS.USDC.mint, b: TOKENS.SOL.mint, c: TOKENS.MSOL.mint, name: 'USDC-SOL-MSOL', minProfitPercent: 0.5, maxSlippagePercent: 0.3 },
  { a: TOKENS.USDC.mint, b: TOKENS.MSOL.mint, c: TOKENS.JITO.mint, name: 'USDC-MSOL-JITO', minProfitPercent: 0.8, maxSlippagePercent: 0.5 },
  { a: TOKENS.USDC.mint, b: TOKENS.STEP.mint, c: TOKENS.MEAN.mint, name: 'USDC-STEP-MEAN', minProfitPercent: 1.2, maxSlippagePercent: 1.0 },
  { a: TOKENS.USDC.mint, b: TOKENS.HADES.mint, c: TOKENS.ORCA.mint, name: 'USDC-HADES-ORCA', minProfitPercent: 1.5, maxSlippagePercent: 1.2 },
  { a: TOKENS.USDC.mint, b: TOKENS.JITO.mint, c: TOKENS.SOL.mint, name: 'USDC-JITO-SOL', minProfitPercent: 0.8, maxSlippagePercent: 0.5 },
  { a: TOKENS.USDC.mint, b: TOKENS.JITO.mint, c: TOKENS.MSOL.mint, name: 'USDC-JITO-MSOL', minProfitPercent: 0.8, maxSlippagePercent: 0.5 },

  // Newer DeFi Triangular Paths
  { a: TOKENS.USDC.mint, b: TOKENS.FRAKT.mint, c: TOKENS.PRISM.mint, name: 'USDC-FRAKT-PRISM', minProfitPercent: 1.5, maxSlippagePercent: 1.2 },
  { a: TOKENS.USDC.mint, b: TOKENS.BONK.mint, c: TOKENS.SBONK.mint, name: 'USDC-BONK-SBONK', minProfitPercent: 1.0, maxSlippagePercent: 1.0 },
  { a: TOKENS.SOL.mint, b: TOKENS.BONK.mint, c: TOKENS.SBONK.mint, name: 'SOL-BONK-SBONK', minProfitPercent: 1.2, maxSlippagePercent: 1.0 },

  // NFT & Gaming Triangular Paths
  { a: TOKENS.USDC.mint, b: TOKENS.DUST.mint, c: TOKENS.ATLAS.mint, name: 'USDC-DUST-ATLAS', minProfitPercent: 1.5, maxSlippagePercent: 1.2 },
  { a: TOKENS.USDC.mint, b: TOKENS.GARI.mint, c: TOKENS.FORGE.mint, name: 'USDC-GARI-FORGE', minProfitPercent: 2.0, maxSlippagePercent: 1.5 },
  { a: TOKENS.SOL.mint, b: TOKENS.ATLAS.mint, c: TOKENS.DUST.mint, name: 'SOL-ATLAS-DUST', minProfitPercent: 1.5, maxSlippagePercent: 1.2 },

  // Complex Cross-Category Paths
  { a: TOKENS.USDC.mint, b: TOKENS.MSOL.mint, c: TOKENS.WIF.mint, name: 'USDC-MSOL-WIF', minProfitPercent: 1.8, maxSlippagePercent: 1.5 },
  { a: TOKENS.USDC.mint, b: TOKENS.BONK.mint, c: TOKENS.SBONK.mint, name: 'USDC-BONK-SBONK', minProfitPercent: 1.2, maxSlippagePercent: 1.0 },
  { a: TOKENS.SOL.mint, b: TOKENS.JITO.mint, c: TOKENS.MSOL.mint, name: 'SOL-JITO-MSOL', minProfitPercent: 0.7, maxSlippagePercent: 0.5 }
];

// Blacklisted tokens - tokens to avoid trading
const BLACKLISTED_TOKENS = [
  // Add any tokens you want to avoid here
  // 'TokenAddressHere'
];

// Whitelisted tokens - if set, only these tokens will be traded
const WHITELISTED_TOKENS = [
  // If empty, all tokens except blacklisted ones will be considered
  // If populated, only these tokens will be considered
  TOKENS.USDC.mint,
  TOKENS.USDT.mint,
  TOKENS.SOL.mint,
  TOKENS.BTC.mint,
  TOKENS.ETH.mint,
  TOKENS.JUP.mint,
  TOKENS.RAY.mint,
  TOKENS.BONK.mint,
  TOKENS.WIF.mint,
  TOKENS.ORCA.mint,
  TOKENS.MNGO.mint,
  TOKENS.PYTH.mint,
  TOKENS.RNDR.mint,
  TOKENS.MOON.mint,
  TOKENS.BOME.mint,
  TOKENS.GUAC.mint,
  TOKENS.DAI.mint,
  TOKENS.USDH.mint,
  TOKENS.MSOL.mint,
  TOKENS.MEAN.mint,
  TOKENS.STEP.mint,
  TOKENS.HADES.mint,
  TOKENS.JITO.mint,
  TOKENS.FRAKT.mint,
  TOKENS.PRISM.mint,
  TOKENS.SBONK.mint,
  TOKENS.DUST.mint,
  TOKENS.GARI.mint,
  TOKENS.FORGE.mint,
  TOKENS.ATLAS.mint
];

module.exports = {
  TOKENS,
  TOKEN_PAIRS,
  TRIANGULAR_PATHS,
  BLACKLISTED_TOKENS,
  WHITELISTED_TOKENS
};
