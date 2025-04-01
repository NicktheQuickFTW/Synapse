import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  colors: {
    brand: {
      black: '#000000',
      white: '#FFFFFF',
      silver: '#C0C0C0',
      silverLight: '#E0E0E0',
      silverDark: '#808080',
      silverDarker: '#404040',
      silverAccent: '#A0A0A0',
    },
  },
  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif',
  },
  components: {
    Card: {
      baseStyle: {
        container: {
          backgroundColor: 'brand.silverDarker',
          borderColor: 'brand.silverDark',
          borderRadius: 'md',
          transition: 'transform 0.15s ease',
          _hover: {
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    Select: {
      baseStyle: {
        field: {
          backgroundColor: 'brand.silverDark',
          borderColor: 'brand.silver',
          color: 'brand.white',
          _hover: {
            backgroundColor: 'brand.silver',
            borderColor: 'brand.silverLight',
          },
        },
      },
    },
    Button: {
      baseStyle: {
        backgroundColor: 'brand.silver',
        color: 'brand.black',
        _hover: {
          backgroundColor: 'brand.silverLight',
        },
      },
    },
  },
  styles: {
    global: {
      body: {
        bg: 'brand.black',
        color: 'brand.white',
      },
    },
  },
});

export default theme; 