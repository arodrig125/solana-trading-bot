import React from 'react';
import {
  Box,
  Badge,
  Button,
  Flex,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue,
  Divider,
  Icon,
  Tooltip,
  HStack,
  SimpleGrid,
} from '@chakra-ui/react';
import { FiClock, FiPlay, FiAlertTriangle, FiInfo, FiTrendingUp } from 'react-icons/fi';
import TokenPathFlow from './TokenPathFlow';

const OpportunityCard = ({ opportunity, onTradeClick }) => {
  const {
    type,
    path,
    profitAmount,
    profitPercent,
    estimatedTime,
    risk,
    successRate,
    avgLatency,
    volatility,
    volume24h,
    dexSuccessRates,
  } = opportunity;

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const riskColors = {
    low: 'green',
    medium: 'yellow',
    high: 'red',
  };

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      borderColor={borderColor}
      bg={bgColor}
      boxShadow="base"
      _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
      transition="all 0.3s"
      position="relative"
    >
      {/* Card Header */}
      <Flex p={4} justify="space-between" align="center">
        <Badge
          px={2}
          py={1}
          bg={type === 'triangular' ? 'blue.500' : 'purple.500'}
          color="white"
          borderRadius="md"
        >
          {type === 'triangular' ? 'Triangular Arbitrage' : 'Simple Swap'}
        </Badge>
        
        <HStack spacing={2}>
          <Tooltip label={`Risk level: ${risk.toUpperCase()}`} placement="top">
            <Badge
              variant="subtle"
              colorScheme={riskColors[risk]}
              px={2}
              py={1}
              borderRadius="md"
            >
              {risk.toUpperCase()}
            </Badge>
          </Tooltip>
          
          <Tooltip label={estimatedTime} placement="top">
            <Flex align="center">
              <Icon as={FiClock} color="gray.400" />
              <Text ml={1} fontSize="sm" color="gray.500">
                {estimatedTime}
              </Text>
            </Flex>
          </Tooltip>
        </HStack>
      </Flex>

      {/* Token Path */}
      <Box p={4} pt={0}>
        <TokenPathFlow path={path} showProfit={true} profitPercent={profitPercent} />
      </Box>

      <Divider />

      {/* Metrics Grid */}
      <SimpleGrid columns={2} gap={4} p={4}>
        {/* Profit Information */}
        <Stat>
          <StatLabel>Profit</StatLabel>
          <StatNumber color="green.500">${profitAmount.toFixed(2)}</StatNumber>
          <StatHelpText>
            <Flex align="center" color="green.500">
              <Icon as={FiTrendingUp} mr={1} />
              {profitPercent.toFixed(2)}%
            </Flex>
          </StatHelpText>
        </Stat>

        {/* Success Rate */}
        <Stat>
          <StatLabel>Success Rate</StatLabel>
          <StatNumber color={successRate >= 80 ? "green.500" : "orange.500"}>
            {successRate}%
          </StatNumber>
          <StatHelpText>
            <Flex align="center">
              <Icon as={FiClock} mr={1} />
              {avgLatency}ms avg
            </Flex>
          </StatHelpText>
        </Stat>

        {/* Volume */}
        <Stat>
          <StatLabel>24h Volume</StatLabel>
          <StatNumber fontSize="lg">${(volume24h / 1000).toFixed(1)}K</StatNumber>
          <StatHelpText>
            <Flex align="center" color={volatility <= 0.5 ? "green.500" : "orange.500"}>
              <Icon as={volatility <= 0.5 ? FiInfo : FiAlertTriangle} mr={1} />
              {(volatility * 100).toFixed(1)}% volatility
            </Flex>
          </StatHelpText>
        </Stat>

        {/* DEX Success Rates */}
        <Stat>
          <StatLabel>DEX Success</StatLabel>
          <StatNumber fontSize="lg">
            {Object.values(dexSuccessRates || {}).reduce((a, b) => a + b, 0) / Object.keys(dexSuccessRates || {}).length}%
          </StatNumber>
          <StatHelpText>
            <Flex align="center">
              {Object.entries(dexSuccessRates || {}).map(([dex, rate]) => (
                <Tooltip key={dex} label={`${dex}: ${rate}% success`}>
                  <Badge
                    ml={1}
                    colorScheme={rate >= 90 ? "green" : rate >= 75 ? "yellow" : "red"}
                    variant="subtle"
                  >
                    {dex}
                  </Badge>
                </Tooltip>
              ))}
            </Flex>
          </StatHelpText>
        </Stat>
      </SimpleGrid>

      <Flex p={4} justify="flex-end">
        <Button
          colorScheme="blue"
          leftIcon={<FiPlay />}
          onClick={() => onTradeClick(opportunity)}
          size="md"
          px={6}
        >
          Trade
        </Button>
      </Flex>

      {/* Risk Indicator */}
      {risk === 'high' && (
        <Tooltip 
          label="This opportunity has higher than normal risk. Proceed with caution."
          placement="top"
        >
          <Box 
            position="absolute" 
            top={4} 
            right={4}
            color="orange.500"
          >
            <Icon as={FiAlertTriangle} w={5} h={5} />
          </Box>
        </Tooltip>
      )}
    </Box>
  );
};

export default OpportunityCard;
