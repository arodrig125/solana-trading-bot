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
  }
};

// Token pairs to monitor for arbitrage opportunities
const TOKEN_PAIRS = [
  // Stablecoin pairs
  { inputMint: TOKENS.USDC.mint, outputMint: TOKENS.USDT.mint, name: 'USDC-USDT', minProfitPercent: 0.1 },
  
  // Major token pairs
  { inputMint: TOKENS.SOL.mint, outputMint: TOKENS.USDC.mint, name: 'SOL-USDC', minProfitPercent: 0.5 },
  { inputMint: TOKENS.BTC.mint, outputMint: TOKENS.USDC.mint, name: 'BTC-USDC', minProfitPercent: 0.5 },
  { inputMint: TOKENS.ETH.mint, outputMint: TOKENS.USDC.mint, name: 'ETH-USDC', minProfitPercent: 0.5 },
  
  // DeFi token pairs
  { inputMint: TOKENS.JUP.mint, outputMint: TOKENS.USDC.mint, name: 'JUP-USDC', minProfitPercent: 1.0 },
  { inputMint: TOKENS.RAY.mint, outputMint: TOKENS.USDC.mint, name: 'RAY-USDC', minProfitPercent: 1.0 },
  { inputMint: TOKENS.BONK.mint, outputMint: TOKENS.USDC.mint, name: 'BONK-USDC', minProfitPercent: 1.5 },
  
  // Cross pairs
  { inputMint: TOKENS.SOL.mint, outputMint: TOKENS.BTC.mint, name: 'SOL-BTC', minProfitPercent: 0.8 },
  { inputMint: TOKENS.SOL.mint, outputMint: TOKENS.ETH.mint, name: 'SOL-ETH', minProfitPercent: 0.8 },
  { inputMint: TOKENS.BTC.mint, outputMint: TOKENS.ETH.mint, name: 'BTC-ETH', minProfitPercent: 0.8 }
];

// Triangular arbitrage paths to check
const TRIANGULAR_PATHS = [
  // USDC -> SOL -> BTC -> USDC
  { a: TOKENS.USDC.mint, b: TOKENS.SOL.mint, c: TOKENS.BTC.mint, name: 'USDC-SOL-BTC', minProfitPercent: 1.0 },
  // USDC -> SOL -> ETH -> USDC
  { a: TOKENS.USDC.mint, b: TOKENS.SOL.mint, c: TOKENS.ETH.mint, name: 'USDC-SOL-ETH', minProfitPercent: 1.0 },
  // USDC -> JUP -> SOL -> USDC
  { a: TOKENS.USDC.mint, b: TOKENS.JUP.mint, c: TOKENS.SOL.mint, name: 'USDC-JUP-SOL', minProfitPercent: 1.2 },
  // USDC -> BONK -> SOL -> USDC
  { a: TOKENS.USDC.mint, b: TOKENS.BONK.mint, c: TOKENS.SOL.mint, name: 'USDC-BONK-SOL', minProfitPercent: 1.5 }
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
  TOKENS.BONK.mint
];

module.exports = {
  TOKENS,
  TOKEN_PAIRS,
  TRIANGULAR_PATHS,
  BLACKLISTED_TOKENS,
  WHITELISTED_TOKENS
};
