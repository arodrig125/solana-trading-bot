import React, { useState, useEffect } from 'react';
import {
  Box,
  SimpleGrid,
  Heading,
  Text,
  Flex,
  Select,
  Button,
  HStack,
  VStack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  useColorModeValue,
  Divider,
  Skeleton,
  Tag,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { FiFilter, FiDownload, FiCalendar } from 'react-icons/fi';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Sample data for charts
const sampleData = {
  daily: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    profit: [12.5, 18.3, 15.7, 20.1, 25.8, 22.6, 28.9],
    trades: [8, 10, 7, 12, 14, 11, 16],
    volume: [450, 580, 520, 630, 780, 690, 850],
  },
  weekly: {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    profit: [68.5, 87.3, 95.7, 102.1],
    trades: [42, 56, 61, 68],
    volume: [2450, 3120, 3580, 3900],
  },
  monthly: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    profit: [210.5, 258.3, 315.7, 292.1, 342.8, 410.6],
    trades: [125, 162, 178, 150, 185, 210],
    volume: [10250, 12800, 14700, 13500, 15800, 18200],
  },
};

// Token performance sample data
const tokenPerformanceData = [
  { token: 'SOL', trades: 45, profitPercent: 2.8, totalProfit: 85.42 },
  { token: 'BONK', trades: 32, profitPercent: 3.6, totalProfit: 65.18 },
  { token: 'JUP', trades: 28, profitPercent: 2.1, totalProfit: 48.73 },
  { token: 'RAY', trades: 18, profitPercent: 1.9, totalProfit: 32.55 },
  { token: 'ETH', trades: 15, profitPercent: 1.5, totalProfit: 27.19 },
];

const TradingAnalytics = () => {
  const [timeRange, setTimeRange] = useState('weekly');
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState(null);
  const [stats, setStats] = useState(null);
  
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const lineColor = useColorModeValue('blue.500', 'blue.300');
  const fillColor = useColorModeValue('blue.50', 'blue.900');
  
  useEffect(() => {
    // Simulate API call to fetch analytics data
    const fetchData = async () => {
      setIsLoading(true);
      
      // In a real app, this would be an API call
      // const response = await apiService.getAnalytics(timeRange);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use sample data based on selected time range
      setChartData(sampleData[timeRange]);
      
      // Calculate summary statistics
      const totalProfit = sampleData[timeRange].profit.reduce((sum, val) => sum + val, 0);
      const totalTrades = sampleData[timeRange].trades.reduce((sum, val) => sum + val, 0);
      const totalVolume = sampleData[timeRange].volume.reduce((sum, val) => sum + val, 0);
      const avgProfitPerTrade = totalProfit / totalTrades;
      
      setStats({
        totalProfit,
        totalTrades,
        totalVolume,
        avgProfitPerTrade,
        successRate: 94.5, // Sample success rate
        topToken: 'BONK', // Sample top performing token
        topTokenProfit: 3.6, // Sample profit percentage for top token
      });
      
      setIsLoading(false);
    };
    
    fetchData();
  }, [timeRange]);
  
  // Prepare data for profit chart
  const profitChartData = {
    labels: chartData?.labels || [],
    datasets: [
      {
        label: 'Profit (USDC)',
        data: chartData?.profit || [],
        borderColor: lineColor,
        backgroundColor: fillColor,
        fill: true,
        tension: 0.3,
      },
    ],
  };
  
  // Prepare data for volume chart
  const volumeChartData = {
    labels: chartData?.labels || [],
    datasets: [
      {
        label: 'Trading Volume (USDC)',
        data: chartData?.volume || [],
        backgroundColor: useColorModeValue('purple.400', 'purple.300'),
        borderRadius: 4,
      },
    ],
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: useColorModeValue('rgba(0,0,0,0.05)', 'rgba(255,255,255,0.05)'),
        },
        ticks: {
          callback: (value) => `$${value}`,
        },
      },
      x: {
        grid: {
          color: useColorModeValue('rgba(0,0,0,0.05)', 'rgba(255,255,255,0.05)'),
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: $${context.parsed.y.toFixed(2)}`,
        },
      },
    },
  };

  return (
    <Box>
      {/* Header and filters */}
      <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={3}>
        <Heading size="lg">Trading Analytics</Heading>
        
        <HStack spacing={3}>
          <HStack>
            <FiCalendar />
            <Select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              w="auto"
              size="sm"
            >
              <option value="daily">Last 7 Days</option>
              <option value="weekly">Last 4 Weeks</option>
              <option value="monthly">Last 6 Months</option>
            </Select>
          </HStack>
          
          <Button leftIcon={<FiDownload />} size="sm" variant="outline">
            Export Data
          </Button>
        </HStack>
      </Flex>
      
      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5} mb={8}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height="100px" borderRadius="lg" />
          ))
        ) : (
          <>
            <Stat
              p={4}
              shadow="sm"
              border="1px solid"
              borderColor={borderColor}
              borderRadius="lg"
              bg={cardBg}
            >
              <StatLabel>Total Profit</StatLabel>
              <StatNumber>${stats?.totalProfit.toFixed(2)}</StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                {timeRange === 'daily' ? 'This week' : timeRange === 'weekly' ? 'This month' : 'This period'}
              </StatHelpText>
            </Stat>
            
            <Stat
              p={4}
              shadow="sm"
              border="1px solid"
              borderColor={borderColor}
              borderRadius="lg"
              bg={cardBg}
            >
              <StatLabel>Total Trades</StatLabel>
              <StatNumber>{stats?.totalTrades}</StatNumber>
              <StatHelpText>
                ${stats?.avgProfitPerTrade.toFixed(2)} avg. profit/trade
              </StatHelpText>
            </Stat>
            
            <Stat
              p={4}
              shadow="sm"
              border="1px solid"
              borderColor={borderColor}
              borderRadius="lg"
              bg={cardBg}
            >
              <StatLabel>Success Rate</StatLabel>
              <StatNumber>{stats?.successRate}%</StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                2.3% from previous period
              </StatHelpText>
            </Stat>
            
            <Stat
              p={4}
              shadow="sm"
              border="1px solid"
              borderColor={borderColor}
              borderRadius="lg"
              bg={cardBg}
            >
              <StatLabel>Best Performing Token</StatLabel>
              <Flex align="center">
                <StatNumber>{stats?.topToken}</StatNumber>
                <Tag colorScheme="green" ml={2} size="sm">
                  +{stats?.topTokenProfit}%
                </Tag>
              </Flex>
              <StatHelpText>
                Based on profit percentage
              </StatHelpText>
            </Stat>
          </>
        )}
      </SimpleGrid>
      
      {/* Charts */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8} mb={8}>
        <Box
          p={6}
          shadow="sm"
          border="1px solid"
          borderColor={borderColor}
          borderRadius="lg"
          bg={cardBg}
        >
          <Heading size="md" mb={4}>Profit History</Heading>
          <Box height="300px">
            {isLoading ? (
              <Skeleton height="100%" startColor="blue.50" endColor="blue.200" />
            ) : (
              <Line data={profitChartData} options={chartOptions} />
            )}
          </Box>
        </Box>
        
        <Box
          p={6}
          shadow="sm"
          border="1px solid"
          borderColor={borderColor}
          borderRadius="lg"
          bg={cardBg}
        >
          <Heading size="md" mb={4}>Trading Volume</Heading>
          <Box height="300px">
            {isLoading ? (
              <Skeleton height="100%" startColor="purple.50" endColor="purple.200" />
            ) : (
              <Bar data={volumeChartData} options={chartOptions} />
            )}
          </Box>
        </Box>
      </SimpleGrid>
      
      {/* Token Performance */}
      <Box
        p={6}
        shadow="sm"
        border="1px solid"
        borderColor={borderColor}
        borderRadius="lg"
        bg={cardBg}
        mb={8}
      >
        <Heading size="md" mb={4}>Token Performance</Heading>
        <Tabs variant="soft-rounded" colorScheme="blue">
          <TabList mb={4}>
            <Tab>By Profit</Tab>
            <Tab>By Trade Count</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel p={0}>
              <SimpleGrid columns={{ base: 1, md: 5 }} spacing={4}>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} height="80px" borderRadius="lg" />
                  ))
                ) : (
                  tokenPerformanceData
                    .sort((a, b) => b.totalProfit - a.totalProfit)
                    .map((token) => (
                      <Box
                        key={token.token}
                        p={4}
                        borderWidth="1px"
                        borderRadius="md"
                        textAlign="center"
                      >
                        <Heading size="md" mb={1}>{token.token}</Heading>
                        <Text fontSize="xl" fontWeight="bold" color="green.500">
                          ${token.totalProfit.toFixed(2)}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          {token.trades} trades | +{token.profitPercent}%
                        </Text>
                      </Box>
                    ))
                )}
              </SimpleGrid>
            </TabPanel>
            
            <TabPanel p={0}>
              <SimpleGrid columns={{ base: 1, md: 5 }} spacing={4}>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} height="80px" borderRadius="lg" />
                  ))
                ) : (
                  tokenPerformanceData
                    .sort((a, b) => b.trades - a.trades)
                    .map((token) => (
                      <Box
                        key={token.token}
                        p={4}
                        borderWidth="1px"
                        borderRadius="md"
                        textAlign="center"
                      >
                        <Heading size="md" mb={1}>{token.token}</Heading>
                        <Text fontSize="xl" fontWeight="bold">
                          {token.trades} trades
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          ${token.totalProfit.toFixed(2)} | +{token.profitPercent}%
                        </Text>
                      </Box>
                    ))
                )}
              </SimpleGrid>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Box>
  );
};

export default TradingAnalytics;
