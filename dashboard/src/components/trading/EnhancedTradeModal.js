import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Box,
  Flex,
  Text,
  Progress,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Badge,
  Stack,
  Divider,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Icon,
  List,
  ListItem,
  ListIcon,
  Select,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  useToast,
  Grid,
  GridItem,
  HStack,
  Switch,
} from '@chakra-ui/react';
import { 
  FiCheckCircle,
  FiAlertTriangle,
  FiClock,
  FiShield,
  FiPercent,
  FiSettings,
  FiCheckSquare,
  FiPlay
} from 'react-icons/fi';
import TokenPathFlow from './TokenPathFlow';
import TradeAnalytics from './TradeAnalytics';

// Import trading context
import { useTrading } from '../../contexts/TradingContext';
import { useWallet } from '../../contexts/WalletContext';

const EnhancedTradeModal = ({ isOpen, onClose, opportunity }) => {
  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const alertSuccessBg = useColorModeValue('green.50', 'green.900');
  const modalBg = useColorModeValue('gray.50', 'gray.900');
  // Access trading context and state management
  const { recentTrades, dexPerformance } = useTrading();
  const [isLoading, setIsLoading] = useState(false);
  const [tradeAmount, setTradeAmount] = useState(100);
  const [simulationResult, setSimulationResult] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('confirm'); // confirm, simulating, simulation-complete, executing, complete
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [autoExecute, setAutoExecute] = useState(false);
  const [advancedSettings, setAdvancedSettings] = useState(false);
  const [slippage, setSlippage] = useState(0.5);
  const [priority, setPriority] = useState('balanced');
  
  // Render trade analytics section
  const renderTradeAnalytics = () => (
    <TradeAnalytics
      opportunity={opportunity}
      recentTrades={recentTrades}
      dexPerformance={dexPerformance}
    />
  );
  
  const toast = useToast();
  const progressIntervalRef = useRef(null);
  
  // Get wallets from context
  const { wallets, selectedWallet, setSelectedWallet } = useWallet();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsLoading(false);
      setSimulationResult(null);
      setError(null);
      setStep('confirm');
      setProgress(0);
      setResult(null);
      setTradeAmount(100);
      setAutoExecute(false);
      setAdvancedSettings(false);
      setSlippage(0.5);
      setPriority('balanced');
    }
    
    // Clean up interval on close
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isOpen]);

  // Check if user has sufficient balance
  const getStartToken = () => opportunity?.path[0]?.from || 'USDC';
  const hasBalance = selectedWallet && 
    selectedWallet.balances.sol >= tradeAmount;

  // Handlers
  const handleSimulate = () => {
    setIsLoading(true);
    setStep('simulating');
    setError(null);
    setProgress(0);
    
    // Animated progress bar
    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressIntervalRef.current);
          return 100;
        }
        return prev + 2;
      });
    }, 50);
    
    // Simulate API call with a delay
    setTimeout(() => {
      clearInterval(progressIntervalRef.current);
      setProgress(100);
      
      // In a real app, this would be the result from your API
      setSimulationResult({
        expected: {
          inputAmount: tradeAmount,
          outputAmount: tradeAmount * (1 + (opportunity.profitPercent / 100)),
          profit: tradeAmount * (opportunity.profitPercent / 100),
          profitPercent: opportunity.profitPercent
        },
        fees: {
          total: tradeAmount * 0.0025, // 0.25% of trade amount
          breakdown: [
            { name: 'Network fee', amount: tradeAmount * 0.0010 },
            { name: 'Jupiter fee', amount: tradeAmount * 0.0010 },
            { name: 'Gas price', amount: tradeAmount * 0.0005 },
          ]
        },
        riskAssessment: opportunity.risk,
        pathAnalysis: {
          slippage: slippage,
          priceImpact: 0.12,
          successProbability: 98.5,
        },
        transactionTime: parseFloat(opportunity.estimatedTime.replace(/[^0-9.]/g, '')),
      });
      
      setIsLoading(false);
      setStep('simulation-complete');
      
      if (autoExecute) {
        handleExecute();
      }
    }, 1500);
  };

  const handleExecute = () => {
    setIsLoading(true);
    setStep('executing');
    setError(null);
    setProgress(0);
    
    // Animated progress bar for execution
    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressIntervalRef.current);
          return 100;
        }
        return prev + 1;
      });
    }, 40);
    
    // Simulate API call with a longer delay
    setTimeout(() => {
      clearInterval(progressIntervalRef.current);
      setProgress(100);
      
      // In a real app, this would be the result from your API
      // 95% success rate in our simulation
      const successful = Math.random() > 0.05;
      
      if (successful) {
        setResult({
          status: 'success',
          txId: 'solana:' + Math.random().toString(36).substring(2, 15),
          inputAmount: tradeAmount,
          outputAmount: tradeAmount * (1 + (opportunity.profitPercent / 100) - 0.001),
          profit: tradeAmount * (opportunity.profitPercent / 100) - (tradeAmount * 0.001),
          profitPercent: opportunity.profitPercent - 0.1, // Slightly less than expected due to real-world conditions
          timestamp: new Date().toISOString(),
        });
        
        toast({
          title: 'Trade successful!',
          description: `Earned $${(tradeAmount * (opportunity.profitPercent / 100) - (tradeAmount * 0.001)).toFixed(2)} profit`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        setError({
          message: 'Transaction failed',
          details: 'The transaction could not be executed due to price movement or network congestion. No funds were lost.',
          code: 'TRADE_FAILED',
        });
        
        toast({
          title: 'Trade failed',
          description: 'The transaction could not be completed. Your funds are safe.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
      
      setIsLoading(false);
      setStep('complete');
    }, 3000);
  };

  if (!opportunity) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(5px)" />
      <ModalContent>
        <ModalHeader>
          <Flex justify="space-between" align="center">
            <Text>Trade Opportunity</Text>
            <Badge
              px={2}
              py={1}
              bg={opportunity.type === 'triangular' ? 'blue.500' : 'purple.500'}
              color="white"
              borderRadius="md"
            >
              {opportunity.type === 'triangular' ? 'Triangular' : 'Simple'}
            </Badge>
          </Flex>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {/* Trade Path Visualization */}
          <Box 
            mb={6} 
            p={4} 
            bg={cardBg} 
            borderRadius="md" 
            borderWidth="1px"
            borderColor={borderColor}
          >
            <Text fontWeight="medium" mb={3} fontSize="md">Trade Path</Text>
            <Box py={2}>
              <TokenPathFlow path={opportunity.path} />
            </Box>
          </Box>
          
          {step === 'confirm' && (
            <Stack spacing={6}>
              {renderTradeAnalytics()}
              {/* Trade Configuration */}
              <Box
                p={4}
                bg={cardBg}
                borderRadius="md"
                borderWidth="1px"
                borderColor={borderColor}
              >
                <Text fontWeight="medium" mb={4} fontSize="md">Trade Configuration</Text>
                
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <GridItem>
                    <Text mb={1} fontSize="sm">Trade Amount ({getStartToken()})</Text>
                    <NumberInput
                      value={tradeAmount}
                      onChange={(value) => setTradeAmount(parseFloat(value))}
                      min={10}
                      max={selectedWallet?.balances.sol || 1000}
                      precision={2}
                      size="md"
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </GridItem>
                  
                  <GridItem>
                    <Text mb={1} fontSize="sm">Select Wallet</Text>
                    <Select
                      value={selectedWallet}
                      onChange={(e) => setSelectedWallet(e.target.value)}
                    >
                      {wallets.map(wallet => (
                        <option key={wallet.id} value={wallet.id}>
                          {wallet.name} ({wallet.balance[getStartToken()]} {getStartToken()})
                        </option>
                      ))}
                    </Select>
                  </GridItem>
                </Grid>
                
                {!hasBalance && (
                  <Alert status="warning" mt={4} borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Insufficient balance</AlertTitle>
                      <AlertDescription>
                        You don't have enough {getStartToken()} in the selected wallet.
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}
                
                <HStack mt={4} spacing={4}>
                  <Switch
                    id="auto-execute"
                    isChecked={autoExecute}
                    onChange={() => setAutoExecute(!autoExecute)}
                    colorScheme="blue"
                  />
                  <Text fontSize="sm">Auto-execute after simulation</Text>
                </HStack>
                
                <Flex mt={4} align="center" cursor="pointer" onClick={() => setAdvancedSettings(!advancedSettings)}>
                  <Icon as={FiSettings} mr={2} color="gray.500" />
                  <Text fontSize="sm" color="gray.500">Advanced Settings</Text>
                </Flex>
                
                {/* Advanced settings background color */}
                {advancedSettings && (
                  <Box mt={4} p={4} bg={cardBg} borderRadius="md">
                    <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                      <GridItem>
                        <Text mb={1} fontSize="sm">Max Slippage</Text>
                        <Flex align="center">
                          <Slider
                            value={slippage}
                            min={0.1}
                            max={5}
                            step={0.1}
                            onChange={(val) => setSlippage(val)}
                            flex="1"
                            mr={4}
                            colorScheme="blue"
                          >
                            <SliderTrack>
                              <SliderFilledTrack />
                            </SliderTrack>
                            <SliderThumb boxSize={6}>
                              <Box as={FiPercent} />
                            </SliderThumb>
                          </Slider>
                          <Text w="40px" textAlign="right">{slippage}%</Text>
                        </Flex>
                      </GridItem>
                      
                      <GridItem>
                        <Text mb={1} fontSize="sm">Execution Priority</Text>
                        <Select
                          value={priority}
                          onChange={(e) => setPriority(e.target.value)}
                          size="md"
                        >
                          <option value="balanced">Balanced</option>
                          <option value="speed">Fastest (Higher Gas)</option>
                          <option value="cost">Lowest Cost (Slower)</option>
                        </Select>
                      </GridItem>
                    </Grid>
                  </Box>
                )}
              </Box>
              
              {/* Profit Estimation */}
              <Box
                p={4}
                bg={cardBg}
                borderRadius="md"
                borderWidth="1px"
                borderColor={borderColor}
              >
                <Text fontWeight="medium" mb={4} fontSize="md">Profit Estimation</Text>
                
                <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                  <Stat>
                    <StatLabel>Input Amount</StatLabel>
                    <StatNumber>{tradeAmount.toFixed(2)} {getStartToken()}</StatNumber>
                  </Stat>
                  
                  <Stat>
                    <StatLabel>Estimated Profit</StatLabel>
                    <StatNumber color="green.500">
                      ${(tradeAmount * (opportunity.profitPercent / 100)).toFixed(2)}
                    </StatNumber>
                    <StatHelpText>
                      <StatArrow type="increase" />
                      {opportunity.profitPercent.toFixed(2)}%
                    </StatHelpText>
                  </Stat>
                  
                  <Stat>
                    <StatLabel>Estimated Time</StatLabel>
                    <StatNumber>{opportunity.estimatedTime}</StatNumber>
                    <StatHelpText>
                      <Badge colorScheme={{
                        low: 'green',
                        medium: 'yellow',
                        high: 'red'
                      }[opportunity.risk]}>
                        {opportunity.risk.toUpperCase()} RISK
                      </Badge>
                    </StatHelpText>
                  </Stat>
                </Grid>
              </Box>
            </Stack>
          )}
          
          {/* Simulation Progress */}
          {step === 'simulating' && (
            <Box
              p={6}
              bg={cardBg}
              borderRadius="md"
              borderWidth="1px"
              borderColor={borderColor}
              textAlign="center"
            >
              <Text fontSize="lg" fontWeight="medium" mb={6}>Simulating Trade</Text>
              <Progress value={progress} size="sm" colorScheme="blue" borderRadius="md" mb={4} />
              <Text color="gray.500">
                Calculating optimal routes, fees, and expected profit...
              </Text>
            </Box>
          )}
          
          {/* Simulation Results */}
          {step === 'simulation-complete' && simulationResult && (
            <Stack spacing={5}>
              <Alert
                status="info"
                variant="subtle"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                textAlign="center"
                borderRadius="md"
                p={4}
              >
                <AlertIcon boxSize="6" mr={0} />
                <AlertTitle mt={4} mb={1} fontSize="lg">
                  Simulation Complete
                </AlertTitle>
                <AlertDescription maxWidth="sm">
                  Trade simulation was successful. Review the details below before execution.
                </AlertDescription>
              </Alert>
              
              <Box
                p={4}
                bg={cardBg}
                borderRadius="md"
                borderWidth="1px"
                borderColor={borderColor}
              >
                <Text fontWeight="medium" mb={4} fontSize="md">Estimated Results</Text>
                
                <Grid templateColumns="repeat(3, 1fr)" gap={6}>
                  <Stat>
                    <StatLabel>Input Amount</StatLabel>
                    <StatNumber>{simulationResult.expected.inputAmount.toFixed(2)} {getStartToken()}</StatNumber>
                  </Stat>
                  
                  <Stat>
                    <StatLabel>Expected Output</StatLabel>
                    <StatNumber>{simulationResult.expected.outputAmount.toFixed(2)} {opportunity.endToken}</StatNumber>
                  </Stat>
                  
                  <Stat>
                    <StatLabel>Net Profit</StatLabel>
                    <StatNumber color="green.500">
                      ${simulationResult.expected.profit.toFixed(2)}
                    </StatNumber>
                    <StatHelpText>
                      <StatArrow type="increase" />
                      {simulationResult.expected.profitPercent.toFixed(2)}%
                    </StatHelpText>
                  </Stat>
                </Grid>
              </Box>
              
              <Grid templateColumns="repeat(2, 1fr)" gap={5}>
                <Box
                  p={4}
                  bg={cardBg}
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor={borderColor}
                >
                  <Text fontWeight="medium" mb={4} fontSize="md">Fee Breakdown</Text>
                  
                  <List spacing={2}>
                    {simulationResult.fees.breakdown.map((fee, index) => (
                      <ListItem key={index}>
                        <Flex justify="space-between">
                          <Text>{fee.name}</Text>
                          <Text>${fee.amount.toFixed(4)}</Text>
                        </Flex>
                      </ListItem>
                    ))}
                    <Divider my={2} />
                    <ListItem fontWeight="bold">
                      <Flex justify="space-between">
                        <Text>Total Fees</Text>
                        <Text>${simulationResult.fees.total.toFixed(4)}</Text>
                      </Flex>
                    </ListItem>
                  </List>
                </Box>
                
                <Box
                  p={4}
                  bg={cardBg}
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor={borderColor}
                >
                  <Text fontWeight="medium" mb={4} fontSize="md">Trade Analysis</Text>
                  
                  <List spacing={3}>
                    <ListItem>
                      <Flex align="center">
                        <ListIcon as={FiShield} color="blue.500" />
                        <Text fontWeight="medium">Risk Assessment:</Text>
                        <Badge ml={2} colorScheme={{
                          low: 'green',
                          medium: 'yellow',
                          high: 'red'
                        }[simulationResult.riskAssessment]}>
                          {simulationResult.riskAssessment.toUpperCase()}
                        </Badge>
                      </Flex>
                    </ListItem>
                    
                    <ListItem>
                      <Flex align="center">
                        <ListIcon as={FiClock} color="blue.500" />
                        <Text fontWeight="medium">Estimated Time:</Text>
                        <Text ml={2}>{simulationResult.transactionTime}s</Text>
                      </Flex>
                    </ListItem>
                    
                    <ListItem>
                      <Flex align="center">
                        <ListIcon as={FiPercent} color="blue.500" />
                        <Text fontWeight="medium">Price Impact:</Text>
                        <Text ml={2}>{simulationResult.pathAnalysis.priceImpact}%</Text>
                      </Flex>
                    </ListItem>
                    
                    <ListItem>
                      <Flex align="center">
                        <ListIcon as={FiCheckSquare} color="blue.500" />
                        <Text fontWeight="medium">Success Probability:</Text>
                        <Text ml={2}>{simulationResult.pathAnalysis.successProbability}%</Text>
                      </Flex>
                    </ListItem>
                  </List>
                </Box>
              </Grid>
            </Stack>
          )}
          
          {/* Execution Progress */}
          {step === 'executing' && (
            <Box
              p={6}
              bg={cardBg}
              borderRadius="md"
              borderWidth="1px"
              borderColor={borderColor}
              textAlign="center"
            >
              <Text fontSize="lg" fontWeight="medium" mb={6}>Executing Trade</Text>
              <Progress value={progress} size="sm" colorScheme="blue" borderRadius="md" mb={4} />
              <Text color="gray.500" mb={2}>
                Building and sending transactions to the Solana network...
              </Text>
              <Text fontSize="sm" color="gray.400">
                This may take a few seconds to complete.
              </Text>
            </Box>
          )}
          
          {/* Execution Results */}
          {step === 'complete' && (
            <Box>
              {result ? (
                <Alert
                  status="success"
                  variant="subtle"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  textAlign="center"
                  borderRadius="md"
                  bg={alertSuccessBg}
                  p={6}
                  mb={6}
                >
                  <Box fontSize="3xl" mb={4}>
                    <Icon as={FiCheckCircle} color="green.500" />
                  </Box>
                  <AlertTitle mb={2} fontSize="lg">
                    Trade Successful!
                  </AlertTitle>
                  <AlertDescription maxWidth="sm" mb={4}>
                    Your trade has been executed successfully. The transaction has been confirmed on the Solana network.
                  </AlertDescription>
                  
                  <Box w="100%" p={4} bg={cardBg} borderRadius="md" textAlign="left">
                    <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                      <Stat>
                        <StatLabel>Transaction ID</StatLabel>
                        <Text fontSize="sm" color="blue.500" isTruncated maxW="full">
                          {result.txId}
                        </Text>
                      </Stat>
                      
                      <Stat>
                        <StatLabel>Timestamp</StatLabel>
                        <Text fontSize="sm">
                          {new Date(result.timestamp).toLocaleString()}
                        </Text>
                      </Stat>
                    </Grid>
                    
                    <Divider my={4} />
                    
                    <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                      <Stat>
                        <StatLabel>Input Amount</StatLabel>
                        <StatNumber>{result.inputAmount.toFixed(2)} {getStartToken()}</StatNumber>
                      </Stat>
                      
                      <Stat>
                        <StatLabel>Output Amount</StatLabel>
                        <StatNumber>{result.outputAmount.toFixed(2)} {opportunity.endToken}</StatNumber>
                      </Stat>
                      
                      <Stat>
                        <StatLabel>Profit</StatLabel>
                        <StatNumber color="green.500">
                          ${result.profit.toFixed(2)}
                        </StatNumber>
                      </Stat>
                      
                      <Stat>
                        <StatLabel>Return</StatLabel>
                        <StatNumber color="green.500">
                          {result.profitPercent.toFixed(2)}%
                        </StatNumber>
                      </Stat>
                    </Grid>
                  </Box>
                  
                  <Button
                    colorScheme="blue"
                    variant="outline"
                    mt={6}
                    size="sm"
                    onClick={() => window.open(`https://solscan.io/tx/${result.txId}`, '_blank')}
                  >
                    View on Explorer
                  </Button>
                </Alert>
              ) : error ? (
                <Alert
                  status="error"
                  variant="subtle"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  textAlign="center"
                  borderRadius="md"
                  bg={cardBg}
                  p={6}
                  mb={6}
                >
                  <Box fontSize="3xl" mb={4}>
                    <Icon as={FiAlertTriangle} color="red.500" />
                  </Box>
                  <AlertTitle mb={2} fontSize="lg">
                    {error.message}
                  </AlertTitle>
                  <AlertDescription maxWidth="md">
                    {error.details}
                    {error.code && (
                      <Text mt={2} fontSize="sm" color="red.500">
                        Error code: {error.code}
                      </Text>
                    )}
                  </AlertDescription>
                  
                  <Button
                    colorScheme="red"
                    variant="outline"
                    mt={6}
                    onClick={() => {
                      setStep('confirm');
                      setError(null);
                    }}
                  >
                    Try Again
                  </Button>
                </Alert>
              ) : null}
            </Box>
          )}
        </ModalBody>

        <ModalFooter bg={modalBg} borderTopWidth="1px" borderColor={borderColor}>
          {step === 'confirm' && (
            <Button
              colorScheme="blue"
              mr={3}
              leftIcon={<FiPlay />}
              onClick={handleSimulate}
              isDisabled={!hasBalance}
              isLoading={isLoading}
            >
              Simulate Trade
            </Button>
          )}
          
          {step === 'simulation-complete' && (
            <Button
              colorScheme="green"
              mr={3}
              leftIcon={<FiCheckCircle />}
              onClick={handleExecute}
              isLoading={isLoading}
            >
              Execute Trade
            </Button>
          )}
          
          {(step === 'complete' && result) && (
            <Button
              colorScheme="blue"
              mr={3}
              onClick={() => {
                setStep('confirm');
                setResult(null);
              }}
            >
              New Trade
            </Button>
          )}
          
          <Button variant="ghost" onClick={onClose}>
            {step === 'complete' ? 'Close' : 'Cancel'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EnhancedTradeModal;
