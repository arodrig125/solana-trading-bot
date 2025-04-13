import React from 'react';
import {
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Heading,
  Text,
  Flex,
  useColorModeValue,
  Tooltip,
  CircularProgress,
  CircularProgressLabel,
  HStack
} from '@chakra-ui/react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend } from 'chart.js';

// Register required Chart.js components
ChartJS.register(ArcElement, ChartTooltip, Legend);

const TradeStats = ({ stats = {} }) => {
  const {
    totalTrades = 143,
    successfulTrades = 135,
    failedTrades = 8,
    avgProfitPercent = 1.87,
    avgTradeAmount = 120.45,
    totalProfit = 410.32,
    bestTrade = 15.75,
    worstTrade = -2.32,
    avgDuration = 3.2,
  } = stats;
  
  const successRate = totalTrades > 0 ? (successfulTrades / totalTrades) * 100 : 0;
  
  // Colors for the chart
  const successColor = useColorModeValue('#38A169', '#68D391'); // green.500 / green.300
  const failColor = useColorModeValue('#E53E3E', '#FC8181'); // red.500 / red.300
  
  // Doughnut chart data
  const chartData = {
    labels: ['Successful Trades', 'Failed Trades'],
    datasets: [
      {
        data: [successfulTrades, failedTrades],
        backgroundColor: [successColor, failColor],
        borderColor: [useColorModeValue('white', 'gray.800')],
        borderWidth: 2,
        hoverOffset: 4
      },
    ],
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 12,
          },
          color: useColorModeValue('#1A202C', '#E2E8F0')
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const percentage = totalTrades > 0 ? (value / totalTrades * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '70%'
  };

  return (
    <Box p={5} shadow="base" borderWidth="1px" borderRadius="lg" bg={useColorModeValue('white', 'gray.700')}>
      <Heading size="md" mb={4}>Trade Statistics</Heading>
      
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
        {/* Success Rate Visualization */}
        <Box height="200px" display="flex" alignItems="center" justifyContent="center">
          <Box position="relative" textAlign="center" width="100%" height="100%">
            <Doughnut data={chartData} options={chartOptions} />
            <Box 
              position="absolute" 
              top="50%" 
              left="50%" 
              transform="translate(-50%, -50%)"
              width="100%"
              pointerEvents="none"
            >
              <Text fontSize="sm" fontWeight="medium" color="gray.500">Success Rate</Text>
              <Text fontSize="2xl" fontWeight="bold" mt={-1}>
                {successRate.toFixed(1)}%
              </Text>
            </Box>
          </Box>
        </Box>
        
        {/* Trade Performance Stats */}
        <SimpleGrid columns={2} spacing={4}>
          <Stat>
            <StatLabel>Total Trades</StatLabel>
            <StatNumber>{totalTrades}</StatNumber>
          </Stat>
          
          <Stat>
            <StatLabel>Total Profit</StatLabel>
            <StatNumber>${totalProfit.toFixed(2)}</StatNumber>
          </Stat>
          
          <Stat>
            <StatLabel>Avg. Profit</StatLabel>
            <StatNumber>{avgProfitPercent.toFixed(2)}%</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              per trade
            </StatHelpText>
          </Stat>
          
          <Stat>
            <StatLabel>Avg. Trade</StatLabel>
            <StatNumber>${avgTradeAmount.toFixed(2)}</StatNumber>
            <StatHelpText>
              {avgDuration.toFixed(1)}s duration
            </StatHelpText>
          </Stat>
        </SimpleGrid>
      </SimpleGrid>
      
      {/* Additional stats */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mt={6}>
        <Box>
          <Text fontSize="sm" fontWeight="medium" color="gray.500">Successful</Text>
          <HStack spacing={2} align="center">
            <Text fontSize="xl" fontWeight="bold" color={successColor}>{successfulTrades}</Text>
            <Text fontSize="xs" color="gray.500">trades</Text>
          </HStack>
        </Box>
        
        <Box>
          <Text fontSize="sm" fontWeight="medium" color="gray.500">Failed</Text>
          <HStack spacing={2} align="center">
            <Text fontSize="xl" fontWeight="bold" color={failColor}>{failedTrades}</Text>
            <Text fontSize="xs" color="gray.500">trades</Text>
          </HStack>
        </Box>
        
        <Box>
          <Text fontSize="sm" fontWeight="medium" color="gray.500">Best Trade</Text>
          <HStack spacing={2} align="center">
            <Text fontSize="xl" fontWeight="bold" color={successColor}>+{bestTrade.toFixed(2)}%</Text>
          </HStack>
        </Box>
        
        <Box>
          <Text fontSize="sm" fontWeight="medium" color="gray.500">Worst Trade</Text>
          <HStack spacing={2} align="center">
            <Text fontSize="xl" fontWeight="bold" color={failColor}>{worstTrade.toFixed(2)}%</Text>
          </HStack>
        </Box>
      </SimpleGrid>
    </Box>
  );
};

export default TradeStats;
