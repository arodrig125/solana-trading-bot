import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Divider,
  Heading,
  HStack,
  List,
  ListIcon,
  ListItem,
  Stack,
  Text,
  VStack,
  useColorModeValue,
  Switch,
  Flex,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FiCheck, FiX } from 'react-icons/fi';

const PricingCard = ({
  title,
  price,
  frequency,
  description,
  features,
  notIncluded,
  highlighted,
  actionText,
  annualPrice,
  isBillingAnnual,
}) => {
  const bgColor = highlighted
    ? useColorModeValue('blue.500', 'blue.300')
    : useColorModeValue('white', 'gray.700');
  const textColor = highlighted
    ? 'white'
    : useColorModeValue('gray.900', 'white');
  const borderColor = highlighted
    ? 'transparent'
    : useColorModeValue('gray.200', 'gray.600');
  const priceToShow = isBillingAnnual ? annualPrice : price;

  return (
    <Box
      position="relative"
      maxW={'330px'}
      w={'full'}
      bg={bgColor}
      boxShadow={'lg'}
      rounded={'md'}
      overflow={'hidden'}
      borderWidth={1}
      borderColor={borderColor}
      transform={highlighted ? { lg: 'scale(1.05)' } : {}}
      zIndex={highlighted ? 1 : 0}
    >
      {highlighted && (
        <Box
          position="absolute"
          top={4}
          right={4}
          bg="yellow.400"
          color="gray.800"
          px={3}
          py={1}
          fontWeight="bold"
          fontSize="xs"
          borderRadius="full"
          boxShadow="md"
        >
          POPULAR
        </Box>
      )}
      <Box p={6}>
        <Stack spacing={0} align={'center'} mb={5}>
          <Heading
            fontSize={'2xl'}
            fontWeight={500}
            fontFamily={'body'}
            color={textColor}
          >
            {title}
          </Heading>
          <Stack direction={'row'} align={'center'} justify={'center'}>
            <Text fontSize={'5xl'} fontWeight={800} color={textColor}>
              ${priceToShow}
            </Text>
            <Text color={highlighted ? 'white' : 'gray.500'}>/ {frequency}</Text>
          </Stack>
          <Text
            fontSize={'sm'}
            color={highlighted ? 'white' : 'gray.500'}
            textAlign="center"
            pt={3}
          >
            {description}
          </Text>
        </Stack>

        <Divider mb={6} borderColor={highlighted ? 'whiteAlpha.300' : 'gray.200'} />

        <List spacing={3} mb={6}>
          {features.map((feature, index) => (
            <ListItem
              key={index}
              color={textColor}
              fontSize="sm"
              fontWeight={400}
            >
              <ListIcon as={FiCheck} color={highlighted ? 'white' : 'green.500'} />
              {feature}
            </ListItem>
          ))}

          {notIncluded && notIncluded.map((feature, index) => (
            <ListItem
              key={`not-${index}`}
              color={highlighted ? 'whiteAlpha.700' : 'gray.400'}
              fontSize="sm"
              fontWeight={400}
            >
              <ListIcon as={FiX} color={highlighted ? 'whiteAlpha.500' : 'red.400'} />
              {feature}
            </ListItem>
          ))}
        </List>

        <Button
          as={RouterLink}
          to="/login"
          mt={3}
          w={'full'}
          colorScheme={highlighted ? 'yellow' : 'blue'}
          color={highlighted ? 'gray.800' : 'white'}
          fontWeight={'bold'}
          boxShadow={'md'}
          _hover={{
            transform: 'translateY(-2px)',
            boxShadow: 'lg',
          }}
        >
          {actionText || 'Get Started'}
        </Button>
      </Box>
    </Box>
  );
};

const Pricing = () => {
  const [annualBilling, setAnnualBilling] = useState(false);

  const pricingPlans = [
    {
      title: 'Basic',
      price: 49,
      annualPrice: 39,
      frequency: 'month',
      description: 'Perfect for new traders looking to explore Solana arbitrage',
      highlighted: false,
      features: [
        'Single wallet support',
        'Basic arbitrage discovery',
        'Manual trade execution',
        '100 API calls per hour',
        'Email support',
        'Standard market data',
        'Basic analytics',
      ],
      notIncluded: [
        'Multi-wallet support',
        'Automated trading',
        'Custom strategies',
      ],
    },
    {
      title: 'Professional',
      price: 149,
      annualPrice: 119,
      frequency: 'month',
      description: 'The ideal package for serious traders seeking consistent profits',
      highlighted: true,
      features: [
        'Multi-wallet support (up to 5)',
        'Advanced arbitrage strategies',
        'Automated trading',
        '1,000 API calls per hour',
        'Priority email & chat support',
        'Custom notification settings',
        'Advanced analytics dashboard',
        'Risk management tools',
        'Performance reporting',
      ],
      notIncluded: [
        'Unlimited wallet support',
        'White-label options',
      ],
    },
    {
      title: 'Enterprise',
      price: 499,
      annualPrice: 399,
      frequency: 'month',
      description: 'For professional traders and institutional clients with high-volume needs',
      highlighted: false,
      features: [
        'Unlimited wallet support',
        'Custom trading strategies',
        'Priority transaction processing',
        'Unlimited API access',
        'Dedicated account manager',
        'White-label options available',
        'Advanced analytics dashboard',
        'Custom integration support',
        'VIP support 24/7',
        'Priority feature requests',
      ],
      notIncluded: [],
    },
  ];

  return (
    <Box>
      {/* Pricing Header */}
      <Box bg={useColorModeValue('blue.50', 'gray.800')} py={16}>
        <Container maxW="6xl">
          <Stack spacing={4} as={Container} maxW={'3xl'} textAlign={'center'}>
            <Heading fontSize={'4xl'} fontWeight={'bold'}>
              Simple, Transparent Pricing
            </Heading>
            <Text color={'gray.500'} fontSize={'xl'}>
              Choose the perfect plan for your trading needs. All plans include access to our core features and regular updates.
            </Text>
          </Stack>
        </Container>
      </Box>

      {/* Pricing Toggle */}
      <Box py={6}>
        <Flex justify="center" align="center" mb={10}>
          <Text fontWeight="medium" mr={3}>Monthly</Text>
          <Switch
            colorScheme="blue"
            size="md"
            isChecked={annualBilling}
            onChange={() => setAnnualBilling(!annualBilling)}
          />
          <Text fontWeight="medium" ml={3}>Annual</Text>
          <Text
            ml={2}
            fontSize="sm"
            bg="green.100"
            color="green.700"
            fontWeight="semibold"
            px={2}
            py={1}
            borderRadius="md"
          >
            Save 20%
          </Text>
        </Flex>

        {/* Pricing Cards */}
        <Container maxW={'6xl'} py={4}>
          <HStack
            spacing={4}
            align={'center'}
            justify={'center'}
            direction={{ base: 'column', md: 'row' }}
            wrap={{ base: 'wrap', md: 'nowrap' }}
          >
            {pricingPlans.map((plan, index) => (
              <PricingCard
                key={index}
                title={plan.title}
                price={plan.price}
                annualPrice={plan.annualPrice}
                isBillingAnnual={annualBilling}
                frequency={annualBilling ? 'month, billed annually' : plan.frequency}
                description={plan.description}
                features={plan.features}
                notIncluded={plan.notIncluded}
                highlighted={plan.highlighted}
              />
            ))}
          </HStack>
        </Container>
      </Box>

      {/* FAQ Section */}
      <Box bg={useColorModeValue('gray.50', 'gray.700')} py={16}>
        <Container maxW={'4xl'}>
          <VStack spacing={4} align={'start'}>
            <Heading as="h2" size="xl" mb={6}>Frequently Asked Questions</Heading>
            
            <Box mb={6}>
              <Heading as="h3" size="md" mb={2}>Can I upgrade or downgrade my plan?</Heading>
              <Text color={useColorModeValue('gray.600', 'gray.300')}>
                Yes, you can upgrade or downgrade your plan at any time. When you upgrade, you'll be charged the prorated difference. When you downgrade, the new price will take effect on your next billing cycle.
              </Text>
            </Box>
            
            <Box mb={6}>
              <Heading as="h3" size="md" mb={2}>How do API call limits work?</Heading>
              <Text color={useColorModeValue('gray.600', 'gray.300')}>
                API calls are counted per hour, and they reset at the beginning of each hour. If you exceed your limit, requests will be throttled until the next hour begins. For high-volume needs, the Enterprise plan offers unlimited API access.
              </Text>
            </Box>
            
            <Box mb={6}>
              <Heading as="h3" size="md" mb={2}>What payment methods do you accept?</Heading>
              <Text color={useColorModeValue('gray.600', 'gray.300')}>
                We accept all major credit cards, PayPal, and cryptocurrency payments in SOL and USDC.
              </Text>
            </Box>
            
            <Box mb={6}>
              <Heading as="h3" size="md" mb={2}>Is there a free trial?</Heading>
              <Text color={useColorModeValue('gray.600', 'gray.300')}>
                New users can sign up for a 7-day free trial of the Basic plan. No credit card required. You can upgrade at any time during or after your trial.
              </Text>
            </Box>
            
            <Box mb={6}>
              <Heading as="h3" size="md" mb={2}>What if I'm not satisfied with the service?</Heading>
              <Text color={useColorModeValue('gray.600', 'gray.300')}>
                We offer a 14-day money-back guarantee. If you're not satisfied with our service within the first 14 days, contact our support team for a full refund.
              </Text>
            </Box>
          </VStack>
        </Container>
      </Box>

      {/* Enterprise CTA */}
      <Box py={16}>
        <Container maxW={'4xl'} bg={useColorModeValue('blue.50', 'blue.900')} p={10} borderRadius="lg">
          <Stack spacing={4} direction={{ base: 'column', md: 'row' }} align="center" justify="space-between">
            <Stack spacing={2} flex={1}>
              <Heading as="h2" size="lg">Need a custom solution?</Heading>
              <Text color={useColorModeValue('gray.600', 'gray.300')}>
                Contact our sales team to discuss a custom solution tailored to your specific trading needs.
              </Text>
            </Stack>
            <Button
              as={RouterLink}
              to="/contact"
              size="lg"
              colorScheme="blue"
              variant="solid"
              px={8}
            >
              Contact Sales
            </Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default Pricing;
