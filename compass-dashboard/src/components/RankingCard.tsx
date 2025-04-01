import { Box, Text, VStack, HStack, Icon } from '@chakra-ui/react';
import { ProgramRanking } from '../types';
import { FiArrowUp, FiArrowDown, FiMinus } from 'react-icons/fi';

interface RankingCardProps {
  title: string;
  ranking: number;
  trend: number;
  subtitle: string;
}

export const RankingCard = ({ title, ranking, trend, subtitle }: RankingCardProps) => {
  const getTrendIcon = () => {
    if (trend > 0) return FiArrowUp;
    if (trend < 0) return FiArrowDown;
    return FiMinus;
  };

  const getTrendColor = () => {
    if (trend > 0) return 'green.400';
    if (trend < 0) return 'red.400';
    return 'brand.silver';
  };

  const getTrendText = () => {
    if (trend > 0) return `↑ ${trend} from last evaluation`;
    if (trend < 0) return `↓ ${Math.abs(trend)} from last evaluation`;
    return '● Unchanged from last evaluation';
  };

  return (
    <Box p={6} borderRadius="md">
      <VStack spacing={4} align="stretch">
        <Text fontSize="xl" fontWeight="bold" color="brand.silver">
          {title}
        </Text>
        
        <HStack justify="center" spacing={2}>
          <Text fontSize="4xl" fontWeight="bold">
            #{ranking}
          </Text>
          <Text color="brand.silver">{subtitle}</Text>
        </HStack>

        <HStack justify="center" color={getTrendColor()}>
          <Icon as={getTrendIcon()} />
          <Text>{getTrendText()}</Text>
        </HStack>
      </VStack>
    </Box>
  );
}; 