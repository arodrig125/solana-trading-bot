import React, { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  IconButton,
  InputGroup,
  InputLeftElement,
  Input,
  SimpleGrid,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
  Skeleton,
  useDisclosure,
  Alert,
  AlertIcon,
  HStack,
  useColorModeValue,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from '@chakra-ui/react';
import { 
  FiSearch, 
  FiRefreshCw, 
  FiGrid,
  FiList
} from 'react-icons/fi';

// Import custom components
import OpportunityCard from '../components/trading/OpportunityCard';
import EnhancedTradeModal from '../components/trading/EnhancedTradeModal';

// Import trading context
import { useTrading } from '../contexts/TradingContext';



const Trading = () => {
  // Access trading context values and functions
  const {
    opportunities,
    isLoading,
    fetchOpportunities,
    filters,
    updateFilters,
    viewMode,
    setViewMode,
    autoRefresh,
    toggleAutoRefresh
  } = useTrading();
  
  // Local state for UI components 
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal controls
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  
  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const headerBg = useColorModeValue('blue.50', 'gray.700');
  
  // Define skeleton background colors outside of render function to avoid hook rule violations
  const skeletonStartColor = useColorModeValue('gray.100', 'gray.700');
  const skeletonEndColor = useColorModeValue('gray.300', 'gray.500');

  // Handle filter changes
  const handleMinProfitChange = (value) => {
    updateFilters({ minProfit: parseFloat(value) });
  };
  
  const handleRiskFilterChange = (e) => {
    updateFilters({ risk: e.target.value });
  };

  // Handle search query - local filtering only
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Filter opportunities based on search query (for quick local filtering)
  const filteredOpportunities = opportunities.filter((opp) => {
    // Skip filtering if no search query
    if (!searchQuery) return true;
    
    // Filter by token names in the path
    const tokens = opp.path.map(step => [step.from, step.to]).flat();
    return tokens.some(token => 
      token.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });
  
  // Handle trade button click
  const handleTradeClick = (opportunity) => {
    setSelectedOpportunity(opportunity);
    onOpen();
  };
  
  // Handle refresh button click
  const handleRefresh = () => {
    fetchOpportunities();
    toast({
      title: 'Opportunities refreshed',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <Box>
      {/* Header and Filter Section */}
      <Box 
        bg={headerBg} 
        p={6} 
        borderRadius="lg" 
        mb={6}
        boxShadow="sm"
      >
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg">Trading Opportunities</Heading>
          <HStack spacing={2}>
            <IconButton
              icon={<FiRefreshCw />}
              aria-label="Refresh"
              onClick={handleRefresh}
              isLoading={isLoading}
            />
            <IconButton
              icon={viewMode === 'grid' ? <FiList /> : <FiGrid />}
              aria-label="Toggle view"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            />
          </HStack>
        </Flex>
        
        {/* Search and Filters */}
        <Flex 
          direction={{ base: 'column', md: 'row' }} 
          gap={4} 
          flexWrap="wrap"
        >
          <InputGroup maxW={{ base: '100%', md: '300px' }}>
            <InputLeftElement pointerEvents="none">
              <FiSearch color="gray.300" />
            </InputLeftElement>
            <Input 
              placeholder="Search by token name..."
              value={searchQuery}
              onChange={handleSearchChange}
              bg={bgColor}
            />
          </InputGroup>
          
          <Flex gap={4} flex={1} flexWrap="wrap">
            <Box>
              <Text fontSize="sm" mb={1}>Min. Profit %</Text>
              <NumberInput 
                value={filters.minProfit} 
                onChange={handleMinProfitChange}
                min={0} 
                max={10} 
                step={0.1}
                maxW="150px"
              >
                <NumberInputField bg={bgColor} />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </Box>
            
            <Box>
              <Text fontSize="sm" mb={1}>Risk Level</Text>
              <Select 
                value={filters.risk}
                onChange={handleRiskFilterChange}
                bg={bgColor}
                maxW="150px"
              >
                <option value="all">All</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Select>
            </Box>
            
            <Flex align="flex-end">
              <Button
                variant={autoRefresh ? "solid" : "outline"}
                colorScheme="blue"
                leftIcon={<FiRefreshCw />}
                onClick={() => toggleAutoRefresh(!autoRefresh)}
                size="md"
              >
                Auto Refresh {autoRefresh && '(30s)'}
              </Button>
            </Flex>
          </Flex>
        </Flex>
      </Box>
      
      {/* Main Content */}
      <Box>
        {isLoading ? (
          // Loading skeleton
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton 
                key={index} 
                height="200px" 
                borderRadius="lg"
                startColor={skeletonStartColor}
                endColor={skeletonEndColor}
              />
            ))}
          </SimpleGrid>
        ) : filteredOpportunities.length === 0 ? (
          // No results
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Text>No opportunities match your current filters. Try adjusting your criteria.</Text>
          </Alert>
        ) : (
          // Opportunities grid/list
          <Tabs variant="enclosed" colorScheme="blue">
            <TabList mb={4}>
              <Tab>All Opportunities ({filteredOpportunities.length})</Tab>
              <Tab>Triangular ({filteredOpportunities.filter(o => o.type === 'triangular').length})</Tab>
              <Tab>Simple ({filteredOpportunities.filter(o => o.type === 'simple').length})</Tab>
            </TabList>
            
            <TabPanels>
              <TabPanel px={0}>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {filteredOpportunities.map((opportunity) => (
                    <OpportunityCard
                      key={opportunity.id}
                      opportunity={opportunity}
                      onTradeClick={handleTradeClick}
                    />
                  ))}
                </SimpleGrid>
              </TabPanel>
              
              <TabPanel px={0}>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {filteredOpportunities
                    .filter(o => o.type === 'triangular')
                    .map((opportunity) => (
                      <OpportunityCard
                        key={opportunity.id}
                        opportunity={opportunity}
                        onTradeClick={handleTradeClick}
                      />
                    ))
                  }
                </SimpleGrid>
              </TabPanel>
              
              <TabPanel px={0}>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {filteredOpportunities
                    .filter(o => o.type === 'simple')
                    .map((opportunity) => (
                      <OpportunityCard
                        key={opportunity.id}
                        opportunity={opportunity}
                        onTradeClick={handleTradeClick}
                      />
                    ))
                  }
                </SimpleGrid>
              </TabPanel>
            </TabPanels>
          </Tabs>
        )}
      </Box>
      
      {/* Enhanced Trade Modal */}
      <EnhancedTradeModal
        isOpen={isOpen}
        onClose={onClose}
        opportunity={selectedOpportunity}
      />
    </Box>
  );
};

export default Trading;
