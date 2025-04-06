from typing import Dict, List, Any
from datetime import datetime
import logging
from .base_sports_agent import BaseSportsAgent, ValidationIssue, ValidationSeverity

logger = logging.getLogger(__name__)

class BasketballAgent(BaseSportsAgent):
    """Basketball-specific agent that implements sport-specific validations"""

    def __init__(self):
        """Initialize the basketball agent"""
        super().__init__('basketball')
        logger.info("Initialized BasketballAgent")

    def validate_court_dimensions(self, court_data: Dict[str, Any]) -> List[ValidationIssue]:
        """Validate basketball court dimensions"""
        logger.info("Validating basketball court dimensions")
        issues = []
        court_reqs = self.manual['venue']['court']
        
        if 'dimensions' in court_data:
            dims = court_data['dimensions']
            # Check length
            if dims.get('length') != court_reqs['length']:
                issues.append(ValidationIssue(
                    type='court_length',
                    severity=ValidationSeverity.HIGH,
                    message="Court length does not meet requirements",
                    details={
                        'actual': dims.get('length'),
                        'required': court_reqs['length'],
                        'unit': court_reqs['unit']
                    }
                ))
            
            # Check width
            if dims.get('width') != court_reqs['width']:
                issues.append(ValidationIssue(
                    type='court_width',
                    severity=ValidationSeverity.HIGH,
                    message="Court width does not meet requirements",
                    details={
                        'actual': dims.get('width'),
                        'required': court_reqs['width'],
                        'unit': court_reqs['unit']
                    }
                ))
        else:
            issues.append(ValidationIssue(
                type='court_dimensions',
                severity=ValidationSeverity.HIGH,
                message="No court dimension data provided",
                details={'requirements': court_reqs}
            ))
        
        logger.info(f"Court dimensions validation complete. Found {len(issues)} issues.")
        return issues

    def validate_backboard_setup(self, court_data: Dict[str, Any]) -> List[ValidationIssue]:
        """Validate basketball backboard and hoop setup"""
        logger.info("Validating backboard setup")
        issues = []
        backboard_reqs = self.manual['venue']['backboard']
        
        if 'backboards' in court_data:
            for i, backboard in enumerate(court_data['backboards']):
                # Check height
                if backboard.get('height') != backboard_reqs['height']:
                    issues.append(ValidationIssue(
                        type='backboard_height',
                        severity=ValidationSeverity.HIGH,
                        message=f"Backboard {i+1} height incorrect",
                        details={
                            'actual': backboard.get('height'),
                            'required': backboard_reqs['height'],
                            'unit': backboard_reqs['unit']
                        }
                    ))
                
                # Check extension distance
                if backboard.get('extension') < backboard_reqs['minExtension']:
                    issues.append(ValidationIssue(
                        type='backboard_extension',
                        severity=ValidationSeverity.HIGH,
                        message=f"Backboard {i+1} extension insufficient",
                        details={
                            'actual': backboard.get('extension'),
                            'minimum': backboard_reqs['minExtension'],
                            'unit': backboard_reqs['unit']
                        }
                    ))
                
                # Check padding
                if not backboard.get('padded', False):
                    issues.append(ValidationIssue(
                        type='backboard_safety',
                        severity=ValidationSeverity.HIGH,
                        message=f"Backboard {i+1} missing required padding",
                        details={'requirement': 'Padding required on all backboards'}
                    ))
        else:
            issues.append(ValidationIssue(
                type='backboard_setup',
                severity=ValidationSeverity.HIGH,
                message="No backboard data provided",
                details={'requirements': backboard_reqs}
            ))
        
        logger.info(f"Backboard setup validation complete. Found {len(issues)} issues.")
        return issues

    def validate_court_markings(self, court_data: Dict[str, Any]) -> List[ValidationIssue]:
        """Validate required basketball court markings"""
        logger.info("Validating basketball court markings")
        issues = []
        required_markings = self.manual['venue']['court']['requiredMarkings']
        
        if 'markings' in court_data:
            missing_markings = [
                marking for marking in required_markings 
                if marking not in court_data['markings']
            ]
            
            if missing_markings:
                issues.append(ValidationIssue(
                    type='court_markings',
                    severity=ValidationSeverity.HIGH,
                    message="Missing required court markings",
                    details={
                        'missing': missing_markings,
                        'required': required_markings
                    }
                ))
        else:
            issues.append(ValidationIssue(
                type='court_markings',
                severity=ValidationSeverity.HIGH,
                message="No court markings data provided",
                details={'required': required_markings}
            ))
        
        logger.info(f"Court markings validation complete. Found {len(issues)} issues.")
        return issues

    def validate_shot_clocks(self, court_data: Dict[str, Any]) -> List[ValidationIssue]:
        """Validate shot clock setup and visibility"""
        logger.info("Validating shot clocks")
        issues = []
        clock_reqs = self.manual['venue']['shotClock']
        
        if 'shotClocks' in court_data:
            clocks = court_data['shotClocks']
            
            # Check number of shot clocks
            if len(clocks) < clock_reqs['minimum']:
                issues.append(ValidationIssue(
                    type='shot_clock_count',
                    severity=ValidationSeverity.HIGH,
                    message="Insufficient number of shot clocks",
                    details={
                        'actual': len(clocks),
                        'required': clock_reqs['minimum']
                    }
                ))
            
            # Check each clock's visibility
            for i, clock in enumerate(clocks):
                if not clock.get('visible_from_court', False):
                    issues.append(ValidationIssue(
                        type='shot_clock_visibility',
                        severity=ValidationSeverity.MEDIUM,
                        message=f"Shot clock {i+1} visibility issues",
                        details={'requirement': 'Shot clocks must be visible from all court positions'}
                    ))
        else:
            issues.append(ValidationIssue(
                type='shot_clock_setup',
                severity=ValidationSeverity.HIGH,
                message="No shot clock data provided",
                details={'requirements': clock_reqs}
            ))
        
        logger.info(f"Shot clock validation complete. Found {len(issues)} issues.")
        return issues

    def validate_officials_crew(self, crew_data: Dict[str, Any]) -> List[ValidationIssue]:
        """Validate officiating crew composition"""
        logger.info("Validating officials crew")
        issues = []
        required_officials = self.manual['officials']['required']
        
        if 'officials' in crew_data:
            crew = crew_data['officials']
            for role, requirements in required_officials.items():
                required_count = requirements['count']
                actual_count = sum(1 for official in crew if official['role'] == role)
                
                if actual_count < required_count:
                    issues.append(ValidationIssue(
                        type='officials_crew',
                        severity=ValidationSeverity.HIGH,
                        message=f"Insufficient {role} officials",
                        details={
                            'role': role,
                            'required': required_count,
                            'actual': actual_count
                        }
                    ))
        else:
            issues.append(ValidationIssue(
                type='officials_crew',
                severity=ValidationSeverity.HIGH,
                message="No officials crew data provided",
                details={'required_roles': list(required_officials.keys())}
            ))
        
        logger.info(f"Officials crew validation complete. Found {len(issues)} issues.")
        return issues

    def get_optimal_game_times(self, constraints: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Calculate optimal game start times based on constraints"""
        logger.info("Calculating optimal game times")
        preferred_times = self.manual['scheduling']['preferredStartTimes']
        valid_times = []
        
        for time_slot in preferred_times:
            time_obj = datetime.strptime(time_slot['time'], '%H:%M').time()
            
            # Check lighting requirements
            if time_slot.get('requiresLighting', False):
                if not constraints.get('venue', {}).get('has_lights', False):
                    logger.debug(f"Skipping {time_slot['time']} - no lighting available")
                    continue
            
            # Check temperature constraints
            if 'temperature_forecast' in constraints:
                temp = constraints['temperature_forecast'].get(time_slot['time'])
                if temp:
                    if temp < self.manual['weather']['temperature']['minimum'] or \
                       temp > self.manual['weather']['temperature']['maximum']:
                        logger.debug(f"Skipping {time_slot['time']} - temperature out of range")
                        continue
            
            # Add valid time with priority
            valid_times.append({
                'time': time_slot['time'],
                'priority': time_slot.get('priority', 1),
                'requires_lighting': time_slot.get('requiresLighting', False)
            })
        
        # Sort by priority (higher priority first)
        valid_times.sort(key=lambda x: x['priority'], reverse=True)
        
        logger.info(f"Found {len(valid_times)} valid game times")
        return valid_times

    def get_required_equipment(self) -> Dict[str, List[str]]:
        """Get required and recommended equipment for basketball"""
        logger.info("Retrieving equipment requirements")
        equipment = self.manual['venue']['equipment']
        return {
            'required': equipment['required'],
            'recommended': equipment['recommended']
        }

    def get_court_requirements(self) -> Dict[str, Any]:
        """Get detailed court requirements for basketball"""
        logger.info("Retrieving court requirements")
        return self.manual['venue']['court'] 