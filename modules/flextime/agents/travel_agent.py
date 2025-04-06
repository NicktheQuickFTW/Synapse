#!/usr/bin/env python3
"""
Travel Agent

This agent specializes in managing all aspects of athletic competition travel,
including planning, logistics, budgeting, risk assessment, and coordination
with COMPASS and other XII-OS modules.

Part of the XII-OS FlexTime module.
"""

import os
import sys
import json
import argparse
import datetime
import subprocess
import requests
import re
from typing import Dict, List, Any, Optional, Union

# FlexTime configuration
FLEXTIME_VERSION = "1.0.0"
FLEXTIME_MODULE_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AGENTS_PATH = os.path.dirname(os.path.abspath(__file__))
COMPASS_MODULE_PATH = "/Users/nickthequick/XII-OS/modules/compass"
TRAVEL_DATA_PATH = os.path.join(FLEXTIME_MODULE_PATH, "data", "travel_data.json")
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

# Airport codes and transportation hubs for each school
SCHOOL_AIRPORTS = {
    "arizona": {"primary": "TUS", "name": "Tucson International Airport", "distance_to_campus": 8.5},
    "arizona_state": {"primary": "PHX", "name": "Phoenix Sky Harbor International Airport", "distance_to_campus": 9.2},
    "baylor": {"primary": "ACT", "name": "Waco Regional Airport", "distance_to_campus": 9.1, 
               "secondary": {"code": "DFW", "name": "Dallas/Fort Worth International Airport", "distance_to_campus": 96.3}},
    "byu": {"primary": "PVU", "name": "Provo Municipal Airport", "distance_to_campus": 3.2,
            "secondary": {"code": "SLC", "name": "Salt Lake City International Airport", "distance_to_campus": 45.7}},
    "cincinnati": {"primary": "CVG", "name": "Cincinnati/Northern Kentucky International Airport", "distance_to_campus": 17.5},
    "colorado": {"primary": "DEN", "name": "Denver International Airport", "distance_to_campus": 42.6},
    "houston": {"primary": "IAH", "name": "George Bush Intercontinental Airport", "distance_to_campus": 23.8,
                "secondary": {"code": "HOU", "name": "William P. Hobby Airport", "distance_to_campus": 14.3}},
    "iowa_state": {"primary": "DSM", "name": "Des Moines International Airport", "distance_to_campus": 40.5},
    "kansas": {"primary": "MCI", "name": "Kansas City International Airport", "distance_to_campus": 52.3},
    "kansas_state": {"primary": "MHK", "name": "Manhattan Regional Airport", "distance_to_campus": 7.8},
    "oklahoma_state": {"primary": "SWO", "name": "Stillwater Regional Airport", "distance_to_campus": 3.5,
                       "secondary": {"code": "OKC", "name": "Will Rogers World Airport", "distance_to_campus": 71.6}},
    "tcu": {"primary": "DFW", "name": "Dallas/Fort Worth International Airport", "distance_to_campus": 25.4},
    "texas_tech": {"primary": "LBB", "name": "Lubbock Preston Smith International Airport", "distance_to_campus": 5.3},
    "ucf": {"primary": "MCO", "name": "Orlando International Airport", "distance_to_campus": 20.7},
    "utah": {"primary": "SLC", "name": "Salt Lake City International Airport", "distance_to_campus": 8.9},
    "west_virginia": {"primary": "PIT", "name": "Pittsburgh International Airport", "distance_to_campus": 75.6,
                     "secondary": {"code": "CRW", "name": "Yeager Airport", "distance_to_campus": 153.2}}
}

# Sport-specific travel requirements
SPORT_TRAVEL_REQUIREMENTS = {
    "football": {
        "team_size": {"players": 75, "coaches": 15, "staff": 25, "total": 115},
        "equipment_needs": "Heavy (multiple large cases, field equipment)",
        "preferred_transportation": "Charter flight for games >400 miles, bus for shorter distances",
        "advance_arrival": "1 day before game (minimum)",
        "typical_lodging_needs": "55-60 hotel rooms, meeting spaces, dining area",
        "budget_tier": "Premium",
        "special_considerations": "Security needs, media accommodations, booster/donor events"
    },
    "mbasketball": {
        "team_size": {"players": 15, "coaches": 5, "staff": 10, "total": 30},
        "equipment_needs": "Medium (team gear, video equipment)",
        "preferred_transportation": "Charter flight for conference games, commercial for non-conference when possible",
        "advance_arrival": "Night before game",
        "typical_lodging_needs": "15-20 hotel rooms, meeting room",
        "budget_tier": "High",
        "special_considerations": "Practice facility access day before game"
    },
    "wbasketball": {
        "team_size": {"players": 15, "coaches": 5, "staff": 10, "total": 30},
        "equipment_needs": "Medium (team gear, video equipment)",
        "preferred_transportation": "Commercial flights with occasional charters for tournament play",
        "advance_arrival": "Night before game",
        "typical_lodging_needs": "15-20 hotel rooms, meeting room",
        "budget_tier": "Medium-High",
        "special_considerations": "Practice facility access day before game"
    },
    "baseball": {
        "team_size": {"players": 27, "coaches": 5, "staff": 8, "total": 40},
        "equipment_needs": "Heavy (bats, balls, protective gear)",
        "preferred_transportation": "Bus for games <500 miles, commercial flights for longer distances",
        "advance_arrival": "Night before series start",
        "typical_lodging_needs": "20-25 hotel rooms",
        "budget_tier": "Medium",
        "special_considerations": "Weather-related flexibility for spring travel"
    },
    "softball": {
        "team_size": {"players": 20, "coaches": 4, "staff": 6, "total": 30},
        "equipment_needs": "Medium-Heavy (bats, balls, protective gear)",
        "preferred_transportation": "Bus for games <500 miles, commercial flights for longer distances",
        "advance_arrival": "Night before series/game",
        "typical_lodging_needs": "15-20 hotel rooms",
        "budget_tier": "Medium",
        "special_considerations": "Weather-related flexibility for spring travel"
    },
    "volleyball": {
        "team_size": {"players": 16, "coaches": 4, "staff": 5, "total": 25},
        "equipment_needs": "Medium (team gear, limited equipment)",
        "preferred_transportation": "Bus for games <400 miles, commercial flights for longer distances",
        "advance_arrival": "Night before match",
        "typical_lodging_needs": "12-15 hotel rooms",
        "budget_tier": "Medium",
        "special_considerations": "Practice time at competition venue when possible"
    }
}

# Transportation mode thresholds and preferences
TRANSPORTATION_THRESHOLDS = {
    "bus": {
        "max_distance": 500,  # miles
        "cost_per_mile": 4.50,  # dollars
        "advantages": ["Convenient for equipment", "Flexible schedule", "Team cohesion", "Campus-to-venue service"],
        "disadvantages": ["Slower than flying", "Tiring for longer trips", "Weather/traffic disruptions"]
    },
    "commercial_air": {
        "min_distance": 300,  # miles
        "cost_per_person": 350,  # approximate average dollars per person
        "advantages": ["Faster for longer distances", "Often more cost-effective than charter", "Reliable schedules"],
        "disadvantages": ["Less flexible", "Equipment transport challenges", "Airport transfers needed", "Public exposure"]
    },
    "charter_air": {
        "min_distance": 400,  # miles
        "cost_per_hour": 5500,  # dollars
        "advantages": ["Most convenient", "Customized schedule", "Direct campus-to-venue possible", "Equipment transport easiest"],
        "disadvantages": ["Most expensive option", "May require FBO arrangements", "Weather impacts"]
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

def get_travel_distance(origin_school: str, destination_school: str) -> float:
    """
    Get travel distance between two schools using COMPASS data
    
    Args:
        origin_school: Origin school code
        destination_school: Destination school code
        
    Returns:
        Distance in miles
    """
    try:
        # Call the COMPASS integration agent to get distances
        result = subprocess.run([
            sys.executable,
            os.path.join(AGENTS_PATH, "compass_integration_agent.py"),
            "-p", f"Get travel distance from {origin_school} to {destination_school}"
        ], capture_output=True, text=True)
        
        # Parse the output to extract distance
        # In a real implementation, we'd parse structured data
        # For now, return a reasonable mock distance
        
        # Mock distances based on regions
        west_schools = ["arizona", "arizona_state", "colorado", "utah", "byu"]
        central_schools = ["texas_tech", "tcu", "baylor", "oklahoma_state", "kansas", "kansas_state", "iowa_state"]
        east_schools = ["west_virginia", "cincinnati"]
        south_schools = ["houston", "ucf"]
        
        if origin_school == destination_school:
            return 0.0
        
        # Cross-region distances
        if (origin_school in west_schools and destination_school in east_schools) or \
           (origin_school in east_schools and destination_school in west_schools):
            return 1800.0 + (hash(origin_school + destination_school) % 400)
            
        if (origin_school in west_schools and destination_school in south_schools) or \
           (origin_school in south_schools and destination_school in west_schools):
            return 1500.0 + (hash(origin_school + destination_school) % 300)
            
        if (origin_school in central_schools and destination_school in east_schools) or \
           (origin_school in east_schools and destination_school in central_schools):
            return 900.0 + (hash(origin_school + destination_school) % 200)
            
        if (origin_school in central_schools and destination_school in south_schools) or \
           (origin_school in south_schools and destination_school in central_schools):
            return 800.0 + (hash(origin_school + destination_school) % 150)
            
        if (origin_school in west_schools and destination_school in central_schools) or \
           (origin_school in central_schools and destination_school in west_schools):
            return 1000.0 + (hash(origin_school + destination_school) % 200)
            
        if (origin_school in south_schools and destination_school in east_schools) or \
           (origin_school in east_schools and destination_school in south_schools):
            return 1100.0 + (hash(origin_school + destination_school) % 200)
        
        # Within-region distances
        if origin_school in west_schools and destination_school in west_schools:
            return 400.0 + (hash(origin_school + destination_school) % 400)
            
        if origin_school in central_schools and destination_school in central_schools:
            return 300.0 + (hash(origin_school + destination_school) % 300)
            
        if origin_school in east_schools and destination_school in east_schools:
            return 300.0 + (hash(origin_school + destination_school) % 100)
            
        if origin_school in south_schools and destination_school in south_schools:
            return 1000.0  # Houston to Orlando
        
        # Default case
        return 800.0 + (hash(origin_school + destination_school) % 700)
        
    except Exception as e:
        print(f"Error getting travel distance: {str(e)}", file=sys.stderr)
        return 800.0  # Default reasonable distance

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

def recommend_transportation_mode(origin_school: str, destination_school: str, sport: str, team_size: int = None) -> Dict[str, Any]:
    """
    Recommend the best transportation mode based on distance, sport, and team size
    
    Args:
        origin_school: Origin school code
        destination_school: Destination school code
        sport: Sport code
        team_size: Override team size if different from default
        
    Returns:
        Dictionary with recommendation details
    """
    distance = get_travel_distance(origin_school, destination_school)
    
    # Get sport requirements
    sport_reqs = SPORT_TRAVEL_REQUIREMENTS.get(sport, {})
    default_team_size = sport_reqs.get("team_size", {}).get("total", 30) if sport_reqs else 30
    actual_team_size = team_size if team_size is not None else default_team_size
    
    # Get preferred transportation from sport requirements
    preferred = sport_reqs.get("preferred_transportation", "")
    
    # Initialize recommendation
    recommendation = {
        "origin": origin_school,
        "destination": destination_school,
        "distance": distance,
        "sport": sport,
        "team_size": actual_team_size,
        "recommended_mode": "",
        "estimated_cost": 0,
        "estimated_travel_time": 0,
        "alternatives": [],
        "notes": []
    }
    
    # Football has special charter requirements for most games
    if sport == "football" and distance > 200:
        recommendation["recommended_mode"] = "charter_air"
        recommendation["notes"].append("Football typically uses charter flights due to team size and equipment")
    
    # For short distances, bus is usually preferred
    elif distance <= TRANSPORTATION_THRESHOLDS["bus"]["max_distance"]:
        recommendation["recommended_mode"] = "bus"
        recommendation["notes"].append(f"Distance ({distance} miles) is within bus range")
    
    # For medium distances, consider commercial air
    elif distance >= TRANSPORTATION_THRESHOLDS["commercial_air"]["min_distance"] and actual_team_size <= 40:
        recommendation["recommended_mode"] = "commercial_air"
        recommendation["notes"].append(f"Distance ({distance} miles) is optimal for commercial flights")
        
        # Add note if this is a basketball team
        if sport in ["mbasketball", "wbasketball"]:
            recommendation["alternatives"].append({
                "mode": "charter_air",
                "reason": "Conference basketball games often use charter for scheduling flexibility"
            })
    
    # For longer distances, charter air becomes more attractive
    elif distance >= TRANSPORTATION_THRESHOLDS["charter_air"]["min_distance"]:
        # Large teams or those with substantial equipment needs benefit more from charter
        if actual_team_size > 40 or sport_reqs.get("equipment_needs", "").startswith("Heavy"):
            recommendation["recommended_mode"] = "charter_air"
            recommendation["notes"].append(f"Team size ({actual_team_size}) and equipment needs favor charter")
        else:
            recommendation["recommended_mode"] = "commercial_air"
            recommendation["notes"].append(f"Commercial air is cost-effective for this team size")
            recommendation["alternatives"].append({
                "mode": "charter_air",
                "reason": "Consider charter if schedule flexibility is needed or multiple connections required"
            })
    
    # Calculate estimated costs
    if recommendation["recommended_mode"] == "bus":
        recommendation["estimated_cost"] = distance * TRANSPORTATION_THRESHOLDS["bus"]["cost_per_mile"] * 2  # round trip
        recommendation["estimated_travel_time"] = (distance / 60.0) + 0.5  # hours, with stops
    
    elif recommendation["recommended_mode"] == "commercial_air":
        recommendation["estimated_cost"] = actual_team_size * TRANSPORTATION_THRESHOLDS["commercial_air"]["cost_per_person"] * 2  # round trip
        recommendation["estimated_travel_time"] = 2 + (distance / 500)  # hours, including airport time
    
    elif recommendation["recommended_mode"] == "charter_air":
        flight_time = (distance / 500) + 0.5  # hours
        recommendation["estimated_cost"] = flight_time * TRANSPORTATION_THRESHOLDS["charter_air"]["cost_per_hour"] * 2  # round trip
        recommendation["estimated_travel_time"] = flight_time + 1  # hours, including boarding
    
    return recommendation

def create_travel_plan(origin_school: str, destination_school: str, sport: str, 
                      event_date: str, return_date: str = None) -> Dict[str, Any]:
    """
    Create a comprehensive travel plan for a team trip
    
    Args:
        origin_school: Origin school code
        destination_school: Destination school code
        sport: Sport code
        event_date: Date of event (YYYY-MM-DD)
        return_date: Return date (YYYY-MM-DD), if None will calculate based on sport
        
    Returns:
        Dictionary with complete travel plan
    """
    # Parse event date
    event_datetime = datetime.datetime.strptime(event_date, "%Y-%m-%d")
    
    # Get sport requirements
    sport_reqs = SPORT_TRAVEL_REQUIREMENTS.get(sport, {})
    advance_arrival = sport_reqs.get("advance_arrival", "Night before game")
    
    # Calculate departure and return dates
    if "day before" in advance_arrival.lower():
        departure_date = (event_datetime - datetime.timedelta(days=1)).strftime("%Y-%m-%d")
    else:
        departure_date = (event_datetime - datetime.timedelta(days=1)).strftime("%Y-%m-%d")
    
    # If return date not specified, assume day after event
    if return_date is None:
        # For baseball/softball, typically 3-day series
        if sport in ["baseball", "softball"]:
            return_date = (event_datetime + datetime.timedelta(days=2)).strftime("%Y-%m-%d")
        else:
            return_date = (event_datetime + datetime.timedelta(days=1)).strftime("%Y-%m-%d")
    
    # Get transportation recommendation
    transport = recommend_transportation_mode(origin_school, destination_school, sport)
    
    # Get venue based on sport and destination school
    venue = f"{destination_school.replace('_', ' ').title()} {sport.capitalize()} Facility"
    
    # Get lodging needs
    lodging_needs = sport_reqs.get("typical_lodging_needs", "15-20 hotel rooms")
    
    # Get weather forecast for the destination
    weather = get_weather_forecast(destination_school, departure_date, return_date)
    
    # Create the travel plan
    plan = {
        "trip_id": f"{origin_school}-{destination_school}-{sport}-{event_date}",
        "origin": {
            "school": origin_school,
            "airport": SCHOOL_AIRPORTS.get(origin_school, {}).get("primary", ""),
            "airport_name": SCHOOL_AIRPORTS.get(origin_school, {}).get("name", "")
        },
        "destination": {
            "school": destination_school,
            "airport": SCHOOL_AIRPORTS.get(destination_school, {}).get("primary", ""),
            "airport_name": SCHOOL_AIRPORTS.get(destination_school, {}).get("name", "")
        },
        "sport": sport,
        "team_size": sport_reqs.get("team_size", {}).get("total", 30) if sport_reqs else 30,
        "dates": {
            "departure": departure_date,
            "event": event_date,
            "return": return_date
        },
        "transportation": transport,
        "lodging": {
            "needs": lodging_needs,
            "recommended_area": "Near campus",
            "estimated_cost": 0  # Would be calculated based on real data
        },
        "venue": venue,
        "weather_forecast": weather,
        "budget": {
            "transportation": transport["estimated_cost"],
            "lodging": 0,  # Would be calculated
            "meals": 0,    # Would be calculated
            "other": 0,    # Would be calculated
            "total": transport["estimated_cost"]  # Incomplete, just placeholder
        },
        "special_considerations": sport_reqs.get("special_considerations", "")
    }
    
    return plan

def calculate_travel_budget(travel_plan: Dict[str, Any]) -> Dict[str, float]:
    """
    Calculate detailed budget for a travel plan
    
    Args:
        travel_plan: The travel plan dictionary
        
    Returns:
        Dictionary with budget details
    """
    # Extract relevant values
    team_size = travel_plan.get("team_size", 30)
    sport = travel_plan.get("sport", "")
    transport_cost = travel_plan.get("transportation", {}).get("estimated_cost", 0)
    
    # Calculate days of travel
    departure = datetime.datetime.strptime(travel_plan.get("dates", {}).get("departure", "2023-01-01"), "%Y-%m-%d")
    return_date = datetime.datetime.strptime(travel_plan.get("dates", {}).get("return", "2023-01-02"), "%Y-%m-%d")
    days = (return_date - departure).days + 1
    
    # Per diem rates based on sport tier
    sport_reqs = SPORT_TRAVEL_REQUIREMENTS.get(sport, {})
    budget_tier = sport_reqs.get("budget_tier", "Medium")
    
    per_diem_rates = {
        "Premium": 75,
        "High": 65,
        "Medium-High": 60,
        "Medium": 55,
        "Low": 45
    }
    
    per_diem = per_diem_rates.get(budget_tier, 55)
    
    # Lodging costs
    avg_room_rate = 150  # Average room rate per night
    rooms_needed = int(team_size / 2) + 5  # Double occupancy plus staff rooms
    lodging_cost = rooms_needed * avg_room_rate * (days - 1)  # -1 because return day typically doesn't need lodging
    
    # Meals not covered by per diem (e.g., team meals)
    team_meals_cost = team_size * 25 * days  # $25 per person per day for team meals
    
    # Ground transportation at destination
    ground_transport_cost = 1000 if days <= 2 else 1500  # Estimated bus rental at destination
    
    # Incidentals
    incidentals = team_size * 10 * days  # $10 per person per day
    
    # Per diem
    per_diem_cost = team_size * per_diem * days
    
    # Total budget
    total = transport_cost + lodging_cost + team_meals_cost + ground_transport_cost + incidentals + per_diem_cost
    
    # Return budget dictionary
    budget = {
        "transportation": transport_cost,
        "lodging": lodging_cost,
        "meals": {
            "per_diem": per_diem_cost,
            "team_meals": team_meals_cost,
            "total_meals": per_diem_cost + team_meals_cost
        },
        "ground_transportation": ground_transport_cost,
        "incidentals": incidentals,
        "total": total,
        "per_person_cost": total / team_size,
        "per_day_cost": total / days
    }
    
    return budget

def optimize_travel_schedule(schedules: Dict[str, List[Dict[str, Any]]], school: str) -> Dict[str, Any]:
    """
    Optimize travel schedule to minimize costs and travel time
    
    Args:
        schedules: Dictionary of schedules by sport
        school: School code to optimize for
        
    Returns:
        Dictionary with optimization recommendations
    """
    # Flatten all events into a list
    all_events = []
    for sport, events in schedules.items():
        for event in events:
            event["sport"] = sport
            all_events.append(event)
    
    # Sort events by date
    all_events.sort(key=lambda x: x.get("date", ""))
    
    # Group events by week
    events_by_week = {}
    for event in all_events:
        event_date = datetime.datetime.strptime(event.get("date", "2023-01-01"), "%Y-%m-%d")
        year, week, _ = event_date.isocalendar()
        week_key = f"{year}-W{week:02d}"
        
        if week_key not in events_by_week:
            events_by_week[week_key] = []
        
        events_by_week[week_key].append(event)
    
    # Find opportunities for optimization
    optimizations = []
    
    for week, events in events_by_week.items():
        # Skip if only one event in the week
        if len(events) < 2:
            continue
        
        # Check for events at the same destination
        destinations = {}
        for event in events:
            dest = event.get("opponent", "")
            if dest not in destinations:
                destinations[dest] = []
            destinations[dest].append(event)
        
        # If multiple events at same destination, recommend combining trips
        for dest, dest_events in destinations.items():
            if len(dest_events) > 1:
                # Check if sports are compatible for combined travel
                sports = [e.get("sport", "") for e in dest_events]
                compatible = all(s in ["mbasketball", "wbasketball"] for s in sports) or \
                             all(s in ["baseball", "softball"] for s in sports)
                
                if compatible:
                    optimizations.append({
                        "type": "combine_trips",
                        "destination": dest,
                        "events": dest_events,
                        "week": week,
                        "estimated_savings": 5000,  # Placeholder
                        "notes": "Consider combined travel arrangements for these events at the same destination"
                    })
    
    # Find opportunities for charter sharing
    potential_charters = []
    for event in all_events:
        if event.get("opponent", "") and get_travel_distance(school, event.get("opponent", "")) > 800:
            potential_charters.append(event)
    
    # Sort potential charters by date
    potential_charters.sort(key=lambda x: x.get("date", ""))
    
    # Check for charter sharing opportunities
    for i in range(len(potential_charters) - 1):
        event1 = potential_charters[i]
        event2 = potential_charters[i+1]
        
        date1 = datetime.datetime.strptime(event1.get("date", "2023-01-01"), "%Y-%m-%d")
        date2 = datetime.datetime.strptime(event2.get("date", "2023-01-01"), "%Y-%m-%d")
        
        # If events are close in time, suggest charter sharing
        if (date2 - date1).days <= 2:
            optimizations.append({
                "type": "charter_share",
                "events": [event1, event2],
                "dates": [event1.get("date", ""), event2.get("date", "")],
                "estimated_savings": 10000,  # Placeholder
                "notes": "Consider sharing charter for these events close in time"
            })
    
    return {
        "school": school,
        "total_events": len(all_events),
        "weeks_with_travel": len(events_by_week),
        "optimizations": optimizations,
        "potential_savings": sum(opt.get("estimated_savings", 0) for opt in optimizations)
    }

def process_user_query(query: str) -> str:
    """
    Process user queries to the Travel Agent
    
    Args:
        query: User query string
        
    Returns:
        Response string
    """
    query = query.lower()
    
    # Handle queries about transportation modes
    if "transportation" in query and "mode" in query:
        sports = [s for s in SCHEDULING_SPORTS if s in query]
        sport = sports[0] if sports else None
        
        if "preferred" in query and sport:
            return f"Preferred transportation for {sport}: " + SPORT_TRAVEL_REQUIREMENTS.get(sport, {}).get("preferred_transportation", "Varies based on distance")
        
        schools = [s for s in BIG12_SCHOOLS if s.replace("_", " ") in query.replace("_", " ")]
        if len(schools) >= 2:
            origin = schools[0]
            destination = schools[1]
            sport_arg = sport if sport else "mbasketball" # default
            recommendation = recommend_transportation_mode(origin, destination, sport_arg)
            return f"For travel from {origin} to {destination} for {sport_arg}: " + \
                   f"\nRecommended mode: {recommendation['recommended_mode']}" + \
                   f"\nEstimated cost: ${recommendation['estimated_cost']:.2f}" + \
                   f"\nEstimated travel time: {recommendation['estimated_travel_time']:.1f} hours" + \
                   f"\nNotes: {'; '.join(recommendation['notes'])}"
    
    # Handle queries about travel requirements for a sport
    if "requirements" in query or "needs" in query:
        sports = [s for s in SCHEDULING_SPORTS if s in query]
        if sports:
            sport = sports[0]
            reqs = SPORT_TRAVEL_REQUIREMENTS.get(sport, {})
            if reqs:
                return f"Travel requirements for {sport}:" + \
                       f"\nTeam size: {reqs.get('team_size', {}).get('total', 'Unknown')} people" + \
                       f"\nEquipment needs: {reqs.get('equipment_needs', 'Not specified')}" + \
                       f"\nPreferred transportation: {reqs.get('preferred_transportation', 'Not specified')}" + \
                       f"\nAdvance arrival: {reqs.get('advance_arrival', 'Not specified')}" + \
                       f"\nLodging needs: {reqs.get('typical_lodging_needs', 'Not specified')}" + \
                       f"\nBudget tier: {reqs.get('budget_tier', 'Not specified')}" + \
                       f"\nSpecial considerations: {reqs.get('special_considerations', 'None')}"
    
    # Handle queries about airports
    if "airport" in query:
        schools = [s for s in BIG12_SCHOOLS if s.replace("_", " ") in query.replace("_", " ")]
        if schools:
            school = schools[0]
            airport = SCHOOL_AIRPORTS.get(school, {})
            if airport:
                response = f"Airport information for {school.replace('_', ' ').title()}:\n" + \
                          f"Primary: {airport.get('primary', 'N/A')} - {airport.get('name', 'N/A')}\n" + \
                          f"Distance to campus: {airport.get('distance_to_campus', 'N/A')} miles"
                
                # Add secondary airport if available
                if "secondary" in airport:
                    response += f"\nSecondary: {airport['secondary'].get('code', 'N/A')} - {airport['secondary'].get('name', 'N/A')}\n" + \
                               f"Distance to campus: {airport['secondary'].get('distance_to_campus', 'N/A')} miles"
                
                return response
    
    # Handle queries about budgets
    if "budget" in query:
        sports = [s for s in SCHEDULING_SPORTS if s in query]
        if sports:
            sport = sports[0]
            reqs = SPORT_TRAVEL_REQUIREMENTS.get(sport, {})
            if reqs:
                return f"Budget information for {sport}:\n" + \
                       f"Budget tier: {reqs.get('budget_tier', 'Not specified')}\n" + \
                       f"For detailed budget estimates, please provide specific trip details including origin, destination, and dates."
    
    # Handle queries about distances
    if "distance" in query:
        schools = [s for s in BIG12_SCHOOLS if s.replace("_", " ") in query.replace("_", " ")]
        if len(schools) >= 2:
            origin = schools[0]
            destination = schools[1]
            distance = get_travel_distance(origin, destination)
            return f"Distance from {origin.replace('_', ' ').title()} to {destination.replace('_', ' ').title()}: {distance:.1f} miles"
    
    # General query about what the Travel Agent can do
    if any(term in query for term in ["help", "capabilities", "what can you do", "functions"]):
        return "Travel Agent capabilities:\n" + \
               "1. Recommend transportation modes based on distance, sport, and team size\n" + \
               "2. Create comprehensive travel plans for team trips\n" + \
               "3. Calculate detailed travel budgets\n" + \
               "4. Provide information about airports and transportation hubs\n" + \
               "5. Optimize travel schedules to minimize costs and travel time\n" + \
               "6. Answer queries about sport-specific travel requirements\n" + \
               "7. Calculate distances between schools\n" + \
               "8. Provide weather forecasts for trip planning"
    
    # Default response
    return "I understand you're asking about travel planning, but I need more specific information. " + \
           "You can ask about transportation modes, travel requirements, airports, budgets, distances, or request help for more information."

def main():
    """
    Main function to handle command-line operation
    """
    parser = argparse.ArgumentParser(description="Travel Agent for athletic team travel planning")
    parser.add_argument("-p", "--prompt", help="User prompt for interactive queries")
    parser.add_argument("-o", "--origin", help="Origin school code")
    parser.add_argument("-d", "--destination", help="Destination school code")
    parser.add_argument("-s", "--sport", help="Sport code")
    parser.add_argument("-e", "--event-date", help="Event date (YYYY-MM-DD)")
    parser.add_argument("-r", "--return-date", help="Return date (YYYY-MM-DD)")
    parser.add_argument("-t", "--transport", help="Calculate transportation recommendation", action="store_true")
    parser.add_argument("-f", "--full-plan", help="Generate full travel plan", action="store_true")
    parser.add_argument("-b", "--budget", help="Calculate travel budget", action="store_true")
    
    args = parser.parse_args()
    
    # Handle interactive mode with prompt
    if args.prompt:
        result = process_user_query(args.prompt)
        print(result)
        return
    
    # Handle transportation recommendation
    if args.transport and args.origin and args.destination and args.sport:
        recommendation = recommend_transportation_mode(args.origin, args.destination, args.sport)
        print(json.dumps(recommendation, indent=2))
        return
    
    # Handle full travel plan generation
    if args.full_plan and args.origin and args.destination and args.sport and args.event_date:
        plan = create_travel_plan(args.origin, args.destination, args.sport, 
                                 args.event_date, args.return_date)
        print(json.dumps(plan, indent=2))
        return
    
    # Handle budget calculation
    if args.budget and args.origin and args.destination and args.sport and args.event_date:
        plan = create_travel_plan(args.origin, args.destination, args.sport, 
                                 args.event_date, args.return_date)
        budget = calculate_travel_budget(plan)
        print(json.dumps(budget, indent=2))
        return
    
    # Default behavior - print help information
    print("Travel Agent for athletic team travel planning")
    print("Use --help for command line options or -p/--prompt for interactive queries")
    print(process_user_query("help"))

if __name__ == "__main__":
    main() 