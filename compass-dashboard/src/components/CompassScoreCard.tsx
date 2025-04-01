import { Box, Text, VStack, HStack, CircularProgress, CircularProgressLabel, Image } from '@chakra-ui/react';
import { CompassScoreCardProps } from '../types';
import { SCHOOLS } from '../config/schools';

export const CompassScoreCard = ({ data }: CompassScoreCardProps) => {
  const schoolData = SCHOOLS.find(school => school.name === data.name);

  return (
    <Box p={6} borderRadius="md">
      <VStack spacing={4} align="stretch">
        <HStack spacing={4} align="center">
          {schoolData && (
            <Image
              src={schoolData.logoUrl}
              alt={`${data.name} logo`}
              boxSize="48px"
              objectFit="contain"
              transition="all 0.2s"
            />
          )}
          <Text fontSize="xl" fontWeight="bold" color="brand.silver">
            COMPASS Score
          </Text>
        </HStack>
        
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress
            value={data.overall}
            size="120px"
            thickness="8px"
            color="brand.silver"
            trackColor="brand.silverDark"
          >
            <CircularProgressLabel color="brand.silver" fontSize="2xl" fontWeight="bold">
              {data.overall.toFixed(1)}
            </CircularProgressLabel>
          </CircularProgress>
        </Box>

        <VStack spacing={2} align="stretch">
          <Text color="brand.silver" fontSize="sm" fontWeight="bold">
            Program: {data.name}
          </Text>
          <Text color="brand.silverLight" fontSize="sm">
            Performance: {data.performance.toFixed(1)}
          </Text>
          <Text color="brand.silverLight" fontSize="sm">
            Recruiting: {data.recruiting.toFixed(1)}
          </Text>
          <Text color="brand.silverLight" fontSize="sm">
            Facilities: {data.facilities.toFixed(1)}
          </Text>
          <Text color="brand.silverLight" fontSize="sm">
            Academics: {data.academics.toFixed(1)}
          </Text>
          <Text color="brand.silverLight" fontSize="sm">
            Tradition: {data.tradition.toFixed(1)}
          </Text>
          <Text color="brand.silverLight" fontSize="sm">
            Budget: {data.budget.toFixed(1)}
          </Text>
        </VStack>
      </VStack>
    </Box>
  );
}; 