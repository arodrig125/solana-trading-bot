import React from 'react';
import { Flex, Spinner, Text, Box } from '@chakra-ui/react';

const LoadingSpinner = ({ size = 'xl', text = 'Loading...', height = '200px' }) => {
  return (
    <Flex
      justifyContent="center"
      alignItems="center"
      flexDirection="column"
      height={height}
      width="100%"
    >
      <Spinner
        thickness="4px"
        speed="0.65s"
        emptyColor="gray.200"
        color="blue.500"
        size={size}
      />
      {text && (
        <Text mt={4} fontSize="md" color="gray.500">
          {text}
        </Text>
      )}
    </Flex>
  );
};

export default LoadingSpinner;
