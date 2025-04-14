import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  useColorModeValue,
  Spinner,
  Select,
} from '@chakra-ui/react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const TIME_RANGES = {
  '1H': 3600,
  '24H': 86400,
  '7D': 604800,
  '30D': 2592000
};

const PriceChart = ({ tokenSymbol, dex, height = 300 }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24H');
  const [error, setError] = useState(null);

  const chartBg = useColorModeValue('white', 'gray.800');
  const gridColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');

  useEffect(() => {
    const fetchPriceData = async () => {
      setLoading(true);
      try {
        // TODO: Replace with actual API call to get price history
        const response = await fetch(`/api/price-history/${tokenSymbol}?dex=${dex}&timeRange=${TIME_RANGES[timeRange]}`);
        if (!response.ok) throw new Error('Failed to fetch price data');
        const priceData = await response.json();
        setData(priceData);
        setError(null);
      } catch (err) {
        console.error('Error fetching price data:', err);
        setError('Failed to load price data');
      } finally {
        setLoading(false);
      }
    };

    fetchPriceData();
    // Set up real-time updates
    const interval = setInterval(fetchPriceData, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, [tokenSymbol, dex, timeRange]);

  if (loading) {
    return (
      <Flex height={height} align="center" justify="center">
        <Spinner />
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex height={height} align="center" justify="center">
        <Text color="red.500">{error}</Text>
      </Flex>
    );
  }

  return (
    <Box p={4} bg={chartBg} borderRadius="lg" boxShadow="sm">
      <Flex justify="space-between" align="center" mb={4}>
        <Text fontSize="lg" fontWeight="medium">
          {tokenSymbol} Price ({dex})
        </Text>
        <Select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          width="100px"
          size="sm"
        >
          {Object.keys(TIME_RANGES).map(range => (
            <option key={range} value={range}>{range}</option>
          ))}
        </Select>
      </Flex>

      <Box height={height}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4299E1" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#4299E1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(timestamp) => {
                const date = new Date(timestamp * 1000);
                return timeRange === '1H'
                  ? date.toLocaleTimeString()
                  : date.toLocaleDateString();
              }}
              stroke={textColor}
            />
            <YAxis
              stroke={textColor}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: chartBg,
                border: '1px solid #E2E8F0'
              }}
              formatter={(value) => [`$${value.toFixed(4)}`, 'Price']}
              labelFormatter={(timestamp) => {
                const date = new Date(timestamp * 1000);
                return date.toLocaleString();
              }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#4299E1"
              fillOpacity={1}
              fill="url(#colorPrice)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default PriceChart;
