import React, { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Stack,
  Flex,
  Button,
  Link,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Code,
  useColorModeValue,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';

const CodeSnippet = ({ language, children }) => {
  return (
    <Box
      as="pre"
      mt={2}
      p={4}
      overflowX="auto"
      bg={useColorModeValue('gray.100', 'gray.700')}
      borderRadius="md"
      fontSize="sm"
      fontFamily="monospace"
    >
      <Code p={0} bg="transparent" children={children} />
    </Box>
  );
};

const Documentation = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <Box>
      {/* Hero Section */}
      <Box bg={useColorModeValue('blue.50', 'gray.800')} py={12}>
        <Container maxW={'6xl'}>
          <Stack spacing={4} align={'center'} textAlign={'center'}>
            <Heading
              fontWeight={700}
              fontSize={{ base: '2xl', sm: '3xl', md: '4xl' }}
              lineHeight={'110%'}
            >
              SolarBot Documentation
            </Heading>
            <Text maxW={'2xl'} fontSize={'lg'} color={'gray.500'}>
              Learn how to use SolarBot's powerful features to maximize your trading profits
            </Text>
          </Stack>
        </Container>
      </Box>

      {/* Documentation Content */}
      <Container maxW={'6xl'} py={8}>
        <Flex direction={{ base: 'column', md: 'row' }}>
          {/* Sidebar */}
          <Box w={{ base: '100%', md: '250px' }} pr={{ md: 8 }} mb={{ base: 6, md: 0 }}>
            <Stack spacing={2} position={{ md: 'sticky' }} top="100px">
              <Heading size="md" mb={2}>Contents</Heading>
              <Link href="#getting-started" fontSize="sm">Getting Started</Link>
              <Link href="#api-reference" fontSize="sm">API Reference</Link>
              <Link href="#wallet-management" fontSize="sm">Wallet Management</Link>
              <Link href="#trading-strategies" fontSize="sm">Trading Strategies</Link>
              <Link href="#troubleshooting" fontSize="sm">Troubleshooting</Link>
            </Stack>
          </Box>

          {/* Main Content */}
          <Box flex={1}>
            <Stack spacing={10}>
              {/* Getting Started */}
              <Box id="getting-started">
                <Heading size="lg" mb={4}>Getting Started</Heading>
                <Text mb={4}>
                  Welcome to SolarBot, the advanced Solana trading bot platform. This guide will help you set up your account and start trading in minutes.
                </Text>
                
                <Accordion allowToggle mb={6}>
                  <AccordionItem>
                    <h2>
                      <AccordionButton>
                        <Box flex="1" textAlign="left" fontWeight="medium">
                          1. Creating an Account
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                      <Text mb={2}>To create an account, follow these steps:</Text>
                      <Box pl={4}>
                        <Text>1. Click on "Get Started" in the top navigation</Text>
                        <Text>2. Fill out the registration form with your email and password</Text>
                        <Text>3. Verify your email address</Text>
                        <Text>4. Choose a subscription plan</Text>
                      </Box>
                    </AccordionPanel>
                  </AccordionItem>

                  <AccordionItem>
                    <h2>
                      <AccordionButton>
                        <Box flex="1" textAlign="left" fontWeight="medium">
                          2. Adding Your First Wallet
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                      <Text mb={2}>After logging in, you'll need to add at least one wallet:</Text>
                      <Box pl={4}>
                        <Text>1. Navigate to the "Wallets" section</Text>
                        <Text>2. Click "Add Wallet"</Text>
                        <Text>3. Enter a name for your wallet</Text>
                        <Text>4. Enter your private key (we recommend using a dedicated trading wallet)</Text>
                        <Text>5. Click "Save"</Text>
                      </Box>
                      <Text mt={2} fontStyle="italic">Note: Your private key is encrypted and securely stored. We never have access to your unencrypted private key.</Text>
                    </AccordionPanel>
                  </AccordionItem>

                  <AccordionItem>
                    <h2>
                      <AccordionButton>
                        <Box flex="1" textAlign="left" fontWeight="medium">
                          3. Setting Up Your First Bot
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                      <Text mb={2}>To set up your first trading bot:</Text>
                      <Box pl={4}>
                        <Text>1. Go to the "Trading" section</Text>
                        <Text>2. Click "Create Bot"</Text>
                        <Text>3. Select the wallet you want to use</Text>
                        <Text>4. Choose your trading strategy</Text>
                        <Text>5. Set your risk parameters and filters</Text>
                        <Text>6. Start the bot</Text>
                      </Box>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              </Box>

              {/* API Reference */}
              <Box id="api-reference">
                <Heading size="lg" mb={4}>API Reference</Heading>
                <Text mb={4}>
                  SolarBot provides a RESTful API for programmatic access to all trading features. 
                  This allows you to integrate our powerful arbitrage detection and execution capabilities into your own systems.
                </Text>

                <Tabs variant="enclosed" colorScheme="blue" mb={6}>
                  <TabList>
                    <Tab>Authentication</Tab>
                    <Tab>Endpoints</Tab>
                    <Tab>Examples</Tab>
                  </TabList>
                  <TabPanels>
                    <TabPanel>
                      <Heading size="md" mb={2}>Authentication</Heading>
                      <Text mb={2}>All API requests require a JWT token for authentication. To obtain a token:</Text>
                      
                      <CodeSnippet language="bash">
{`# Request a token
POST /api/auth/login

# Request body
{
  "email": "your-email@example.com",
  "password": "your-password"
}

# Response
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400
}`}
                      </CodeSnippet>
                      
                      <Text mt={4}>Include the token in all subsequent requests:</Text>
                      
                      <CodeSnippet language="bash">
{`# Example API request with token
GET /api/opportunities
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`}
                      </CodeSnippet>
                    </TabPanel>
                    <TabPanel>
                      <Heading size="md" mb={2}>Endpoints</Heading>
                      
                      <Accordion allowToggle>
                        <AccordionItem>
                          <h2>
                            <AccordionButton>
                              <Box flex="1" textAlign="left" fontWeight="medium">
                                /api/wallet
                              </Box>
                              <AccordionIcon />
                            </AccordionButton>
                          </h2>
                          <AccordionPanel pb={4}>
                            <Text fontWeight="bold">GET /api/wallet</Text>
                            <Text mb={2}>Returns a list of all wallets associated with your account.</Text>
                            
                            <Text fontWeight="bold" mt={4}>POST /api/wallet</Text>
                            <Text mb={2}>Adds a new wallet.</Text>
                            <CodeSnippet language="json">
{`// Request body
{
  "name": "Trading Wallet",
  "privateKey": "your-encrypted-private-key"
}`}
                            </CodeSnippet>
                            
                            <Text fontWeight="bold" mt={4}>DELETE /api/wallet/:id</Text>
                            <Text>Deletes the specified wallet.</Text>
                          </AccordionPanel>
                        </AccordionItem>
                        
                        <AccordionItem>
                          <h2>
                            <AccordionButton>
                              <Box flex="1" textAlign="left" fontWeight="medium">
                                /api/opportunities
                              </Box>
                              <AccordionIcon />
                            </AccordionButton>
                          </h2>
                          <AccordionPanel pb={4}>
                            <Text fontWeight="bold">GET /api/opportunities</Text>
                            <Text mb={2}>Returns a list of current arbitrage opportunities.</Text>
                            <CodeSnippet language="json">
{`// Query parameters
{
  "minProfitPercent": 0.5,  // Optional
  "tokenSymbol": "SOL"     // Optional
}`}
                            </CodeSnippet>
                            
                            <Text fontWeight="bold" mt={4}>POST /api/opportunities/execute</Text>
                            <Text mb={2}>Executes a trade for the specified opportunity.</Text>
                            <CodeSnippet language="json">
{`// Request body
{
  "opportunityId": "opportunity-uuid",
  "walletId": "wallet-uuid",
  "amount": 1.0  // Optional, defaults to max
}`}
                            </CodeSnippet>
                          </AccordionPanel>
                        </AccordionItem>
                      </Accordion>
                    </TabPanel>
                    <TabPanel>
                      <Heading size="md" mb={2}>Examples</Heading>
                      
                      <Text fontWeight="bold">Finding arbitrage opportunities with Node.js</Text>
                      <CodeSnippet language="javascript">
{`const axios = require('axios');

async function getArbitrageOpportunities() {
  try {
    const response = await axios.get('https://api.solarbot.io/api/opportunities', {
      headers: {
        'Authorization': 'Bearer YOUR_JWT_TOKEN'
      },
      params: {
        minProfitPercent: 0.8
      }
    });
    
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching opportunities:', error);
  }
}

getArbitrageOpportunities();`}
                      </CodeSnippet>
                      
                      <Text fontWeight="bold" mt={6}>Executing a trade with Python</Text>
                      <CodeSnippet language="python">
{`import requests
import json

def execute_trade(opportunity_id, wallet_id):
    url = "https://api.solarbot.io/api/opportunities/execute"
    headers = {
        "Authorization": "Bearer YOUR_JWT_TOKEN",
        "Content-Type": "application/json"
    }
    payload = {
        "opportunityId": opportunity_id,
        "walletId": wallet_id
    }
    
    response = requests.post(url, headers=headers, data=json.dumps(payload))
    
    if response.status_code == 200:
        print("Trade executed successfully!")
        return response.json()
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        return None

# Example usage
result = execute_trade("opportunity-uuid", "wallet-uuid")`}
                      </CodeSnippet>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </Box>

              {/* Additional documentation sections would go here */}
              <Box id="wallet-management">
                <Heading size="lg" mb={4}>Wallet Management</Heading>
                <Text mb={4}>
                  SolarBot supports managing multiple wallets, allowing you to organize your trading strategies across different accounts and risk profiles.
                </Text>
                {/* Content would go here */}
              </Box>

              <Box id="trading-strategies">
                <Heading size="lg" mb={4}>Trading Strategies</Heading>
                <Text mb={4}>
                  SolarBot offers several built-in trading strategies optimized for different market conditions and risk profiles.
                </Text>
                {/* Content would go here */}
              </Box>

              <Box id="troubleshooting">
                <Heading size="lg" mb={4}>Troubleshooting</Heading>
                <Text mb={4}>
                  Encountering issues with SolarBot? Check out these common problems and solutions.
                </Text>
                {/* Content would go here */}
              </Box>
            </Stack>
          </Box>
        </Flex>
      </Container>
    </Box>
  );
};

export default Documentation;
