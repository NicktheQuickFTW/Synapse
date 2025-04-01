import { Select, Box } from '@chakra-ui/react';
import { Sport } from '../types';

interface SportSelectorProps {
  selectedSport: Sport;
  onSportChange: (sport: Sport) => void;
}

const SPORTS: Sport[] = ['wrestling', 'basketball', 'football', 'baseball', 'volleyball'];

export const SportSelector = ({ selectedSport, onSportChange }: SportSelectorProps) => {
  return (
    <Box p={4} bg="brand.silverDarker" borderBottom="1px" borderColor="brand.silverDark">
      <Select
        value={selectedSport}
        onChange={(e) => onSportChange(e.target.value as Sport)}
        maxW="200px"
      >
        {SPORTS.map((sport) => (
          <option key={sport} value={sport}>
            {sport.charAt(0).toUpperCase() + sport.slice(1)}
          </option>
        ))}
      </Select>
    </Box>
  );
}; 