import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Stack,
  Badge,
  IconButton,
  Tooltip,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Input,
  FormControl,
  FormLabel,
  FormHelperText,
  useToast,
  Select,
  Skeleton,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiPlus, FiRefreshCw, FiCopy, FiTrash2, FiStar, FiEye, FiEyeOff } from 'react-icons/fi';

// Sample wallet data - this would come from your API in a real application
const SAMPLE_WALLETS = [
  {
    id: '1',
    name: 'Main Trading Wallet',
    address: '8ZUczSFQWvCZVRJUHbYqvxLzc7GHnLYdXoS1yxX8jPTP',
    balance: {
      sol: 2.45,
      usdc: 523.67,
      other: [
        { symbol: 'ETH', amount: 0.12 },
        { symbol: 'BONK', amount: 125000 },
        { symbol: 'JUP', amount: 534.8 },
      ]
    },
    transactions: 35,
    isDefault: true,
    lastActive: '2 hours ago'
  },
  {
    id: '2',
    name: 'Secondary Wallet',
    address: '6YR1mxTCjm5nPu1unVHzXRjCfZPPN4vV1sMQoHUvnVcA',
    balance: {
      sol: 1.32,
      usdc: 312.45,
      other: [
        { symbol: 'ETH', amount: 0.05 },
        { symbol: 'JUP', amount: 230.4 },
      ]
    },
    transactions: 18,
    isDefault: false,
    lastActive: '1 day ago'
  },
  {
    id: '3',
    name: 'Reserve Wallet',
    address: '9RV1y5QFzb9GR5jK8mgJ5GDbyopxbWLQ3FbAHueg9vMW',
    balance: {
      sol: 5.67,
      usdc: 1042.89,
      other: [
        { symbol: 'ETH', amount: 0.3 },
        { symbol: 'RAY', amount: 125.6 },
        { symbol: 'JUP', amount: 1240.5 },
      ]
    },
    transactions: 7,
    isDefault: false,
    lastActive: '5 days ago'
  },
];

// Wallet Card Component
const WalletCard = ({ wallet, onRefresh, onSetDefault, onDelete, onRename }) => {
  const [isPrivateKeyVisible, setIsPrivateKeyVisible] = useState(false);
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.600');
  const tokenBgColor = useColorModeValue('gray.50', 'gray.600');
  const solBgColor = useColorModeValue('blue.50', 'blue.900');
  const usdcBgColor = useColorModeValue('green.50', 'green.900');
  
  const handleCopyAddress = () => {
    navigator.clipboard.writeText(wallet.address);
    toast({
      title: 'Address copied',
      description: 'Wallet address copied to clipboard',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };
  
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };
  
  return (
    <Card 
      bg={cardBg} 
      borderWidth="1px" 
      borderColor={borderColor}
      borderRadius="lg"
      overflow="hidden"
      transition="all 0.2s"
      _hover={{ shadow: 'md', borderColor: 'blue.300' }}
    >
      <CardHeader pb={2}>
        <Flex justifyContent="space-between" alignItems="center">
          <HStack>
            <Heading size="md">{wallet.name}</Heading>
            {wallet.isDefault && (
              <Badge colorScheme="green">Default</Badge>
            )}
          </HStack>
          <HStack>
            <Tooltip label="Refresh Balance">
              <IconButton
                aria-label="Refresh wallet"
                icon={<FiRefreshCw />}
                size="sm"
                variant="ghost"
                onClick={() => onRefresh(wallet.id)}
              />
            </Tooltip>
            <Tooltip label={wallet.isDefault ? "Default Wallet" : "Set as Default"}>
              <IconButton
                aria-label="Set as default"
                icon={<FiStar />}
                size="sm"
                variant="ghost"
                colorScheme={wallet.isDefault ? "yellow" : "gray"}
                onClick={() => onSetDefault(wallet.id)}
                isDisabled={wallet.isDefault}
              />
            </Tooltip>
          </HStack>
        </Flex>
      </CardHeader>
      
      <CardBody py={2}>
        <VStack align="stretch" spacing={3}>
          <Box>
            <Flex justify="space-between" align="center">
              <Text fontSize="sm" color="gray.500">Address</Text>
              <Tooltip label="Copy Address">
                <IconButton
                  aria-label="Copy address"
                  icon={<FiCopy />}
                  size="xs"
                  variant="ghost"
                  onClick={handleCopyAddress}
                />
              </Tooltip>
            </Flex>
            <Text fontSize="sm" fontFamily="monospace">
              {formatAddress(wallet.address)}
            </Text>
          </Box>
          
          <Divider />
          
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={1}>Balances</Text>
            <SimpleGrid columns={2} spacing={2}>
              <Box p={2} bg={solBgColor} borderRadius="md">
                <Text fontSize="xs" color="gray.500">SOL</Text>
                <Text fontWeight="bold">{wallet.balance.sol.toFixed(4)}</Text>
              </Box>
              <Box p={2} bg={usdcBgColor} borderRadius="md">
                <Text fontSize="xs" color="gray.500">USDC</Text>
                <Text fontWeight="bold">${wallet.balance.usdc.toFixed(2)}</Text>
              </Box>
              {wallet.balance.other.map((token) => (
                <Box key={token.symbol} p={2} bg={tokenBgColor} borderRadius="md">
                  <Text fontSize="xs" color="gray.500">{token.symbol}</Text>
                  <Text fontWeight="bold">
                    {token.symbol === 'BONK' 
                      ? `${(token.amount / 1000).toFixed(1)}K` 
                      : token.amount.toFixed(token.amount < 1 ? 4 : 2)}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          </Box>
          
          <Divider />
          
          <Flex justify="space-between">
            <Text fontSize="sm">Transactions: {wallet.transactions}</Text>
            <Text fontSize="sm" color="gray.500">Last active: {wallet.lastActive}</Text>
          </Flex>
        </VStack>
      </CardBody>
      
      <CardFooter pt={0}>
        <Button size="sm" colorScheme="blue" variant="ghost" onClick={() => onRename(wallet)} mr={2}>
          Rename
        </Button>
        <Button size="sm" colorScheme="red" variant="ghost" onClick={() => onDelete(wallet.id)}>
          Remove
        </Button>
      </CardFooter>
    </Card>
  );
};

// Add Wallet Modal
const AddWalletModal = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [keyfile, setKeyfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importMethod, setImportMethod] = useState('privateKey');
  const toast = useToast();
  
  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please provide a name for your wallet',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (importMethod === 'privateKey' && !privateKey.trim()) {
      toast({
        title: 'Private key required',
        description: 'Please enter your private key',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (importMethod === 'keyfile' && !keyfile) {
      toast({
        title: 'Keyfile required',
        description: 'Please select a keyfile',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // In a real app, this would be an API call to add the wallet
      // const result = await api.addWallet({
      //   name,
      //   privateKey: importMethod === 'privateKey' ? privateKey : undefined,
      //   keyfile: importMethod === 'keyfile' ? keyfile : undefined,
      // });
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate a fake wallet for demo purposes
      const newWallet = {
        id: Math.random().toString(36).substring(2, 9),
        name,
        address: '6' + Math.random().toString(36).substring(2, 35),
        balance: {
          sol: 0,
          usdc: 0,
          other: []
        },
        transactions: 0,
        isDefault: false,
        lastActive: 'Just now'
      };
      
      onAdd(newWallet);
      
      toast({
        title: 'Wallet added',
        description: `Wallet "${name}" has been added successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Reset form
      setName('');
      setPrivateKey('');
      setKeyfile(null);
      setImportMethod('privateKey');
      onClose();
    } catch (error) {
      toast({
        title: 'Error adding wallet',
        description: error.message || 'An error occurred while adding the wallet',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add New Wallet</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Wallet Name</FormLabel>
              <Input 
                placeholder="Main Wallet" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
              />
              <FormHelperText>A friendly name to identify this wallet</FormHelperText>
            </FormControl>
            
            <FormControl>
              <FormLabel>Import Method</FormLabel>
              <Select 
                value={importMethod} 
                onChange={(e) => setImportMethod(e.target.value)}
              >
                <option value="privateKey">Private Key</option>
                <option value="keyfile">Keyfile (JSON)</option>
              </Select>
            </FormControl>
            
            {importMethod === 'privateKey' ? (
              <FormControl isRequired>
                <FormLabel>Private Key</FormLabel>
                <Input 
                  type="password" 
                  placeholder="Enter your private key" 
                  value={privateKey} 
                  onChange={(e) => setPrivateKey(e.target.value)} 
                />
                <FormHelperText color="red.500">
                  Never share your private key with anyone
                </FormHelperText>
              </FormControl>
            ) : (
              <FormControl isRequired>
                <FormLabel>Keyfile</FormLabel>
                <Input 
                  type="file" 
                  accept=".json" 
                  onChange={(e) => setKeyfile(e.target.files[0])} 
                  p={1}
                />
                <FormHelperText>
                  Upload your wallet keyfile (JSON format)
                </FormHelperText>
              </FormControl>
            )}
          </VStack>
        </ModalBody>
        
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleSubmit} 
            isLoading={loading}
            loadingText="Adding"
          >
            Add Wallet
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// Rename Wallet Modal
const RenameWalletModal = ({ isOpen, onClose, wallet, onRename }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  
  useEffect(() => {
    if (wallet) {
      setName(wallet.name || '');
    }
  }, [wallet]);
  
  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please provide a name for your wallet',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // In a real app, this would be an API call to rename the wallet
      // await api.renameWallet(wallet.id, name);
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onRename(wallet.id, name);
      
      toast({
        title: 'Wallet renamed',
        description: `Wallet has been renamed to "${name}"`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: 'Error renaming wallet',
        description: error.message || 'An error occurred while renaming the wallet',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Rename Wallet</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <FormControl isRequired>
            <FormLabel>New Wallet Name</FormLabel>
            <Input 
              placeholder="Enter new name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
            />
          </FormControl>
        </ModalBody>
        
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleSubmit} 
            isLoading={loading}
            loadingText="Saving"
          >
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const Wallets = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
  const { isOpen: isRenameOpen, onOpen: onRenameOpen, onClose: onRenameClose } = useDisclosure();
  const toast = useToast();
  
  useEffect(() => {
    // Simulate API call to get wallets
    const fetchWallets = async () => {
      setLoading(true);
      
      // In a real app, this would be an API call
      // const response = await api.getWallets();
      
      // Simulate delay
      setTimeout(() => {
        setWallets(SAMPLE_WALLETS);
        setLoading(false);
      }, 1500);
    };
    
    fetchWallets();
  }, []);
  
  const handleRefreshWallet = async (walletId) => {
    // In a real app, this would be an API call to refresh the wallet
    toast({
      title: 'Refreshing wallet',
      description: 'Updating wallet balance...',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update wallet with new balance (for demo purposes)
    setWallets(wallets.map(wallet => {
      if (wallet.id === walletId) {
        return {
          ...wallet,
          balance: {
            ...wallet.balance,
            sol: wallet.balance.sol + (Math.random() * 0.1 - 0.05),
            usdc: wallet.balance.usdc + (Math.random() * 5 - 2.5),
          },
          lastActive: 'Just now'
        };
      }
      return wallet;
    }));
    
    toast({
      title: 'Wallet refreshed',
      description: 'The wallet balance has been updated',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };
  
  const handleSetDefaultWallet = (walletId) => {
    // In a real app, this would be an API call to set the default wallet
    setWallets(wallets.map(wallet => ({
      ...wallet,
      isDefault: wallet.id === walletId
    })));
    
    toast({
      title: 'Default wallet updated',
      description: 'Your default wallet has been updated',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };
  
  const handleDeleteWallet = (walletId) => {
    // In a real app, this would be an API call to delete the wallet
    const walletToDelete = wallets.find(w => w.id === walletId);
    
    if (walletToDelete?.isDefault) {
      toast({
        title: 'Cannot delete default wallet',
        description: 'Please set another wallet as default before deleting this one',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setWallets(wallets.filter(wallet => wallet.id !== walletId));
    
    toast({
      title: 'Wallet removed',
      description: 'The wallet has been removed successfully',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };
  
  const handleOpenRenameModal = (wallet) => {
    setSelectedWallet(wallet);
    onRenameOpen();
  };
  
  const handleRenameWallet = (walletId, newName) => {
    setWallets(wallets.map(wallet => {
      if (wallet.id === walletId) {
        return {
          ...wallet,
          name: newName
        };
      }
      return wallet;
    }));
  };
  
  const handleAddWallet = (newWallet) => {
    setWallets([...wallets, newWallet]);
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Wallet Management</Heading>
        <Button
          leftIcon={<FiPlus />}
          colorScheme="blue"
          onClick={onAddOpen}
        >
          Add Wallet
        </Button>
      </Flex>
      
      {loading ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {Array.from({ length: 3 }).map((_, index) => (
            <Box key={index} p={5} shadow="md" borderWidth="1px" borderRadius="lg">
              <Skeleton height="20px" mb={4} />
              <Skeleton height="15px" mb={2} />
              <Skeleton height="15px" mb={4} />
              <Skeleton height="100px" mb={4} />
              <Skeleton height="15px" mb={2} />
              <Skeleton height="15px" />
            </Box>
          ))}
        </SimpleGrid>
      ) : wallets.length === 0 ? (
        <Box 
          p={8} 
          textAlign="center" 
          borderWidth="1px"
          borderRadius="lg"
          borderStyle="dashed"
        >
          <Text fontSize="lg" mb={4}>No wallets found</Text>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={onAddOpen}
          >
            Add Your First Wallet
          </Button>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {wallets.map((wallet) => (
            <WalletCard
              key={wallet.id}
              wallet={wallet}
              onRefresh={handleRefreshWallet}
              onSetDefault={handleSetDefaultWallet}
              onDelete={handleDeleteWallet}
              onRename={handleOpenRenameModal}
            />
          ))}
        </SimpleGrid>
      )}
      
      {/* Add Wallet Modal */}
      <AddWalletModal 
        isOpen={isAddOpen} 
        onClose={onAddClose} 
        onAdd={handleAddWallet} 
      />
      
      {/* Rename Wallet Modal */}
      <RenameWalletModal 
        isOpen={isRenameOpen} 
        onClose={onRenameClose} 
        wallet={selectedWallet} 
        onRename={handleRenameWallet} 
      />
    </Box>
  );
};

export default Wallets;
