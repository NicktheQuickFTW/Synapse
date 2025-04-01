import { FiTrendingUp, FiTrendingDown, FiTarget, FiAlertCircle } from 'react-icons/fi';
import { IconType } from 'react-icons';
import { CompassInsight } from '../types';

export const getInsightIcon = (type: CompassInsight['type']): IconType => {
  switch (type) {
    case 'strength':
      return FiTrendingUp;
    case 'weakness':
      return FiTrendingDown;
    case 'opportunity':
      return FiTarget;
    case 'threat':
      return FiAlertCircle;
    default:
      return FiTrendingUp;
  }
};

export const getInsightColor = (type: CompassInsight['type']): string => {
  switch (type) {
    case 'strength':
      return '#48BB78'; // green.400
    case 'weakness':
      return '#F56565'; // red.400
    case 'opportunity':
      return '#4299E1'; // blue.400
    case 'threat':
      return '#ED8936'; // orange.400
    default:
      return '#CBD5E0'; // gray.400
  }
}; 