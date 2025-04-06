from typing import Dict, List, Any
from datetime import datetime
import logging
from .base_sports_agent import BaseSportsAgent, ValidationIssue, ValidationSeverity

logger = logging.getLogger(__name__)

class VolleyballAgent(BaseSportsAgent):
    """Volleyball-specific agent that implements sport-specific validations"""

    def __init__(self):
        """Initialize the volleyball agent"""
        super().__init__('volleyball')
        logger.info("Initialized VolleyballAgent")

    def validate_court_markings(self, court_data: Dict[str, Any]) -> List[ValidationIssue]:
        """Validate required court markings for volleyball"""
        logger.info("Validating volleyball court markings")
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

    def validate_net_requirements(self, net_data: Dict[str, Any]) -> List[ValidationIssue]:
        """Validate volleyball net setup and measurements"""
        logger.info("Validating net requirements")
        issues = []
        net_reqs = self.manual['venue']['net']
        
        if 'net' in net_data:
            net = net_data['net']
            
            # Check net height
            if 'height' in net:
                min_height = net_reqs['height']['minimum']
                max_height = net_reqs['height']['maximum']
                if not min_height <= net['height'] <= max_height:
                    issues.append(ValidationIssue(
                        type='net_height',
                        severity=ValidationSeverity.HIGH,
                        message="Net height outside allowed range",
                        details={
                            'actual': net['height'],
                            'allowed_range': {'min': min_height, 'max': max_height},
                            'unit': net_reqs['height']['unit']
                        }
                    ))
            
            # Check antenna placement
            if not net.get('antennas', False):
                issues.append(ValidationIssue(
                    type='net_equipment',
                    severity=ValidationSeverity.HIGH,
                    message="Net antennas not present",
                    details={'required_equipment': ['antennas']}
                ))
        else:
            issues.append(ValidationIssue(
                type='net_setup',
                severity=ValidationSeverity.HIGH,
                message="No net setup data provided",
                details={'requirements': net_reqs}
            ))
        
        logger.info(f"Net requirements validation complete. Found {len(issues)} issues.")
        return issues

    def validate_ceiling_height(self, venue_data: Dict[str, Any]) -> List[ValidationIssue]:
        """Validate ceiling height requirements"""
        logger.info("Validating ceiling height")
        issues = []
        min_height = self.manual['venue']['ceiling']['minimumHeight']
        
        if 'ceiling_height' in venue_data:
            if venue_data['ceiling_height'] < min_height:
                issues.append(ValidationIssue(
                    type='ceiling_height',
                    severity=ValidationSeverity.HIGH,
                    message="Insufficient ceiling height",
                    details={
                        'actual': venue_data['ceiling_height'],
                        'minimum': min_height,
                        'unit': self.manual['venue']['ceiling']['unit']
                    }
                ))
        else:
            issues.append(ValidationIssue(
                type='ceiling_height',
                severity=ValidationSeverity.HIGH,
                message="No ceiling height data provided",
                details={'minimum_required': min_height}
            ))
        
        logger.info(f"Ceiling height validation complete. Found {len(issues)} issues.")
        return issues

    def validate_match_format(self, match_data: Dict[str, Any]) -> List[ValidationIssue]:
        """Validate volleyball match format and scoring rules"""
        logger.info("Validating match format")
        issues = []
        format_reqs = self.manual['scheduling']['matchFormat']
        
        # Check set format
        if 'sets' in match_data:
            if match_data['sets'].get('toWin', 0) != format_reqs['setsToWin']:
                issues.append(ValidationIssue(
                    type='match_format',
                    severity=ValidationSeverity.HIGH,
                    message="Invalid sets to win",
                    details={
                        'actual': match_data['sets'].get('toWin'),
                        'required': format_reqs['setsToWin']
                    }
                ))
            
            if match_data['sets'].get('pointsToWin', 0) != format_reqs['pointsPerSet']:
                issues.append(ValidationIssue(
                    type='match_format',
                    severity=ValidationSeverity.HIGH,
                    message="Invalid points per set",
                    details={
                        'actual': match_data['sets'].get('pointsToWin'),
                        'required': format_reqs['pointsPerSet']
                    }
                ))
        else:
            issues.append(ValidationIssue(
                type='match_format',
                severity=ValidationSeverity.HIGH,
                message="No match format data provided",
                details={'requirements': format_reqs}
            ))
        
        logger.info(f"Match format validation complete. Found {len(issues)} issues.")
        return issues

    def validate_officials_crew(self, crew_data: Dict[str, Any]) -> List[ValidationIssue]:
        """Validate officiating crew composition"""
        logger.info("Validating officials crew")
        issues = []
        required_officials = self.manual['officials']['required']
        
        if 'officials' in crew_data:
            crew = crew_data['officials']
            for role in required_officials:
                required_count = required_officials[role]['count']
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

    def get_optimal_match_times(self, constraints: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Calculate optimal match start times based on constraints"""
        logger.info("Calculating optimal match times")
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
        
        logger.info(f"Found {len(valid_times)} valid match times")
        return valid_times

    def get_required_equipment(self) -> Dict[str, List[str]]:
        """Get required and recommended equipment for volleyball"""
        logger.info("Retrieving equipment requirements")
        equipment = self.manual['venue']['equipment']
        return {
            'required': equipment['required'],
            'recommended': equipment['recommended']
        }

    def get_court_requirements(self) -> Dict[str, Any]:
        """Get detailed court requirements for volleyball"""
        logger.info("Retrieving court requirements")
        return self.manual['venue']['court'] 