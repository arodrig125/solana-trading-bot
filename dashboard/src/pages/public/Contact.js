import React, { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Stack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  SimpleGrid,
  Icon,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { FiMail, FiMessageSquare, FiHelpCircle, FiMapPin } from 'react-icons/fi';

const ContactFeature = ({ icon, title, children, ...rest }) => {
  return (
    <Stack
      spacing={3}
      p={5}
      bg={useColorModeValue('white', 'gray.700')}
      rounded="lg"
      borderWidth="1px"
      borderColor={useColorModeValue('gray.100', 'gray.700')}
      shadow="md"
      {...rest}
    >
      <Icon as={icon} w={6} h={6} color="blue.500" />
      <Heading size="md">{title}</Heading>
      <Text color={useColorModeValue('gray.600', 'gray.300')}>{children}</Text>
    </Stack>
  );
};

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      toast({
        title: 'Message sent!',
        description: 'We\'ll get back to you as soon as possible.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setIsSubmitting(false);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
    }, 1500);
  };

  return (
    <Box>
      {/* Hero Section */}
      <Box bg={useColorModeValue('blue.50', 'gray.800')} py={12}>
        <Container maxW={'6xl'}>
          <Stack spacing={4} align={'center'} textAlign={'center'}>
            <Heading
              fontWeight={700}
              fontSize={{ base: '2xl', sm: '3xl', md: '4xl' }}
              lineHeight={'110%'}
            >
              Get in Touch
            </Heading>
            <Text maxW={'2xl'} fontSize={'lg'} color={'gray.500'}>
              Have questions or feedback? We'd love to hear from you. Our team is here to help.
            </Text>
          </Stack>
        </Container>
      </Box>

      {/* Contact Information */}
      <Container maxW={'6xl'} py={16}>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10} mb={16}>
          <ContactFeature 
            icon={FiMail} 
            title="Email Us"
          >
            Drop us an email at support@solarbot.io and we'll get back to you within 24 hours.
          </ContactFeature>
          
          <ContactFeature 
            icon={FiMessageSquare} 
            title="Live Chat"
          >
            Available for Premium and Enterprise customers. Login to access 24/7 support.
          </ContactFeature>
          
          <ContactFeature 
            icon={FiHelpCircle} 
            title="Help Center"
          >
            Check our comprehensive documentation and FAQs for immediate answers.
          </ContactFeature>
        </SimpleGrid>

        {/* Contact Form */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
          <Stack spacing={8}>
            <Heading size="lg">Send us a Message</Heading>
            <Text color={useColorModeValue('gray.600', 'gray.400')} fontSize="lg">
              Fill out the form below and our team will get back to you as soon as possible.
            </Text>
            <ContactFeature 
              icon={FiMapPin} 
              title="Our Location"
            >
              123 Blockchain Avenue<br />
              San Francisco, CA 94105<br />
              United States
            </ContactFeature>
          </Stack>

          <Box
            bg={useColorModeValue('white', 'gray.700')}
            borderRadius="lg"
            p={8}
            boxShadow={'lg'}
            borderWidth="1px"
            borderColor={useColorModeValue('gray.200', 'gray.600')}
          >
            <form onSubmit={handleSubmit}>
              <Stack spacing={4}>
                <FormControl id="name" isRequired>
                  <FormLabel>Your Name</FormLabel>
                  <Input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    placeholder="John Doe"
                  />
                </FormControl>
                <FormControl id="email" isRequired>
                  <FormLabel>Email address</FormLabel>
                  <Input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    placeholder="john@example.com"
                  />
                </FormControl>
                <FormControl id="subject" isRequired>
                  <FormLabel>Subject</FormLabel>
                  <Input 
                    type="text" 
                    name="subject" 
                    value={formData.subject} 
                    onChange={handleChange} 
                    placeholder="How can we help you?"
                  />
                </FormControl>
                <FormControl id="message" isRequired>
                  <FormLabel>Message</FormLabel>
                  <Textarea 
                    name="message" 
                    value={formData.message} 
                    onChange={handleChange} 
                    placeholder="Your message here..."
                    size="lg"
                    rows={6}
                  />
                </FormControl>
                <Button
                  colorScheme="blue"
                  bg="blue.500"
                  color="white"
                  _hover={{
                    bg: 'blue.600',
                  }}
                  size="lg"
                  type="submit"
                  isLoading={isSubmitting}
                  loadingText="Sending"
                >
                  Send Message
                </Button>
              </Stack>
            </form>
          </Box>
        </SimpleGrid>
      </Container>
    </Box>
  );
};

export default Contact;
