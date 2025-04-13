import React from 'react';
import { Box, Alert, AlertIcon, AlertTitle, AlertDescription, Button, Text, VStack } from '@chakra-ui/react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box p={4} borderRadius="md" bg="white" boxShadow="md" my={4}>
          <Alert
            status="error"
            variant="subtle"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            height="auto"
            p={4}
            borderRadius="md"
          >
            <AlertIcon boxSize={10} mr={0} />
            <AlertTitle mt={4} mb={1} fontSize="lg">
              Something went wrong
            </AlertTitle>
            <AlertDescription maxWidth="lg">
              <VStack spacing={4} align="center" mt={2}>
                <Text fontSize="sm" color="gray.600">
                  We encountered an error while rendering this component. Please try refreshing the page or contact support if this problem persists.
                </Text>
                {this.state.error && (
                  <Box 
                    p={2} 
                    bg="gray.50" 
                    borderRadius="md" 
                    maxW="100%" 
                    overflow="auto"
                    fontSize="xs"
                    fontFamily="monospace"
                    textAlign="left"
                    whiteSpace="pre-wrap"
                    border="1px"
                    borderColor="gray.200"
                  >
                    <Text fontWeight="bold">Error:</Text>
                    <Text>{this.state.error.toString()}</Text>
                    {this.state.errorInfo && (
                      <>
                        <Text fontWeight="bold" mt={2}>Component Stack:</Text>
                        <Text>{this.state.errorInfo.componentStack}</Text>
                      </>
                    )}
                  </Box>
                )}
                <Button colorScheme="blue" onClick={this.handleReset}>
                  Try Again
                </Button>
              </VStack>
            </AlertDescription>
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
