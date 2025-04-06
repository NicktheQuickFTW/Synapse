from typing import Dict, List, Any
from datetime import datetime
import logging
from .base_sports_agent import BaseSportsAgent, ValidationIssue, ValidationSeverity

logger = logging.getLogger(__name__)

class FootballAgent(BaseSportsAgent):
    """Football-specific agent that implements sport-specific validations"""

    def __init__(self):
        """Initialize the football agent"""
        super().__init__('football')
        logger.info("Initialized FootballAgent")

    def validate_field_markings(self, field_data: Dict[str, Any]) -> List[ValidationIssue]:
        """Validate required field markings for football"""
        logger.info("Validating football field markings")
        issues = []
        required_markings = self.manual['venue']['field']['requiredMarkings']
        
        if 'markings' in field_data:
            missing_markings = [
                marking for marking in required_markings 
                if marking not in field_data['markings']
            ]
            
            if missing_markings:
                issues.append(ValidationIssue(
                    type='field_markings',
                    severity=ValidationSeverity.HIGH,
                    message="Missing required field markings",
                    details={
                        'missing': missing_markings,
                        'required': required_markings
                    }
                ))
        else:
            issues.append(ValidationIssue(
                type='field_markings',
                severity=ValidationSeverity.HIGH,
                message="No field markings data provided",
                details={'required': required_markings}
            ))
        
        logger.info(f"Field markings validation complete. Found {len(issues)} issues.")
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

    def check_conference_restrictions(self, schedule_data: Dict[str, Any]) -> List[ValidationIssue]:
        """Validate conference-specific scheduling restrictions"""
        logger.info("Checking conference restrictions")
        issues = []
        
        # Check for games during finals week
        if 'academic_calendar' in schedule_data:
            finals_week = schedule_data['academic_calendar'].get('finals_week')
            game_date = datetime.fromisoformat(schedule_data['start_time']).date()
            
            if finals_week and finals_week['start'] <= game_date <= finals_week['end']:
                issues.append(ValidationIssue(
                    type='conference_schedule',
                    severity=ValidationSeverity.HIGH,
                    message="Game scheduled during finals week",
                    details={
                        'game_date': game_date.isoformat(),
                        'finals_week': {
                            'start': finals_week['start'].isoformat(),
                            'end': finals_week['end'].isoformat()
                        }
                    }
                ))

        # Check conference game spacing
        if 'conference_games' in schedule_data:
            conf_games = schedule_data['conference_games']
            game_date = datetime.fromisoformat(schedule_data['start_time']).date()
            
            for existing_game in conf_games:
                existing_date = datetime.fromisoformat(existing_game['date']).date()
                days_between = abs((game_date - existing_date).days)
                
                if days_between < 5:  # Minimum days between conference games
                    issues.append(ValidationIssue(
                        type='conference_spacing',
                        severity=ValidationSeverity.MEDIUM,
                        message="Insufficient spacing between conference games",
                        details={
                            'game_date': game_date.isoformat(),
                            'conflict_date': existing_date.isoformat(),
                            'days_between': days_between,
                            'minimum_required': 5
                        }
                    ))

        # Check Thursday game limits
        if schedule_data.get('is_thursday_game'):
            thursday_games = len([
                game for game in schedule_data.get('season_games', [])
                if datetime.fromisoformat(game['date']).strftime('%A') == 'Thursday'
            ])
            
            if thursday_games >= 2:  # Maximum 2 Thursday games per season
                issues.append(ValidationIssue(
                    type='thursday_games',
                    severity=ValidationSeverity.MEDIUM,
                    message="Exceeds maximum Thursday games per season",
                    details={
                        'current_count': thursday_games,
                        'maximum_allowed': 2
                    }
                ))
        
        logger.info(f"Conference restrictions check complete. Found {len(issues)} issues.")
        return issues

    def validate_safety_zones(self, venue_data: Dict[str, Any]) -> List[ValidationIssue]:
        """Validate safety zones around the field"""
        logger.info("Validating safety zones")
        issues = []
        safety_reqs = self.manual['venue']['safetyZones']
        
        if 'safety_zones' in venue_data:
            zones = venue_data['safety_zones']
            
            for zone_type, requirements in safety_reqs.items():
                if zone_type in zones:
                    actual_distance = zones[zone_type]['distance']
                    min_distance = requirements['minimumDistance']
                    
                    if actual_distance < min_distance:
                        issues.append(ValidationIssue(
                            type='safety_zone',
                            severity=ValidationSeverity.HIGH,
                            message=f"Insufficient {zone_type} safety zone",
                            details={
                                'zone_type': zone_type,
                                'actual_distance': actual_distance,
                                'minimum_required': min_distance,
                                'unit': requirements['unit']
                            }
                        ))
                else:
                    issues.append(ValidationIssue(
                        type='safety_zone',
                        severity=ValidationSeverity.HIGH,
                        message=f"Missing {zone_type} safety zone data",
                        details={'requirements': requirements}
                    ))
        else:
            issues.append(ValidationIssue(
                type='safety_zone',
                severity=ValidationSeverity.HIGH,
                message="No safety zone data provided",
                details={'required_zones': list(safety_reqs.keys())}
            ))
        
        logger.info(f"Safety zones validation complete. Found {len(issues)} issues.")
        return issues

    def get_optimal_start_times(self, constraints: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Calculate optimal game start times based on constraints"""
        logger.info("Calculating optimal start times")
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
        
        logger.info(f"Found {len(valid_times)} valid start times")
        return valid_times

    def get_required_facilities(self) -> Dict[str, List[str]]:
        """Get required and recommended facilities for football"""
        logger.info("Retrieving facility requirements")
        facilities = self.manual['venue']['facilities']
        return {
            'required': facilities['required'],
            'recommended': facilities['recommended']
        }

    def get_field_requirements(self) -> Dict[str, Any]:
        """Get detailed field requirements for football"""
        logger.info("Retrieving field requirements")
        return self.manual['venue']['field'] 