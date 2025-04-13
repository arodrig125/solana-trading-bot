import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  IconButton,
  Button,
  Stack,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  useColorMode,
  Badge,
  Tooltip,
  HStack,
  Divider,
  Link
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { 
  FiSun, 
  FiMoon, 
  FiBell, 
  FiSettings, 
  FiLogOut, 
  FiUser, 
  FiDollarSign,
  FiActivity
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const Header = ({ onLogout, onNotificationsClick }) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { user } = useAuth();
  const location = useLocation();
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const highlightColor = useColorModeValue('blue.50', 'blue.900');
  
  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Format time as HH:MM AM/PM
  const formatTime = () => {
    return currentTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true
    });
  };

  // Get day and date
  const formatDate = () => {
    return currentTime.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric'
    });
  };
  
  // Get title for current page
  const getPageTitle = () => {
    const path = location.pathname;
    switch (path) {
      case '/':
        return 'Dashboard';
      case '/trading':
        return 'Trading';
      case '/wallets':
        return 'Wallet Management';
      case '/settings':
        return 'Settings';
      default:
        return 'SolarBot Dashboard';
    }
  };

  return (
    <Box
      bg={bg}
      borderBottom={1}
      borderStyle={'solid'}
      borderColor={borderColor}
      px={4}
      py={2}
      position="sticky"
      top={0}
      zIndex={10}
    >
      <Flex alignItems={'center'} justifyContent={'space-between'}>
        <HStack spacing={4}>
          <Text fontSize="xl" fontWeight="bold" color={useColorModeValue('blue.600', 'blue.200')}>
            {getPageTitle()}
          </Text>
          
          <Box display={{ base: 'none', md: 'block' }}>
            <HStack spacing={1} color="gray.500" fontSize="sm">
              <FiActivity />
              <Text>SOL: $123.45</Text>
              <Text color="green.500">(+5.6%)</Text>
              <Divider orientation="vertical" height="20px" mx={2} />
              <Text>{formatDate()}</Text>
              <Text>{formatTime()}</Text>
            </HStack>
          </Box>
        </HStack>

        <Flex alignItems={'center'}>
          <Stack direction={'row'} spacing={3} align="center">
            {/* User subscription badge */}
            <Tooltip label={`${user?.tier || 'Pro'} Subscription`}>
              <Badge colorScheme="purple" variant="solid" fontSize="xs" px={2} py={1}>
                {user?.tier || 'Pro'}
              </Badge>
            </Tooltip>
            
            {/* Theme toggle */}
            <Tooltip label={`Switch to ${colorMode === 'light' ? 'dark' : 'light'} mode`}>
              <IconButton
                size={'sm'}
                variant={'ghost'}
                aria-label={'Toggle Color Mode'}
                onClick={toggleColorMode}
                icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
              />
            </Tooltip>
            
            {/* Notifications */}
            <Box position="relative">
              <Tooltip label="Notifications">
                <IconButton
                  size={'sm'}
                  variant={'ghost'}
                  aria-label={'Notifications'}
                  icon={<FiBell />}
                  onClick={onNotificationsClick}
                />
              </Tooltip>
              
              {unreadNotifications > 0 && (
                <Badge
                  position="absolute"
                  top={0}
                  right={0}
                  transform="translate(25%, -25%)"
                  borderRadius="full"
                  colorScheme="red"
                  fontSize="xs"
                >
                  {unreadNotifications}
                </Badge>
              )}
            </Box>

            {/* User menu */}
            <Menu>
              <MenuButton
                as={Button}
                rounded={'full'}
                variant={'link'}
                cursor={'pointer'}
                minW={0}
              >
                <Avatar
                  size={'sm'}
                  src={'https://api.dicebear.com/7.x/personas/svg?seed=solarbot'}
                  name={user?.name || 'User'}
                />
              </MenuButton>
              <MenuList>
                <MenuItem icon={<FiUser />}>
                  <Box>
                    <Text fontWeight="medium">{user?.name || 'SolarBot User'}</Text>
                    <Text fontSize="xs" color="gray.500">{user?.email || 'user@solarbot.io'}</Text>
                  </Box>
                </MenuItem>
                <Divider />
                <MenuItem icon={<FiDollarSign />}>Subscription</MenuItem>
                <MenuItem icon={<FiSettings />} as={RouterLink} to="/settings">Settings</MenuItem>
                <MenuItem icon={<FiLogOut />} onClick={onLogout}>Logout</MenuItem>
              </MenuList>
            </Menu>
          </Stack>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Header;
