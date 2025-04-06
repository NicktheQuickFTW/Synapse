#!/usr/bin/env python3
"""
FlexTime Historical Scheduling Patterns Agent

This agent specializes in analyzing historical scheduling patterns and traditions
for each sport in the Big 12 Conference, ensuring these patterns are maintained
or explicitly approved for change by users.

Part of the XII-OS FlexTime module.
"""

import os
import sys
import json
import argparse
import datetime
import subprocess
import re
from typing import Dict, List, Any, Optional, Union

# FlexTime configuration
FLEXTIME_VERSION = "1.0.0"
FLEXTIME_MODULE_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AGENTS_PATH = os.path.dirname(os.path.abspath(__file__))
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

# Sport-specific scheduling data
SPORT_TRADITIONAL_PARAMETERS = {
    "football": {
        "rivalry_games": [
            {"teams": ["kansas", "kansas_state"], "name": "Sunflower Showdown", "traditional_date": "Late November"},
            {"teams": ["oklahoma_state", "texas_tech"], "name": "Thanksgiving Weekend Rivalry", "traditional_date": "Thanksgiving weekend"},
            {"teams": ["iowa_state", "kansas"], "name": "Farmageddon", "traditional_date": "Mid-October"},
            {"teams": ["baylor", "tcu"], "name": "Revivalry", "traditional_date": "Early November"},
            {"teams": ["utah", "byu"], "name": "Holy War", "traditional_date": "Mid-September"},
            {"teams": ["colorado", "utah"], "name": "Rumble in the Rockies", "traditional_date": "Late November"},
            {"teams": ["arizona", "arizona_state"], "name": "Territorial Cup", "traditional_date": "Late November"},
            {"teams": ["cincinnati", "west_virginia"], "name": "Eastern Division Rivalry", "traditional_date": "Mid-October"}
        ],
        "parameters": {
            "conference_games": 9,
            "non_conference_games": 3,
            "season_start": "Late August/Early September",
            "season_end": "Late November/Early December",
            "bye_weeks": 2,
            "max_consecutive_away": 2,
            "black_friday_games": ["iowa_state vs kansas_state", "utah vs colorado"],
            "thanksgiving_games": ["texas_tech vs oklahoma_state"]
        }
    },
    "mbasketball": {
        "rivalry_games": [
            {"teams": ["kansas", "kansas_state"], "name": "Sunflower Showdown", "traditional_date": "Mid-January and early February"},
            {"teams": ["baylor", "tcu"], "name": "Basketball Revivalry", "traditional_date": "January/February"},
            {"teams": ["west_virginia", "kansas"], "name": "Big Monday Matchup", "traditional_date": "Monday night in January"},
            {"teams": ["iowa_state", "kansas"], "name": "Hilton Magic vs Phog Allen", "traditional_date": "Late January"}
        ],
        "parameters": {
            "conference_games": 18,
            "home_away_balance": "9 home, 9 away",
            "travel_partners": [
                ["arizona", "arizona_state"],
                ["kansas", "kansas_state"],
                ["houston", "baylor"],
                ["cincinnati", "west_virginia"],
                ["iowa_state", "tcu"],
                ["byu", "utah"],
                ["texas_tech", "oklahoma_state"],
                ["colorado", "ucf"]
            ],
            "typical_game_days": ["Monday", "Tuesday", "Wednesday", "Saturday"],
            "back_to_back_away_limit": 2
        }
    },
    "wbasketball": {
        "rivalry_games": [
            {"teams": ["kansas", "kansas_state"], "name": "Sunflower Showdown", "traditional_date": "Mid-January and early February"},
            {"teams": ["baylor", "tcu"], "name": "Basketball Revivalry", "traditional_date": "January/February"},
            {"teams": ["iowa_state", "oklahoma_state"], "name": "Rivalry Series", "traditional_date": "Early February"}
        ],
        "parameters": {
            "conference_games": 18,
            "home_away_balance": "9 home, 9 away",
            "travel_partners": [
                ["arizona", "arizona_state"],
                ["kansas", "kansas_state"],
                ["houston", "baylor"],
                ["cincinnati", "west_virginia"],
                ["iowa_state", "tcu"],
                ["byu", "utah"],
                ["texas_tech", "oklahoma_state"],
                ["colorado", "ucf"]
            ],
            "typical_game_days": ["Wednesday", "Saturday", "Sunday"],
            "back_to_back_away_limit": 2
        }
    },
    "baseball": {
        "parameters": {
            "conference_series": 10,
            "series_structure": "3-game weekend series (Fri-Sat-Sun)",
            "mid_week_games": "Tuesday/Wednesday non-conference",
            "travel_restrictions": "No more than 2 consecutive away series",
            "weather_considerations": "Early season games in southern/western schools"
        }
    },
    "softball": {
        "parameters": {
            "conference_series": 8,
            "series_structure": "3-game weekend series (Fri-Sat-Sun)",
            "doubleheaders": "Common on Saturdays",
            "mid_week_games": "Wednesday non-conference",
            "travel_considerations": "Similar to baseball weather pattern"
        }
    },
    "volleyball": {
        "parameters": {
            "conference_matches": 16,
            "match_days": "Wednesday/Saturday or Thursday/Sunday pairs",
            "travel_partners": "Similar to basketball",
            "season_window": "August through November"
        }
    },
    "soccer": {
        "parameters": {
            "conference_matches": 10,
            "match_days": "Thursday/Sunday pairs",
            "season_window": "August through October",
            "championship_timing": "Early November"
        }
    }
}

# Traditional rivalry weekends that should be preserved
TRADITIONAL_RIVALRY_WEEKENDS = {
    "football": {
        "Thanksgiving Weekend": [
            ["kansas", "kansas_state"],
            ["oklahoma_state", "texas_tech"],
            ["west_virginia", "cincinnati"]
        ],
        "Late October": [
            ["baylor", "tcu"],
            ["iowa_state", "kansas"]
        ],
        "Season Finale": [
            ["colorado", "utah"],
            ["arizona", "arizona_state"]
        ]
    },
    "mbasketball": {
        "Rivalry Week (Late January)": [
            ["kansas", "kansas_state"],
            ["baylor", "tcu"],
            ["iowa_state", "oklahoma_state"]
        ],
        "Final Weekend": [
            ["colorado", "utah"],
            ["arizona", "arizona_state"]
        ]
    },
    "wbasketball": {
        "Rivalry Week (Late January)": [
            ["kansas", "kansas_state"],
            ["baylor", "tcu"],
            ["iowa_state", "oklahoma_state"]
        ],
        "Final Weekend": [
            ["colorado", "utah"],
            ["arizona", "arizona_state"]
        ]
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

def get_historical_schedules(sport: str, seasons: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Retrieve historical schedules for a given sport
    
    Args:
        sport: The sport to retrieve schedules for
        seasons: Optional list of specific seasons to retrieve
        
    Returns:
        Dictionary of historical schedule data
    """
    # In a real implementation, this would fetch actual historical data
    # This is a simplified mock implementation
    
    sport_path = os.path.join(SCHEDULING_DATA_PATH, sport)
    
    # Create mock historical data
    historical_data = {
        "sport": sport,
        "seasons": {},
        "recurring_patterns": [],
        "traditional_parameters": SPORT_TRADITIONAL_PARAMETERS.get(sport, {})
    }
    
    # Get seasons to include
    if not seasons:
        # Default to last 3 seasons
        current_year = datetime.datetime.now().year
        seasons = [f"{year-1}-{year}" for year in range(current_year-2, current_year+1)]
    
    # For each season, create mock data
    for season in seasons:
        historical_data["seasons"][season] = {
            "games": [],  # In a real implementation, this would contain actual games
            "patterns": []  # Patterns identified for this season
        }
    
    # Add sport-specific recurring patterns
    if sport == "football":
        historical_data["recurring_patterns"] = [
            "Rivalry games consistently scheduled in November",
            "Teams typically play no more than 2 consecutive away games",
            "Thursday/Friday night games limited to 1-2 per team per season",
            "Regular season ends with rivalry games",
            "Black Friday games are a consistent tradition",
            "Each team has at least 6 home games"
        ]
    elif sport == "basketball":
        historical_data["recurring_patterns"] = [
            "Teams play each conference opponent once at home and once away",
            "Travel partners used to reduce travel burden",
            "Big Monday games featuring top teams",
            "Saturday-Monday or Saturday-Tuesday sequences common",
            "Conference schedule balanced between first and second half",
            "Season typically opens with home games"
        ]
    elif sport in ["baseball", "softball"]:
        historical_data["recurring_patterns"] = [
            "Consistent 3-game weekend series format",
            "Early season games scheduled in southern locations due to weather",
            "Mid-week non-conference games between weekend series",
            "Doubleheaders typically scheduled on Saturdays",
            "Travel limited to maximum 2 consecutive away series"
        ]
    
    return historical_data

def identify_key_traditions(sport: str) -> List[Dict[str, Any]]:
    """
    Identify key scheduling traditions for a sport
    
    Args:
        sport: Sport to analyze
        
    Returns:
        List of key traditions
    """
    traditions = []
    
    # Add sport-specific traditions
    if sport == "football":
        traditions = [
            {
                "name": "Thanksgiving Weekend Rivalries",
                "description": "Traditional rivalry games scheduled on Thanksgiving weekend",
                "importance": "High",
                "teams_involved": [t for sublist in TRADITIONAL_RIVALRY_WEEKENDS["football"]["Thanksgiving Weekend"] for t in sublist],
                "historical_adherence": "Consistent since conference formation"
            },
            {
                "name": "Black Friday Games",
                "description": "Select games played on the Friday after Thanksgiving",
                "importance": "Medium",
                "teams_involved": ["iowa_state", "kansas_state", "utah", "colorado"],
                "historical_adherence": "Consistent in recent years"
            },
            {
                "name": "Season Finale Rivalries",
                "description": "Specific rivalry games scheduled as the final game of the regular season",
                "importance": "High",
                "teams_involved": [t for sublist in TRADITIONAL_RIVALRY_WEEKENDS["football"]["Season Finale"] for t in sublist],
                "historical_adherence": "Very consistent"
            },
            {
                "name": "Home/Away Balance",
                "description": "Teams alternate home/away for specific rivalry games each year",
                "importance": "Medium",
                "teams_involved": BIG12_SCHOOLS,
                "historical_adherence": "Consistently followed"
            }
        ]
    elif sport == "basketball":
        traditions = [
            {
                "name": "Travel Partners",
                "description": "Schools paired geographically to minimize travel",
                "importance": "High",
                "teams_involved": BIG12_SCHOOLS,
                "historical_adherence": "Consistent scheduling approach"
            },
            {
                "name": "Big Monday Appearances",
                "description": "Premium TV slot for marquee matchups",
                "importance": "Medium",
                "teams_involved": ["kansas", "west_virginia", "baylor", "iowa_state"],
                "historical_adherence": "Top teams consistently featured"
            },
            {
                "name": "Rivalry Week Matchups",
                "description": "Key rivalry games scheduled during designated rivalry week",
                "importance": "High",
                "teams_involved": [t for sublist in TRADITIONAL_RIVALRY_WEEKENDS["mbasketball"]["Rivalry Week (Late January)"] for t in sublist],
                "historical_adherence": "Consistently observed"
            }
        ]
    elif sport == "baseball" or sport == "softball":
        traditions = [
            {
                "name": "3-Game Weekend Series",
                "description": "Conference games played as 3-game weekend series",
                "importance": "High",
                "teams_involved": BIG12_SCHOOLS,
                "historical_adherence": "Standard format across seasons"
            },
            {
                "name": "Southern/Western Early Season",
                "description": "Early season games scheduled in warmer locations",
                "importance": "Medium",
                "teams_involved": ["arizona", "arizona_state", "houston", "ucf", "texas_tech", "baylor", "tcu"],
                "historical_adherence": "Weather-driven necessity"
            }
        ]
    
    return traditions

def analyze_sport_specific_patterns(sport: str) -> Dict[str, Any]:
    """
    Analyze sport-specific scheduling patterns
    
    Args:
        sport: Sport to analyze
        
    Returns:
        Dictionary with sport-specific scheduling parameters and patterns
    """
    # Get historical schedules
    historical_data = get_historical_schedules(sport)
    
    # Get traditions
    traditions = identify_key_traditions(sport)
    
    # Combine into analysis
    analysis = {
        "sport": sport,
        "historical_data": historical_data,
        "key_traditions": traditions,
        "recommendations": []
    }
    
    # Generate sport-specific recommendations
    if sport == "football":
        analysis["recommendations"] = [
            "Maintain Black Friday games for traditional matchups",
            "Preserve Thanksgiving weekend rivalry games",
            "Ensure season-ending rivalry games are maintained",
            "Balance home/away games to minimum of 6 home games per team",
            "Limit consecutive road games to maximum of 2",
            "Schedule at least one non-Saturday game for each team for TV purposes"
        ]
    elif sport == "basketball":
        analysis["recommendations"] = [
            "Maintain travel partner arrangements for road trips",
            "Schedule key rivalry games during traditional rivalry week",
            "Balance weekday/weekend games throughout season",
            "Feature top teams in Big Monday TV slots",
            "Ensure balanced first/second half conference schedules",
            "Avoid more than 2 consecutive road games"
        ]
    elif sport == "baseball" or sport == "softball":
        analysis["recommendations"] = [
            "Maintain 3-game weekend series format",
            "Schedule early season games in warmer locations",
            "Allow for weather makeups, especially in February/March",
            "Balance travel to avoid consecutive long road trips",
            "Schedule rivalry series at traditional times in the season"
        ]
    
    return analysis

def validate_schedule_against_traditions(sport: str, proposed_schedule: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate a proposed schedule against historical traditions
    
    Args:
        sport: Sport being scheduled
        proposed_schedule: Proposed schedule to validate
        
    Returns:
        Dictionary with validation results and recommendations
    """
    # In a real implementation, this would analyze the actual proposed schedule
    # This is a simplified mock implementation
    
    # Get the sport-specific patterns
    patterns = analyze_sport_specific_patterns(sport)
    
    # Create mock validation results
    validation = {
        "sport": sport,
        "is_valid": True,
        "adherence_score": 85,  # 0-100 score for tradition adherence
        "violations": [],
        "warnings": [],
        "recommendations": [],
        "user_approval_needed": []
    }
    
    # Add some mock violations for demonstration
    if sport == "football":
        validation["violations"] = [
            {
                "type": "Rivalry Weekend",
                "description": "Kansas vs Kansas State not scheduled on Thanksgiving weekend",
                "severity": "High",
                "recommendation": "Move game to traditional Thanksgiving weekend slot"
            }
        ]
        
        validation["warnings"] = [
            {
                "type": "Consecutive Away Games",
                "description": "Iowa State has 3 consecutive away games in October",
                "severity": "Medium",
                "recommendation": "Restructure to limit to 2 consecutive away games"
            },
            {
                "type": "Black Friday Game",
                "description": "Utah vs Colorado not scheduled on Black Friday",
                "severity": "Low", 
                "recommendation": "Consider moving to traditional Black Friday slot"
            }
        ]
        
        validation["user_approval_needed"] = [
            {
                "parameter": "Kansas vs Kansas State game date",
                "tradition": "Traditionally played Thanksgiving weekend",
                "proposed_change": "Scheduled for November 2nd",
                "impact": "Breaks long-standing rivalry tradition",
                "requires_approval": True
            },
            {
                "parameter": "Consecutive Away Games for Iowa State",
                "tradition": "Maximum 2 consecutive away games",
                "proposed_change": "3 consecutive away games in October",
                "impact": "Potentially unfair competitive disadvantage",
                "requires_approval": True
            }
        ]
    elif sport == "basketball":
        validation["warnings"] = [
            {
                "type": "Travel Partners",
                "description": "Arizona/Arizona State not scheduled as travel partners for visiting teams",
                "severity": "Medium",
                "recommendation": "Restructure to maintain traditional travel partner arrangement"
            }
        ]
        
        validation["user_approval_needed"] = [
            {
                "parameter": "Travel partner arrangement",
                "tradition": "Arizona and Arizona State visited on same road trip",
                "proposed_change": "Split into separate trips",
                "impact": "Increases travel burden for all teams",
                "requires_approval": True
            }
        ]
    
    # If there are violations, the schedule is not valid
    if validation["violations"]:
        validation["is_valid"] = False
        validation["adherence_score"] -= 15 * len(validation["violations"])
    
    # If there are warnings, reduce the adherence score
    if validation["warnings"]:
        validation["adherence_score"] -= 5 * len(validation["warnings"])
    
    # Ensure the score stays within 0-100
    validation["adherence_score"] = max(0, min(100, validation["adherence_score"]))
    
    return validation

def process_user_query(query: str) -> str:
    """
    Process a user query related to historical scheduling patterns
    
    Args:
        query: Natural language query from the user
        
    Returns:
        Response with historical pattern analysis
    """
    # Add school context
    school_context = get_school_context()
    
    # Parse the query to determine the type of request
    query_lower = query.lower()
    
    # First, try to identify which sport is being discussed
    sport_mentioned = None
    for sport in SCHEDULING_SPORTS:
        if sport in query_lower:
            sport_mentioned = sport
            break
    
    # If no sport is explicitly mentioned, try to infer from context
    if not sport_mentioned:
        if any(term in query_lower for term in ["quarterback", "touchdown", "field goal", "bowl"]):
            sport_mentioned = "football"
        elif any(term in query_lower for term in ["3-point", "dunk", "court", "march madness"]):
            sport_mentioned = "basketball"
        elif any(term in query_lower for term in ["pitcher", "homerun", "inning", "baseball"]):
            sport_mentioned = "baseball"
        elif any(term in query_lower for term in ["softball", "fastpitch"]):
            sport_mentioned = "softball"
        else:
            # Default to football if we can't determine
            sport_mentioned = "football"
    
    # Generate an appropriate response based on the query type
    if "analyze" in query_lower and "pattern" in query_lower:
        # Pattern analysis request
        analysis = analyze_sport_specific_patterns(sport_mentioned)
        
        response = f"[Historical Patterns Analysis: {sport_mentioned.title()}]\n\n"
        response += f"I've analyzed historical scheduling patterns for {sport_mentioned} in the Big 12 Conference:\n\n"
        
        response += "Key Scheduling Traditions:\n"
        for i, tradition in enumerate(analysis["key_traditions"], 1):
            response += f"{i}. {tradition['name']}: {tradition['description']}\n"
            response += f"   Importance: {tradition['importance']} | Historical adherence: {tradition['historical_adherence']}\n"
        
        response += "\nRecurring Patterns Identified:\n"
        for i, pattern in enumerate(analysis["historical_data"]["recurring_patterns"], 1):
            response += f"{i}. {pattern}\n"
        
        response += "\nScheduling Recommendations:\n"
        for i, recommendation in enumerate(analysis["recommendations"], 1):
            response += f"{i}. {recommendation}\n"
        
        response += "\nWould you like these historical patterns to be maintained in future schedules? Any specific traditions you'd like to modify?"
        
        return response
        
    elif "validate" in query_lower or "check" in query_lower:
        # Schedule validation request
        validation = validate_schedule_against_traditions(sport_mentioned, {})
        
        response = f"[Schedule Validation: {sport_mentioned.title()}]\n\n"
        if validation["is_valid"]:
            response += f"The proposed schedule has an adherence score of {validation['adherence_score']}/100 for historical patterns.\n\n"
        else:
            response += f"The proposed schedule has VIOLATIONS of historical patterns (adherence score: {validation['adherence_score']}/100).\n\n"
        
        if validation["violations"]:
            response += "Critical Violations:\n"
            for i, violation in enumerate(validation["violations"], 1):
                response += f"{i}. {violation['type']}: {violation['description']}\n"
                response += f"   Recommendation: {violation['recommendation']}\n"
        
        if validation["warnings"]:
            response += "\nWarnings:\n"
            for i, warning in enumerate(validation["warnings"], 1):
                response += f"{i}. {warning['type']}: {warning['description']}\n"
                response += f"   Recommendation: {warning['recommendation']}\n"
        
        if validation["user_approval_needed"]:
            response += "\nUser Approval Required for These Changes:\n"
            for i, approval in enumerate(validation["user_approval_needed"], 1):
                response += f"{i}. {approval['parameter']}\n"
                response += f"   Tradition: {approval['tradition']}\n"
                response += f"   Proposed Change: {approval['proposed_change']}\n"
                response += f"   Impact: {approval['impact']}\n"
                response += f"   Do you approve this deviation from historical patterns? (Yes/No)\n"
        
        return response
        
    elif "tradition" in query_lower or "rivalr" in query_lower:
        # Rivalry/tradition information request
        traditions = identify_key_traditions(sport_mentioned)
        
        response = f"[{sport_mentioned.title()} Traditions and Rivalries]\n\n"
        response += f"Here are the key scheduling traditions and rivalries for {sport_mentioned} in the Big 12:\n\n"
        
        for i, tradition in enumerate(traditions, 1):
            response += f"{i}. {tradition['name']}\n"
            response += f"   Description: {tradition['description']}\n"
            response += f"   Importance: {tradition['importance']}\n"
            response += f"   Teams Involved: {', '.join([team.title() for team in tradition['teams_involved']])}\n"
            response += f"   Historical Adherence: {tradition['historical_adherence']}\n\n"
        
        if sport_mentioned in TRADITIONAL_RIVALRY_WEEKENDS:
            response += "Traditional Rivalry Weekends:\n"
            for weekend, matchups in TRADITIONAL_RIVALRY_WEEKENDS[sport_mentioned].items():
                response += f"- {weekend}: "
                matchup_strs = []
                for matchup in matchups:
                    matchup_strs.append(f"{matchup[0].title()} vs {matchup[1].title()}")
                response += ", ".join(matchup_strs) + "\n"
        
        response += "\nWould you like to maintain these traditions in the upcoming schedule? Are there any specific traditions you'd like to modify?"
        
        return response
        
    elif "parameter" in query_lower or "constraint" in query_lower:
        # Sport parameters request
        parameters = SPORT_TRADITIONAL_PARAMETERS.get(sport_mentioned, {}).get("parameters", {})
        
        response = f"[Traditional Scheduling Parameters: {sport_mentioned.title()}]\n\n"
        response += f"Here are the historical scheduling parameters for {sport_mentioned} in the Big 12:\n\n"
        
        for param, value in parameters.items():
            if isinstance(value, list):
                response += f"- {param.replace('_', ' ').title()}: {', '.join(str(v) for v in value)}\n"
            else:
                response += f"- {param.replace('_', ' ').title()}: {value}\n"
        
        response += "\nWould you like to maintain these parameters in the upcoming schedule? Are there any specific parameters you'd like to modify?"
        
        return response
    
    else:
        # General request about historical patterns
        response = f"[Historical Scheduling Patterns: {sport_mentioned.title()}]\n\n"
        response += f"I can analyze historical scheduling patterns for {sport_mentioned} in the Big 12 Conference to ensure traditions are maintained.\n\n"
        
        response += "I can help with:\n"
        response += "1. Analyzing historical scheduling patterns and traditions\n"
        response += "2. Identifying key rivalry games and their traditional scheduling windows\n"
        response += "3. Validating proposed schedules against historical patterns\n"
        response += "4. Highlighting scheduling parameters that require user approval to change\n"
        response += "5. Providing recommendations based on historical precedent\n\n"
        
        response += f"For {sport_mentioned}, some key historical considerations include:\n"
        
        if sport_mentioned == "football":
            response += "- Traditional rivalry games (e.g., Sunflower Showdown, Revivalry)\n"
            response += "- Thanksgiving weekend matchups\n"
            response += "- Black Friday games\n"
            response += "- Season-ending rivalries\n"
            response += "- Home/away game balance\n"
        elif sport_mentioned == "basketball":
            response += "- Travel partner arrangements\n"
            response += "- Big Monday television appearances\n"
            response += "- Rivalry week matchups\n"
            response += "- Conference schedule balance\n"
        elif sport_mentioned == "baseball" or sport_mentioned == "softball":
            response += "- 3-game weekend series format\n"
            response += "- Weather considerations for early season\n"
            response += "- Travel partner arrangements\n"
            response += "- Doubleheader scheduling\n"
        
        response += f"\n{school_context}\n"
        response += "Would you like me to analyze specific historical patterns for this sport? Or validate a schedule against traditional parameters?"
        
        return response

def main():
    parser = argparse.ArgumentParser(description='FlexTime Historical Patterns Agent')
    parser.add_argument('-p', '--prompt', type=str, required=True, help='User prompt/query')
    parser.add_argument('--system-prompt', type=str, help='System prompt for the agent', default="")
    parser.add_argument('-s', '--sport', type=str, help='Sport to analyze', default="")
    
    args = parser.parse_args()
    
    # Process the query
    response = process_user_query(args.prompt)
    
    # Print the response
    print(response)

if __name__ == "__main__":
    main() 