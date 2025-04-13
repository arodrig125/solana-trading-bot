import React from 'react';
import {
  Box,
  Flex,
  Text,
  Image,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Badge,
  Tooltip,
  useColorModeValue
} from '@chakra-ui/react';
import { formatCurrency, formatPercent } from '../../utils/format';

// Default fallback image for tokens without proper icons
const FALLBACK_IMG = 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png';

// Sample token logos - in a real app, these would be fetched from an API or token registry
const TOKEN_LOGOS = {
  'SOL': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
  'USDC': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  'BONK': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263/logo.png',
  'JUP': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN/logo.png',
  'ETH': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/7vfCXTUXP5SmeAGR4fA7RMSMwGNFMGSLkHZU3gA4bzD1/logo.png',
  'RAY': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png',
};

/**
 * Token information component with price and change data
 */
const TokenInfo = ({ 
  token = {}, 
  showPrice = true, 
  showChange = true, 
  showVolume = false,
  size = 'md' // 'sm', 'md', 'lg'
}) => {
  const {
    symbol = 'SOL',
    name = 'Solana',
    price = 123.45,
    change24h = 5.67,
    volume24h = 1500000,
    marketCap = 45678000000,
  } = token;
  
  // Get logo URL or use fallback
  const logoUrl = TOKEN_LOGOS[symbol] || FALLBACK_IMG;
  
  // Determine sizes based on the requested size prop
  const getSize = () => {
    switch (size) {
      case 'sm':
        return {
          iconSize: '24px',
          nameSize: 'xs',
          priceSize: 'sm',
          changeSize: 'xs',
          spacing: 2
        };
      case 'lg':
        return {
          iconSize: '40px',
          nameSize: 'md',
          priceSize: 'xl',
          changeSize: 'sm',
          spacing: 4
        };
      case 'md':
      default:
        return {
          iconSize: '32px',
          nameSize: 'sm',
          priceSize: 'md',
          changeSize: 'xs',
          spacing: 3
        };
    }
  };
  
  const sizes = getSize();
  
  return (
    <Flex 
      align="center" 
      p={2} 
      borderRadius="md"
      _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
    >
      <Image 
        src={logoUrl} 
        alt={`${symbol} logo`} 
        boxSize={sizes.iconSize} 
        borderRadius="full" 
        mr={sizes.spacing}
        fallbackSrc={FALLBACK_IMG}
      />
      
      <Box flex="1">
        <Flex justify="space-between" align="center">
          <Box>
            <Text fontWeight="bold" fontSize={sizes.nameSize}>{symbol}</Text>
            <Text color="gray.500" fontSize={sizes.nameSize === 'xs' ? 'xs' : 'xs'}>{name}</Text>
          </Box>
          
          {showPrice && (
            <Box textAlign="right">
              <Text fontWeight="semibold" fontSize={sizes.priceSize}>
                {formatCurrency(price, 'USD', 2)}
              </Text>
              
              {showChange && (
                <Text 
                  fontSize={sizes.changeSize} 
                  color={change24h >= 0 ? 'green.500' : 'red.500'}
                >
                  <StatArrow type={change24h >= 0 ? 'increase' : 'decrease'} />
                  {Math.abs(change24h).toFixed(2)}%
                </Text>
              )}
            </Box>
          )}
        </Flex>
        
        {showVolume && (
          <Flex mt={1} justify="space-between" fontSize="xs" color="gray.500">
            <Text>Vol: {formatCurrency(volume24h, 'USD', 0)}</Text>
            <Text>MCap: {formatCurrency(marketCap, 'USD', 0)}</Text>
          </Flex>
        )}
      </Box>
    </Flex>
  );
};

/**
 * Token price table for showing multiple tokens
 */
export const TokenPriceTable = ({ tokens = [], showVolume = true }) => {
  // Sample token data for demonstration
  const sampleTokens = [
    { symbol: 'SOL', name: 'Solana', price: 123.45, change24h: 5.67, volume24h: 1500000000, marketCap: 45678000000 },
    { symbol: 'USDC', name: 'USD Coin', price: 1.00, change24h: 0.01, volume24h: 520000000, marketCap: 31500000000 },
    { symbol: 'ETH', name: 'Ethereum (Wormhole)', price: 3456.78, change24h: -2.34, volume24h: 850000000, marketCap: 420000000000 },
    { symbol: 'BONK', name: 'Bonk', price: 0.00002345, change24h: 12.75, volume24h: 75000000, marketCap: 1250000000 },
    { symbol: 'JUP', name: 'Jupiter', price: 1.23, change24h: 8.90, volume24h: 125000000, marketCap: 4300000000 },
  ];
  
  // Use provided tokens or fallback to sample data
  const displayTokens = tokens.length > 0 ? tokens : sampleTokens;
  
  return (
    <Box 
      borderWidth="1px" 
      borderRadius="lg" 
      overflow="hidden"
      bg={useColorModeValue('white', 'gray.700')}
    >
      <Box p={4} borderBottomWidth="1px">
        <Text fontWeight="medium" fontSize="lg">Market Prices</Text>
      </Box>
      
      <Box maxH="400px" overflowY="auto">
        {displayTokens.map((token) => (
          <Box key={token.symbol} p={2} borderBottomWidth="1px" _last={{ borderBottomWidth: 0 }}>
            <TokenInfo 
              token={token} 
              showPrice={true} 
              showChange={true} 
              showVolume={showVolume}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default TokenInfo;
