import { Box, Text, VStack, HStack, Select } from "@chakra-ui/react";
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from 'chart.js';
import { HistoricalData } from '../types';
import { useState } from 'react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface HistoricalPerformanceCardProps {
  data: HistoricalData[];
}

type MetricType = 'score' | 'result';

export const HistoricalPerformanceCard = ({ data }: HistoricalPerformanceCardProps) => {
  const [metricType, setMetricType] = useState<MetricType>('score');

  const chartData: ChartData<'line'> = {
    labels: data.map((d) => d.year),
    datasets: [
      {
        label: metricType === 'score' ? 'COMPASS Score' : 'Tournament Result',
        data: data.map((d) => (metricType === 'score' ? d.score : d.result)),
        borderColor: '#C0C0C0',
        backgroundColor: 'rgba(192, 192, 192, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#C0C0C0',
        pointBorderColor: '#000000',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
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
        borderColor: '#333333',
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: metricType === 'score',
        grid: {
          color: 'rgba(192, 192, 192, 0.1)',
        },
        ticks: {
          color: '#C0C0C0',
          font: {
            family: 'Inter',
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#C0C0C0',
          font: {
            family: 'Inter',
          },
        },
      },
    },
  };

  return (
    <Box p={6} borderRadius="md">
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between">
          <Text fontSize="xl" fontWeight="bold" color="brand.silver">
            Historical Performance
          </Text>
          <Select
            size="sm"
            value={metricType}
            onChange={(e) => setMetricType(e.target.value as MetricType)}
            maxW="200px"
          >
            <option value="score">COMPASS Score</option>
            <option value="result">Tournament Result</option>
          </Select>
        </HStack>

        <Box h="300px">
          <Line data={chartData} options={chartOptions} />
        </Box>

        <HStack spacing={4} justify="center">
          {data.slice(-3).map((d, index) => (
            <VStack key={index} spacing={1}>
              <Text color="brand.silver" fontSize="sm">
                {d.year}
              </Text>
              <Text fontWeight="bold" color="brand.silver">
                {metricType === 'score' ? d.score.toFixed(1) : d.result}
              </Text>
            </VStack>
          ))}
        </HStack>
      </VStack>
    </Box>
  );
}; 