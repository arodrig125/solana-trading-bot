import React from 'react';
import {
  Box,
  Grid,
  GridItem,
  Text,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  List,
  ListItem,
  Badge,
  Flex,
  useColorModeValue,
} from '@chakra-ui/react';
import PriceChart from '../charts/PriceChart';

const TradeAnalytics = ({ opportunity, recentTrades, dexPerformance }) => {
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box>
      {/* Price Charts */}
      <Grid templateColumns="repeat(2, 1fr)" gap={4} mb={6}>
        <GridItem>
          <PriceChart
            tokenSymbol={opportunity.path[0].from}
            dex={opportunity.path[0].dex}
            height={250}
          />
        </GridItem>
        <GridItem>
          <PriceChart
            tokenSymbol={opportunity.path[opportunity.path.length - 1].to}
            dex={opportunity.path[opportunity.path.length - 1].dex}
            height={250}
          />
        </GridItem>
      </Grid>

      {/* DEX Performance */}
      <Box mb={6} p={4} bg={cardBg} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
        <Text fontSize="lg" fontWeight="medium" mb={4}>DEX Performance</Text>
        <Grid templateColumns="repeat(3, 1fr)" gap={4}>
          {opportunity.path.map((step, idx) => {
            const dexStats = dexPerformance[step.dex] || {};
            return (
              <Box key={`${step.dex}-${idx}`} p={4} bg={cardBg} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                <Text fontWeight="medium">{step.dex}</Text>
                <Stack spacing={2} mt={2}>
                  <Stat size="sm">
                    <StatLabel>Success Rate</StatLabel>
                    <StatNumber>{dexStats.successRate || 0}%</StatNumber>
                  </Stat>
                  <Stat size="sm">
                    <StatLabel>Avg Latency</StatLabel>
                    <StatNumber>{dexStats.avgLatency || 0}ms</StatNumber>
                  </Stat>
                  <Stat size="sm">
                    <StatLabel>24h Volume</StatLabel>
                    <StatNumber>${((dexStats.volume24h || 0) / 1000000).toFixed(1)}M</StatNumber>
                  </Stat>
                </Stack>
              </Box>
            );
          })}
        </Grid>
      </Box>

      {/* Recent Similar Trades */}
      <Box mb={6} p={4} bg={cardBg} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
        <Text fontSize="lg" fontWeight="medium" mb={4}>Recent Similar Trades</Text>
        <List spacing={3}>
          {recentTrades
            .filter(trade => 
              trade.path[0].from === opportunity.path[0].from &&
              trade.path[trade.path.length - 1].to === opportunity.path[opportunity.path.length - 1].to
            )
            .slice(0, 3)
            .map((trade, idx) => (
              <ListItem key={`trade-${idx}`} p={3} bg={cardBg} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                <Flex justify="space-between" align="center">
                  <Stack spacing={1}>
                    <Text fontWeight="medium">
                      {trade.inputAmount} {trade.path[0].from} → {trade.outputAmount} {trade.path[trade.path.length - 1].to}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      {new Date(trade.timestamp).toLocaleString()}
                    </Text>
                  </Stack>
                  <Badge
                    colorScheme={trade.success ? 'green' : 'red'}
                    variant="subtle"
                  >
                    {trade.success ? 'Success' : 'Failed'}
                  </Badge>
                </Flex>
              </ListItem>
            ))}
        </List>
      </Box>
    </Box>
  );
};

export default TradeAnalytics;
