import React, { useState } from 'react';
import {
  Box,
  Flex,
  Select,
  Text,
  useColorModeValue
} from '@chakra-ui/react';
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
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PerformanceChart = ({ performanceData, title = 'Performance' }) => {
  const [timeRange, setTimeRange] = useState('7d');
  const lineColor = useColorModeValue('rgba(49, 130, 206, 1)', 'rgba(99, 179, 237, 1)');
  const gradientColor = useColorModeValue('rgba(49, 130, 206, 0.2)', 'rgba(99, 179, 237, 0.2)');
  const gridColor = useColorModeValue('rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.05)');

  // Sample data format - in a real app, this would adapt based on timeRange
  const data = {
    labels: performanceData?.labels || ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
    datasets: [
      {
        label: 'Profit (USDC)',
        data: performanceData?.data || [0, 56, 128, 185, 290, 376, 410],
        borderColor: lineColor,
        backgroundColor: gradientColor,
        tension: 0.3,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          boxWidth: 15,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: useColorModeValue('rgba(255, 255, 255, 0.9)', 'rgba(50, 50, 50, 0.9)'),
        titleColor: useColorModeValue('#2D3748', '#E2E8F0'),
        bodyColor: useColorModeValue('#2D3748', '#E2E8F0'),
        borderColor: useColorModeValue('rgba(0, 0, 0, 0.1)', 'rgba(255, 255, 255, 0.1)'),
        borderWidth: 1,
        padding: 10,
        boxPadding: 5,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            return `Profit: $${context.parsed.y.toFixed(2)}`;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: gridColor
        },
        ticks: {
          callback: function(value) {
            return '$' + value;
          }
        }
      },
      x: {
        grid: {
          color: gridColor
        }
      }
    }
  };

  const handleTimeRangeChange = (e) => {
    setTimeRange(e.target.value);
    // In a real app, you would fetch new data based on the selected time range
  };

  return (
    <Box>
      <Flex justifyContent="space-between" alignItems="center" mb={4}>
        <Text fontSize="lg" fontWeight="bold">{title}</Text>
        <Select 
          value={timeRange} 
          onChange={handleTimeRangeChange} 
          size="sm" 
          width="auto"
          maxW="150px"
        >
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="3m">Last 3 months</option>
          <option value="all">All time</option>
        </Select>
      </Flex>
      <Box height="300px">
        <Line data={data} options={options} />
      </Box>
    </Box>
  );
};

export default PerformanceChart;
