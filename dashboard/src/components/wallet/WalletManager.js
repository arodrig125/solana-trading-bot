import React, { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Text,
  VStack,
  HStack,
  Input,
  IconButton,
  useColorModeValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { FiPlus, FiRefreshCw, FiTrash2, FiCheck } from 'react-icons/fi';
import { useWallet } from '../../contexts/WalletContext';

const WalletManager = () => {
  const {
    wallets,
    selectedWallet,
    setSelectedWallet,
    isLoading,
    addWallet,
    removeWallet,
    updateWalletBalances,
  } = useWallet();

  const [newPrivateKey, setNewPrivateKey] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleAddWallet = async () => {
    if (!newPrivateKey.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a private key',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    await addWallet(newPrivateKey);
    setNewPrivateKey('');
    onClose();
  };

  const handleRemoveWallet = async (publicKey) => {
    if (window.confirm('Are you sure you want to remove this wallet?')) {
      await removeWallet(publicKey);
    }
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Text fontSize="2xl" fontWeight="bold">
          Wallet Manager
        </Text>
        <HStack>
          <Button
            leftIcon={<FiRefreshCw />}
            onClick={updateWalletBalances}
            isLoading={isLoading}
            size="sm"
          >
            Refresh Balances
          </Button>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={onOpen}
            size="sm"
          >
            Add Wallet
          </Button>
        </HStack>
      </Flex>

      <Box
        bg={bgColor}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="lg"
        overflow="hidden"
      >
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Address</Th>
              <Th>Status</Th>
              <Th isNumeric>Balance (SOL)</Th>
              <Th isNumeric>Transactions</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {wallets.map((wallet) => (
              <Tr
                key={wallet.publicKey}
                bg={selectedWallet?.publicKey === wallet.publicKey ? 'blue.50' : undefined}
                _dark={{
                  bg: selectedWallet?.publicKey === wallet.publicKey ? 'blue.900' : undefined,
                }}
                cursor="pointer"
                onClick={() => setSelectedWallet(wallet)}
              >
                <Td>
                  <Text fontSize="sm" fontFamily="mono">
                    {wallet.displayAddress}
                  </Text>
                </Td>
                <Td>
                  <Badge
                    colorScheme={wallet.status === 'Ready' ? 'green' : 'yellow'}
                  >
                    {wallet.status}
                  </Badge>
                </Td>
                <Td isNumeric>{wallet.balances.sol?.toFixed(4) || '0.0000'}</Td>
                <Td isNumeric>{wallet.transactions}</Td>
                <Td>
                  <IconButton
                    icon={<FiTrash2 />}
                    variant="ghost"
                    colorScheme="red"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveWallet(wallet.publicKey);
                    }}
                  />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Wallet</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Text>Enter the private key of the wallet you want to add:</Text>
              <Input
                value={newPrivateKey}
                onChange={(e) => setNewPrivateKey(e.target.value)}
                placeholder="Enter private key"
                type="password"
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              leftIcon={<FiCheck />}
              colorScheme="blue"
              mr={3}
              onClick={handleAddWallet}
              isLoading={isLoading}
            >
              Add Wallet
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default WalletManager;
