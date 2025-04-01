import { Box, Text, VStack, HStack, Progress } from '@chakra-ui/react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from 'chart.js';
import { CompassScore } from '../types';

ChartJS.register(ArcElement, Tooltip, Legend);

interface CompassScoreCardProps {
  score: CompassScore;
}

const COMPONENT_LABELS = [
  'Performance (35%)',
  'Roster (25%)',
  'Infrastructure (20%)',
  'Prestige (15%)',
  'Academics (5%)',
];

export const CompassScoreCard = ({ score }: CompassScoreCardProps) => {
  const chartData: ChartData<'doughnut'> = {
    labels: COMPONENT_LABELS,
    datasets: [
      {
        data: [
          score.components.performance,
          score.components.roster,
          score.components.infrastructure,
          score.components.prestige,
          score.components.academics,
        ],
        backgroundColor: [
          '#C0C0C0',
          '#A0A0A0',
          '#808080',
          '#606060',
          '#404040',
        ],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#FFFFFF',
          font: {
            family: 'Inter',
            size: 11,
          },
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: '#000000',
        titleColor: '#FFFFFF',
        bodyColor: '#C0C0C0',
        titleFont: {
          size: 14,
          weight: 'bold',
          family: 'Inter',
        },
        bodyFont: {
          size: 13,
          family: 'Inter',
        },
        padding: 12,
        cornerRadius: 4,
        displayColors: false,
        borderColor: '#333333',
        borderWidth: 1,
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
    },
  };

  return (
    <Box p={6} borderRadius="md">
      <VStack spacing={4} align="stretch">
        <Text fontSize="xl" fontWeight="bold" color="brand.silver">
          Total COMPASS Score
        </Text>
        
        <HStack justify="center" spacing={2}>
          <Text fontSize="4xl" fontWeight="bold">
            {score.totalScore.toFixed(1)}
          </Text>
          <Text color="brand.silver">/ 100</Text>
        </HStack>

        <Box h="200px">
          <Doughnut data={chartData} options={chartOptions} />
        </Box>

        <VStack spacing={2} align="stretch">
          {Object.entries(score.components).map(([key, value]) => (
            <Box key={key}>
              <HStack justify="space-between" mb={1}>
                <Text color="brand.silver">
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Text>
                <Text>{value}</Text>
              </HStack>
              <Progress
                value={value}
                colorScheme="whiteAlpha"
                size="sm"
                borderRadius="full"
              />
            </Box>
          ))}
        </VStack>
      </VStack>
    </Box>
  );
}; 