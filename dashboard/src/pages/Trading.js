import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  Tag,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Select,
  HStack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
  Skeleton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Progress,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiPlay, FiDollarSign, FiPercent, FiTrendingUp, FiInfo } from 'react-icons/fi';

// Sample data - in a real app, this would come from your API
const SAMPLE_OPPORTUNITIES = [
  {
    id: '1',
    type: 'triangular',
    path: [
      { from: 'USDC', to: 'SOL' },
      { from: 'SOL', to: 'ETH' },
      { from: 'ETH', to: 'USDC' }
    ],
    startToken: 'USDC',
    endToken: 'USDC',
    profitAmount: 2.58,
    profitPercent: 1.23,
    estimatedTime: '~2.5s',
    risk: 'low'
  },
  {
    id: '2',
    type: 'triangular',
    path: [
      { from: 'USDC', to: 'BONK' },
      { from: 'BONK', to: 'SOL' },
      { from: 'SOL', to: 'USDC' }
    ],
    startToken: 'USDC',
    endToken: 'USDC',
    profitAmount: 3.45,
    profitPercent: 1.73,
    estimatedTime: '~3s',
    risk: 'medium'
  },
  {
    id: '3',
    type: 'triangular',
    path: [
      { from: 'USDC', to: 'JUP' },
      { from: 'JUP', to: 'ETH' },
      { from: 'ETH', to: 'USDC' }
    ],
    startToken: 'USDC',
    endToken: 'USDC',
    profitAmount: 5.12,
    profitPercent: 2.56,
    estimatedTime: '~2s',
    risk: 'medium'
  },
  {
    id: '4',
    type: 'simple',
    path: [
      { from: 'SOL', to: 'USDC' }
    ],
    startToken: 'SOL',
    endToken: 'USDC',
    profitAmount: 1.05,
    profitPercent: 0.52,
    estimatedTime: '~1s',
    risk: 'low'
  },
];

const TradeModal = ({ isOpen, onClose, opportunity }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [tradeAmount, setTradeAmount] = useState(100);
  const [simulationResult, setSimulationResult] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('confirm'); // confirm, simulating, simulation-complete, executing, complete
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setIsLoading(false);
      setSimulationResult(null);
      setError(null);
      setStep('confirm');
      setProgress(0);
      setResult(null);
    }
  }, [isOpen]);

  const handleSimulate = () => {
    setIsLoading(true);
    setStep('simulating');
    setError(null);
    
    // Start progress animation
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 5;
      setProgress(currentProgress);
      
      if (currentProgress >= 100) {
        clearInterval(interval);
        
        // Simulate API response
        setTimeout(() => {
          setIsLoading(false);
          setStep('simulation-complete');
          setSimulationResult({
            expected: {
              inputAmount: tradeAmount,
              outputAmount: tradeAmount * (1 + (opportunity.profitPercent / 100)),
              profit: tradeAmount * (opportunity.profitPercent / 100),
              profitPercent: opportunity.profitPercent
            },
            fees: {
              total: 0.05,
              breakdown: [
                { name: 'Network fee', amount: 0.02 },
                { name: 'Jupiter fee', amount: 0.02 },
                { name: 'Gas price', amount: 0.01 },
              ]
            },
            riskAssessment: 'low',
          });
        }, 500);
      }
    }, 50);
  };

  const handleExecute = () => {
    setIsLoading(true);
    setStep('executing');
    setError(null);
    setProgress(0);
    
    // Start progress animation
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 2;
      setProgress(currentProgress);
      
      if (currentProgress >= 100) {
        clearInterval(interval);
        
        // Simulate API response
        setTimeout(() => {
          setIsLoading(false);
          setStep('complete');
          
          // 90% chance of success for demo purposes
          if (Math.random() > 0.1) {
            setResult({
              success: true,
              inputAmount: tradeAmount,
              outputAmount: (tradeAmount * (1 + (opportunity.profitPercent / 100))).toFixed(2),
              profit: (tradeAmount * (opportunity.profitPercent / 100)).toFixed(2),
              profitPercent: opportunity.profitPercent.toFixed(2),
              txIds: ['2ZG8WnHc6Z5xM9LmHxrNZx4RnqqfGzWvmWJTc5hFDpBZ', '8sYPCgvHpLZ3SEUVuxV8dong5XVXAiSiJaXpRQbdGmQQ'],
              timestamp: new Date().toISOString(),
            });
            
            toast({
              title: 'Trade executed successfully!',
              description: `Profit: $${(tradeAmount * (opportunity.profitPercent / 100)).toFixed(2)} (${opportunity.profitPercent.toFixed(2)}%)`,
              status: 'success',
              duration: 5000,
              isClosable: true,
            });
          } else {
            setResult({
              success: false,
              error: 'Transaction failed due to price movement',
              timestamp: new Date().toISOString(),
            });
            
            setError('Transaction failed due to price movement');
            
            toast({
              title: 'Trade failed',
              description: 'Transaction failed due to price movement',
              status: 'error',
              duration: 5000,
              isClosable: true,
            });
          }
        }, 500);
      }
    }, 100);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Execute {opportunity?.type === 'triangular' ? 'Triangular' : 'Simple'} Trade
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          {opportunity && (
            <Box>
              <Box mb={6}>
                <Text fontWeight="bold" mb={2}>Trading Path:</Text>
                <HStack spacing={1}>
                  {opportunity.path.map((step, index) => (
                    <React.Fragment key={`${step.from}-${step.to}`}>
                      <Tag size="md" variant="solid" colorScheme="blue">
                        {step.from}
                      </Tag>
                      {index < opportunity.path.length - 1 && (
                        <Box as={FiTrendingUp} />
                      )}
                    </React.Fragment>
                  ))}
                  <Tag size="md" variant="solid" colorScheme="green">
                    {opportunity.path[opportunity.path.length - 1].to}
                  </Tag>
                </HStack>
              </Box>
              
              <Flex mb={6}>
                <Box flex="1">
                  <Text fontWeight="bold" mb={2}>Expected Profit:</Text>
                  <HStack>
                    <Box as={FiDollarSign} />
                    <Text>${opportunity.profitAmount.toFixed(2)}</Text>
                  </HStack>
                </Box>
                
                <Box flex="1">
                  <Text fontWeight="bold" mb={2}>Profit Percentage:</Text>
                  <HStack>
                    <Box as={FiPercent} />
                    <Text>{opportunity.profitPercent.toFixed(2)}%</Text>
                  </HStack>
                </Box>
                
                <Box flex="1">
                  <Text fontWeight="bold" mb={2}>Risk Level:</Text>
                  <Badge colorScheme={opportunity.risk === 'low' ? 'green' : opportunity.risk === 'medium' ? 'yellow' : 'red'}>
                    {opportunity.risk.toUpperCase()}
                  </Badge>
                </Box>
              </Flex>
              
              {step === 'confirm' && (
                <Box mb={6}>
                  <Text fontWeight="bold" mb={2}>Trade Amount (USDC):</Text>
                  <NumberInput 
                    defaultValue={100} 
                    min={10} 
                    max={1000}
                    onChange={(valueString) => setTradeAmount(parseFloat(valueString))}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    Min: $10, Max: $1,000
                  </Text>
                </Box>
              )}
              
              {(step === 'simulating' || step === 'executing') && (
                <Box mb={6}>
                  <Text fontWeight="bold" mb={2}>
                    {step === 'simulating' ? 'Simulating Trade...' : 'Executing Trade...'}
                  </Text>
                  <Progress value={progress} size="sm" colorScheme="blue" mb={2} />
                  <Text fontSize="sm" color="gray.500">
                    {step === 'simulating' ? 'Calculating expected output and fees...' : 'Please wait while we execute your trade...'}
                  </Text>
                </Box>
              )}
              
              {simulationResult && step === 'simulation-complete' && (
                <Box mb={6}>
                  <Alert status="info" mb={4}>
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Simulation Complete</AlertTitle>
                      <AlertDescription>
                        Review the expected results below before executing the trade.
                      </AlertDescription>
                    </Box>
                  </Alert>
                  
                  <Box mb={4}>
                    <Text fontWeight="bold" mb={2}>Expected Output:</Text>
                    <Text>Input: ${simulationResult.expected.inputAmount.toFixed(2)} USDC</Text>
                    <Text>Output: ${simulationResult.expected.outputAmount.toFixed(2)} USDC</Text>
                    <Text color="green.500" fontWeight="bold">
                      Profit: ${simulationResult.expected.profit.toFixed(2)} ({simulationResult.expected.profitPercent.toFixed(2)}%)
                    </Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold" mb={2}>Estimated Fees:</Text>
                    {simulationResult.fees.breakdown.map((fee, index) => (
                      <Text key={index}>{fee.name}: ${fee.amount.toFixed(2)}</Text>
                    ))}
                    <Text fontWeight="bold">Total Fees: ${simulationResult.fees.total.toFixed(2)}</Text>
                  </Box>
                </Box>
              )}
              
              {error && (
                <Alert status="error" mb={4}>
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Box>
                </Alert>
              )}
              
              {step === 'complete' && result && (
                <Box mb={6}>
                  <Alert 
                    status={result.success ? 'success' : 'error'}
                    variant="subtle"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    textAlign="center"
                    height="200px"
                    mb={4}
                  >
                    <AlertIcon boxSize="40px" mr={0} />
                    <AlertTitle mt={4} mb={1} fontSize="lg">
                      {result.success ? 'Trade Successful!' : 'Trade Failed'}
                    </AlertTitle>
                    <AlertDescription maxWidth="sm">
                      {result.success ? (
                        <>
                          <Text>Input: ${result.inputAmount.toFixed(2)} USDC</Text>
                          <Text>Output: ${result.outputAmount} USDC</Text>
                          <Text color="green.500" fontWeight="bold">
                            Profit: ${result.profit} ({result.profitPercent}%)
                          </Text>
                        </>
                      ) : (
                        <Text>{result.error}</Text>
                      )}
                    </AlertDescription>
                  </Alert>
                  
                  {result.success && (
                    <Box>
                      <Text fontWeight="bold" mb={2}>Transaction IDs:</Text>
                      {result.txIds.map((txId, index) => (
                        <Text key={index} fontSize="sm" fontFamily="monospace">
                          {txId}
                        </Text>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          )}
        </ModalBody>

        <ModalFooter>
          {step === 'confirm' && (
            <Button 
              colorScheme="blue" 
              leftIcon={<FiPlay />} 
              onClick={handleSimulate}
              isLoading={isLoading}
            >
              Simulate Trade
            </Button>
          )}
          
          {step === 'simulation-complete' && (
            <HStack spacing={3}>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button 
                colorScheme="green" 
                leftIcon={<FiPlay />} 
                onClick={handleExecute}
                isLoading={isLoading}
              >
                Execute Trade
              </Button>
            </HStack>
          )}
          
          {step === 'complete' && (
            <Button colorScheme="blue" onClick={onClose}>
              Close
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const Trading = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [minProfit, setMinProfit] = useState(0.5);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const bgColor = useColorModeValue('white', 'gray.700');
  
  useEffect(() => {
    // Simulate API call to get opportunities
    const fetchOpportunities = async () => {
      setIsLoading(true);
      
      // In a real app, this would be an API call
      // const response = await api.getArbitrageOpportunities();
      
      // Simulate delay
      setTimeout(() => {
        setOpportunities(SAMPLE_OPPORTUNITIES);
        setIsLoading(false);
      }, 1500);
    };
    
    fetchOpportunities();
    
    // Set up polling interval to refresh opportunities
    const interval = setInterval(() => {
      fetchOpportunities();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  const filteredOpportunities = opportunities.filter(opp => {
    if (filter === 'all') return opp.profitPercent >= minProfit;
    return opp.type === filter && opp.profitPercent >= minProfit;
  });
  
  const handleTradeClick = (opportunity) => {
    setSelectedOpportunity(opportunity);
    onOpen();
  };

  return (
    <Box>
      <Heading mb={6} size="lg">Trading Opportunities</Heading>
      
      {/* Filters */}
      <Flex mb={6} direction={{ base: 'column', md: 'row' }} gap={4}>
        <Box>
          <Text mb={2} fontWeight="medium">Opportunity Type</Text>
          <Select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            bg={bgColor}
          >
            <option value="all">All Types</option>
            <option value="triangular">Triangular Arbitrage</option>
            <option value="simple">Simple Arbitrage</option>
          </Select>
        </Box>
        
        <Box>
          <Text mb={2} fontWeight="medium">Minimum Profit (%)</Text>
          <NumberInput 
            defaultValue={0.5} 
            min={0.1} 
            max={10} 
            step={0.1}
            onChange={(valueString) => setMinProfit(parseFloat(valueString))}
          >
            <NumberInputField bg={bgColor} />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </Box>
      </Flex>
      
      {/* Opportunities Table */}
      <Box
        bg={bgColor}
        shadow="base"
        rounded="lg"
        overflow="hidden"
        borderWidth="1px"
        borderColor={useColorModeValue('gray.200', 'gray.700')}
      >
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Type</Th>
                <Th>Path</Th>
                <Th isNumeric>Profit ($)</Th>
                <Th isNumeric>Profit (%)</Th>
                <Th>Estimated Time</Th>
                <Th>Risk</Th>
                <Th>Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <Tr key={index}>
                    {Array.from({ length: 7 }).map((_, cellIndex) => (
                      <Td key={cellIndex}>
                        <Skeleton height="20px" />
                      </Td>
                    ))}
                  </Tr>
                ))
              ) : filteredOpportunities.length === 0 ? (
                <Tr>
                  <Td colSpan={7} textAlign="center">
                    <Text py={4}>No opportunities match the current filters</Text>
                  </Td>
                </Tr>
              ) : (
                filteredOpportunities.map((opp) => (
                  <Tr key={opp.id}>
                    <Td>
                      <Badge colorScheme={opp.type === 'triangular' ? 'blue' : 'purple'}>
                        {opp.type === 'triangular' ? 'Triangular' : 'Simple'}
                      </Badge>
                    </Td>
                    <Td>
                      <HStack spacing={1} wrap="wrap">
                        {opp.path.map((step, index) => (
                          <React.Fragment key={`${step.from}-${step.to}`}>
                            <Text fontWeight="medium">{step.from}</Text>
                            {index < opp.path.length - 1 && (
                              <Box as={FiTrendingUp} mx={1} />
                            )}
                          </React.Fragment>
                        ))}
                        <Text fontWeight="medium">{opp.path[opp.path.length - 1].to}</Text>
                      </HStack>
                    </Td>
                    <Td isNumeric fontWeight="semibold" color="green.500">
                      ${opp.profitAmount.toFixed(2)}
                    </Td>
                    <Td isNumeric fontWeight="semibold" color="green.500">
                      {opp.profitPercent.toFixed(2)}%
                    </Td>
                    <Td>{opp.estimatedTime}</Td>
                    <Td>
                      <Badge colorScheme={
                        opp.risk === 'low' ? 'green' :
                        opp.risk === 'medium' ? 'yellow' : 'red'
                      }>
                        {opp.risk.toUpperCase()}
                      </Badge>
                    </Td>
                    <Td>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        leftIcon={<FiPlay />}
                        onClick={() => handleTradeClick(opp)}
                      >
                        Trade
                      </Button>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>
      
      {/* Trade Modal */}
      <TradeModal 
        isOpen={isOpen} 
        onClose={onClose} 
        opportunity={selectedOpportunity} 
      />
    </Box>
  );
};

export default Trading;
