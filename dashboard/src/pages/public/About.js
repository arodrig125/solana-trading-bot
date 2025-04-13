import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Stack,
  SimpleGrid,
  Avatar,
  Flex,
  Image,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';

const TeamMember = ({ name, role, bio, image }) => {
  return (
    <Box
      maxW={'340px'}
      w={'full'}
      bg={useColorModeValue('white', 'gray.700')}
      boxShadow={'lg'}
      rounded={'lg'}
      p={6}
      textAlign={'center'}
    >
      <Avatar
        size={'xl'}
        src={image}
        mb={4}
        pos={'relative'}
      />
      <Heading fontSize={'2xl'} fontFamily={'body'}>
        {name}
      </Heading>
      <Text fontWeight={600} color={'gray.500'} mb={4}>
        {role}
      </Text>
      <Text
        textAlign={'center'}
        color={useColorModeValue('gray.700', 'gray.400')}
        px={3}
      >
        {bio}
      </Text>
    </Box>
  );
};

const About = () => {
  const teamMembers = [
    {
      name: 'Alex Rodriguez',
      role: 'Founder & Lead Developer',
      bio: 'DeFi enthusiast with extensive experience in algorithmic trading and Solana development. Built SolarBot to democratize access to arbitrage opportunities.',
      image: 'https://randomuser.me/api/portraits/men/1.jpg',
    },
    {
      name: 'Sarah Chen',
      role: 'Trading Strategist',
      bio: 'Former quantitative analyst with 8+ years experience in crypto markets. Specializes in designing efficient trading algorithms and risk management systems.',
      image: 'https://randomuser.me/api/portraits/women/2.jpg',
    },
    {
      name: 'Michael Patel',
      role: 'Security Expert',
      bio: 'Blockchain security specialist ensuring all transactions and wallet interactions are secure. Previously worked on securing major DeFi protocols.',
      image: 'https://randomuser.me/api/portraits/men/3.jpg',
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box bg={useColorModeValue('blue.50', 'gray.800')} py={20}>
        <Container maxW={'6xl'}>
          <Stack spacing={8} align={'center'} textAlign={'center'}>
            <Heading
              fontWeight={700}
              fontSize={{ base: '3xl', sm: '4xl', md: '5xl' }}
              lineHeight={'110%'}
            >
              About SolarBot
              <Text as={'span'} color={'blue.500'}>
                .io
              </Text>
            </Heading>
            <Text maxW={'2xl'} fontSize={'xl'} color={'gray.500'}>
              We're building the future of Solana trading through innovative arbitrage strategies and cutting-edge automation
            </Text>
          </Stack>
        </Container>
      </Box>

      {/* Our Story */}
      <Container maxW={'6xl'} py={16}>
        <Stack spacing={12}>
          <Stack spacing={6}>
            <Heading size="xl">Our Story</Heading>
            <Text fontSize={'lg'} color={'gray.500'} maxW={'4xl'}>
              SolarBot began in 2023 when our founder noticed a significant inefficiency in Solana-based DEXes. 
              What started as a simple script to automate profitable trades between Jupiter and other platforms 
              evolved into a comprehensive trading system that has processed millions in trade volume.
            </Text>
            <Text fontSize={'lg'} color={'gray.500'} maxW={'4xl'}>
              Our mission is to democratize access to sophisticated trading strategies that were previously 
              only available to large institutions and tech-savvy traders. By simplifying complex arbitrage 
              detection and execution, we've enabled thousands of traders to profit from market inefficiencies 
              without needing deep technical knowledge.
            </Text>
          </Stack>

          <Box>
            <Image
              rounded={'md'}
              alt={'feature image'}
              src={'https://images.unsplash.com/photo-1516245834210-c4c142787335?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1169&q=80'}
              objectFit={'cover'}
              width={'100%'}
              height={'300px'}
            />
          </Box>
        </Stack>
      </Container>

      {/* Our Values */}
      <Box bg={useColorModeValue('gray.50', 'gray.700')} py={16}>
        <Container maxW={'6xl'}>
          <VStack spacing={8} align={'start'}>
            <Heading size="xl">Our Values</Heading>
            
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10} width="100%">
              <Box p={5} shadow={'md'} borderWidth={'1px'} borderRadius={'md'} bg={useColorModeValue('white', 'gray.800')}>
                <Heading fontSize={'xl'} mb={4}>Innovation</Heading>
                <Text>We constantly push the boundaries of what's possible in DeFi trading, developing new strategies and tools to stay ahead of the market.</Text>
              </Box>
              
              <Box p={5} shadow={'md'} borderWidth={'1px'} borderRadius={'md'} bg={useColorModeValue('white', 'gray.800')}>
                <Heading fontSize={'xl'} mb={4}>Accessibility</Heading>
                <Text>We believe sophisticated trading strategies should be accessible to everyone, not just those with technical expertise or large capital.</Text>
              </Box>
              
              <Box p={5} shadow={'md'} borderWidth={'1px'} borderRadius={'md'} bg={useColorModeValue('white', 'gray.800')}>
                <Heading fontSize={'xl'} mb={4}>Security</Heading>
                <Text>We prioritize the security of our users' funds and data above all else, implementing industry-best practices and regular security audits.</Text>
              </Box>
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* Team */}
      <Container maxW={'6xl'} py={16}>
        <VStack spacing={12}>
          <Heading size="xl">Meet Our Team</Heading>
          <Flex flexWrap="wrap" gridGap={6} justify="center">
            {teamMembers.map((member, index) => (
              <TeamMember key={index} {...member} />
            ))}
          </Flex>
        </VStack>
      </Container>
    </Box>
  );
};

export default About;
