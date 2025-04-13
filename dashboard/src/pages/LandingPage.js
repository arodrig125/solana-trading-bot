import React from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  Stack,
  Image,
  SimpleGrid,
  Icon,
  HStack,
  VStack,
  useColorModeValue,
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FiCheckCircle, FiTrendingUp, FiDollarSign, FiShield, FiClock } from 'react-icons/fi';

// Feature component
const Feature = ({ title, text, icon }) => {
  return (
    <Stack align={'center'} textAlign={'center'} p={5}>
      <Flex
        w={16}
        h={16}
        align={'center'}
        justify={'center'}
        color={'white'}
        rounded={'full'}
        bg={useColorModeValue('blue.500', 'blue.300')}
        mb={3}
      >
        {icon}
      </Flex>
      <Text fontWeight={600} fontSize={'lg'}>{title}</Text>
      <Text color={useColorModeValue('gray.600', 'gray.400')}>{text}</Text>
    </Stack>
  );
};

// Pricing tier component
const PricingTier = ({ title, price, features, accentColor, isPopular }) => {
  return (
    <Box
      position="relative"
      mb={4}
      shadow="xl"
      borderWidth="1px"
      alignSelf={{ base: 'center', lg: 'flex-start' }}
      borderColor={useColorModeValue('gray.200', 'gray.500')}
      borderRadius={'xl'}
      overflow="hidden"
    >
      {isPopular && (
        <Box
          position="absolute"
          top="0"
          right="0"
          bg={accentColor}
          color="white"
          px={3}
          py={1}
          fontSize="sm"
          fontWeight="700"
          borderBottomLeftRadius="xl"
        >
          Popular
        </Box>
      )}
      
      <Box py={6} px={12} bg={isPopular ? `${accentColor}` : 'transparent'} color={isPopular ? 'white' : 'inherit'}>
        <Text fontWeight="500" fontSize="2xl">
          {title}
        </Text>
        <HStack justifyContent="center">
          <Text fontSize="5xl" fontWeight="900">
            ${price}
          </Text>
          <Text fontSize="md" color={isPopular ? 'whiteAlpha.800' : 'gray.500'}>
            /month
          </Text>
        </HStack>
      </Box>
      
      <VStack
        bg={useColorModeValue('white', 'gray.700')}
        py={6}
        px={12}
        spacing={4}
        height="100%"
        justifyContent="space-between"
      >
        <Box w="100%">
          <List spacing={3} textAlign="start" px={2}>
            {features.map((feature, index) => (
              <ListItem key={index}>
                <ListIcon as={FiCheckCircle} color={accentColor} />
                {feature}
              </ListItem>
            ))}
          </List>
        </Box>
        
        <Button
          as={RouterLink}
          to="/login"
          w={'full'}
          colorScheme={isPopular ? accentColor.split('.')[0] : 'blue'}
          variant={isPopular ? 'solid' : 'outline'}
          mt={6}
        >
          Get Started
        </Button>
      </VStack>
    </Box>
  );
};

const LandingPage = () => {
  return (
    <Box>
      {/* Hero Section */}
      <Box
        background="linear-gradient(135deg, #4299E1 0%, #805AD5 100%)"
        color="white"
        pt={{ base: 20, md: 28 }}
        pb={{ base: 20, md: 28 }}
      >
        <Container maxW={'6xl'}>
          <Stack
            direction={{ base: 'column', md: 'row' }}
            align={'center'}
            spacing={{ base: 8, md: 16 }}
          >
            <Stack flex={1} spacing={{ base: 5, md: 8 }}>
              <Heading
                fontWeight={600}
                fontSize={{ base: '3xl', sm: '4xl', lg: '6xl' }}
                lineHeight={'1.2'}
              >
                Maximize Profits with 
                <Text as={'span'} bgGradient="linear(to-r, yellow.400, orange.400)" bgClip="text">
                  {' SolarBot.io'}
                </Text>
              </Heading>
              <Text fontSize={{ base: 'md', lg: 'lg' }} color="gray.100">
                Automate your Solana trading with the most advanced arbitrage bot in the market. Discover and execute profitable opportunities in real-time across multiple DEXs.
              </Text>
              <Stack
                spacing={{ base: 4, sm: 6 }}
                direction={{ base: 'column', sm: 'row' }}
              >
                <Button
                  as={RouterLink}
                  to="/login"
                  rounded={'full'}
                  size={'lg'}
                  fontWeight={'normal'}
                  px={6}
                  colorScheme={'orange'}
                  bg={'orange.400'}
                  _hover={{ bg: 'orange.500' }}
                >
                  Get Started
                </Button>
                <Button
                  rounded={'full'}
                  size={'lg'}
                  fontWeight={'normal'}
                  px={6}
                  leftIcon={<Icon as={FiClock} h={4} w={4} />}
                >
                  Watch Demo
                </Button>
              </Stack>
            </Stack>
            <Flex
              flex={1}
              justify={'center'}
              align={'center'}
              position={'relative'}
              w={'full'}
              display={{ base: 'none', md: 'flex' }}
            >
              <Box
                position={'relative'}
                height={'400px'}
                rounded={'2xl'}
                boxShadow={'2xl'}
                width={'full'}
                overflow={'hidden'}
              >
                <Image
                  alt={'Dashboard Preview'}
                  fit={'cover'}
                  align={'center'}
                  w={'100%'}
                  h={'100%'}
                  src={'https://via.placeholder.com/800x600?text=SolarBot+Dashboard'}
                />
              </Box>
            </Flex>
          </Stack>
        </Container>
      </Box>

      {/* Features Section */}
      <Box py={20}>
        <Container maxW={'6xl'}>
          <Stack
            as={Box}
            textAlign={'center'}
            spacing={{ base: 10, md: 14 }}
          >
            <Heading
              fontWeight={600}
              fontSize={{ base: '2xl', sm: '4xl', lg: '5xl' }}
              lineHeight={'110%'}
            >
              Trade Smarter with 
              <Text as={'span'} color={'blue.400'}>
                {' Advanced Features'}
              </Text>
            </Heading>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
              <Feature
                icon={<Icon as={FiTrendingUp} w={10} h={10} />}
                title={'Advanced Arbitrage'}
                text={'Find profitable triangular arbitrage opportunities across multiple DEXs including Jupiter, Raydium and more.'}
              />
              <Feature
                icon={<Icon as={FiDollarSign} w={10} h={10} />}
                title={'Multi-Wallet Support'}
                text={'Manage multiple wallets for different strategies and maximize your trading efficiency with smart wallet rotation.'}
              />
              <Feature
                icon={<Icon as={FiShield} w={10} h={10} />}
                title={'Risk Management'}
                text={'Built-in slippage protection, position sizing and advanced simulation mode to validate trades before execution.'}
              />
            </SimpleGrid>
          </Stack>
        </Container>
      </Box>

      {/* Pricing Section */}
      <Box py={20} bg={useColorModeValue('gray.50', 'gray.800')}>
        <Container maxW={'6xl'}>
          <Stack
            as={Box}
            textAlign={'center'}
            spacing={{ base: 8, md: 14 }}
            mb={20}
          >
            <Heading
              fontWeight={600}
              fontSize={{ base: '2xl', sm: '4xl', lg: '5xl' }}
              lineHeight={'110%'}
            >
              <Text as={'span'} color={'blue.400'}>
                {'Flexible '}
              </Text>
              Plans for Every Trader
            </Heading>
            <Text color={useColorModeValue('gray.600', 'gray.400')} maxW={'3xl'} mx={'auto'}>
              Choose the perfect plan to match your trading style and volume. All plans include access to our core features and 24/7 support.
            </Text>
          </Stack>

          <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={{ base: 5, lg: 8 }} alignItems="stretch">
            <PricingTier
              title="Basic"
              price={49}
              accentColor="blue.500"
              isPopular={false}
              features={[
                'Single wallet support',
                'Basic arbitrage discovery',
                'Manual trade execution',
                '100 API calls per hour',
                'Email support',
              ]}
            />
            <PricingTier
              title="Professional"
              price={149}
              accentColor="purple.500"
              isPopular={true}
              features={[
                'Multi-wallet support (up to 5)',
                'Advanced arbitrage strategies',
                'Automated trading',
                '1,000 API calls per hour',
                'Priority email & chat support',
                'Custom notification settings',
              ]}
            />
            <PricingTier
              title="Enterprise"
              price={499}
              accentColor="orange.500"
              isPopular={false}
              features={[
                'Unlimited wallet support',
                'Custom trading strategies',
                'Priority transaction processing',
                'Unlimited API access',
                'Dedicated account manager',
                'White-label options available',
              ]}
            />
          </SimpleGrid>
        </Container>
      </Box>

      {/* Footer */}
      <Box bg={useColorModeValue('gray.100', 'gray.900')} p={10}>
        <Container maxW={'6xl'}>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
            <Stack spacing={4}>
              <Heading as="h2" size="md" mb={2}>SolarBot.io</Heading>
              <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                The most advanced Solana trading bot with powerful arbitrage strategies and multi-wallet support.  
              </Text>
            </Stack>
            <Stack spacing={4}>
              <Heading as="h2" size="md" mb={2}>Resources</Heading>
              <List spacing={2}>
                <ListItem><RouterLink to="/docs">Documentation</RouterLink></ListItem>
                <ListItem><RouterLink to="/guides">Guides</RouterLink></ListItem>
                <ListItem><RouterLink to="/api">API</RouterLink></ListItem>
                <ListItem><RouterLink to="/faqs">FAQs</RouterLink></ListItem>
              </List>
            </Stack>
            <Stack spacing={4}>
              <Heading as="h2" size="md" mb={2}>Contact</Heading>
              <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                support@solarbot.io
              </Text>
              <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                © {new Date().getFullYear()} SolarBot.io. All rights reserved.
              </Text>
            </Stack>
          </SimpleGrid>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
