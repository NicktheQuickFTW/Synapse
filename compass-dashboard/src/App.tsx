import { useState, useEffect } from 'react';
import { ChakraProvider, Box, Grid, VStack, Heading, useToast } from '@chakra-ui/react';
import { SportSelector } from './components/SportSelector';
import { CompassScoreCard } from './components/CompassScoreCard';
import { RankingCard } from './components/RankingCard';
import theme from './theme';
import { Sport, CompassData } from './types';
import axios from 'axios';

function App() {
  const [selectedSport, setSelectedSport] = useState<Sport>('wrestling');
  const [compassData, setCompassData] = useState<CompassData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchCompassData = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`/api/compass/${selectedSport}`);
        setCompassData(response.data);
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

    fetchCompassData();
  }, [selectedSport, toast]);

  if (isLoading) {
    return (
      <ChakraProvider theme={theme}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minH="100vh"
          bg="brand.black"
          color="brand.white"
        >
          <Heading>Loading COMPASS data...</Heading>
        </Box>
      </ChakraProvider>
    );
  }

  if (!compassData) {
    return (
      <ChakraProvider theme={theme}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minH="100vh"
          bg="brand.black"
          color="brand.white"
        >
          <Heading>No data available</Heading>
        </Box>
      </ChakraProvider>
    );
  }

  return (
    <ChakraProvider theme={theme}>
      <Box minH="100vh" bg="brand.black" color="brand.white">
        <SportSelector
          selectedSport={selectedSport}
          onSportChange={setSelectedSport}
        />
        
        <Box maxW="1200px" mx="auto" p={6}>
          <VStack spacing={8} align="stretch">
            <Heading size="xl" color="brand.silver">
              COMPASS Analytics
            </Heading>

            <Grid
              templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
              gap={6}
            >
              <CompassScoreCard score={compassData.compassScore} />
              <RankingCard
                title="Program Ranking"
                ranking={compassData.ranking.national}
                trend={compassData.ranking.trend}
                subtitle="National"
              />
              <RankingCard
                title="Conference Standing"
                ranking={compassData.ranking.conference}
                trend={0}
                subtitle="In Conference"
              />
              <Box p={6} borderRadius="md">
                <VStack spacing={4} align="stretch">
                  <Heading size="md" color="brand.silver">
                    AI Predictions
                  </Heading>
                  <VStack spacing={2} align="stretch">
                    <Box>
                      <Text color="brand.silver">Win-Loss Ratio</Text>
                      <Text fontSize="xl">{compassData.predictions.winLoss}</Text>
                    </Box>
                    <Box>
                      <Text color="brand.silver">Tournament Seed</Text>
                      <Text fontSize="xl">#{compassData.predictions.tournamentSeed}</Text>
                    </Box>
                    <Box>
                      <Text color="brand.silver">Tournament Finish</Text>
                      <Text fontSize="xl">{compassData.predictions.tournamentFinish}</Text>
                    </Box>
                  </VStack>
                </VStack>
              </Box>
            </Grid>
          </VStack>
        </Box>
      </Box>
    </ChakraProvider>
  );
}

export default App;
