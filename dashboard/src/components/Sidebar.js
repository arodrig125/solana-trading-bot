import React from 'react';
import {
  Box,
  Flex,
  Icon,
  Text,
  Stack,
  Link,
  useColorModeValue
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { FiHome, FiTrendingUp, FiDatabase, FiSettings, FiInfo } from 'react-icons/fi';
import { RiExchangeDollarLine } from 'react-icons/ri';

const NavItem = ({ icon, children, path, ...rest }) => {
  const location = useLocation();
  const isActive = location.pathname === path;
  const activeColor = useColorModeValue('blue.500', 'blue.300');
  const inactiveColor = useColorModeValue('gray.600', 'gray.300');
  const activeBg = useColorModeValue('blue.50', 'blue.900');
  
  return (
    <Link
      as={RouterLink}
      to={path}
      style={{ textDecoration: 'none' }}
      _focus={{ boxShadow: 'none' }}
    >
      <Flex
        align="center"
        p="4"
        mx="2"
        mb="1"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        bg={isActive ? activeBg : 'transparent'}
        color={isActive ? activeColor : inactiveColor}
        fontWeight={isActive ? 'bold' : 'normal'}
        _hover={{
          bg: activeBg,
          color: activeColor,
        }}
        {...rest}
      >
        {icon && (
          <Icon
            mr="4"
            fontSize="18"
            as={icon}
          />
        )}
        {children}
      </Flex>
    </Link>
  );
};

const Sidebar = () => {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      h="100vh"
      w={{ base: 'full', md: '250px' }}
      bg={bg}
      borderRight="1px"
      borderRightColor={borderColor}
      position="sticky"
      top="0"
    >
      <Flex h="20" alignItems="center" justifyContent="center">
        <Text
          fontSize="2xl"
          fontFamily="monospace"
          fontWeight="bold"
          bgGradient="linear(to-l, #7928CA, #FF0080)"
          bgClip="text"
        >
          SolarBot.io
        </Text>
      </Flex>
      
      <Stack spacing={1} direction="column" mt={2}>
        <NavItem icon={FiHome} path="/">
          Dashboard
        </NavItem>
        <NavItem icon={RiExchangeDollarLine} path="/trading">
          Trading
        </NavItem>
        <NavItem icon={FiDatabase} path="/wallets">
          Wallets
        </NavItem>
        <NavItem icon={FiTrendingUp} path="/analytics">
          Analytics
        </NavItem>
        <NavItem icon={FiSettings} path="/settings">
          Settings
        </NavItem>
        <NavItem icon={FiInfo} path="/help">
          Help & Support
        </NavItem>
      </Stack>
      
      <Box position="absolute" bottom="0" w="full" p={4}>
        <Text fontSize="sm" color="gray.500" textAlign="center">
          v1.0.0 • © 2025 SolarBot
        </Text>
      </Box>
    </Box>
  );
};

export default Sidebar;
