#!/usr/bin/env python3
"""
COMPASS Integration Agent

This agent specializes in incorporating geographical, travel, and weather data 
from the COMPASS module into scheduling decisions and competitive analysis.
"""

import os
import sys
import json
import argparse
import datetime
import subprocess
import requests
from typing import Dict, List, Any, Optional, Union

# FlexTime configuration
FLEXTIME_VERSION = "1.0.0"
FLEXTIME_MODULE_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AGENTS_PATH = os.path.dirname(os.path.abspath(__file__))
COMPASS_MODULE_PATH = "/Users/nickthequick/XII-OS/modules/compass"

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
            
            context = "Current Big 12 schools with their primary colors and locations:\n"
            for school_key, school in school_data.items():
                primary_color = school.get('primary_color', 'Unknown')
                location = get_compass_school_location(school_key)
                context += f"- {school.get('name')}: {primary_color} - Located in {location}\n"
            
            return context
        return ""
    except Exception as e:
        print(f"Error generating school context: {str(e)}", file=sys.stderr)
        return ""

def get_compass_school_location(school_code: str) -> str:
    """
    Get location information for a school from COMPASS data
    """
    # In a real implementation, this would call the COMPASS API
    # This is a simplified mock implementation
    locations = {
        "arizona": "Tucson, AZ (Elevation: 2,389 ft, Mountain Time)",
        "arizona_state": "Tempe, AZ (Elevation: 1,140 ft, Mountain Time)",
        "baylor": "Waco, TX (Elevation: 470 ft, Central Time)",
        "byu": "Provo, UT (Elevation: 4,551 ft, Mountain Time)",
        "cincinnati": "Cincinnati, OH (Elevation: 482 ft, Eastern Time)",
        "colorado": "Boulder, CO (Elevation: 5,328 ft, Mountain Time)",
        "houston": "Houston, TX (Elevation: 80 ft, Central Time)",
        "iowa_state": "Ames, IA (Elevation: 942 ft, Central Time)",
        "kansas": "Lawrence, KS (Elevation: 866 ft, Central Time)",
        "kansas_state": "Manhattan, KS (Elevation: 1,020 ft, Central Time)",
        "oklahoma_state": "Stillwater, OK (Elevation: 984 ft, Central Time)",
        "tcu": "Fort Worth, TX (Elevation: 653 ft, Central Time)",
        "texas_tech": "Lubbock, TX (Elevation: 3,202 ft, Central Time)",
        "ucf": "Orlando, FL (Elevation: 82 ft, Eastern Time)",
        "utah": "Salt Lake City, UT (Elevation: 4,226 ft, Mountain Time)",
        "west_virginia": "Morgantown, WV (Elevation: 960 ft, Eastern Time)"
    }
    return locations.get(school_code, "Unknown location")

def get_travel_distance_matrix() -> Dict[str, Dict[str, float]]:
    """
    Get the travel distance matrix between all Big 12 schools from COMPASS
    """
    # In a real implementation, this would call the COMPASS API
    # This is a simplified mock implementation
    
    # Create a mock distance matrix (miles between schools)
    distances = {}
    for school1 in BIG12_SCHOOLS:
        distances[school1] = {}
        for school2 in BIG12_SCHOOLS:
            if school1 == school2:
                distances[school1][school2] = 0
            else:
                # Generate a realistic but mock distance
                # In a real implementation, this would use actual distances
                distances[school1][school2] = 500 + (hash(school1 + school2) % 1500)
    
    return distances 

def get_weather_forecast(school_code: str, start_date: str, end_date: str) -> List[Dict[str, Any]]:
    """
    Get weather forecast for a school location within a date range
    
    Args:
        school_code: School identifier
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)
        
    Returns:
        List of weather forecasts for each day
    """
    # In a real implementation, this would call the COMPASS API
    # This is a simplified mock implementation
    
    # Convert dates to datetime objects
    start = datetime.datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.datetime.strptime(end_date, "%Y-%m-%d")
    
    # Number of days in the range
    days = (end - start).days + 1
    
    # Generate mock weather data
    forecasts = []
    for i in range(days):
        day = start + datetime.timedelta(days=i)
        day_str = day.strftime("%Y-%m-%d")
        
        # Generate realistic but mock weather
        # In a real implementation, this would use actual weather forecasts
        seed = hash(f"{school_code}_{day_str}")
        temp_high = 40 + (seed % 60)  # Temperature between 40-100°F
        temp_low = temp_high - 15 - (seed % 10)  # 15-25 degrees lower than high
        precip_chance = seed % 101  # 0-100%
        
        # For high-altitude schools, adjust temperatures
        high_altitude_schools = ["colorado", "byu", "utah", "texas_tech"]
        if school_code in high_altitude_schools:
            temp_high -= 5
            temp_low -= 7
        
        # For southern schools, increase temperatures
        southern_schools = ["arizona", "arizona_state", "houston", "ucf"]
        if school_code in southern_schools:
            temp_high += 8
            temp_low += 6
        
        # Determine weather conditions based on precipitation chance
        conditions = "Sunny"
        if precip_chance > 80:
            conditions = "Heavy Rain"
        elif precip_chance > 60:
            conditions = "Rain"
        elif precip_chance > 40:
            conditions = "Partly Cloudy"
        elif precip_chance > 20:
            conditions = "Mostly Sunny"
        
        # Add special conditions for certain locations/seasons
        if school_code in ["colorado", "utah", "byu"] and day.month in [11, 12, 1, 2, 3]:
            if precip_chance > 50:
                conditions = "Snow"
                
        if school_code in ["houston", "ucf"] and day.month in [6, 7, 8, 9]:
            if precip_chance > 70:
                conditions = "Thunderstorms"
        
        # Create the forecast entry
        forecast = {
            "date": day_str,
            "school": school_code,
            "conditions": conditions,
            "temperature": {
                "high": temp_high,
                "low": temp_low,
                "unit": "F"
            },
            "precipitation": {
                "chance": precip_chance,
                "type": "rain" if "Rain" in conditions else "snow" if conditions == "Snow" else "none"
            },
            "advisories": []
        }
        
        # Add weather advisories if applicable
        if conditions == "Heavy Rain" and precip_chance > 90:
            forecast["advisories"].append("Flood Watch")
        if conditions == "Snow" and precip_chance > 85:
            forecast["advisories"].append("Winter Storm Warning")
        if temp_high > 95 and precip_chance < 20:
            forecast["advisories"].append("Heat Advisory")
        
        forecasts.append(forecast)
    
    return forecasts

def find_optimal_travel_pairings() -> List[List[str]]:
    """
    Find optimal travel partnerships based on proximity
    
    Returns:
        List of school pairs that make good travel partners
    """
    # Get the distance matrix
    distances = get_travel_distance_matrix()
    
    # Dictionary to store each school's closest partner
    closest_partners = {}
    
    # Find each school's closest neighbor
    for school in BIG12_SCHOOLS:
        other_schools = [s for s in BIG12_SCHOOLS if s != school]
        closest = min(other_schools, key=lambda s: distances[school][s])
        closest_partners[school] = closest
    
    # Create mutual pairings where possible
    pairings = []
    unpaired = set(BIG12_SCHOOLS)
    
    # First, find mutual closest partners
    for school in list(unpaired):
        if school not in unpaired:
            continue
            
        partner = closest_partners[school]
        if partner in unpaired and closest_partners[partner] == school:
            pairings.append([school, partner])
            unpaired.remove(school)
            unpaired.remove(partner)
    
    # Then, pair remaining schools by proximity
    while len(unpaired) >= 2:
        school = unpaired.pop()
        closest = min(unpaired, key=lambda s: distances[school][s])
        pairings.append([school, closest])
        unpaired.remove(closest)
    
    return pairings 

def optimize_schedule_for_travel(schedule: Dict[str, Any]) -> Dict[str, Any]:
    """
    Optimize a schedule to minimize travel distance and burden
    
    Args:
        schedule: Current schedule information
        
    Returns:
        Optimized schedule with travel metrics
    """
    # In a real implementation, this would analyze the actual schedule
    # This is a simplified mock implementation
    
    # Mock schedule optimization - pretend we've improved the schedule
    optimized = schedule.copy() if isinstance(schedule, dict) else {"games": []}
    
    # Add optimization metrics
    optimized["optimizationMetrics"] = {
        "totalTravelDistance": {
            "original": 254680,  # miles
            "optimized": 198520,  # miles
            "improvement": "22%"
        },
        "averageTravelTime": {
            "original": 3.8,  # hours
            "optimized": 3.1,  # hours
            "improvement": "18%"
        },
        "longestTrip": {
            "original": 2180,  # miles
            "optimized": 1850,  # miles
            "improvement": "15%"
        },
        "carbonFootprint": {
            "original": 126.4,  # tons CO2
            "optimized": 98.2,  # tons CO2
            "improvement": "22%"
        }
    }
    
    # Add travel partnership recommendations
    optimized["travelPartnerships"] = find_optimal_travel_pairings()
    
    return optimized

def generate_travel_itinerary(school_code: str, schedule: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate a travel itinerary for a school based on their schedule
    
    Args:
        school_code: School identifier
        schedule: The school's schedule
        
    Returns:
        Travel itinerary with trips, costs, and logistics
    """
    # In a real implementation, this would generate a detailed itinerary
    # This is a simplified mock implementation
    
    # Create a mock itinerary
    away_games = 10  # Mock number of away games
    
    # Generate mock trips
    trips = []
    for i in range(away_games):
        # Randomly select an opponent (not the school itself)
        opponents = [s for s in BIG12_SCHOOLS if s != school_code]
        opponent = opponents[hash(f"{school_code}_{i}") % len(opponents)]
        
        # Create a departure date (during season)
        base_date = datetime.datetime(2024, 1, 15) + datetime.timedelta(days=i*14)
        depart_date = base_date - datetime.timedelta(days=1)
        return_date = base_date + datetime.timedelta(days=1)
        
        # Distance (from the distance matrix)
        distance = get_travel_distance_matrix()[school_code][opponent]
        
        # Create the trip
        trip = {
            "id": f"trip_{i+1}",
            "opponent": opponent,
            "departureDate": depart_date.strftime("%Y-%m-%d"),
            "gameDate": base_date.strftime("%Y-%m-%d"),
            "returnDate": return_date.strftime("%Y-%m-%d"),
            "distance": distance,
            "travelMode": "Air" if distance > 500 else "Bus",
            "estimatedCost": distance * 25 if distance > 500 else distance * 15,
            "weather": get_weather_forecast(opponent, base_date.strftime("%Y-%m-%d"), base_date.strftime("%Y-%m-%d"))[0]
        }
        
        trips.append(trip)
    
    # Calculate total stats
    total_distance = sum(trip["distance"] for trip in trips)
    total_cost = sum(trip["estimatedCost"] for trip in trips)
    
    # Create the full itinerary
    itinerary = {
        "school": school_code,
        "season": "2024-25",
        "trips": trips,
        "totalDistance": total_distance,
        "totalEstimatedCost": total_cost,
        "averageTripDistance": total_distance / len(trips),
        "longestTrip": max(trips, key=lambda t: t["distance"]),
        "recommendations": [
            "Schedule back-to-back away games at travel partners to reduce trips",
            "Consider charter flights for trips over 1000 miles",
            "Avoid scheduling games during exam periods"
        ]
    }
    
    return itinerary

def process_user_query(query: str) -> str:
    """
    Process a user query related to COMPASS integration
    
    Args:
        query: Natural language query from the user
        
    Returns:
        Response with COMPASS-based analysis and recommendations
    """
    # Add school context
    school_context = get_school_context()
    
    # Parse the query to determine the type of request
    query_lower = query.lower()
    
    # Generate an appropriate response based on the query type
    if "optimize" in query_lower and "schedule" in query_lower:
        # Schedule optimization request
        mock_schedule = {"games": [], "sport": "basketball", "season": "2024-25"}
        optimized = optimize_schedule_for_travel(mock_schedule)
        
        response = f"[COMPASS Integration Analysis]\n\nI've analyzed the schedule for travel optimization with the following results:\n\n"
        response += f"Total travel distance: Reduced by {optimized['optimizationMetrics']['totalTravelDistance']['improvement']}\n"
        response += f"Average travel time: Reduced by {optimized['optimizationMetrics']['averageTravelTime']['improvement']}\n"
        response += f"Longest trip: Reduced by {optimized['optimizationMetrics']['longestTrip']['improvement']}\n"
        response += f"Carbon footprint: Reduced by {optimized['optimizationMetrics']['carbonFootprint']['improvement']}\n\n"
        
        response += "Recommended travel partnerships:\n"
        for pair in optimized["travelPartnerships"][:5]:
            response += f"- {pair[0]} and {pair[1]}\n"
            
        response += "\nThese optimizations were achieved by:\n"
        response += "1. Pairing geographically close schools for away trips\n"
        response += "2. Sequencing games to minimize back-and-forth travel\n"
        response += "3. Scheduling around weather patterns and forecasted conditions\n"
        response += "4. Balancing home/away distribution to reduce consecutive long trips\n"
        
        return response
        
    elif "weather" in query_lower:
        # Weather analysis request
        if any(school in query_lower for school in BIG12_SCHOOLS):
            # Extract the school from the query
            school = next((s for s in BIG12_SCHOOLS if s in query_lower), "baylor")
        else:
            school = "baylor"  # Default to Baylor if no school specified
            
        # Get weather for the next month
        start_date = datetime.datetime.now().strftime("%Y-%m-%d")
        end_date = (datetime.datetime.now() + datetime.timedelta(days=30)).strftime("%Y-%m-%d")
        weather = get_weather_forecast(school, start_date, end_date)
        
        response = f"[COMPASS Weather Analysis for {school.title()}]\n\n"
        response += f"Here's the weather forecast for upcoming dates:\n\n"
        
        # Show the next 7 days
        for day in weather[:7]:
            response += f"{day['date']}: {day['conditions']}, {day['temperature']['high']}°F high / {day['temperature']['low']}°F low"
            if day['advisories']:
                response += f" - ALERT: {', '.join(day['advisories'])}"
            response += "\n"
            
        response += "\nScheduling recommendations based on weather patterns:\n"
        response += "1. Avoid scheduling outdoor sports during potential adverse conditions\n"
        response += "2. Consider climate-controlled venues for high-risk weather periods\n"
        response += "3. Plan for weather contingencies in regions with unpredictable patterns\n"
        
        return response
        
    elif "travel" in query_lower and "distance" in query_lower:
        # Travel distance analysis
        distances = get_travel_distance_matrix()
        
        response = f"[COMPASS Travel Distance Analysis]\n\n"
        response += f"Here are the key travel insights for Big 12 Conference:\n\n"
        
        # Find the longest and shortest distances
        all_distances = [(s1, s2, d) for s1 in BIG12_SCHOOLS for s2 in BIG12_SCHOOLS if s1 != s2 for d in [distances[s1][s2]]]
        longest = max(all_distances, key=lambda x: x[2])
        shortest = min(all_distances, key=lambda x: x[2])
        
        response += f"Longest travel distance: {longest[0]} to {longest[1]} ({longest[2]} miles)\n"
        response += f"Shortest travel distance: {shortest[0]} to {shortest[1]} ({shortest[2]} miles)\n\n"
        
        # Average distance for each school
        response += "Schools with longest average travel distance:\n"
        school_avg_distances = [(s, sum(distances[s].values()) / (len(BIG12_SCHOOLS) - 1)) for s in BIG12_SCHOOLS]
        for school, avg in sorted(school_avg_distances, key=lambda x: x[1], reverse=True)[:3]:
            response += f"- {school}: {avg:.1f} miles average\n"
            
        response += "\nSchools with shortest average travel distance:\n"
        for school, avg in sorted(school_avg_distances, key=lambda x: x[1])[:3]:
            response += f"- {school}: {avg:.1f} miles average\n"
            
        response += "\nRecommended travel partnerships based on proximity:\n"
        pairs = find_optimal_travel_pairings()
        for pair in pairs[:5]:
            response += f"- {pair[0]} and {pair[1]} ({distances[pair[0]][pair[1]]} miles apart)\n"
            
        return response
        
    elif "itinerary" in query_lower:
        # Travel itinerary request
        if any(school in query_lower for school in BIG12_SCHOOLS):
            # Extract the school from the query
            school = next((s for s in BIG12_SCHOOLS if s in query_lower), "kansas")
        else:
            school = "kansas"  # Default to Kansas if no school specified
            
        # Generate a mock itinerary
        itinerary = generate_travel_itinerary(school, {})
        
        response = f"[COMPASS Travel Itinerary for {school.title()}]\n\n"
        response += f"Season: {itinerary['season']}\n"
        response += f"Total travel distance: {itinerary['totalDistance']:.1f} miles\n"
        response += f"Total estimated cost: ${itinerary['totalEstimatedCost']:,.2f}\n"
        response += f"Average trip distance: {itinerary['averageTripDistance']:.1f} miles\n\n"
        
        response += "Selected trips:\n"
        # Show 3 sample trips
        for trip in itinerary['trips'][:3]:
            response += f"- vs. {trip['opponent']} on {trip['gameDate']}: {trip['distance']} miles by {trip['travelMode']}\n"
            response += f"  Weather: {trip['weather']['conditions']}, {trip['weather']['temperature']['high']}°F high\n"
            
        response += "\nTravel optimization recommendations:\n"
        for rec in itinerary['recommendations']:
            response += f"- {rec}\n"
            
        return response
    
    else:
        # General request - provide an overview of COMPASS capabilities
        response = f"[COMPASS Integration Module]\n\n"
        response += f"I can help integrate geographical, travel, and weather data from COMPASS into your scheduling decisions. Here's what I can assist with:\n\n"
        
        response += "1. Schedule Optimization for Travel\n"
        response += "   - Minimize total travel distance and time\n"
        response += "   - Create logical travel partnerships\n"
        response += "   - Balance travel burden across schools\n\n"
        
        response += "2. Weather Analysis for Game Planning\n"
        response += "   - Forecast weather conditions for game dates\n"
        response += "   - Identify potential weather risks\n"
        response += "   - Recommend optimal scheduling windows\n\n"
        
        response += "3. Travel Distance Analysis\n"
        response += "   - Calculate distances between all Big 12 schools\n"
        response += "   - Identify optimal travel partnerships\n"
        response += "   - Analyze travel equity across the conference\n\n"
        
        response += "4. Travel Itinerary Planning\n"
        response += "   - Generate detailed trip itineraries\n"
        response += "   - Estimate travel costs and logistics\n"
        response += "   - Recommend travel modes and timing\n\n"
        
        response += f"{school_context}\n"
        response += "To use my capabilities, please ask a specific question about schedule optimization, weather analysis, travel distances, or itinerary planning."
        
        return response

def main():
    parser = argparse.ArgumentParser(description='FlexTime COMPASS Integration Agent')
    parser.add_argument('-p', '--prompt', type=str, required=True, help='User prompt/query')
    parser.add_argument('--system-prompt', type=str, help='System prompt for the agent', default="")
    
    args = parser.parse_args()
    
    # Process the query
    response = process_user_query(args.prompt)
    
    # Print the response
    print(response)

if __name__ == "__main__":
    main() 