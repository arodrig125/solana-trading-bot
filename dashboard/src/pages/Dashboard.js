import React, { useState, useEffect } from 'react';
import {
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Text,
  Flex,
  Heading,
  Icon,
  Divider,
  useColorModeValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from '@chakra-ui/react';
import { FiArrowUp, FiArrowDown, FiDollarSign, FiCheckCircle, FiClock, FiX } from 'react-icons/fi';
import { RiExchangeDollarLine } from 'react-icons/ri';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Sample data - in a real app, this would come from your API
const samplePerformanceData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
  datasets: [
    {
      label: 'Profit (USDC)',
      data: [0, 56, 128, 185, 290, 376, 410],
      borderColor: '#4299E1',
      backgroundColor: 'rgba(66, 153, 225, 0.2)',
      fill: true,
    },
  ],
};

const sampleTrades = [
  {
    id: '1',
    path: 'USDC → SOL → ETH → USDC',
    profit: '+$2.58',
    profitPercent: '+1.23%',
    time: '10 min ago',
    status: 'success',
  },
  {
    id: '2',
    path: 'USDC → BONK → SOL → USDC',
    profit: '+$3.17',
    profitPercent: '+1.56%',
    time: '25 min ago',
    status: 'success',
  },
  {
    id: '3',
    path: 'USDC → RAY → SOL → USDC',
    profit: '-$0.12',
    profitPercent: '-0.06%',
    time: '42 min ago',
    status: 'failed',
  },
  {
    id: '4',
    path: 'USDC → JUP → ETH → USDC',
    profit: '+$5.30',
    profitPercent: '+2.65%',
    time: '1 hr ago',
    status: 'success',
  },
];

// Stat card component
const StatCard = ({ title, stat, helpText, type, icon }) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  
  return (
    <Stat
      px={4}
      py={5}
      bg={bgColor}
      shadow="base"
      rounded="lg"
      borderWidth="1px"
      borderColor={useColorModeValue('gray.200', 'gray.700')}
    >
      <Flex justifyContent="space-between">
        <Box pl={2}>
          <StatLabel color={textColor} fontWeight="medium" isTruncated>
            {title}
          </StatLabel>
          <StatNumber fontSize="2xl" fontWeight="semibold">
            {stat}
          </StatNumber>
          {helpText && (
            <StatHelpText>
              {type === 'increase' && <StatArrow type="increase" />}
              {type === 'decrease' && <StatArrow type="decrease" />}
              {helpText}
            </StatHelpText>
          )}
        </Box>
        <Box
          my="auto"
          alignContent="center"
          borderRadius="full"
          bg={useColorModeValue('gray.100', 'gray.700')}
          p={2}
        >
          <Icon as={icon} w={6} h={6} color={useColorModeValue('blue.500', 'blue.300')} />
        </Box>
      </Flex>
    </Stat>
  );
};

const Dashboard = () => {
  const [currentBalance, setCurrentBalance] = useState('$1,458.29');
  const [totalProfit, setTotalProfit] = useState('$410.32');
  const [profitToday, setProfitToday] = useState('$28.16');
  const [totalTrades, setTotalTrades] = useState('143');
  const [successRate, setSuccessRate] = useState('94.3%');
  
  // Simulate loading data when component mounts
  useEffect(() => {
    // Here you would fetch real data from your API
    // fetchDashboardData().then(data => { ... })
  }, []);

  return (
    <Box>
      <Heading mb={6} size="lg">Dashboard</Heading>
      
      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 5 }} spacing={5} mb={8}>
        <StatCard 
          title="Current Balance" 
          stat={currentBalance} 
          icon={FiDollarSign} 
        />
        <StatCard 
          title="Total Profit" 
          stat={totalProfit} 
          helpText="Since inception" 
          type="increase" 
          icon={FiArrowUp} 
        />
        <StatCard 
          title="Today's Profit" 
          stat={profitToday} 
          helpText="+2.3% from yesterday" 
          type="increase" 
          icon={FiArrowUp} 
        />
        <StatCard 
          title="Total Trades" 
          stat={totalTrades} 
          icon={RiExchangeDollarLine} 
        />
        <StatCard 
          title="Success Rate" 
          stat={successRate} 
          icon={FiCheckCircle} 
        />
      </SimpleGrid>
      
      {/* Chart and Recent Trades */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
        {/* Performance Chart */}
        <Box
          bg={useColorModeValue('white', 'gray.700')}
          p={6}
          shadow="base"
          rounded="lg"
          borderWidth="1px"
          borderColor={useColorModeValue('gray.200', 'gray.700')}
        >
          <Heading size="md" mb={4}>Performance History</Heading>
          <Box height="300px">
            <Line 
              data={samplePerformanceData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: useColorModeValue('rgba(0,0,0,0.05)', 'rgba(255,255,255,0.05)')
                    }
                  },
                  x: {
                    grid: {
                      color: useColorModeValue('rgba(0,0,0,0.05)', 'rgba(255,255,255,0.05)')
                    }
                  }
                }
              }} 
            />
          </Box>
        </Box>

        {/* Recent Trades */}
        <Box
          bg={useColorModeValue('white', 'gray.700')}
          p={6}
          shadow="base"
          rounded="lg"
          borderWidth="1px"
          borderColor={useColorModeValue('gray.200', 'gray.700')}
        >
          <Heading size="md" mb={4}>Recent Trades</Heading>
          <TableContainer>
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Path</Th>
                  <Th>Profit</Th>
                  <Th>Time</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {sampleTrades.map((trade) => (
                  <Tr key={trade.id}>
                    <Td>
                      <Text fontSize="sm" fontWeight="medium">{trade.path}</Text>
                    </Td>
                    <Td>
                      <Text 
                        color={trade.profit.startsWith('+') ? 'green.500' : 'red.500'}
                        fontWeight="semibold"
                      >
                        {trade.profit} ({trade.profitPercent})
                      </Text>
                    </Td>
                    <Td>
                      <Flex align="center">
                        <Icon as={FiClock} mr={1} color="gray.500" />
                        <Text fontSize="sm">{trade.time}</Text>
                      </Flex>
                    </Td>
                    <Td>
                      {trade.status === 'success' ? (
                        <Icon as={FiCheckCircle} color="green.500" />
                      ) : (
                        <Icon as={FiX} color="red.500" />
                      )}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      </SimpleGrid>
    </Box>
  );
};

export default Dashboard;
