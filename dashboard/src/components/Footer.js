import React from 'react';
import {
  Box,
  Container,
  SimpleGrid,
  Stack,
  Text,
  Heading,
  Link,
  Button,
  Input,
  FormControl,
  useColorModeValue,
  Icon,
  HStack,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FaTwitter, FaGithub, FaDiscord, FaTelegram } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      bg={useColorModeValue('gray.50', 'gray.900')}
      color={useColorModeValue('gray.700', 'gray.200')}
      mt="auto"
      borderTopWidth={1}
      borderStyle={'solid'}
      borderColor={useColorModeValue('gray.200', 'gray.700')}
    >
      <Container as={Stack} maxW={'6xl'} py={10}>
        <SimpleGrid
          templateColumns={{ sm: '1fr 1fr', md: '2fr 1fr 1fr 2fr' }}
          spacing={8}
        >
          <Stack spacing={6}>
            <Box>
              <Heading size="md" color={useColorModeValue('blue.600', 'blue.300')}>
                SolarBot.io
              </Heading>
            </Box>
            <Text fontSize={'sm'}>
              The most advanced Solana trading bot with powerful arbitrage strategies and multi-wallet support.
            </Text>
            <HStack spacing={4}>
              <Link href="https://twitter.com" isExternal>
                <Icon as={FaTwitter} w={5} h={5} />
              </Link>
              <Link href="https://github.com" isExternal>
                <Icon as={FaGithub} w={5} h={5} />
              </Link>
              <Link href="https://discord.com" isExternal>
                <Icon as={FaDiscord} w={5} h={5} />
              </Link>
              <Link href="https://telegram.org" isExternal>
                <Icon as={FaTelegram} w={5} h={5} />
              </Link>
            </HStack>
          </Stack>
          <Stack align={'flex-start'}>
            <Heading as="h4" size="sm" mb={2}>
              Company
            </Heading>
            <Link as={RouterLink} to='/about'>About</Link>
            <Link as={RouterLink} to='/pricing'>Pricing</Link>
            <Link as={RouterLink} to='/contact'>Contact</Link>
            <Link as={RouterLink} to='/terms'>Terms of Service</Link>
            <Link as={RouterLink} to='/privacy'>Privacy Policy</Link>
          </Stack>
          <Stack align={'flex-start'}>
            <Heading as="h4" size="sm" mb={2}>
              Resources
            </Heading>
            <Link as={RouterLink} to='/docs'>Documentation</Link>
            <Link as={RouterLink} to='/guides'>Guides</Link>
            <Link as={RouterLink} to='/api'>API</Link>
            <Link as={RouterLink} to='/faqs'>FAQs</Link>
            <Link as={RouterLink} to='/blog'>Blog</Link>
          </Stack>
          <Stack align={'flex-start'}>
            <Heading as="h4" size="sm" mb={2}>
              Stay up to date
            </Heading>
            <Text fontSize='sm'>Subscribe to our newsletter for the latest features and updates.</Text>
            <Stack direction={'row'} spacing={2} width='100%' maxW='400px'>
              <FormControl>
                <Input
                  placeholder={'Your email address'}
                  bg={useColorModeValue('white', 'gray.800')}
                  border={1}
                  borderColor={useColorModeValue('gray.300', 'gray.700')}
                  _focus={{
                    bg: useColorModeValue('white', 'gray.800'),
                    borderColor: 'blue.500',
                  }}
                />
              </FormControl>
              <Button
                bg={'blue.500'}
                color={'white'}
                _hover={{
                  bg: 'blue.600',
                }}
              >
                Subscribe
              </Button>
            </Stack>
          </Stack>
        </SimpleGrid>
      </Container>

      <Box
        borderTopWidth={1}
        borderStyle={'solid'}
        borderColor={useColorModeValue('gray.200', 'gray.700')}
      >
        <Container
          as={Stack}
          maxW={'6xl'}
          py={4}
          direction={{ base: 'column', md: 'row' }}
          spacing={4}
          justify={{ base: 'center', md: 'space-between' }}
          align={{ base: 'center', md: 'center' }}
        >
          <Text>© {currentYear} SolarBot.io. All rights reserved</Text>
        </Container>
      </Box>
    </Box>
  );
};

export default Footer;
