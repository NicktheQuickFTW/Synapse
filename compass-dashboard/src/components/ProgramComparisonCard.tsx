import { Box, Text, VStack, HStack, Select } from '@chakra-ui/react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from 'chart.js';
import { ProgramData } from '../types';
import { useState } from 'react';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface ProgramComparisonCardProps {
  programs: ProgramData[];
}

export const ProgramComparisonCard = ({ programs }: ProgramComparisonCardProps) => {
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);

  const metrics = [
    'Performance',
    'Recruiting',
    'Facilities',
    'Academics',
    'Tradition',
    'Budget',
  ];

  const chartData: ChartData<'radar'> = {
    labels: metrics,
    datasets: selectedPrograms.map((programName, index) => {
      const program = programs.find((p) => p.name === programName);
      if (!program) return null;

      return {
        label: program.name,
        data: [
          program.performance,
          program.recruiting,
          program.facilities,
          program.academics,
          program.tradition,
          program.budget,
        ],
        backgroundColor: `rgba(192, 192, 192, ${0.2 + index * 0.1})`,
        borderColor: '#C0C0C0',
        borderWidth: 2,
        pointBackgroundColor: '#C0C0C0',
        pointBorderColor: '#000000',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      };
    }).filter(Boolean) as ChartData<'radar'>['datasets'],
  };

  const chartOptions: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#C0C0C0',
          font: {
            family: 'Inter',
          },
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
        borderColor: '#333333',
        borderWidth: 1,
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        grid: {
          color: 'rgba(192, 192, 192, 0.1)',
        },
        ticks: {
          color: '#C0C0C0',
          font: {
            family: 'Inter',
          },
        },
        pointLabels: {
          color: '#C0C0C0',
          font: {
            family: 'Inter',
            size: 12,
          },
        },
      },
    },
  };

  const handleProgramSelect = (programName: string) => {
    setSelectedPrograms((prev) => {
      if (prev.includes(programName)) {
        return prev.filter((p) => p !== programName);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), programName];
      }
      return [...prev, programName];
    });
  };

  return (
    <Box p={6} borderRadius="md">
      <VStack spacing={4} align="stretch">
        <Text fontSize="xl" fontWeight="bold" color="brand.silver">
          Program Comparison
        </Text>

        <HStack spacing={4}>
          {programs.map((program) => (
            <Select
              key={program.name}
              size="sm"
              value={selectedPrograms.includes(program.name) ? program.name : ''}
              onChange={(e) => handleProgramSelect(e.target.value)}
              maxW="200px"
              color="brand.silver"
            >
              <option value="">Select Program</option>
              <option value={program.name}>{program.name}</option>
            </Select>
          ))}
        </HStack>

        <Box h="400px">
          <Radar data={chartData} options={chartOptions} />
        </Box>

        {selectedPrograms.length > 0 && (
          <HStack spacing={4} justify="center">
            {selectedPrograms.map((programName) => {
              const program = programs.find((p) => p.name === programName);
              if (!program) return null;

              return (
                <VStack key={programName} spacing={1}>
                  <Text color="brand.silver" fontSize="sm">
                    {programName}
                  </Text>
                  <Text fontWeight="bold" color="brand.silver">
                    Overall: {program.overall.toFixed(1)}
                  </Text>
                </VStack>
              );
            })}
          </HStack>
        )}
      </VStack>
    </Box>
  );
}; 