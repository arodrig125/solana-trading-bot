import { extendTheme } from '@chakra-ui/react';

// Define custom colors for the SolarBot theme
const colors = {
  brand: {
    50: '#e9f5ff',
    100: '#c6e2ff',
    200: '#a0cfff',
    300: '#79bcff',
    400: '#53a9ff',
    500: '#2c96ff', // Primary brand color
    600: '#1e74cc',
    700: '#135399',
    800: '#093366',
    900: '#021633',
  },
  solar: {
    50: '#fdf6df',
    100: '#fce7b2',
    200: '#fbd983',
    300: '#f9ca54',
    400: '#f7bc26',
    500: '#f6b215', // Solar accent color
    600: '#c48e10',
    700: '#936a0b',
    800: '#624607',
    900: '#312302',
  },
};

// Define custom component styles
const components = {
  Button: {
    baseStyle: {
      fontWeight: 'semibold',
      rounded: 'md',
    },
    variants: {
      solid: (props) => ({
        bg: props.colorScheme === 'brand' ? 'brand.500' : undefined,
        _hover: {
          bg: props.colorScheme === 'brand' ? 'brand.600' : undefined,
        },
      }),
      ghost: {
        _hover: {
          bg: 'rgba(0, 0, 0, 0.05)',
        },
      },
    },
  },
  Card: {
    baseStyle: {
      container: {
        borderRadius: 'lg',
        boxShadow: 'sm',
      },
    },
  },
  Heading: {
    baseStyle: {
      fontWeight: '600',
    },
  },
};

// Define custom global styles
const styles = {
  global: {
    body: {
      bg: 'gray.50',
      color: 'gray.800',
    },
    '*::placeholder': {
      color: 'gray.400',
    },
    '*, *::before, &::after': {
      borderColor: 'gray.200',
    },
    // Custom scrollbar
    '::-webkit-scrollbar': {
      width: '8px',
      height: '8px',
    },
    '::-webkit-scrollbar-track': {
      background: 'rgba(0, 0, 0, 0.05)',
    },
    '::-webkit-scrollbar-thumb': {
      background: 'rgba(0, 0, 0, 0.2)',
      borderRadius: '4px',
    },
    '::-webkit-scrollbar-thumb:hover': {
      background: 'rgba(0, 0, 0, 0.3)',
    },
  },
};

// Define fonts
const fonts = {
  heading: "'Inter', sans-serif",
  body: "'Inter', sans-serif",
};

// Create the custom theme
const theme = extendTheme({
  colors,
  components,
  styles,
  fonts,
  config: {
    initialColorMode: 'light',
    useSystemColorMode: true,
  },
});

export default theme;
