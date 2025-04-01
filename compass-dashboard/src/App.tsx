import { useState, useEffect } from 'react';
import {
  ChakraProvider,
  Box,
  Grid,
  VStack,
  Heading,
  useToast,
  Container,
  SimpleGrid,
  theme as baseTheme,
} from '@chakra-ui/react';
import { mergeWith } from '@chakra-ui/utils';
import { SportSelector } from './components/SportSelector';
import { CompassScoreCard } from './components/CompassScoreCard';
import { RankingCard } from './components/RankingCard';
import { AIInsightsCard } from './components/AIInsightsCard';
import { HistoricalPerformanceCard } from './components/HistoricalPerformanceCard';
import { ProgramComparisonCard } from './components/ProgramComparisonCard';
import { CompassData } from './types';

const customTheme = {
  colors: {
    brand: {
      black: '#000000',
      white: '#FFFFFF',
      silver: '#C0C0C0',
      silverLight: '#D3D3D3',
      silverDark: '#A9A9A9',
      silverDarker: '#808080',
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
};

const theme = mergeWith(baseTheme, customTheme);

const MOCK_DATA: CompassData = {
  program: {
    name: "Iowa State",
    performance: 85.2,
    recruiting: 82.1,
    facilities: 90.0,
    academics: 88.5,
    tradition: 92.3,
    budget: 87.8,
    overall: 87.6
  },
  historical: [
    { year: 2021, score: 82.4, result: "4th" },
    { year: 2022, score: 84.8, result: "3rd" },
    { year: 2023, score: 86.2, result: "2nd" },
    { year: 2024, score: 87.6, result: "2nd" }
  ],
  insights: [
    {
      type: "strength",
      text: "Strong tradition of success with multiple conference championships"
    },
    {
      type: "opportunity",
      text: "Rising recruiting class rankings show potential for future growth"
    },
    {
      type: "weakness",
      text: "Recent tournament performance below historical averages"
    },
    {
      type: "threat",
      text: "Increasing competition from emerging programs in the conference"
    }
  ],
  predictions: [
    {
      metric: "Tournament Finish",
      value: 2,
      trend: "up",
      confidence: 0.85
    },
    {
      metric: "Recruiting Class",
      value: 5,
      trend: "up",
      confidence: 0.78
    }
  ]
};

const App = () => {
  const [selectedSport, setSelectedSport] = useState('wrestling');
  const [compassData, setCompassData] = useState<CompassData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    // Simulate API call with mock data
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setCompassData(MOCK_DATA);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load COMPASS data. Please try again later.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedSport, toast]);

  if (isLoading) {
    return (
      <ChakraProvider theme={theme}>
        <Container maxW="container.xl" py={8}>
          <VStack spacing={8} align="stretch">
            <Heading size="lg" color="brand.silver">
              Loading COMPASS Dashboard...
            </Heading>
          </VStack>
        </Container>
      </ChakraProvider>
    );
  }

  if (!compassData) {
    return (
      <ChakraProvider theme={theme}>
        <Container maxW="container.xl" py={8}>
          <VStack spacing={8} align="stretch">
            <Heading size="lg" color="brand.silver">
              No Data Available
            </Heading>
          </VStack>
        </Container>
      </ChakraProvider>
    );
  }

  return (
    <ChakraProvider theme={theme}>
      <Box minH="100vh">
        <Container maxW="container.xl" py={8}>
          <VStack spacing={8} align="stretch">
            <SportSelector
              selectedSport={selectedSport}
              onSportChange={setSelectedSport}
            />

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              <CompassScoreCard data={compassData.program} />
              <RankingCard
                title="Overall Ranking"
                ranking={compassData.program.overall}
                trend={0.5}
                subtitle="Among Big 12 Programs"
              />
              <RankingCard
                title="Performance Index"
                ranking={compassData.program.performance}
                trend={0.3}
                subtitle="Based on Recent Results"
              />
            </SimpleGrid>

            <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
              <VStack spacing={6} align="stretch">
                <HistoricalPerformanceCard data={compassData.historical} />
                <ProgramComparisonCard programs={[compassData.program]} />
              </VStack>
              <VStack spacing={6} align="stretch">
                <AIInsightsCard insights={compassData.insights} />
              </VStack>
            </Grid>
          </VStack>
        </Container>
      </Box>
    </ChakraProvider>
  );
};

export default App;
