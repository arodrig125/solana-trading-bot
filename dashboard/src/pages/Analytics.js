import React from 'react';
import {
  Box,
  Tab,
  Tabs,
  TabList,
  TabPanel,
  TabPanels,
  useColorModeValue
} from '@chakra-ui/react';
import TradingAnalytics from '../components/analytics/TradingAnalytics';
import TradeStats from '../components/charts/TradeStats';
import { TokenPriceTable } from '../components/common/TokenInfo';

const Analytics = () => {
  return (
    <Box>
      <Tabs variant="enclosed" colorScheme="blue" isLazy>
        <TabList mb={4}>
          <Tab>Trading Performance</Tab>
          <Tab>Token Analysis</Tab>
          <Tab>Market Data</Tab>
        </TabList>
        
        <TabPanels
          bg={useColorModeValue('white', 'gray.700')}
          borderWidth="1px"
          borderRadius="lg"
          p={4}
          shadow="sm"
        >
          <TabPanel>
            <TradingAnalytics />
          </TabPanel>
          
          <TabPanel>
            <Box mb={6}>
              <TradeStats />
            </Box>
            
            {/* Add more token analysis components here */}
          </TabPanel>
          
          <TabPanel>
            <TokenPriceTable showVolume={true} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default Analytics;
