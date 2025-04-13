import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Button,
  VStack,
  Text,
  Flex,
  Avatar,
  Badge,
  Divider,
  IconButton,
  useColorModeValue,
  Tooltip
} from '@chakra-ui/react';
import { FiCheck, FiX, FiAlertTriangle, FiInfo, FiCheckCircle } from 'react-icons/fi';
import { formatRelativeTime } from '../../utils/format';

// Sample notifications data - this would come from API in a real app
const SAMPLE_NOTIFICATIONS = [
  {
    id: '1',
    type: 'trade',
    status: 'success',
    title: 'Trade Executed Successfully',
    description: 'USDC → SOL → ETH → USDC with 2.3% profit',
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(), // 15 minutes ago
    read: false
  },
  {
    id: '2',
    type: 'opportunity',
    status: 'info',
    title: 'New Arbitrage Opportunity',
    description: 'Found potential 3.1% profit in USDC → BONK → SOL → USDC',
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(), // 45 minutes ago
    read: false
  },
  {
    id: '3',
    type: 'system',
    status: 'warning',
    title: 'Wallet Balance Low',
    description: 'Secondary wallet SOL balance is below 0.5 SOL',
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), // 2 hours ago
    read: true
  },
  {
    id: '4',
    type: 'trade',
    status: 'error',
    title: 'Trade Failed',
    description: 'USDC → RAY → SOL → USDC failed due to slippage',
    timestamp: new Date(Date.now() - 1 * 86400000).toISOString(), // 1 day ago
    read: true
  },
  {
    id: '5',
    type: 'system',
    status: 'success',
    title: 'New Wallet Added',
    description: 'Wallet "Reserve Wallet" has been added',
    timestamp: new Date(Date.now() - 2 * 86400000).toISOString(), // 2 days ago
    read: true
  },
];

// Notification item component
const NotificationItem = ({ notification, onMarkAsRead, onDelete }) => {
  const {
    id,
    type,
    status,
    title,
    description,
    timestamp,
    read
  } = notification;
  
  // Icon based on notification type and status
  const getIcon = () => {
    switch (status) {
      case 'success':
        return FiCheckCircle;
      case 'error':
        return FiX;
      case 'warning':
        return FiAlertTriangle;
      case 'info':
      default:
        return FiInfo;
    }
  };
  
  // Color based on status
  const getColor = () => {
    switch (status) {
      case 'success':
        return 'green';
      case 'error':
        return 'red';
      case 'warning':
        return 'orange';
      case 'info':
      default:
        return 'blue';
    }
  };
  
  const Icon = getIcon();
  const color = getColor();
  const bgColor = useColorModeValue(`${color}.50`, `${color}.900`);
  const borderColor = useColorModeValue(`${color}.200`, `${color}.700`);
  const unreadBg = useColorModeValue('blue.50', 'blue.900');
  
  return (
    <Box 
      position="relative"
      p={3} 
      borderRadius="md" 
      borderWidth="1px"
      borderLeftWidth="4px"
      borderLeftColor={`${color}.500`}
      borderColor={read ? borderColor : unreadBg}
      bg={read ? 'transparent' : unreadBg}
      transition="all 0.2s"
      _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
    >
      {!read && (
        <Badge 
          position="absolute" 
          top={2} 
          right={2} 
          colorScheme="blue" 
          variant="solid" 
          size="xs"
        >
          New
        </Badge>
      )}
      
      <Flex>
        <Avatar 
          icon={<Icon />} 
          bg={bgColor} 
          color={`${color}.500`} 
          size="sm" 
          mr={3}
        />
        
        <Box flex="1" pr={read ? 0 : 10}>
          <Text fontWeight="semibold" fontSize="sm">{title}</Text>
          <Text fontSize="sm" color="gray.600" noOfLines={2}>{description}</Text>
          <Text fontSize="xs" color="gray.500" mt={1}>{formatRelativeTime(timestamp)}</Text>
        </Box>
        
        <Flex direction="column" ml={2} justify="space-between" align="flex-end">
          {!read && (
            <Tooltip label="Mark as read">
              <IconButton
                aria-label="Mark as read"
                icon={<FiCheck />}
                size="xs"
                variant="ghost"
                colorScheme="blue"
                onClick={() => onMarkAsRead(id)}
              />
            </Tooltip>
          )}
          
          <Tooltip label="Delete notification">
            <IconButton
              aria-label="Delete notification"
              icon={<FiX />}
              size="xs"
              variant="ghost"
              colorScheme="red"
              mt="auto"
              onClick={() => onDelete(id)}
            />
          </Tooltip>
        </Flex>
      </Flex>
    </Box>
  );
};

const NotificationsPanel = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Fetch notifications - in a real app this would be from an API
    const fetchNotifications = async () => {
      setLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setNotifications(SAMPLE_NOTIFICATIONS);
      setLoading(false);
    };
    
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);
  
  const handleMarkAsRead = (id) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };
  
  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, read: true })));
  };
  
  const handleDelete = (id) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
  };
  
  const handleDeleteAll = () => {
    setNotifications([]);
  };
  
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px">
          <Flex justify="space-between" align="center">
            Notifications
            {unreadCount > 0 && (
              <Badge colorScheme="blue" borderRadius="full" px={2}>
                {unreadCount} new
              </Badge>
            )}
          </Flex>
        </DrawerHeader>

        <DrawerBody>
          {loading ? (
            <Flex justify="center" align="center" height="100%">
              <Text>Loading notifications...</Text>
            </Flex>
          ) : notifications.length === 0 ? (
            <Flex direction="column" justify="center" align="center" height="100%">
              <FiInfo size={40} color="gray" />
              <Text mt={4} color="gray.500">No notifications</Text>
            </Flex>
          ) : (
            <VStack spacing={3} align="stretch">
              {notifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                />
              ))}
            </VStack>
          )}
        </DrawerBody>

        <DrawerFooter borderTopWidth="1px">
          <Flex width="100%" justify="space-between">
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} isDisabled={unreadCount === 0}>
              Mark all as read
            </Button>
            <Button colorScheme="red" variant="ghost" size="sm" onClick={handleDeleteAll} isDisabled={notifications.length === 0}>
              Clear all
            </Button>
          </Flex>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default NotificationsPanel;
