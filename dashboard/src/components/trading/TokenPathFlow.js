import React from 'react';
import {
  Box,
  Flex,
  Text,
  Circle,
  Icon,
  useColorModeValue,
  Tooltip,
  HStack,
} from '@chakra-ui/react';
import { FiArrowRight, FiTrendingUp } from 'react-icons/fi';

// Token icons - in a real app, you would use actual token icons from your assets
const getTokenIcon = (token) => {
  const tokenMap = {
    'SOL': '◎', // Solana
    'USDC': '$', // USDC
    'ETH': 'Ξ', // Ethereum
    'BONK': '🐕', // BONK
    'JUP': '♃', // Jupiter
    'RAY': '⚡', // Raydium
    'SRM': '🔶', // Serum
  };

  return tokenMap[token] || '🪙';
};

// Token colors - for visual distinction
const getTokenColor = (token) => {
  const colorMap = {
    'SOL': 'purple',
    'USDC': 'green',
    'ETH': 'blue',
    'BONK': 'orange',
    'JUP': 'teal',
    'RAY': 'cyan',
    'SRM': 'red',
  };

  return colorMap[token] || 'gray';
};

const TokenPathFlow = ({ path, isCompact = false, showProfit = false, profitPercent = 0 }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const arrowColor = useColorModeValue('gray.400', 'gray.500');
  const profitColor = profitPercent > 0 ? 'green.500' : 'red.500';
  
  const nodeSize = isCompact ? 8 : 10;
  const fontSize = isCompact ? 'xs' : 'sm';
  const iconSize = isCompact ? 3 : 4;
  
  return (
    <Flex 
      alignItems="center" 
      justify="center" 
      flexWrap="wrap"
      position="relative"
    >
      {path.map((step, index) => (
        <React.Fragment key={`${step.from}-${step.to}`}>
          {/* FROM Token */}
          {index === 0 && (
            <Tooltip label={step.from} placement="top">
              <Flex direction="column" align="center">
                <Circle 
                  size={`${nodeSize}0px`} 
                  bg={`${getTokenColor(step.from)}.500`} 
                  color="white"
                  fontWeight="bold"
                  fontSize={fontSize}
                >
                  {getTokenIcon(step.from)}
                </Circle>
                <Text fontSize={fontSize} mt={1} fontWeight="medium">{step.from}</Text>
              </Flex>
            </Tooltip>
          )}
          
          {/* Arrow */}
          <Flex direction="column" align="center" mx={2}>
            <Icon 
              as={FiArrowRight} 
              w={iconSize} 
              h={iconSize} 
              color={arrowColor} 
            />
            {!isCompact && (
              <Text fontSize="xs" color="gray.500" mt={1}>via DEX</Text>
            )}
          </Flex>
          
          {/* TO Token */}
          <Tooltip label={step.to} placement="top">
            <Flex direction="column" align="center">
              <Circle 
                size={`${nodeSize}0px`} 
                bg={`${getTokenColor(step.to)}.500`} 
                color="white"
                fontWeight="bold"
                fontSize={fontSize}
              >
                {getTokenIcon(step.to)}
              </Circle>
              <Text fontSize={fontSize} mt={1} fontWeight="medium">{step.to}</Text>
            </Flex>
          </Tooltip>
          
          {/* If there are more steps, add another arrow */}
          {index < path.length - 1 && (
            <Flex direction="column" align="center" mx={2}>
              <Icon 
                as={FiArrowRight} 
                w={iconSize} 
                h={iconSize} 
                color={arrowColor} 
              />
            </Flex>
          )}
        </React.Fragment>
      ))}
      
      {/* Profit indicator */}
      {showProfit && (
        <Box 
          position="absolute" 
          top="-20px" 
          right="0" 
          bg={profitColor}
          color="white"
          px={2}
          py={1}
          borderRadius="md"
          fontSize="xs"
          fontWeight="bold"
        >
          {profitPercent > 0 ? '+' : ''}{profitPercent.toFixed(2)}%
        </Box>
      )}
    </Flex>
  );
};

export default TokenPathFlow;
