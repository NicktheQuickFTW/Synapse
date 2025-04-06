#!/usr/bin/env python3
"""
Game Manager Agent

This agent specializes in overseeing game operations, venue management, 
weather analysis, venue availability, and resolving venue conflicts for Big 12 sports.

Part of the XII-OS FlexTime module.
"""

import os
import sys
import json
import argparse
import datetime
import subprocess
import requests
from typing import Dict, List, Any, Optional, Union
import re

# FlexTime configuration
FLEXTIME_VERSION = "1.0.0"
FLEXTIME_MODULE_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AGENTS_PATH = os.path.dirname(os.path.abspath(__file__))
VENUE_DATA_PATH = os.path.join(FLEXTIME_MODULE_PATH, "data", "venue_data.json")
SCHEDULING_DATA_PATH = "/Users/nickthequick/XII-OS/data/scheduling_data"

# Big 12 Conference constants
BIG12_SCHOOLS = [
    "arizona", "arizona_state", "baylor", "byu", "cincinnati", 
    "colorado", "houston", "iowa_state", "kansas", "kansas_state", 
    "oklahoma_state", "tcu", "texas_tech", "ucf", "utah", "west_virginia"
]

SCHEDULING_SPORTS = [
    "mbasketball", "wbasketball", "football", "baseball", "softball", 
    "mtennis", "wtennis", "volleyball", "soccer", "wrestling", 
    "gymnastics", "lacrosse"
]

# Sport-specific venue requirements and operational considerations
SPORT_REQUIREMENTS = {
    "football": {
        "venue_type": "stadium",
        "weather_sensitive": True,
        "staffing_requirements": ["security", "medical", "officials", "concessions", "television", "ticketing"],
        "setup_time": 6,  # hours
        "teardown_time": 3,  # hours
        "operations_notes": "Requires significant security coordination; TV operations setup needs 4+ hours"
    },
    "mbasketball": {
        "venue_type": "arena",
        "weather_sensitive": False,
        "staffing_requirements": ["security", "medical", "officials", "concessions", "television", "ticketing"],
        "setup_time": 3,  # hours
        "teardown_time": 2,  # hours
        "operations_notes": "Court preparation and TV setup are primary time constraints"
    },
    "wbasketball": {
        "venue_type": "arena",
        "weather_sensitive": False,
        "staffing_requirements": ["security", "medical", "officials", "concessions", "television", "ticketing"],
        "setup_time": 3,  # hours
        "teardown_time": 2,  # hours
        "operations_notes": "Court preparation and TV setup are primary time constraints"
    },
    "baseball": {
        "venue_type": "ballpark",
        "weather_sensitive": True,
        "staffing_requirements": ["grounds_crew", "security", "medical", "officials", "concessions", "ticketing"],
        "setup_time": 4,  # hours
        "teardown_time": 2,  # hours
        "operations_notes": "Weather monitoring critical; field tarps and drainage systems must be ready"
    },
    "softball": {
        "venue_type": "ballpark",
        "weather_sensitive": True,
        "staffing_requirements": ["grounds_crew", "security", "medical", "officials", "concessions", "ticketing"],
        "setup_time": 3,  # hours
        "teardown_time": 1.5,  # hours
        "operations_notes": "Similar to baseball but typically smaller venue and staff requirements"
    },
    "volleyball": {
        "venue_type": "arena",
        "weather_sensitive": False,
        "staffing_requirements": ["security", "medical", "officials", "concessions", "ticketing"],
        "setup_time": 2,  # hours
        "teardown_time": 1,  # hours
        "operations_notes": "Court setup and net systems are primary setup considerations"
    },
    "soccer": {
        "venue_type": "field",
        "weather_sensitive": True,
        "staffing_requirements": ["grounds_crew", "security", "medical", "officials", "ticketing"],
        "setup_time": 3,  # hours
        "teardown_time": 1.5,  # hours
        "operations_notes": "Field condition monitoring important; lightning protocols must be in place"
    }
}

# Utility functions
def get_school_context() -> str:
    """
    Get Big 12 school context for the agents
    """
    try:
        school_info_path = os.path.join("/Users/nickthequick/XII-OS/data/school_branding", "school_info.json")
        if os.path.exists(school_info_path):
            with open(school_info_path, 'r') as f:
                school_data = json.load(f)
            
            context = "Current Big 12 schools:\n"
            for school_key, school in school_data.items():
                context += f"- {school.get('name')}\n"
            
            return context
        return ""
    except Exception as e:
        print(f"Error generating school context: {str(e)}", file=sys.stderr)
        return ""

def load_venue_data() -> Dict[str, Any]:
    """
    Load venue data from the centralized JSON file
    
    Returns:
        Dictionary containing venue data for all schools
    """
    try:
        if os.path.exists(VENUE_DATA_PATH):
            with open(VENUE_DATA_PATH, 'r') as f:
                venue_data = json.load(f)
            return venue_data
        else:
            # Call the venue data agent if needed
            subprocess.run([
                sys.executable,
                os.path.join(AGENTS_PATH, "venue_data_agent.py"),
                "-p", "retrieve venue data for all schools"
            ])
            
            # Try to load again
            if os.path.exists(VENUE_DATA_PATH):
                with open(VENUE_DATA_PATH, 'r') as f:
                    venue_data = json.load(f)
                return venue_data
            
            print(f"Warning: Venue data file not found at {VENUE_DATA_PATH}", file=sys.stderr)
            return {"schools": {}}
    except Exception as e:
        print(f"Error loading venue data: {str(e)}", file=sys.stderr)
        return {"schools": {}}

def get_weather_forecast(school_code: str, start_date: str, end_date: str) -> List[Dict[str, Any]]:
    """
    Get weather forecast for a school location using the COMPASS agent
    
    Args:
        school_code: School identifier
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)
        
    Returns:
        List of weather forecasts for each day
    """
    try:
        # Call the COMPASS integration agent
        result = subprocess.run([
            sys.executable,
            os.path.join(AGENTS_PATH, "compass_integration_agent.py"),
            "-p", f"Get weather forecast for {school_code} from {start_date} to {end_date}"
        ], capture_output=True, text=True)
        
        # Parse the output
        # In a real implementation, we would parse structured data
        # For now, we'll return a mock forecast
        
        # Mock forecast data
        forecasts = []
        start = datetime.datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.datetime.strptime(end_date, "%Y-%m-%d")
        days = (end - start).days + 1
        
        for i in range(days):
            day = start + datetime.timedelta(days=i)
            day_str = day.strftime("%Y-%m-%d")
            
            # Create a mock forecast
            forecast = {
                "date": day_str,
                "school": school_code,
                "conditions": "Sunny",
                "temperature": {"high": 75, "low": 60, "unit": "F"},
                "precipitation": {"chance": 10, "type": "none"},
                "wind": {"speed": 5, "direction": "NW"},
                "advisories": []
            }
            
            forecasts.append(forecast)
        
        return forecasts
    except Exception as e:
        print(f"Error getting weather forecast: {str(e)}", file=sys.stderr)
        return []

def check_venue_availability(school_code: str, venue_name: str, date: str, start_time: str, end_time: str) -> Dict[str, Any]:
    """
    Check if a venue is available for a specific date and time range
    
    Args:
        school_code: School identifier
        venue_name: Name of the venue
        date: Date (YYYY-MM-DD)
        start_time: Start time (HH:MM)
        end_time: End time (HH:MM)
        
    Returns:
        Dictionary with availability information
    """
    # In a real implementation, this would check a venue calendar database
    # This is a simplified mock implementation
    
    # Convert times to datetime objects for comparison
    date_obj = datetime.datetime.strptime(date, "%Y-%m-%d")
    start_dt = datetime.datetime.strptime(f"{date} {start_time}", "%Y-%m-%d %H:%M")
    end_dt = datetime.datetime.strptime(f"{date} {end_time}", "%Y-%m-%d %H:%M")
    
    # Mock events calendar - in reality, this would come from a database
    mock_calendar = {
        "kansas": {
            "Allen Fieldhouse": [
                {"date": "2024-02-15", "start_time": "18:00", "end_time": "22:00", "event": "Men's Basketball vs. Baylor"},
                {"date": "2024-02-18", "start_time": "14:00", "end_time": "18:00", "event": "Women's Basketball vs. Iowa State"}
            ]
        },
        "iowa_state": {
            "Hilton Coliseum": [
                {"date": "2024-02-17", "start_time": "19:00", "end_time": "23:00", "event": "Men's Basketball vs. TCU"},
                {"date": "2024-02-20", "start_time": "18:00", "end_time": "22:00", "event": "Wrestling Meet vs. Oklahoma State"}
            ]
        }
    }
    
    # Check if we have calendar data for this school and venue
    if school_code in mock_calendar and venue_name in mock_calendar[school_code]:
        events = mock_calendar[school_code][venue_name]
        
        # Check for conflicts
        conflicts = []
        for event in events:
            event_date = datetime.datetime.strptime(event["date"], "%Y-%m-%d")
            event_start = datetime.datetime.strptime(f"{event['date']} {event['start_time']}", "%Y-%m-%d %H:%M")
            event_end = datetime.datetime.strptime(f"{event['date']} {event['end_time']}", "%Y-%m-%d %H:%M")
            
            # Check if the dates match and times overlap
            if event_date.date() == date_obj.date() and (
                (start_dt <= event_start < end_dt) or
                (start_dt < event_end <= end_dt) or
                (event_start <= start_dt and event_end >= end_dt)
            ):
                conflicts.append(event)
        
        if conflicts:
            return {
                "available": False,
                "conflicts": conflicts
            }
    
    # If we reach here, the venue is available (or we don't have data)
    return {
        "available": True,
        "conflicts": []
    }

def assess_weather_risk(school_code: str, sport: str, date: str) -> Dict[str, Any]:
    """
    Assess weather-related risks for a scheduled event
    
    Args:
        school_code: School identifier
        sport: Sport code
        date: Event date (YYYY-MM-DD)
        
    Returns:
        Dictionary with weather risk assessment
    """
    # Get the sport requirements
    sport_info = SPORT_REQUIREMENTS.get(sport, {})
    
    # If the sport is not weather sensitive, return minimal risk
    if not sport_info.get("weather_sensitive", False):
        return {
            "risk_level": "Low",
            "weather_sensitive": False,
            "notes": "Indoor sport with minimal weather impact"
        }
    
    # Get the weather forecast
    forecast = get_weather_forecast(school_code, date, date)
    
    if not forecast:
        return {
            "risk_level": "Unknown",
            "weather_sensitive": True,
            "notes": "Unable to retrieve weather forecast"
        }
    
    # Analyze the forecast for the specific date
    day_forecast = forecast[0]
    
    # Determine risk level based on conditions
    risk_level = "Low"
    risk_notes = []
    
    # Check precipitation
    precip_chance = day_forecast.get("precipitation", {}).get("chance", 0)
    if precip_chance > 70:
        risk_level = "High"
        risk_notes.append(f"High precipitation chance ({precip_chance}%)")
    elif precip_chance > 40:
        risk_level = "Medium"
        risk_notes.append(f"Moderate precipitation chance ({precip_chance}%)")
    
    # Check temperature extremes
    temp_high = day_forecast.get("temperature", {}).get("high", 75)
    temp_low = day_forecast.get("temperature", {}).get("low", 55)
    
    if temp_high > 95:
        risk_level = max(risk_level, "Medium")
        risk_notes.append(f"Extreme heat (high: {temp_high}°F)")
    
    if temp_low < 32 and sport in ["football", "soccer"]:
        risk_level = max(risk_level, "Medium")
        risk_notes.append(f"Freezing temperatures (low: {temp_low}°F)")
    
    # Check for weather advisories
    advisories = day_forecast.get("advisories", [])
    if advisories:
        risk_level = "High"
        risk_notes.append(f"Weather advisories: {', '.join(advisories)}")
    
    # Prepare the assessment
    assessment = {
        "risk_level": risk_level,
        "weather_sensitive": True,
        "forecast": day_forecast,
        "notes": "; ".join(risk_notes) if risk_notes else "No significant weather concerns"
    }
    
    # Add sport-specific recommendations
    if sport == "football" or sport == "soccer":
        assessment["recommendations"] = [
            "Monitor lightning in the area",
            "Have field tarps ready if precipitation expected",
            "Prepare alternate game times if high risk persists"
        ]
    elif sport in ["baseball", "softball"]:
        assessment["recommendations"] = [
            "Prepare field tarps and drainage systems",
            "Consider doubleheader scheduling options in case of postponement",
            "Verify umpire rain delay protocols"
        ]
    
    return assessment

def create_operations_plan(school_code: str, sport: str, venue_name: str, event_date: str, event_time: str) -> Dict[str, Any]:
    """
    Create a game operations plan for a specific event
    
    Args:
        school_code: School identifier
        sport: Sport code
        venue_name: Name of the venue
        event_date: Event date (YYYY-MM-DD)
        event_time: Event time (HH:MM)
        
    Returns:
        Dictionary with operations plan
    """
    # Get the sport requirements
    sport_info = SPORT_REQUIREMENTS.get(sport, {})
    
    # Calculate setup and teardown times
    setup_time = sport_info.get("setup_time", 3)  # default 3 hours
    teardown_time = sport_info.get("teardown_time", 2)  # default 2 hours
    
    # Calculate setup start time
    event_dt = datetime.datetime.strptime(f"{event_date} {event_time}", "%Y-%m-%d %H:%M")
    setup_start = event_dt - datetime.timedelta(hours=setup_time)
    
    # Estimate game duration (varies by sport)
    if sport in ["mbasketball", "wbasketball"]:
        duration = 2.5  # hours
    elif sport == "football":
        duration = 3.5  # hours
    elif sport in ["baseball", "softball"]:
        duration = 3.0  # hours
    elif sport == "volleyball":
        duration = 2.0  # hours
    elif sport == "soccer":
        duration = 2.5  # hours
    else:
        duration = 3.0  # default
    
    # Calculate end time and teardown end time
    event_end = event_dt + datetime.timedelta(hours=duration)
    teardown_end = event_end + datetime.timedelta(hours=teardown_time)
    
    # Check venue availability
    availability = check_venue_availability(
        school_code, 
        venue_name, 
        event_date, 
        setup_start.strftime("%H:%M"),
        teardown_end.strftime("%H:%M")
    )
    
    # Assess weather risks
    weather_assessment = assess_weather_risk(school_code, sport, event_date)
    
    # Create the operations plan
    ops_plan = {
        "event": {
            "school": school_code,
            "sport": sport,
            "venue": venue_name,
            "date": event_date,
            "time": event_time,
            "estimated_duration": f"{duration} hours"
        },
        "schedule": {
            "setup_start": setup_start.strftime("%Y-%m-%d %H:%M"),
            "event_start": event_dt.strftime("%Y-%m-%d %H:%M"),
            "event_end": event_end.strftime("%Y-%m-%d %H:%M"),
            "teardown_end": teardown_end.strftime("%Y-%m-%d %H:%M")
        },
        "venue_availability": availability,
        "weather_assessment": weather_assessment,
        "staffing_requirements": sport_info.get("staffing_requirements", []),
        "operations_notes": sport_info.get("operations_notes", "")
    }
    
    # Add specific operational tasks
    ops_plan["tasks"] = {
        "pre_event": [
            {"time": (setup_start).strftime("%H:%M"), "task": "Security staff arrival", "responsible": "Security Lead"},
            {"time": (setup_start).strftime("%H:%M"), "task": "Begin venue setup", "responsible": "Operations Manager"},
            {"time": (event_dt - datetime.timedelta(hours=3)).strftime("%H:%M"), "task": "Technical/AV setup", "responsible": "Tech Director"},
            {"time": (event_dt - datetime.timedelta(hours=2)).strftime("%H:%M"), "task": "Team arrival", "responsible": "Team Liaisons"},
            {"time": (event_dt - datetime.timedelta(hours=1.5)).strftime("%H:%M"), "task": "Gates open to public", "responsible": "Venue Manager"},
        ],
        "post_event": [
            {"time": (event_end).strftime("%H:%M"), "task": "Begin venue teardown", "responsible": "Operations Manager"},
            {"time": (event_end + datetime.timedelta(minutes=30)).strftime("%H:%M"), "task": "Media interviews", "responsible": "Media Relations"},
            {"time": (teardown_end).strftime("%H:%M"), "task": "Venue closure", "responsible": "Venue Manager"}
        ]
    }
    
    # Add weather-specific tasks if needed
    if weather_assessment["risk_level"] in ["Medium", "High"]:
        ops_plan["tasks"]["weather_contingency"] = [
            {"task": "Weather monitoring", "responsible": "Game Manager", "notes": "Continuous monitoring throughout event"},
            {"task": "Coordinate with officials on weather protocols", "responsible": "Game Manager"},
            {"task": "Prepare public address announcements", "responsible": "Public Address Coordinator"}
        ]
    
    return ops_plan

def process_user_query(query: str) -> str:
    """
    Process a user query related to game operations and venue management
    
    Args:
        query: Natural language query from the user
        
    Returns:
        Response with game operations analysis and recommendations
    """
    # Add school context
    school_context = get_school_context()
    
    # Parse the query to determine the type of request
    query_lower = query.lower()
    
    # Extract key information from the query
    school_mentioned = None
    for school in BIG12_SCHOOLS:
        if school in query_lower:
            school_mentioned = school
            break
    
    sport_mentioned = None
    for sport in SCHEDULING_SPORTS:
        if sport in query_lower:
            sport_mentioned = sport
            break
    
    # Default values if not specified
    if not school_mentioned:
        school_mentioned = "kansas"  # Default school
    
    if not sport_mentioned:
        sport_mentioned = "mbasketball"  # Default sport
    
    # Generate an appropriate response based on the query type
    if "operations plan" in query_lower or "game plan" in query_lower:
        # Operations plan request
        # Extract date information if present
        date_match = re.search(r'(\d{4}-\d{2}-\d{2}|[A-Z][a-z]+ \d{1,2}(?:st|nd|rd|th)?(?:,? \d{4})?)', query)
        event_date = date_match.group(1) if date_match else "2024-03-01"  # Default date
        
        # Try to convert to YYYY-MM-DD format if it's not already
        if not re.match(r'\d{4}-\d{2}-\d{2}', event_date):
            try:
                parsed_date = datetime.datetime.strptime(event_date, "%B %d, %Y")
                event_date = parsed_date.strftime("%Y-%m-%d")
            except ValueError:
                try:
                    parsed_date = datetime.datetime.strptime(event_date, "%B %d %Y")
                    event_date = parsed_date.strftime("%Y-%m-%d")
                except ValueError:
                    try:
                        parsed_date = datetime.datetime.strptime(event_date, "%b %d, %Y")
                        event_date = parsed_date.strftime("%Y-%m-%d")
                    except ValueError:
                        event_date = "2024-03-01"  # Default if parsing fails
        
        # Extract time information if present
        time_match = re.search(r'(\d{1,2}:\d{2}(?:\s*[AP]M)?)', query)
        event_time = time_match.group(1) if time_match else "19:00"  # Default time
        
        # Normalize time to 24-hour format
        if "PM" in event_time.upper() and not event_time.startswith("12"):
            hour = int(event_time.split(":")[0]) + 12
            event_time = f"{hour}:{event_time.split(':')[1].replace('PM', '').replace('pm', '').strip()}"
        elif "AM" in event_time.upper() and event_time.startswith("12"):
            event_time = f"00:{event_time.split(':')[1].replace('AM', '').replace('am', '').strip()}"
        else:
            event_time = event_time.replace("AM", "").replace("am", "").replace("PM", "").replace("pm", "").strip()
        
        # Get venue information
        venue_data = load_venue_data()
        venue_name = "Default Arena"  # Default venue
        
        if "schools" in venue_data and school_mentioned in venue_data["schools"]:
            for venue in venue_data["schools"][school_mentioned].get("venues", []):
                if sport_mentioned in venue.get("sports", []):
                    venue_name = venue["name"]
                    break
        
        # Create the operations plan
        ops_plan = create_operations_plan(
            school_mentioned, 
            sport_mentioned, 
            venue_name, 
            event_date, 
            event_time
        )
        
        # Format the response
        response = f"[Game Operations Plan: {school_mentioned.title()} {sport_mentioned.replace('m', 'Men\'s ').replace('w', 'Women\'s ')}]\n\n"
        response += f"Event: {sport_mentioned.replace('m', 'Men\'s ').replace('w', 'Women\'s ')} at {venue_name}\n"
        response += f"Date: {event_date}\n"
        response += f"Time: {event_time}\n\n"
        
        response += "Operational Schedule:\n"
        response += f"- Setup Start: {ops_plan['schedule']['setup_start']}\n"
        response += f"- Event Start: {ops_plan['schedule']['event_start']}\n"
        response += f"- Event End: {ops_plan['schedule']['event_end']}\n"
        response += f"- Teardown End: {ops_plan['schedule']['teardown_end']}\n\n"
        
        if not ops_plan["venue_availability"]["available"]:
            response += "⚠️ VENUE CONFLICT DETECTED ⚠️\n"
            for conflict in ops_plan["venue_availability"]["conflicts"]:
                response += f"- Conflict with: {conflict['event']} ({conflict['date']} {conflict['start_time']}-{conflict['end_time']})\n"
            response += "\n"
        
        response += f"Weather Assessment: {ops_plan['weather_assessment']['risk_level']} Risk\n"
        response += f"- {ops_plan['weather_assessment']['notes']}\n"
        
        if "recommendations" in ops_plan["weather_assessment"]:
            response += "Weather Recommendations:\n"
            for rec in ops_plan["weather_assessment"]["recommendations"]:
                response += f"- {rec}\n"
        
        response += "\nStaffing Requirements:\n"
        for staff in ops_plan["staffing_requirements"]:
            response += f"- {staff.replace('_', ' ').title()}\n"
        
        response += "\nKey Operational Tasks:\n"
        response += "Pre-Event:\n"
        for task in ops_plan["tasks"]["pre_event"]:
            response += f"- {task['time']}: {task['task']} ({task['responsible']})\n"
        
        response += "\nPost-Event:\n"
        for task in ops_plan["tasks"]["post_event"]:
            response += f"- {task['time']}: {task['task']} ({task['responsible']})\n"
        
        if "weather_contingency" in ops_plan["tasks"]:
            response += "\nWeather Contingency Tasks:\n"
            for task in ops_plan["tasks"]["weather_contingency"]:
                response += f"- {task['task']} ({task['responsible']})\n"
        
        response += f"\nOperations Notes: {ops_plan['operations_notes']}\n"
        
        return response
        
    elif "weather" in query_lower or "forecast" in query_lower:
        # Weather analysis request
        # Extract date information if present
        date_match = re.search(r'(\d{4}-\d{2}-\d{2}|[A-Z][a-z]+ \d{1,2}(?:st|nd|rd|th)?(?:,? \d{4})?)', query)
        event_date = date_match.group(1) if date_match else "2024-03-01"  # Default date
        
        # Try to convert to YYYY-MM-DD format if it's not already
        if not re.match(r'\d{4}-\d{2}-\d{2}', event_date):
            try:
                parsed_date = datetime.datetime.strptime(event_date, "%B %d, %Y")
                event_date = parsed_date.strftime("%Y-%m-%d")
            except ValueError:
                try:
                    parsed_date = datetime.datetime.strptime(event_date, "%B %d %Y")
                    event_date = parsed_date.strftime("%Y-%m-%d")
                except ValueError:
                    try:
                        parsed_date = datetime.datetime.strptime(event_date, "%b %d, %Y")
                        event_date = parsed_date.strftime("%Y-%m-%d")
                    except ValueError:
                        event_date = "2024-03-01"  # Default if parsing fails
        
        # Assess weather risks
        weather_assessment = assess_weather_risk(school_mentioned, sport_mentioned, event_date)
        
        # Format the response
        response = f"[Weather Analysis: {school_mentioned.title()} for {sport_mentioned.replace('m', 'Men\'s ').replace('w', 'Women\'s ')}]\n\n"
        response += f"Date: {event_date}\n"
        response += f"Risk Level: {weather_assessment['risk_level']}\n"
        response += f"Weather Sensitive Sport: {'Yes' if weather_assessment['weather_sensitive'] else 'No'}\n\n"
        
        response += "Weather Forecast:\n"
        if "forecast" in weather_assessment:
            forecast = weather_assessment["forecast"]
            response += f"- Conditions: {forecast.get('conditions', 'Unknown')}\n"
            response += f"- Temperature: {forecast.get('temperature', {}).get('high', 'N/A')}°F high / {forecast.get('temperature', {}).get('low', 'N/A')}°F low\n"
            response += f"- Precipitation: {forecast.get('precipitation', {}).get('chance', 'N/A')}% chance\n"
            
            if forecast.get("advisories"):
                response += f"- Advisories: {', '.join(forecast['advisories'])}\n"
        
        response += f"\nNotes: {weather_assessment['notes']}\n"
        
        if "recommendations" in weather_assessment:
            response += "\nRecommendations:\n"
            for rec in weather_assessment["recommendations"]:
                response += f"- {rec}\n"
        
        return response
        
    elif "venue" in query_lower and "availability" in query_lower:
        # Venue availability request
        # Extract date information if present
        date_match = re.search(r'(\d{4}-\d{2}-\d{2}|[A-Z][a-z]+ \d{1,2}(?:st|nd|rd|th)?(?:,? \d{4})?)', query)
        event_date = date_match.group(1) if date_match else "2024-03-01"  # Default date
        
        # Try to convert to YYYY-MM-DD format if it's not already
        if not re.match(r'\d{4}-\d{2}-\d{2}', event_date):
            try:
                parsed_date = datetime.datetime.strptime(event_date, "%B %d, %Y")
                event_date = parsed_date.strftime("%Y-%m-%d")
            except ValueError:
                try:
                    parsed_date = datetime.datetime.strptime(event_date, "%B %d %Y")
                    event_date = parsed_date.strftime("%Y-%m-%d")
                except ValueError:
                    try:
                        parsed_date = datetime.datetime.strptime(event_date, "%b %d, %Y")
                        event_date = parsed_date.strftime("%Y-%m-%d")
                    except ValueError:
                        event_date = "2024-03-01"  # Default if parsing fails
        
        # Extract time information if present
        time_match = re.search(r'(\d{1,2}:\d{2}(?:\s*[AP]M)?)', query)
        event_time = time_match.group(1) if time_match else "19:00"  # Default time
        
        # Normalize time to 24-hour format
        if "PM" in event_time.upper() and not event_time.startswith("12"):
            hour = int(event_time.split(":")[0]) + 12
            event_time = f"{hour}:{event_time.split(':')[1].replace('PM', '').replace('pm', '').strip()}"
        elif "AM" in event_time.upper() and event_time.startswith("12"):
            event_time = f"00:{event_time.split(':')[1].replace('AM', '').replace('am', '').strip()}"
        else:
            event_time = event_time.replace("AM", "").replace("am", "").replace("PM", "").replace("pm", "").strip()
        
        # Get venue information
        venue_data = load_venue_data()
        venue_name = "Default Arena"  # Default venue
        
        if "schools" in venue_data and school_mentioned in venue_data["schools"]:
            for venue in venue_data["schools"][school_mentioned].get("venues", []):
                if sport_mentioned in venue.get("sports", []):
                    venue_name = venue["name"]
                    break
        
        # Calculate estimated duration based on sport
        if sport_mentioned in ["mbasketball", "wbasketball"]:
            duration = 2.5  # hours
        elif sport_mentioned == "football":
            duration = 3.5  # hours
        elif sport_mentioned in ["baseball", "softball"]:
            duration = 3.0  # hours
        else:
            duration = 3.0  # default
        
        # Calculate end time
        event_dt = datetime.datetime.strptime(f"{event_date} {event_time}", "%Y-%m-%d %H:%M")
        end_time = (event_dt + datetime.timedelta(hours=duration)).strftime("%H:%M")
        
        # Check venue availability
        availability = check_venue_availability(
            school_mentioned, 
            venue_name, 
            event_date, 
            event_time,
            end_time
        )
        
        # Format the response
        response = f"[Venue Availability: {venue_name} at {school_mentioned.title()}]\n\n"
        response += f"Date: {event_date}\n"
        response += f"Time: {event_time} - {end_time}\n"
        response += f"Sport: {sport_mentioned.replace('m', 'Men\'s ').replace('w', 'Women\'s ')}\n\n"
        
        if availability["available"]:
            response += "✅ Venue is AVAILABLE for the requested time\n"
        else:
            response += "❌ Venue is NOT AVAILABLE due to the following conflicts:\n"
            for conflict in availability["conflicts"]:
                response += f"- {conflict['event']} ({conflict['date']} {conflict['start_time']}-{conflict['end_time']})\n"
        
        return response
    
    else:
        # General request - provide an overview of Game Manager capabilities
        response = f"[Game Manager Agent]\n\n"
        response += f"I can help with game operations, venue management, weather analysis, and other logistical aspects of Big 12 sporting events. Here's what I can assist with:\n\n"
        
        response += "1. Game Operations Planning\n"
        response += "   - Create detailed operations timelines for events\n"
        response += "   - Identify staffing requirements for each sport\n"
        response += "   - Generate task lists for pre and post-event activities\n\n"
        
        response += "2. Weather Analysis\n"
        response += "   - Assess weather-related risks for outdoor events\n"
        response += "   - Provide sport-specific weather recommendations\n"
        response += "   - Monitor potential weather impacts on scheduling\n\n"
        
        response += "3. Venue Management\n"
        response += "   - Check venue availability for specific dates/times\n"
        response += "   - Identify venue conflicts across multiple sports\n"
        response += "   - Provide venue setup and transition requirements\n\n"
        
        response += "4. Game Day Coordination\n"
        response += "   - Create timeline templates for game day operations\n"
        response += "   - Coordinate facility, staff, and team requirements\n"
        response += "   - Manage operational contingency plans\n\n"
        
        response += f"{school_context}\n"
        response += "To use my capabilities, please ask a specific question about operations planning, weather analysis, venue availability, or game coordination for a Big 12 sporting event."
        
        return response

def main():
    parser = argparse.ArgumentParser(description='Game Manager Agent')
    parser.add_argument('-p', '--prompt', type=str, required=True, help='User prompt/query')
    parser.add_argument('--system-prompt', type=str, help='System prompt for the agent', default="")
    
    args = parser.parse_args()
    
    # Process the query
    response = process_user_query(args.prompt)
    
    # Print the response
    print(response)

if __name__ == "__main__":
    main() 