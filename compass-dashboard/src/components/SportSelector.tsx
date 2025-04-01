import { Select, Box, HStack, Image, Text } from '@chakra-ui/react';
import { SportSelectorProps } from '../types';
import { SCHOOLS } from '../config/schools';

export const SportSelector = ({ selectedSchool, onSchoolChange }: SportSelectorProps) => {
  const selectedSchoolData = SCHOOLS.find(school => school.id === selectedSchool);

  return (
    <Box maxW="400px">
      <HStack spacing={4} align="center">
        {selectedSchoolData && (
          <Image
            src={selectedSchoolData.logoUrl}
            alt={`${selectedSchoolData.name} logo`}
            boxSize="40px"
            objectFit="contain"
            transition="all 0.2s"
          />
        )}
        <Select
          value={selectedSchool}
          onChange={(e) => onSchoolChange(e.target.value)}
          bg="brand.black"
          color="brand.silver"
          borderColor="brand.silverDark"
          _hover={{
            borderColor: 'brand.silver',
          }}
          icon={<></>}
        >
          {SCHOOLS.map(school => (
            <option key={school.id} value={school.id}>
              {school.name} Wrestling
            </option>
          ))}
        </Select>
      </HStack>
    </Box>
  );
}; 