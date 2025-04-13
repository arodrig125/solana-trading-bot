import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Switch,
  Select,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Divider,
  useToast,
  Card,
  CardHeader,
  CardBody,
  Stack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Badge,
  HStack,
  useColorModeValue,
} from '@chakra-ui/react';

// Sample settings data
const INITIAL_SETTINGS = {
  trading: {
    autoTrade: true,
    minProfitPercent: 1.2,
    maxSlippagePercent: 0.5,
    defaultTradeAmount: 100,
    gasOptimization: true,
    maxParallelTrades: 2,
    tradeTimeout: 30,
  },
  notifications: {
    email: true,
    telegram: true,
    telegramChatId: '123456789',
    notifyOnTrade: true,
    notifyOnOpportunity: false,
    notifyMinimumProfit: 2.5,
  },
  api: {
    enabled: true,
    rateLimitPerMinute: 60,
    apiKey: 'sk_test_abcdefghijklmnopqrstuvwxyz',
    webhookUrl: '',
  },
  security: {
    twoFactorEnabled: false,
    ipWhitelist: '',
    sessionTimeout: 60,
  },
  subscription: {
    plan: 'professional',
    expiresAt: '2026-05-15',
    maxWallets: 5,
  },
};

const Settings = () => {
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    // Simulate API call to fetch settings
    const fetchSettings = async () => {
      setIsLoading(true);
      
      // In a real app, this would be an API call
      // const response = await api.getSettings();
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use initial settings as a placeholder
      setSettings(INITIAL_SETTINGS);
      setIsLoading(false);
    };
    
    fetchSettings();
  }, []);
  
  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    try {
      // In a real app, this would be an API call
      // await api.updateSettings(settings);
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: 'Settings saved',
        description: 'Your settings have been updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error saving settings',
        description: error.message || 'An error occurred while saving settings',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const updateSettings = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };
  
  // Helper function to get subscription badge color
  const getSubscriptionColor = (plan) => {
    switch (plan) {
      case 'basic':
        return 'gray';
      case 'standard':
        return 'blue';
      case 'professional':
        return 'purple';
      case 'enterprise':
        return 'orange';
      default:
        return 'gray';
    }
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Settings</Heading>
        <Button
          colorScheme="blue"
          onClick={handleSaveSettings}
          isLoading={isSaving}
          loadingText="Saving"
        >
          Save Changes
        </Button>
      </Flex>
      
      <Stack spacing={6}>
        {/* Subscription Information */}
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflow="hidden">
          <CardHeader pb={2}>
            <Heading size="md">Subscription</Heading>
          </CardHeader>
          <CardBody pt={0}>
            <HStack spacing={4} mb={4}>
              <Badge colorScheme={getSubscriptionColor(settings.subscription.plan)} fontSize="md" py={1} px={2}>
                {settings.subscription.plan.charAt(0).toUpperCase() + settings.subscription.plan.slice(1)} Plan
              </Badge>
              <Text>Expires: {settings.subscription.expiresAt}</Text>
              <Text>Max Wallets: {settings.subscription.maxWallets}</Text>
            </HStack>
            <Button size="sm" colorScheme="green">
              Upgrade Plan
            </Button>
          </CardBody>
        </Card>

        {/* Trading Settings */}
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflow="hidden">
          <CardHeader pb={2}>
            <Heading size="md">Trading Settings</Heading>
          </CardHeader>
          <CardBody pt={0}>
            <VStack spacing={4} align="stretch">
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="autoTrade" mb="0">
                  Enable Auto Trading
                </FormLabel>
                <Switch 
                  id="autoTrade" 
                  isChecked={settings.trading.autoTrade}
                  onChange={(e) => updateSettings('trading', 'autoTrade', e.target.checked)}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Minimum Profit Percentage</FormLabel>
                <Flex>
                  <NumberInput 
                    value={settings.trading.minProfitPercent} 
                    onChange={(valueString) => updateSettings('trading', 'minProfitPercent', parseFloat(valueString))}
                    step={0.1}
                    min={0.1}
                    max={10}
                    mr={2}
                    maxW="100px"
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <Text alignSelf="center">%</Text>
                </Flex>
              </FormControl>

              <FormControl>
                <FormLabel>Maximum Slippage</FormLabel>
                <Flex>
                  <NumberInput 
                    value={settings.trading.maxSlippagePercent} 
                    onChange={(valueString) => updateSettings('trading', 'maxSlippagePercent', parseFloat(valueString))}
                    step={0.1}
                    min={0.1}
                    max={5}
                    mr={2}
                    maxW="100px"
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <Text alignSelf="center">%</Text>
                </Flex>
              </FormControl>

              <FormControl>
                <FormLabel>Default Trade Amount (USDC)</FormLabel>
                <NumberInput 
                  value={settings.trading.defaultTradeAmount} 
                  onChange={(valueString) => updateSettings('trading', 'defaultTradeAmount', parseFloat(valueString))}
                  min={10}
                  max={1000}
                  maxW="150px"
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="gasOptimization" mb="0">
                  Enable Gas Optimization
                </FormLabel>
                <Switch 
                  id="gasOptimization" 
                  isChecked={settings.trading.gasOptimization}
                  onChange={(e) => updateSettings('trading', 'gasOptimization', e.target.checked)}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Maximum Parallel Trades</FormLabel>
                <Select 
                  value={settings.trading.maxParallelTrades}
                  onChange={(e) => updateSettings('trading', 'maxParallelTrades', parseInt(e.target.value))}
                  maxW="150px"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5</option>
                </Select>
              </FormControl>
            </VStack>
          </CardBody>
        </Card>

        {/* Notification Settings */}
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflow="hidden">
          <CardHeader pb={2}>
            <Heading size="md">Notification Settings</Heading>
          </CardHeader>
          <CardBody pt={0}>
            <VStack spacing={4} align="stretch">
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="emailNotifications" mb="0">
                  Email Notifications
                </FormLabel>
                <Switch 
                  id="emailNotifications" 
                  isChecked={settings.notifications.email}
                  onChange={(e) => updateSettings('notifications', 'email', e.target.checked)}
                />
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="telegramNotifications" mb="0">
                  Telegram Notifications
                </FormLabel>
                <Switch 
                  id="telegramNotifications" 
                  isChecked={settings.notifications.telegram}
                  onChange={(e) => updateSettings('notifications', 'telegram', e.target.checked)}
                />
              </FormControl>

              {settings.notifications.telegram && (
                <FormControl>
                  <FormLabel>Telegram Chat ID</FormLabel>
                  <Input 
                    value={settings.notifications.telegramChatId}
                    onChange={(e) => updateSettings('notifications', 'telegramChatId', e.target.value)}
                    maxW="250px"
                  />
                </FormControl>
              )}

              <Divider />

              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="notifyOnTrade" mb="0">
                  Notify on Trade Execution
                </FormLabel>
                <Switch 
                  id="notifyOnTrade" 
                  isChecked={settings.notifications.notifyOnTrade}
                  onChange={(e) => updateSettings('notifications', 'notifyOnTrade', e.target.checked)}
                />
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="notifyOnOpportunity" mb="0">
                  Notify on New Opportunities
                </FormLabel>
                <Switch 
                  id="notifyOnOpportunity" 
                  isChecked={settings.notifications.notifyOnOpportunity}
                  onChange={(e) => updateSettings('notifications', 'notifyOnOpportunity', e.target.checked)}
                />
              </FormControl>

              {settings.notifications.notifyOnOpportunity && (
                <FormControl>
                  <FormLabel>Minimum Profit for Notification (%)</FormLabel>
                  <Flex>
                    <NumberInput 
                      value={settings.notifications.notifyMinimumProfit}
                      onChange={(valueString) => updateSettings('notifications', 'notifyMinimumProfit', parseFloat(valueString))}
                      min={0.5}
                      max={10}
                      step={0.5}
                      maxW="100px"
                      mr={2}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <Text alignSelf="center">%</Text>
                  </Flex>
                </FormControl>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* API Settings */}
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflow="hidden">
          <CardHeader pb={2}>
            <Heading size="md">API Settings</Heading>
          </CardHeader>
          <CardBody pt={0}>
            <VStack spacing={4} align="stretch">
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="apiEnabled" mb="0">
                  Enable API Access
                </FormLabel>
                <Switch 
                  id="apiEnabled" 
                  isChecked={settings.api.enabled}
                  onChange={(e) => updateSettings('api', 'enabled', e.target.checked)}
                />
              </FormControl>

              {settings.api.enabled && (
                <>
                  <FormControl>
                    <FormLabel>API Key</FormLabel>
                    <Flex>
                      <Input 
                        value={settings.api.apiKey}
                        isReadOnly
                        type="password"
                        maxW="350px"
                        mr={2}
                      />
                      <Button size="sm" colorScheme="blue" alignSelf="center">
                        Regenerate
                      </Button>
                    </Flex>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Rate Limit (requests per minute)</FormLabel>
                    <NumberInput 
                      value={settings.api.rateLimitPerMinute}
                      onChange={(valueString) => updateSettings('api', 'rateLimitPerMinute', parseInt(valueString))}
                      min={10}
                      max={200}
                      step={10}
                      maxW="150px"
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Webhook URL (optional)</FormLabel>
                    <Input 
                      value={settings.api.webhookUrl}
                      onChange={(e) => updateSettings('api', 'webhookUrl', e.target.value)}
                      placeholder="https://"
                      maxW="350px"
                    />
                  </FormControl>
                </>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Security Settings */}
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflow="hidden">
          <CardHeader pb={2}>
            <Heading size="md">Security Settings</Heading>
          </CardHeader>
          <CardBody pt={0}>
            <VStack spacing={4} align="stretch">
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="twoFactorEnabled" mb="0">
                  Enable Two-Factor Authentication
                </FormLabel>
                <Switch 
                  id="twoFactorEnabled" 
                  isChecked={settings.security.twoFactorEnabled}
                  onChange={(e) => updateSettings('security', 'twoFactorEnabled', e.target.checked)}
                />
              </FormControl>

              <FormControl>
                <FormLabel>IP Whitelist (comma separated, leave empty for all)</FormLabel>
                <Input 
                  value={settings.security.ipWhitelist}
                  onChange={(e) => updateSettings('security', 'ipWhitelist', e.target.value)}
                  placeholder="192.168.1.1, 10.0.0.1"
                  maxW="350px"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Session Timeout (minutes)</FormLabel>
                <NumberInput 
                  value={settings.security.sessionTimeout}
                  onChange={(valueString) => updateSettings('security', 'sessionTimeout', parseInt(valueString))}
                  min={15}
                  max={240}
                  step={15}
                  maxW="150px"
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </VStack>
          </CardBody>
        </Card>
      </Stack>
    </Box>
  );
};

export default Settings;
