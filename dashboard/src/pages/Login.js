import React, { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  useColorModeValue,
  Image,
  Alert,
  AlertIcon,
  InputGroup,
  InputRightElement,
  IconButton,
  Link,
  Divider,
} from '@chakra-ui/react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // In a real app, this would be an API call
      // const response = await api.login(email, password);
      
      // For demo purposes, we'll simulate a login
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check for demo credentials
      if (email === 'demo@solarbot.io' && password === 'demo123') {
        // Login successful
        onLogin('demo-token-xyz');
      } else {
        // For demo, allow any credentials
        onLogin('fake-token-xyz');
      }
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex
      minH={'100vh'}
      align={'center'}
      justify={'center'}
      bg={useColorModeValue('gray.50', 'gray.800')}
    >
      <Stack spacing={8} mx={'auto'} maxW={'lg'} py={12} px={6} w={{ base: 'full', md: '500px' }}>
        <Stack align={'center'} mb={4}>
          <Heading
            fontSize={'4xl'}
            bgGradient="linear(to-l, #7928CA, #FF0080)"
            bgClip="text"
            fontWeight="extrabold"
          >
            SolarBot.io
          </Heading>
          <Text fontSize={'lg'} color={'gray.600'}>
            Solana Trading Bot Dashboard
          </Text>
        </Stack>
        
        <Box
          rounded={'lg'}
          bg={useColorModeValue('white', 'gray.700')}
          boxShadow={'lg'}
          p={8}
        >
          <form onSubmit={handleSubmit}>
            <Stack spacing={4}>
              {error && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  {error}
                </Alert>
              )}
              
              <FormControl id="email" isRequired>
                <FormLabel>Email address</FormLabel>
                <Input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com" 
                  autoComplete="email"
                />
              </FormControl>
              
              <FormControl id="password" isRequired>
                <FormLabel>Password</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <InputRightElement>
                    <IconButton
                      size="sm"
                      variant="ghost"
                      icon={showPassword ? <FiEyeOff /> : <FiEye />}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>
              
              <Stack spacing={10} pt={2}>
                <Button
                  type="submit"
                  loadingText="Signing in"
                  size="lg"
                  bg={'blue.400'}
                  color={'white'}
                  _hover={{
                    bg: 'blue.500',
                  }}
                  isLoading={isLoading}
                >
                  Sign in
                </Button>
              </Stack>
              
              <Stack pt={6}>
                <Text align={'center'}>
                  <Link color={'blue.400'}>Forgot password?</Link>
                </Text>
              </Stack>
              
              <Divider my={4} />
              
              <Box textAlign="center">
                <Text fontSize="sm" color="gray.500" mb={2}>
                  Demo credentials:
                </Text>
                <Text fontSize="xs" fontFamily="monospace">
                  Email: demo@solarbot.io
                </Text>
                <Text fontSize="xs" fontFamily="monospace">
                  Password: demo123
                </Text>
              </Box>
            </Stack>
          </form>
        </Box>
      </Stack>
    </Flex>
  );
};

export default Login;
