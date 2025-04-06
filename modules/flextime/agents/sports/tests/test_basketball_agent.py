import unittest
from datetime import datetime
from ..basketball_agent import BasketballAgent
from ..base_sports_agent import ValidationSeverity

class TestBasketballAgent(unittest.TestCase):
    """Test cases for BasketballAgent"""

    def setUp(self):
        """Set up test fixtures"""
        self.agent = BasketballAgent()
        
        # Sample valid court data
        self.court_data = {
            'dimensions': {
                'length': 94,  # feet
                'width': 50    # feet
            },
            'backboards': [
                {
                    'height': 10,  # feet
                    'extension': 4, # feet
                    'padded': True
                },
                {
                    'height': 10,
                    'extension': 4,
                    'padded': True
                }
            ],
            'markings': [
                'center_circle',
                'three_point_line',
                'free_throw_line',
                'key',
                'baseline',
                'sidelines'
            ],
            'shotClocks': [
                {'visible_from_court': True},
                {'visible_from_court': True}
            ]
        }

    def test_court_dimensions(self):
        """Test court dimension validation"""
        # Test valid dimensions
        issues = self.agent.validate_court_dimensions(self.court_data)
        self.assertEqual(len(issues), 0, "Valid court dimensions should not have issues")

        # Test invalid length
        invalid_data = self.court_data.copy()
        invalid_data['dimensions']['length'] = 90
        issues = self.agent.validate_court_dimensions(invalid_data)
        self.assertTrue(any(
            issue.type == 'court_length' and
            issue.severity == ValidationSeverity.HIGH
            for issue in issues
        ))

        # Test missing dimensions
        missing_data = {}
        issues = self.agent.validate_court_dimensions(missing_data)
        self.assertTrue(any(
            issue.type == 'court_dimensions' and
            issue.severity == ValidationSeverity.HIGH
            for issue in issues
        ))

    def test_backboard_setup(self):
        """Test backboard setup validation"""
        # Test valid backboards
        issues = self.agent.validate_backboard_setup(self.court_data)
        self.assertEqual(len(issues), 0, "Valid backboard setup should not have issues")

        # Test incorrect height
        invalid_data = self.court_data.copy()
        invalid_data['backboards'][0]['height'] = 9.5
        issues = self.agent.validate_backboard_setup(invalid_data)
        self.assertTrue(any(
            issue.type == 'backboard_height' and
            issue.severity == ValidationSeverity.HIGH
            for issue in issues
        ))

        # Test insufficient extension
        invalid_data = self.court_data.copy()
        invalid_data['backboards'][0]['extension'] = 2
        issues = self.agent.validate_backboard_setup(invalid_data)
        self.assertTrue(any(
            issue.type == 'backboard_extension' and
            issue.severity == ValidationSeverity.HIGH
            for issue in issues
        ))

        # Test missing padding
        invalid_data = self.court_data.copy()
        invalid_data['backboards'][0]['padded'] = False
        issues = self.agent.validate_backboard_setup(invalid_data)
        self.assertTrue(any(
            issue.type == 'backboard_safety' and
            issue.severity == ValidationSeverity.HIGH
            for issue in issues
        ))

    def test_court_markings(self):
        """Test court markings validation"""
        # Test valid markings
        issues = self.agent.validate_court_markings(self.court_data)
        self.assertEqual(len(issues), 0, "Valid court markings should not have issues")

        # Test missing markings
        invalid_data = self.court_data.copy()
        invalid_data['markings'].remove('three_point_line')
        issues = self.agent.validate_court_markings(invalid_data)
        self.assertTrue(any(
            issue.type == 'court_markings' and
            issue.severity == ValidationSeverity.HIGH
            for issue in issues
        ))

        # Test missing markings data
        missing_data = {}
        issues = self.agent.validate_court_markings(missing_data)
        self.assertTrue(any(
            issue.type == 'court_markings' and
            issue.severity == ValidationSeverity.HIGH
            for issue in issues
        ))

    def test_shot_clocks(self):
        """Test shot clock validation"""
        # Test valid shot clocks
        issues = self.agent.validate_shot_clocks(self.court_data)
        self.assertEqual(len(issues), 0, "Valid shot clock setup should not have issues")

        # Test insufficient number of clocks
        invalid_data = self.court_data.copy()
        invalid_data['shotClocks'] = [invalid_data['shotClocks'][0]]
        issues = self.agent.validate_shot_clocks(invalid_data)
        self.assertTrue(any(
            issue.type == 'shot_clock_count' and
            issue.severity == ValidationSeverity.HIGH
            for issue in issues
        ))

        # Test visibility issues
        invalid_data = self.court_data.copy()
        invalid_data['shotClocks'][0]['visible_from_court'] = False
        issues = self.agent.validate_shot_clocks(invalid_data)
        self.assertTrue(any(
            issue.type == 'shot_clock_visibility' and
            issue.severity == ValidationSeverity.MEDIUM
            for issue in issues
        ))

    def test_officials_crew(self):
        """Test officials crew validation"""
        crew_data = {
            'officials': [
                {'role': 'referee', 'name': 'John Smith'},
                {'role': 'umpire', 'name': 'Jane Doe'},
                {'role': 'umpire', 'name': 'Bob Wilson'}
            ]
        }

        # Test valid crew
        issues = self.agent.validate_officials_crew(crew_data)
        self.assertEqual(len(issues), 0, "Valid officials crew should not have issues")

        # Test insufficient officials
        invalid_data = crew_data.copy()
        invalid_data['officials'] = invalid_data['officials'][:1]
        issues = self.agent.validate_officials_crew(invalid_data)
        self.assertTrue(any(
            issue.type == 'officials_crew' and
            issue.severity == ValidationSeverity.HIGH
            for issue in issues
        ))

        # Test missing crew data
        missing_data = {}
        issues = self.agent.validate_officials_crew(missing_data)
        self.assertTrue(any(
            issue.type == 'officials_crew' and
            issue.severity == ValidationSeverity.HIGH
            for issue in issues
        ))

    def test_optimal_game_times(self):
        """Test optimal game time calculation"""
        constraints = {
            'venue': {'has_lights': True},
            'temperature_forecast': {
                '14:00': 72,
                '19:00': 68
            }
        }

        # Test valid constraints
        times = self.agent.get_optimal_game_times(constraints)
        self.assertTrue(len(times) > 0, "Should find valid game times")
        self.assertTrue(all(
            isinstance(time, dict) and 'time' in time
            for time in times
        ))

        # Test temperature constraints
        invalid_constraints = constraints.copy()
        invalid_constraints['temperature_forecast'] = {
            '14:00': 95,  # Too hot
            '19:00': 68
        }
        times = self.agent.get_optimal_game_times(invalid_constraints)
        self.assertTrue(any(
            time['time'] == '19:00'
            for time in times
        ))
        self.assertFalse(any(
            time['time'] == '14:00'
            for time in times
        ))

    def test_required_equipment(self):
        """Test retrieving required equipment"""
        equipment = self.agent.get_required_equipment()
        self.assertIn('required', equipment)
        self.assertIn('recommended', equipment)
        self.assertTrue(isinstance(equipment['required'], list))
        self.assertTrue(isinstance(equipment['recommended'], list))

    def test_court_requirements(self):
        """Test retrieving court requirements"""
        requirements = self.agent.get_court_requirements()
        self.assertTrue(isinstance(requirements, dict))
        self.assertIn('length', requirements)
        self.assertIn('width', requirements)
        self.assertIn('unit', requirements)

if __name__ == '__main__':
    unittest.main() 