import { Box, Text, VStack, HStack, IconButton, Collapse, useDisclosure } from '@chakra-ui/react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { AIInsightsCardProps } from '../types';
import { getInsightIcon, getInsightColor } from '../utils/insightUtils';

export const AIInsightsCard = ({ insights }: AIInsightsCardProps) => {
  const { isOpen, onToggle } = useDisclosure();

  return (
    <Box p={6} borderRadius="md">
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between">
          <Text fontSize="xl" fontWeight="bold" color="brand.silver">
            AI-Powered Insights
          </Text>
          <IconButton
            aria-label={isOpen ? 'Show less' : 'Show more'}
            icon={isOpen ? <FaChevronUp /> : <FaChevronDown />}
            onClick={onToggle}
            variant="ghost"
            color="brand.silver"
            _hover={{ bg: 'brand.silverDark' }}
            size="sm"
          />
        </HStack>

        <Collapse in={isOpen}>
          <VStack spacing={4} align="stretch">
            {insights.map((insight, index) => {
              const Icon = getInsightIcon(insight.type);
              const color = getInsightColor(insight.type);

              return (
                <HStack
                  key={index}
                  p={4}
                  borderRadius="md"
                  bg="brand.black"
                  border="1px"
                  borderColor="brand.silverDark"
                  _hover={{
                    borderColor: color,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${color}33`,
                  }}
                  transition="all 0.2s"
                >
                  <Icon size={24} color={color} />
                  <Text color="brand.silver" flex={1}>
                    {insight.text}
                  </Text>
                </HStack>
              );
            })}
          </VStack>
        </Collapse>
      </VStack>
    </Box>
  );
}; 