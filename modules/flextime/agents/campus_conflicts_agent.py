#!/usr/bin/env python3
"""
Campus Conflicts Agent

This agent specializes in identifying and resolving scheduling conflicts
for shared athletic facilities across multiple sports at Big 12 schools.

Part of the XII-OS FlexTime module.
"""

import os
import sys
import json
import argparse
import datetime
import subprocess
from typing import Dict, List, Any, Optional, Union

# FlexTime configuration
FLEXTIME_VERSION = "1.0.0"
FLEXTIME_MODULE_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AGENTS_PATH = os.path.dirname(os.path.abspath(__file__))
SCHEDULING_DATA_PATH = "/Users/nickthequick/XII-OS/data/scheduling_data"
VENUE_DATA_PATH = "/Users/nickthequick/XII-OS/data/venue_data/big12_venues.json"

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

# Load venue data from the centralized JSON file
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
            print(f"Warning: Venue data file not found at {VENUE_DATA_PATH}", file=sys.stderr)
            return {"schools": {}}
    except Exception as e:
        print(f"Error loading venue data: {str(e)}", file=sys.stderr)
        return {"schools": {}}

# Fall back to hardcoded values if venue data file cannot be loaded
VENUE_DATA = load_venue_data()

# Venue configurations and setup times (in hours) - fallback if venue data not available
VENUE_SETUP_TIMES = {
    "basketball_to_basketball": 1,    # MBB to WBB or vice versa
    "basketball_to_volleyball": 2,    # Basketball to volleyball
    "basketball_to_wrestling": 3,     # Basketball to wrestling
    "basketball_to_gymnastics": 4,    # Basketball to gymnastics
    "volleyball_to_basketball": 2,    # Volleyball to basketball
    "volleyball_to_wrestling": 3,     # Volleyball to wrestling
    "wrestling_to_basketball": 3,     # Wrestling to basketball
    "wrestling_to_volleyball": 3,     # Wrestling to volleyball
    "gymnastics_to_basketball": 4,    # Gymnastics to basketball
    "mtennis_to_wtennis": 1,          # Men's to women's tennis
    "default": 2                      # Default transition time
}

# Schools with shared venues and their specific configurations - fallback if venue data not available
SHARED_VENUES = {
    "arizona_state": {
        "Desert Financial Arena": {
            "sports": ["mbasketball", "wbasketball", "volleyball", "wrestling", "gymnastics"],
            "priority_order": ["mbasketball", "wbasketball", "gymnastics", "wrestling", "volleyball"],
            "transition_time": 3,  # Hours needed between events
            "notes": "Complex setup for gymnastics requires additional time"
        },
        "Whiteman Tennis Center": {
            "sports": ["mtennis", "wtennis"],
            "priority_order": ["mtennis", "wtennis"],
            "transition_time": 1,
            "notes": "Typically scheduled on different days but can be used same day"
        }
    },
    "iowa_state": {
        "Hilton Coliseum": {
            "sports": ["mbasketball", "wbasketball", "volleyball", "gymnastics", "wrestling"],
            "priority_order": ["mbasketball", "wbasketball", "wrestling", "gymnastics", "volleyball"],
            "transition_time": 3,
            "notes": "Wrestling and gymnastics never scheduled on same day"
        },
        "Forker Tennis Courts": {
            "sports": ["mtennis", "wtennis"],
            "priority_order": ["wtennis", "mtennis"],
            "transition_time": 1,
            "notes": "Indoor courts have limited availability in winter months"
        }
    },
    "west_virginia": {
        "WVU Coliseum": {
            "sports": ["mbasketball", "wbasketball", "volleyball", "wrestling", "gymnastics"],
            "priority_order": ["mbasketball", "wbasketball", "wrestling", "gymnastics", "volleyball"],
            "transition_time": 4,
            "notes": "Particularly difficult to schedule gymnastics with other sports"
        },
        "Mountaineer Tennis Courts": {
            "sports": ["mtennis", "wtennis"],
            "priority_order": ["mtennis", "wtennis"],
            "transition_time": 1,
            "notes": "Outdoor courts dependent on weather conditions"
        }
    },
    "kansas": {
        "Allen Fieldhouse": {
            "sports": ["mbasketball", "wbasketball", "volleyball"],
            "priority_order": ["mbasketball", "wbasketball", "volleyball"],
            "transition_time": 2,
            "notes": "Tradition of MBB priority; volleyball typically scheduled around basketball"
        }
    },
    "baylor": {
        "Foster Pavilion": {
            "sports": ["mbasketball", "wbasketball"],
            "priority_order": ["mbasketball", "wbasketball"],
            "transition_time": 2,
            "notes": "New facility with efficient conversion between setups"
        },
        "Ferrell Center": {
            "sports": ["volleyball", "gymnastics"],
            "priority_order": ["volleyball", "gymnastics"],
            "transition_time": 3,
            "notes": "Former basketball arena now used for Olympic sports"
        }
    }
}

# Conflict types and their definitions
CONFLICT_TYPES = {
    "hard_conflict": {
        "description": "Events that physically cannot occur in the same venue at the same time",
        "examples": ["Two games scheduled at exact same time", "Event scheduled during mandatory setup/teardown time"],
        "resolution_priority": "Must be resolved - no exceptions"
    },
    "soft_conflict": {
        "description": "Events that are technically possible but preferably avoided",
        "examples": ["Men's/Women's Tennis same day (different times)", "Basketball followed by volleyball with tight transition"],
        "resolution_priority": "Should be resolved when possible, but can remain if necessary"
    },
    "doubleheader_opportunity": {
        "description": "Potential for intentional same-day scheduling",
        "examples": ["Men's/Women's Basketball played back-to-back", "Olympic sports festival day"],
        "resolution_priority": "Consider maintaining as an opportunity for increased attendance"
    }
}

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

def identify_venue_for_event(school_code: str, sport: str) -> str:
    """
    Identify the venue for a given sport at a specific school
    
    Args:
        school_code: Code for the school (e.g., 'arizona_state')
        sport: Sport code (e.g., 'mbasketball')
    
    Returns:
        Name of the venue or empty string if not found
    """
    # Try to get venue from centralized venue data
    if "schools" in VENUE_DATA and school_code in VENUE_DATA["schools"]:
        school_venues = VENUE_DATA["schools"][school_code]["venues"]
        for venue in school_venues:
            if sport in venue["sports"]:
                return venue["name"]
    
    # Fall back to hardcoded data if not found
    if school_code not in SHARED_VENUES:
        return ""
    
    for venue_name, venue_info in SHARED_VENUES[school_code].items():
        if sport in venue_info["sports"]:
            return venue_name
    
    return ""

def get_venue_info(school_code: str, venue_name: str) -> Dict[str, Any]:
    """
    Get detailed venue information
    
    Args:
        school_code: Code for the school
        venue_name: Name of the venue
    
    Returns:
        Venue information dictionary
    """
    # Try to get venue info from centralized venue data
    if "schools" in VENUE_DATA and school_code in VENUE_DATA["schools"]:
        school_venues = VENUE_DATA["schools"][school_code]["venues"]
        for venue in school_venues:
            if venue["name"] == venue_name:
                return venue
    
    # Fall back to hardcoded data
    if school_code in SHARED_VENUES and venue_name in SHARED_VENUES[school_code]:
        return SHARED_VENUES[school_code][venue_name]
    
    return {}

def get_transition_time(from_sport: str, to_sport: str, school_code: str = None, venue_name: str = None) -> int:
    """
    Get the transition time between two sports in hours
    
    Args:
        from_sport: Sport transitioning from
        to_sport: Sport transitioning to
        school_code: Optional school code for venue-specific transition times
        venue_name: Optional venue name for venue-specific transition times
    
    Returns:
        Transition time in hours
    """
    # Handle basketball specifically (men's/women's are similar for transitions)
    if from_sport in ["mbasketball", "wbasketball"]:
        from_sport = "basketball"
    if to_sport in ["mbasketball", "wbasketball"]:
        to_sport = "basketball"
    
    # Check venue-specific transition times if venue info provided
    if school_code and venue_name:
        venue_info = get_venue_info(school_code, venue_name)
        if venue_info and "transition_times" in venue_info:
            transition_key = f"{from_sport}_to_{to_sport}"
            if transition_key in venue_info["transition_times"]:
                return venue_info["transition_times"][transition_key]
    
    # Fall back to global transition times
    transition_key = f"{from_sport}_to_{to_sport}"
    if transition_key in VENUE_SETUP_TIMES:
        return VENUE_SETUP_TIMES[transition_key]
    
    # Fall back to default
    return VENUE_SETUP_TIMES["default"]

def detect_conflicts(schedules: Dict[str, List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
    """
    Detect venue conflicts across all schedules
    
    Args:
        schedules: Dictionary mapping sport codes to lists of scheduled events
    
    Returns:
        List of identified conflicts
    """
    conflicts = []
    
    # Create a map of venue usage by day and time
    venue_usage = {}
    
    # First pass: organize events by venue, date, and time
    for sport, events in schedules.items():
        for event in events:
            # Extract essential information
            home_school = event.get("home_team")
            event_date = event.get("date")
            start_time = event.get("start_time")
            end_time = event.get("end_time", "")  # End time might not be specified
            
            # If no end time, estimate based on sport type
            if not end_time:
                # Assume 2 hours for most sports, 3 for football
                duration = 3 if sport == "football" else 2
                # Parse start time and add duration
                try:
                    start_dt = datetime.datetime.strptime(start_time, "%H:%M")
                    end_dt = start_dt + datetime.timedelta(hours=duration)
                    end_time = end_dt.strftime("%H:%M")
                except:
                    # If time parsing fails, use a default end time
                    end_time = "23:59"
            
            # Only care about home games (they use the venue)
            if home_school and event_date and start_time:
                venue = identify_venue_for_event(home_school, sport)
                if venue:
                    # Create venue usage entry
                    venue_key = f"{home_school}:{venue}"
                    date_key = event_date
                    
                    if venue_key not in venue_usage:
                        venue_usage[venue_key] = {}
                    
                    if date_key not in venue_usage[venue_key]:
                        venue_usage[venue_key][date_key] = []
                    
                    # Add this event to the venue usage
                    venue_usage[venue_key][date_key].append({
                        "sport": sport,
                        "start_time": start_time,
                        "end_time": end_time,
                        "event_id": event.get("id", ""),
                        "description": event.get("description", "")
                    })
    
    # Second pass: detect conflicts in the venue usage
    for venue_key, dates in venue_usage.items():
        school_code, venue_name = venue_key.split(":")
        
        for date, events in dates.items():
            # Sort events by start time
            events.sort(key=lambda x: x["start_time"])
            
            # Check for same-day conflicts
            if len(events) > 1:
                # Check each pair of events
                for i in range(len(events)):
                    for j in range(i+1, len(events)):
                        event1 = events[i]
                        event2 = events[j]
                        
                        sport1 = event1["sport"]
                        sport2 = event2["sport"]
                        
                        # Same sport, different genders for tennis (soft conflict)
                        if (sport1 == "mtennis" and sport2 == "wtennis") or (sport1 == "wtennis" and sport2 == "mtennis"):
                            # This is a soft conflict - men's and women's tennis should preferably be on different days
                            conflicts.append({
                                "type": "soft_conflict",
                                "school": school_code,
                                "venue": venue_name,
                                "date": date,
                                "sport1": sport1,
                                "sport2": sport2,
                                "event1_time": f"{event1['start_time']}-{event1['end_time']}",
                                "event2_time": f"{event2['start_time']}-{event2['end_time']}",
                                "reason": "Men's and Women's Tennis preferably scheduled on different days",
                                "severity": "Medium",
                                "recommendation": "Consider scheduling tennis events on separate days if possible"
                            })
                        
                        # Check if event times overlap
                        elif event1["end_time"] > event2["start_time"]:
                            # Hard conflict - overlapping times
                            conflicts.append({
                                "type": "hard_conflict",
                                "school": school_code,
                                "venue": venue_name,
                                "date": date,
                                "sport1": sport1,
                                "sport2": sport2,
                                "event1_time": f"{event1['start_time']}-{event1['end_time']}",
                                "event2_time": f"{event2['start_time']}-{event2['end_time']}",
                                "reason": "Events have overlapping times",
                                "severity": "High",
                                "recommendation": "Reschedule one event to different day or time"
                            })
                        else:
                            # Check if there's enough transition time between events
                            start_time2 = datetime.datetime.strptime(event2["start_time"], "%H:%M")
                            end_time1 = datetime.datetime.strptime(event1["end_time"], "%H:%M")
                            
                            # Calculate hours between end of first event and start of second
                            hours_between = (start_time2 - end_time1).total_seconds() / 3600
                            
                            # Get required transition time
                            required_transition = get_transition_time(sport1, sport2, school_code, venue_name)
                            
                            if hours_between < required_transition:
                                # Hard conflict - insufficient transition time
                                conflicts.append({
                                    "type": "hard_conflict",
                                    "school": school_code,
                                    "venue": venue_name,
                                    "date": date,
                                    "sport1": sport1,
                                    "sport2": sport2,
                                    "event1_time": f"{event1['start_time']}-{event1['end_time']}",
                                    "event2_time": f"{event2['start_time']}-{event2['end_time']}",
                                    "reason": f"Insufficient transition time ({hours_between:.1f} hours, need {required_transition} hours)",
                                    "severity": "High",
                                    "recommendation": f"Reschedule to allow {required_transition} hours between events"
                                })
                            elif hours_between < required_transition + 1:
                                # Soft conflict - tight transition time
                                conflicts.append({
                                    "type": "soft_conflict",
                                    "school": school_code,
                                    "venue": venue_name,
                                    "date": date,
                                    "sport1": sport1,
                                    "sport2": sport2,
                                    "event1_time": f"{event1['start_time']}-{event1['end_time']}",
                                    "event2_time": f"{event2['start_time']}-{event2['end_time']}",
                                    "reason": f"Tight transition time ({hours_between:.1f} hours)",
                                    "severity": "Medium",
                                    "recommendation": f"Consider adding buffer time if possible"
                                })
                            
                            # Check for possible doubleheader opportunities (except for tennis)
                            if ((sport1 == "mbasketball" and sport2 == "wbasketball") or 
                                (sport1 == "wbasketball" and sport2 == "mbasketball")):
                                # Basketball doubleheader opportunity
                                conflicts.append({
                                    "type": "doubleheader_opportunity",
                                    "school": school_code,
                                    "venue": venue_name,
                                    "date": date,
                                    "sport1": sport1,
                                    "sport2": sport2,
                                    "event1_time": f"{event1['start_time']}-{event1['end_time']}",
                                    "event2_time": f"{event2['start_time']}-{event2['end_time']}",
                                    "reason": "Potential basketball doubleheader",
                                    "severity": "Opportunity",
                                    "recommendation": "Consider marketing as doubleheader event"
                                })
    
    return conflicts

def recommend_conflict_resolution(conflict: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate a resolution recommendation for a venue conflict
    
    Args:
        conflict: The conflict information
    
    Returns:
        Resolution recommendations
    """
    resolution = {
        "conflict_id": id(conflict),  # Generate a unique ID for the conflict
        "options": []
    }
    
    if conflict["type"] == "hard_conflict":
        # For hard conflicts, we need to provide concrete scheduling alternatives
        school = conflict["school"]
        venue = conflict["venue"]
        date = conflict["date"]
        sport1 = conflict["sport1"]
        sport2 = conflict["sport2"]
        
        # Special handling for tennis conflicts removed since it's now a soft constraint
        
        # Check for sport priorities at this venue
        venue_info = SHARED_VENUES.get(school, {}).get(venue, {})
        priority_order = venue_info.get("priority_order", [])
        
        # Determine which sport has higher priority
        sport1_priority = priority_order.index(sport1) if sport1 in priority_order else 999
        sport2_priority = priority_order.index(sport2) if sport2 in priority_order else 999
        
        if sport1_priority < sport2_priority:
            # Sport 1 has higher priority, recommend moving sport 2
            lower_priority_sport = sport2
            resolution["options"].append({
                "recommendation": f"Move {sport2} to a different date (higher priority given to {sport1})",
                "priority": 1,
                "rationale": f"{sport1} has higher venue priority at {venue}"
            })
        else:
            # Sport 2 has higher priority, recommend moving sport 1
            lower_priority_sport = sport1
            resolution["options"].append({
                "recommendation": f"Move {sport1} to a different date (higher priority given to {sport2})",
                "priority": 1,
                "rationale": f"{sport2} has higher venue priority at {venue}"
            })
        
        # Additional recommendations
        resolution["options"].append({
            "recommendation": f"Adjust start times to ensure adequate transition time",
            "priority": 2,
            "rationale": "May be feasible if transition time is the main issue"
        })
        
        resolution["options"].append({
            "recommendation": f"Check if alternate venue is available for {lower_priority_sport}",
            "priority": 3,
            "rationale": "Some schools have secondary facilities that could be used"
        })
    
    elif conflict["type"] == "soft_conflict":
        # For soft conflicts, provide more flexible recommendations
        sport1 = conflict["sport1"]
        sport2 = conflict["sport2"]
        
        # Special handling for tennis as a soft constraint
        if (sport1 == "mtennis" and sport2 == "wtennis") or (sport1 == "wtennis" and sport2 == "mtennis"):
            resolution["options"].append({
                "recommendation": "Schedule men's and women's tennis on separate days when possible",
                "priority": 1,
                "rationale": "Separate days are preferred but not mandatory for tennis events"
            })
            
            resolution["options"].append({
                "recommendation": "If same-day scheduling is necessary, ensure at least 3 hours between events",
                "priority": 2,
                "rationale": "Provides adequate transition time for court preparation and staff changes"
            })
            
            resolution["options"].append({
                "recommendation": "Consider men's matches in mornings and women's in afternoons if same-day scheduling is required",
                "priority": 3,
                "rationale": "Creates a natural flow for spectators and reduces operational complexity"
            })
        else:
            resolution["options"].append({
                "recommendation": f"Add more buffer time between {sport1} and {sport2} events",
                "priority": 1,
                "rationale": "Extra buffer provides flexibility for event overruns"
            })
            
            resolution["options"].append({
                "recommendation": "Schedule on separate days if the schedule allows",
                "priority": 2,
                "rationale": "Eliminates transition pressure and staffing concerns"
            })
    
    elif conflict["type"] == "doubleheader_opportunity":
        # For doubleheader opportunities, provide optimization suggestions
        sport1 = conflict["sport1"]
        sport2 = conflict["sport2"]
        
        # Only suggest doubleheaders for basketball and other applicable sports, never for tennis
        if ((sport1 == "mbasketball" and sport2 == "wbasketball") or 
            (sport1 == "wbasketball" and sport2 == "mbasketball")):
            resolution["options"].append({
                "recommendation": "Officially designate as Basketball Doubleheader with special marketing",
                "priority": 1,
                "rationale": "Increases attendance and creates better atmosphere for both teams"
            })
            
            resolution["options"].append({
                "recommendation": "Schedule women's game first (2PM), followed by men's game (6PM)",
                "priority": 2,
                "rationale": "Optimal timing for maximum attendance at both games"
            })
            
            resolution["options"].append({
                "recommendation": "Offer special ticket packages for attending both games",
                "priority": 3,
                "rationale": "Incentivizes fans to attend both games"
            })
    
    return resolution

def process_user_query(query: str) -> str:
    """
    Process a user query related to campus venue conflicts
    
    Args:
        query: Natural language query from user
    
    Returns:
        Response addressing the query
    """
    # Add school context
    school_context = get_school_context()
    
    # Parse the query to determine the type of request
    query_lower = query.lower()
    
    # Check for incorrect constraint classification mentions
    if "hard constraint" in query_lower and ("tennis" in query_lower or "men's and women's" in query_lower):
        response = "[⚠️ Scheduling Policy Correction]\n\n"
        response += "There appears to be a misunderstanding in your query.\n\n"
        response += "Men's and Women's Tennis scheduling is a SOFT CONSTRAINT, not a hard constraint.\n\n"
        response += "This means:\n"
        response += "- We prefer to schedule men's and women's tennis matches on different days when possible\n"
        response += "- Same-day scheduling is allowed if necessary to complete the schedule\n"
        response += "- The system will flag same-day tennis scheduling as soft conflicts that should be avoided when feasible\n\n"
        
        response += "Unlike hard constraints which cannot be violated, this soft constraint can be overridden if scheduling requirements demand it."
        
        return response
    
    # Check for tennis-specific queries
    if any(term in query_lower for term in ["tennis", "tennis doubleheader", "men's and women's tennis"]):
        response = "[Tennis Scheduling Policy]\n\n"
        response += "Men's and Women's Tennis scheduling follows these guidelines:\n\n"
        response += "⚠️ SOFT CONSTRAINT: Men's and Women's tennis events should preferably be scheduled on different days.\n\n"
        response += "While not strictly prohibited, same-day scheduling for men's and women's tennis is discouraged due to:\n"
        response += "- Potential for coaching staff overlap between men's and women's programs\n"
        response += "- Length and unpredictability of tennis matches\n"
        response += "- Court availability and maintenance considerations\n"
        response += "- Player recovery needs in tournament-style competition\n\n"
        
        response += "Recommended Tennis Scheduling Pattern:\n"
        response += "- When possible, schedule men's and women's matches on alternating days\n"
        response += "- If same-day scheduling is necessary, allow at least 3 hours between events\n"
        response += "- Consider scheduling men's matches in mornings and women's in afternoons when on same day\n\n"
        
        response += "This differs from basketball, where doubleheaders are actively encouraged to boost attendance."
        
        return response
    
    # Check for doubleheader-specific queries
    if any(term in query_lower for term in ["doubleheader", "double header", "same day games"]):
        response = "[Doubleheader Policies]\n\n"
        response += "The Big 12 Conference has specific policies regarding doubleheaders (same-day scheduling):\n\n"
        
        response += "✅ ENCOURAGED for Basketball:\n"
        response += "- Men's and women's basketball doubleheaders are encouraged when practical\n"
        response += "- Typical format: Women's game at 2PM followed by men's game at 6PM\n"
        response += "- Benefits include increased attendance and efficient venue usage\n\n"
        
        response += "✅ ALLOWED for most other sports:\n"
        response += "- Volleyball, gymnastics, wrestling can be scheduled as doubleheaders if transition times are respected\n"
        response += "- Olympic sports festivals (multiple events in one day) can be beneficial for attendance\n\n"
        
        response += "⚠️ DISCOURAGED but ALLOWED for Tennis:\n"
        response += "- Men's and women's tennis events should preferably be scheduled on different days\n"
        response += "- Same-day scheduling is acceptable when necessary to complete a viable schedule\n"
        response += "- When scheduled on same day, allow at least 3 hours between events\n\n"
        
        response += "When creating schedules, the system will flag tennis doubleheaders as soft conflicts that should be avoided when possible."
        
        return response
    
    # Check for venue information request
    if any(term in query_lower for term in ["venue info", "venue configuration", "venue setup", "venue layout"]):
        # Extract school if mentioned
        school_mentioned = None
        for school in BIG12_SCHOOLS:
            if school in query_lower:
                school_mentioned = school
                break
        
        if school_mentioned and school_mentioned in SHARED_VENUES:
            response = f"[Venue Information: {school_mentioned.title()}]\n\n"
            response += f"Here are the shared athletic venues at {school_mentioned.title()}:\n\n"
            
            for venue_name, venue_info in SHARED_VENUES[school_mentioned].items():
                response += f"📍 {venue_name}\n"
                response += f"   Sports: {', '.join(venue_info['sports'])}\n"
                response += f"   Priority Order: {', '.join(venue_info['priority_order'])}\n"
                response += f"   Transition Time: {venue_info['transition_time']} hours\n"
                response += f"   Notes: {venue_info['notes']}\n\n"
            
            return response
        
        else:
            # General venue information
            response = "[Shared Venue Information]\n\n"
            response += "The following Big 12 schools have complex shared venue arrangements:\n\n"
            
            for school in sorted(SHARED_VENUES.keys()):
                response += f"- {school.title()}: "
                venues = list(SHARED_VENUES[school].keys())
                response += f"{len(venues)} shared venues ({', '.join(venues)})\n"
            
            response += "\nFor details on a specific school's venues, please ask about that school specifically."
            return response
    
    # Check for conflict types explanation
    elif any(term in query_lower for term in ["conflict types", "conflict categories", "hard vs soft", "conflict definitions"]):
        response = "[Campus Conflict Types]\n\n"
        response += "When analyzing venue conflicts, I categorize them as follows:\n\n"
        
        for conflict_type, info in CONFLICT_TYPES.items():
            response += f"🔶 {conflict_type.replace('_', ' ').title()}\n"
            response += f"   Description: {info['description']}\n"
            response += f"   Examples: {', '.join(info['examples'])}\n"
            response += f"   Resolution Priority: {info['resolution_priority']}\n\n"
        
        response += "Special Policy: Men's and women's tennis events should preferably be scheduled on different days (soft constraint)."
        return response
    
    # Check for transition time information
    elif any(term in query_lower for term in ["transition time", "setup time", "changeover", "venue conversion"]):
        sport1 = None
        sport2 = None
        
        # Try to extract sports being asked about
        for sport in SCHEDULING_SPORTS:
            if sport in query_lower:
                if sport1 is None:
                    sport1 = sport
                else:
                    sport2 = sport
                    break
        
        if sport1 and sport2:
            # Specific transition time query
            transition_time = get_transition_time(sport1, sport2)
            
            response = f"[Venue Transition: {sport1} to {sport2}]\n\n"
            response += f"The recommended transition time from {sport1} to {sport2} is {transition_time} hours.\n\n"
            response += "This accounts for:\n"
            response += "- Physical reconfiguration of the venue\n"
            response += "- Equipment setup/teardown\n"
            response += "- Floor/surface changes\n"
            response += "- Staffing transitions\n"
            response += "- Basic cleaning and maintenance\n\n"
            
            if transition_time >= 3:
                response += "⚠️ This is considered a significant transition requiring careful scheduling."
            else:
                response += "This is a standard transition that should be accommodated in scheduling."
            
            # Add special note for tennis
            if (sport1 == "mtennis" and sport2 == "wtennis") or (sport1 == "wtennis" and sport2 == "mtennis"):
                response += "\n\n⚠️ NOTE: When possible, we prefer to schedule men's and women's tennis events on different days, but same-day scheduling is allowed if necessary."
            
            return response
        
        else:
            # General transition time information
            response = "[Venue Transition Times]\n\n"
            response += "Here are the standard transition times between different sports:\n\n"
            
            # Group transitions by time required
            transitions_by_time = {}
            for transition, time in VENUE_SETUP_TIMES.items():
                if transition == "default":
                    continue
                    
                if time not in transitions_by_time:
                    transitions_by_time[time] = []
                
                transitions_by_time[time].append(transition.replace("_to_", " → "))
            
            # Output grouped by time
            for time in sorted(transitions_by_time.keys()):
                response += f"⏱️ {time} Hour Transitions:\n"
                for transition in sorted(transitions_by_time[time]):
                    response += f"   - {transition.title()}\n"
                response += "\n"
            
            response += f"Default transition time for unlisted combinations: {VENUE_SETUP_TIMES['default']} hours\n\n"
            response += "Note: While we prefer scheduling men's and women's tennis on different days, same-day scheduling is allowed when necessary."
            return response
    
    # Default response with general capabilities
    response = "[Campus Conflicts Agent]\n\n"
    response += "I can help manage scheduling conflicts for shared athletic venues across the Big 12 Conference.\n\n"
    
    response += "I can assist with:\n"
    response += "1. Identifying potential scheduling conflicts at shared venues\n"
    response += "2. Categorizing conflicts as Hard (must resolve) or Soft (preferably avoid)\n"
    response += "3. Recommending schedule adjustments to resolve venue conflicts\n"
    response += "4. Providing venue-specific information for each school\n"
    response += "5. Explaining transition time requirements between different sports\n\n"
    
    response += "Key conflict areas I monitor:\n"
    response += "- Arena sharing between Basketball, Volleyball, Wrestling and Gymnastics\n"
    response += "- Tennis facility usage between Men's and Women's teams (preferably on different days)\n"
    response += "- Complex venue situations at ASU, ISU, and WVU\n"
    response += "- Transition time requirements between different sports\n"
    response += "- Doubleheader opportunities for applicable sports\n\n"
    
    response += f"{school_context}\n"
    response += "What specific venue conflict issue would you like me to help with?"
    
    return response

def main():
    parser = argparse.ArgumentParser(description='FlexTime Campus Conflicts Agent')
    parser.add_argument('-p', '--prompt', type=str, required=True, help='User prompt/query')
    parser.add_argument('--system-prompt', type=str, help='System prompt for the agent', default="")
    
    args = parser.parse_args()
    
    # Process the query
    response = process_user_query(args.prompt)
    
    # Print the response
    print(response)

if __name__ == "__main__":
    main() 