from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
import sys
import os
from pathlib import Path
import logging
from enum import Enum

# Add XII-OS to Python path for imports
xii_os_path = Path(__file__).parent.parent.parent / 'XII-OS'
sys.path.append(str(xii_os_path))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ValidationSeverity(Enum):
    """Enumeration for validation issue severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class ValidationIssue:
    """Structured class for validation issues"""
    def __init__(self, type: str, severity: ValidationSeverity, message: str, details: Optional[Dict[str, Any]] = None):
        self.type = type
        self.severity = severity
        self.message = message
        self.details = details or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            'type': self.type,
            'severity': self.severity.value,
            'message': self.message,
            'details': self.details
        }

class BaseSportsAgent:
    """Base class for all sports agents that interface between XII-OS and FlexTime"""
    
    def __init__(self, sport: str):
        """Initialize the sports agent with logging and manual loading"""
        logger.info(f"Initializing {sport} agent")
        self.sport = sport
        self.manual = self._load_manual()
        logger.info(f"Successfully loaded manual for {sport}")
        
    def _load_manual(self) -> Dict[str, Any]:
        """Load the sport manual from XII-OS with error handling"""
        try:
            logger.debug(f"Attempting to load manual for {self.sport}")
            module = __import__(f'src.sports.{self.sport}.manual', fromlist=[f'{self.sport.capitalize()}Manual'])
            manual = getattr(module, f'{self.sport.capitalize()}Manual')
            logger.debug(f"Successfully loaded manual version {manual.get('version', 'unknown')}")
            return manual
        except ImportError as e:
            logger.error(f"Failed to load manual for {self.sport}: {e}")
            raise ImportError(f"Could not load manual for sport: {self.sport}. Error: {e}")

    def validate_venue(self, venue_data: Dict[str, Any]) -> List[ValidationIssue]:
        """Validate venue against manual requirements with detailed reporting"""
        logger.info(f"Starting venue validation for {venue_data.get('name', 'unnamed venue')}")
        issues = []
        venue_reqs = self.manual['venue']

        # Field dimensions validation
        self._validate_field_dimensions(venue_data, venue_reqs, issues)
        
        # Surface type validation
        self._validate_surface_type(venue_data, venue_reqs, issues)
        
        # Lighting validation
        self._validate_lighting(venue_data, venue_reqs, issues)

        logger.info(f"Completed venue validation. Found {len(issues)} issues.")
        return issues

    def _validate_field_dimensions(self, venue_data: Dict[str, Any], venue_reqs: Dict[str, Any], issues: List[ValidationIssue]):
        """Helper method for field dimension validation"""
        for dimension in ['length', 'width']:
            if dimension in venue_data:
                min_value = venue_reqs['field'][dimension]['minimum']
                if venue_data[dimension] < min_value:
                    issues.append(ValidationIssue(
                        type=f'field_{dimension}',
                        severity=ValidationSeverity.HIGH,
                        message=f"Field {dimension} {venue_data[dimension]} {venue_reqs['field'][dimension]['unit']} "
                                f"below minimum {min_value}",
                        details={
                            'actual': venue_data[dimension],
                            'minimum': min_value,
                            'unit': venue_reqs['field'][dimension]['unit']
                        }
                    ))

    def _validate_surface_type(self, venue_data: Dict[str, Any], venue_reqs: Dict[str, Any], issues: List[ValidationIssue]):
        """Helper method for surface type validation"""
        if 'surface_type' in venue_data:
            if venue_data['surface_type'] not in venue_reqs['field']['surfaceTypes']:
                issues.append(ValidationIssue(
                    type='surface_type',
                    severity=ValidationSeverity.MEDIUM,
                    message=f"Surface type {venue_data['surface_type']} not approved",
                    details={
                        'actual': venue_data['surface_type'],
                        'allowed': venue_reqs['field']['surfaceTypes']
                    }
                ))

    def _validate_lighting(self, venue_data: Dict[str, Any], venue_reqs: Dict[str, Any], issues: List[ValidationIssue]):
        """Helper method for lighting validation"""
        if venue_reqs['lighting']['eveningRequired']:
            if not venue_data.get('has_lights', False):
                issues.append(ValidationIssue(
                    type='lighting',
                    severity=ValidationSeverity.HIGH,
                    message="Venue lacks required lighting for evening events"
                ))
            elif 'lighting_level' in venue_data:
                min_level = venue_reqs['lighting']['minimumLevel']['minimum']
                if venue_data['lighting_level'] < min_level:
                    issues.append(ValidationIssue(
                        type='lighting_level',
                        severity=ValidationSeverity.HIGH,
                        message=f"Lighting level insufficient",
                        details={
                            'actual': venue_data['lighting_level'],
                            'minimum': min_level,
                            'unit': venue_reqs['lighting']['minimumLevel']['unit']
                        }
                    ))

    def validate_weather(self, weather_data: Dict[str, Any]) -> List[ValidationIssue]:
        """Validate weather conditions with structured reporting"""
        logger.info("Starting weather condition validation")
        issues = []
        weather_reqs = self.manual['weather']

        self._validate_temperature(weather_data, weather_reqs, issues)
        self._validate_wind(weather_data, weather_reqs, issues)
        self._validate_precipitation(weather_data, weather_reqs, issues)

        logger.info(f"Completed weather validation. Found {len(issues)} issues.")
        return issues

    def _validate_temperature(self, weather_data: Dict[str, Any], weather_reqs: Dict[str, Any], issues: List[ValidationIssue]):
        """Helper method for temperature validation"""
        if 'temperature' in weather_data:
            temp = weather_data['temperature']
            min_temp = weather_reqs['temperature']['minimum']
            max_temp = weather_reqs['temperature']['maximum']
            
            if temp < min_temp or temp > max_temp:
                issues.append(ValidationIssue(
                    type='temperature',
                    severity=ValidationSeverity.HIGH,
                    message=f"Temperature outside allowed range",
                    details={
                        'actual': temp,
                        'allowed_range': {'min': min_temp, 'max': max_temp},
                        'unit': weather_reqs['temperature']['unit']
                    }
                ))

    def get_scheduling_guidelines(self) -> Dict[str, Any]:
        """Get scheduling guidelines with validation"""
        logger.info("Retrieving scheduling guidelines")
        return self.manual['scheduling']

    def get_officials_requirements(self) -> Dict[str, Any]:
        """Get officials requirements with validation"""
        logger.info("Retrieving officials requirements")
        return self.manual['officials']

    def get_references(self) -> Dict[str, Any]:
        """Get reference documentation"""
        logger.info("Retrieving reference documentation")
        return self.manual['references']

    def validate_game_schedule(self, schedule_data: Dict[str, Any]) -> List[ValidationIssue]:
        """Validate game schedule with comprehensive checks"""
        logger.info("Starting game schedule validation")
        issues = []
        scheduling = self.manual['scheduling']

        self._validate_game_duration(schedule_data, scheduling, issues)
        self._validate_rest_period(schedule_data, scheduling, issues)
        self._validate_start_time(schedule_data, scheduling, issues)
        self._validate_game_day(schedule_data, scheduling, issues)

        logger.info(f"Completed schedule validation. Found {len(issues)} issues.")
        return issues

    def _validate_game_duration(self, schedule_data: Dict[str, Any], scheduling: Dict[str, Any], issues: List[ValidationIssue]):
        """Helper method for game duration validation"""
        if 'duration' in schedule_data:
            if schedule_data['duration'] > scheduling['gameDuration']['total']:
                issues.append(ValidationIssue(
                    type='duration',
                    severity=ValidationSeverity.MEDIUM,
                    message="Game duration exceeds allowed time",
                    details={
                        'actual': schedule_data['duration'],
                        'maximum': scheduling['gameDuration']['total'],
                        'unit': scheduling['gameDuration']['unit']
                    }
                ))

    def _validate_rest_period(self, schedule_data: Dict[str, Any], scheduling: Dict[str, Any], issues: List[ValidationIssue]):
        """Helper method for rest period validation"""
        if 'last_game_end' in schedule_data and 'start_time' in schedule_data:
            last_game = datetime.fromisoformat(schedule_data['last_game_end'])
            game_start = datetime.fromisoformat(schedule_data['start_time'])
            rest_hours = (game_start - last_game).total_seconds() / 3600

            if rest_hours < scheduling['restPeriod']['minimum']:
                issues.append(ValidationIssue(
                    type='rest_period',
                    severity=ValidationSeverity.HIGH,
                    message="Insufficient rest period",
                    details={
                        'actual_hours': rest_hours,
                        'minimum_hours': scheduling['restPeriod']['minimum'],
                        'unit': scheduling['restPeriod']['unit']
                    }
                ))

    def _validate_start_time(self, schedule_data: Dict[str, Any], scheduling: Dict[str, Any], issues: List[ValidationIssue]):
        """Helper method for start time validation"""
        if 'start_time' in schedule_data:
            game_time = datetime.fromisoformat(schedule_data['start_time'])
            time_str = game_time.strftime('%H:%M')
            valid_times = [st['time'] for st in scheduling['preferredStartTimes']]
            
            if time_str not in valid_times:
                issues.append(ValidationIssue(
                    type='start_time',
                    severity=ValidationSeverity.LOW,
                    message="Start time not in preferred times",
                    details={
                        'actual': time_str,
                        'preferred_times': valid_times
                    }
                ))

    def _validate_game_day(self, schedule_data: Dict[str, Any], scheduling: Dict[str, Any], issues: List[ValidationIssue]):
        """Helper method for game day validation"""
        if 'start_time' in schedule_data:
            game_day = datetime.fromisoformat(schedule_data['start_time']).strftime('%A')
            valid_days = [gd['day'] for gd in scheduling['traditionalGameDays']]
            
            if game_day not in valid_days:
                issues.append(ValidationIssue(
                    type='game_day',
                    severity=ValidationSeverity.LOW,
                    message="Non-traditional game day",
                    details={
                        'actual': game_day,
                        'traditional_days': valid_days
                    }
                )) 