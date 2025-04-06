#!/usr/bin/env python3
"""
Venue Data Agent

This agent specializes in sourcing, validating, and maintaining venue data
for athletic facilities across all Big 12 schools.

Part of the XII-OS FlexTime module.
"""

import os
import sys
import json
import re
import argparse
import datetime
import requests
from bs4 import BeautifulSoup
import subprocess
from typing import Dict, List, Any, Optional, Union

# FlexTime configuration
FLEXTIME_VERSION = "1.0.0"
FLEXTIME_MODULE_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AGENTS_PATH = os.path.dirname(os.path.abspath(__file__))
SCHEDULING_DATA_PATH = "/Users/nickthequick/XII-OS/data/scheduling_data"
VENUE_DATA_PATH = "/Users/nickthequick/XII-OS/data/venue_data/big12_venues.json"
VENUE_SCHEMA_PATH = "/Users/nickthequick/XII-OS/data/venue_data/venue_schema.json"

# Big 12 Conference constants
BIG12_SCHOOLS = [
    "arizona", "arizona_state", "baylor", "byu", "cincinnati", 
    "colorado", "houston", "iowa_state", "kansas", "kansas_state", 
    "oklahoma_state", "tcu", "texas_tech", "ucf", "utah", "west_virginia"
]

SCHEDULING_SPORTS = [
    "mbasketball", "wbasketball", "football", "baseball", "softball", 
    "mtennis", "wtennis", "volleyball", "soccer", "wrestling", 
    "gymnastics", "lacrosse", "track", "swimming", "golf"
]

# School websites for venue data collection
SCHOOL_WEBSITES = {
    "arizona": "https://arizonawildcats.com/facilities/",
    "arizona_state": "https://thesundevils.com/sports/2018/6/5/facilities-sun-devil-facilities-html.aspx",
    "baylor": "https://baylorbears.com/facilities/",
    "byu": "https://byucougars.com/facilities/",
    "cincinnati": "https://gobearcats.com/facilities/",
    "colorado": "https://cubuffs.com/facilities/",
    "houston": "https://uhcougars.com/facilities/",
    "iowa_state": "https://cyclones.com/facilities/",
    "kansas": "https://kuathletics.com/facilities/",
    "kansas_state": "https://kstatesports.com/facilities/",
    "oklahoma_state": "https://okstate.com/facilities/",
    "tcu": "https://gofrogs.com/facilities/",
    "texas_tech": "https://texastech.com/facilities/",
    "ucf": "https://ucfknights.com/facilities/",
    "utah": "https://utahutes.com/facilities/",
    "west_virginia": "https://wvusports.com/facilities/"
}

def load_venue_data() -> Dict[str, Any]:
    """
    Load current venue data from the centralized JSON file
    
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

def load_venue_schema() -> Dict[str, Any]:
    """
    Load venue schema from the schema JSON file
    
    Returns:
        Dictionary containing the venue schema
    """
    try:
        if os.path.exists(VENUE_SCHEMA_PATH):
            with open(VENUE_SCHEMA_PATH, 'r') as f:
                schema_data = json.load(f)
            return schema_data
        else:
            print(f"Warning: Venue schema file not found at {VENUE_SCHEMA_PATH}", file=sys.stderr)
            return {}
    except Exception as e:
        print(f"Error loading venue schema: {str(e)}", file=sys.stderr)
        return {}

def save_venue_data(data: Dict[str, Any]) -> bool:
    """
    Save venue data to the centralized JSON file
    
    Args:
        data: Dictionary containing venue data
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(VENUE_DATA_PATH), exist_ok=True)
        
        # Save with pretty formatting
        with open(VENUE_DATA_PATH, 'w') as f:
            json.dump(data, f, indent=2)
        
        return True
    except Exception as e:
        print(f"Error saving venue data: {str(e)}", file=sys.stderr)
        return False

def validate_venue_data(data: Dict[str, Any], schema: Dict[str, Any]) -> List[str]:
    """
    Validate venue data against the venue schema
    
    Args:
        data: Dictionary containing venue data
        schema: Dictionary containing the venue schema
        
    Returns:
        List of validation errors, empty if valid
    """
    # This is a basic validation function
    # In a production environment, use a proper JSON Schema validator
    errors = []
    
    # Check for required top-level fields
    if "schools" not in data:
        errors.append("Missing required field: schools")
        return errors
    
    # Check school data
    for school_code, school_data in data["schools"].items():
        # Check for required school fields
        if "name" not in school_data:
            errors.append(f"School {school_code} missing required field: name")
        
        if "venues" not in school_data:
            errors.append(f"School {school_code} missing required field: venues")
            continue
        
        # Check venue data
        for i, venue in enumerate(school_data["venues"]):
            venue_id = venue.get("name", f"Venue #{i+1}")
            
            # Check for required venue fields
            for field in ["name", "sports", "priority_order", "location"]:
                if field not in venue:
                    errors.append(f"Venue {venue_id} in school {school_code} missing required field: {field}")
            
            # Check that sports are from the allowed list
            if "sports" in venue:
                for sport in venue["sports"]:
                    if sport not in SCHEDULING_SPORTS:
                        errors.append(f"Venue {venue_id} in school {school_code} has invalid sport: {sport}")
    
    return errors

def scrape_venue_data(school_code: str) -> Dict[str, Any]:
    """
    Scrape venue data from a school's website
    
    Args:
        school_code: Code for the school
        
    Returns:
        Dictionary containing scraped venue data
    """
    if school_code not in SCHOOL_WEBSITES:
        return {"error": f"No website configured for school: {school_code}"}
    
    venue_data = {"venues": []}
    
    try:
        # Request the facilities page
        url = SCHOOL_WEBSITES[school_code]
        response = requests.get(url, timeout=10)
        
        if response.status_code != 200:
            return {"error": f"Failed to access website for {school_code}: HTTP {response.status_code}"}
        
        # Parse the HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Look for venue elements - this is generic and would need customization per school
        venue_elements = soup.select('.facility-item, .venue-card, .facility-card, .venue-listing')
        
        for element in venue_elements:
            venue_name = element.select_one('.facility-name, .venue-name, h3, h4')
            venue_description = element.select_one('.facility-description, .venue-description, p')
            
            if venue_name:
                venue = {
                    "name": venue_name.text.strip(),
                    "description": venue_description.text.strip() if venue_description else "",
                    "source_url": url,
                    "scraped_at": datetime.datetime.now().isoformat(),
                    "needs_review": True
                }
                venue_data["venues"].append(venue)
        
        # If no venues found through standard selectors, try extracting from any text content
        if not venue_data["venues"]:
            venue_data["raw_content"] = soup.get_text()
            venue_data["needs_manual_processing"] = True
        
        return venue_data
    
    except Exception as e:
        return {"error": f"Error scraping venue data for {school_code}: {str(e)}"}

def merge_venue_data(existing_data: Dict[str, Any], new_data: Dict[str, Any], school_code: str) -> Dict[str, Any]:
    """
    Merge newly scraped venue data with existing data
    
    Args:
        existing_data: Existing venue data dictionary
        new_data: New venue data to merge
        school_code: Code for the school being updated
        
    Returns:
        Updated venue data dictionary
    """
    result = existing_data.copy()
    
    # Initialize school if it doesn't exist
    if school_code not in result["schools"]:
        result["schools"][school_code] = {
            "name": school_code.replace('_', ' ').title(),
            "venues": []
        }
    
    # Process venues
    if "venues" in new_data:
        # Create a map of existing venues by name
        existing_venues = {v["name"]: v for v in result["schools"][school_code]["venues"]}
        
        for new_venue in new_data["venues"]:
            if new_venue["name"] in existing_venues:
                # Update existing venue data
                existing_venue = existing_venues[new_venue["name"]]
                
                # Preserve certain fields
                preserved_fields = ["sports", "priority_order", "location", "capacity", "transition_times"]
                
                # Update with new data
                for key, value in new_venue.items():
                    if key not in preserved_fields or key not in existing_venue:
                        existing_venue[key] = value
                
                # Mark as updated
                existing_venue["last_updated"] = datetime.datetime.now().isoformat()
            else:
                # Add new venue
                new_venue["last_updated"] = datetime.datetime.now().isoformat()
                result["schools"][school_code]["venues"].append(new_venue)
    
    return result

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

def get_venue_status() -> Dict[str, Any]:
    """
    Get status of venue data for all schools
    
    Returns:
        Dictionary with venue data status
    """
    status = {
        "schools": {},
        "last_checked": datetime.datetime.now().isoformat(),
        "total_venues": 0,
        "schools_with_data": 0,
        "schools_missing_data": []
    }
    
    # Load current data
    venue_data = load_venue_data()
    
    for school_code in BIG12_SCHOOLS:
        if school_code in venue_data.get("schools", {}):
            school_data = venue_data["schools"][school_code]
            venues = school_data.get("venues", [])
            
            status["schools"][school_code] = {
                "name": school_data.get("name", school_code),
                "venue_count": len(venues),
                "venues": [v["name"] for v in venues],
                "shared_venues": [v["name"] for v in venues if len(v.get("sports", [])) > 1],
                "has_data": len(venues) > 0
            }
            
            status["total_venues"] += len(venues)
            if len(venues) > 0:
                status["schools_with_data"] += 1
        else:
            status["schools"][school_code] = {
                "name": school_code.replace('_', ' ').title(),
                "venue_count": 0,
                "venues": [],
                "shared_venues": [],
                "has_data": False
            }
            status["schools_missing_data"].append(school_code)
    
    return status

def parse_venue_info_from_text(text: str, school_code: str) -> List[Dict[str, Any]]:
    """
    Parse venue information from text using pattern matching
    
    Args:
        text: Text to parse
        school_code: Code for the school
        
    Returns:
        List of venue dictionaries
    """
    venues = []
    
    # Common patterns for venue information
    venue_patterns = [
        r'(?P<name>[A-Za-z\s\-\.&]+(?:Arena|Stadium|Field|Center|Complex|Court|Coliseum|Fieldhouse))',
        r'(?P<name>[A-Za-z\s\-\.&]+)\s+\(\s*capacity:?\s*(?P<capacity>[\d,]+)\s*\)',
        r'(?P<name>[A-Za-z\s\-\.&]+)\s+Home\s+of\s+(?P<sports>.+)'
    ]
    
    for pattern in venue_patterns:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            venue = {
                "name": match.group("name").strip(),
                "source": "text_extraction",
                "school_code": school_code,
                "needs_review": True
            }
            
            # Add capacity if found
            if 'capacity' in match.groupdict() and match.group("capacity"):
                try:
                    venue["capacity"] = int(match.group("capacity").replace(",", ""))
                except:
                    pass
            
            # Add sports if found
            if 'sports' in match.groupdict() and match.group("sports"):
                sports_text = match.group("sports")
                venue["extracted_sports"] = sports_text
            
            venues.append(venue)
    
    # Remove duplicates based on name
    unique_venues = []
    venue_names = set()
    
    for venue in venues:
        if venue["name"] not in venue_names:
            venue_names.add(venue["name"])
            unique_venues.append(venue)
    
    return unique_venues

def process_user_query(query: str) -> str:
    """
    Process a user query related to venue data
    
    Args:
        query: Natural language query from user
    
    Returns:
        Response addressing the query
    """
    # Add school context
    school_context = get_school_context()
    
    # Parse the query to determine the type of request
    query_lower = query.lower()
    
    # Check for venue status request
    if any(term in query_lower for term in ["status", "overview", "summary", "report"]):
        status = get_venue_status()
        
        response = "[Venue Data Status]\n\n"
        response += f"Total venues in database: {status['total_venues']}\n"
        response += f"Schools with venue data: {status['schools_with_data']} of {len(BIG12_SCHOOLS)}\n\n"
        
        if status['schools_missing_data']:
            response += "Schools missing venue data:\n"
            for school in status['schools_missing_data']:
                response += f"- {school.replace('_', ' ').title()}\n"
            response += "\n"
        
        response += "Schools with most venues:\n"
        # Sort schools by venue count
        sorted_schools = sorted(
            status['schools'].items(),
            key=lambda x: x[1]['venue_count'], 
            reverse=True
        )
        
        # Show top 5 schools
        for school_code, school_status in sorted_schools[:5]:
            response += f"- {school_status['name']}: {school_status['venue_count']} venues"
            if school_status['shared_venues']:
                response += f" ({len(school_status['shared_venues'])} shared)"
            response += "\n"
        
        return response
    
    # Check for school-specific venue information request
    school_mentioned = None
    for school in BIG12_SCHOOLS:
        school_name = school.replace('_', ' ')
        if school in query_lower or school_name in query_lower:
            school_mentioned = school
            break
    
    if school_mentioned:
        venue_data = load_venue_data()
        
        if "schools" in venue_data and school_mentioned in venue_data["schools"]:
            school_data = venue_data["schools"][school_mentioned]
            venues = school_data.get("venues", [])
            
            if venues:
                response = f"[Venue Data: {school_data.get('name', school_mentioned.title())}]\n\n"
                
                for venue in venues:
                    response += f"📍 {venue['name']}\n"
                    
                    if "sports" in venue:
                        response += f"   Sports: {', '.join(venue['sports'])}\n"
                    
                    if "capacity" in venue:
                        response += f"   Capacity: {venue['capacity']:,}\n"
                    
                    if "location" in venue and "address" in venue["location"]:
                        response += f"   Address: {venue['location']['address']}\n"
                    
                    if "shared" in venue and venue["shared"]:
                        response += f"   Shared Venue: Yes\n"
                        if "priority_order" in venue:
                            response += f"   Priority Order: {', '.join(venue['priority_order'])}\n"
                    
                    if "notes" in venue:
                        response += f"   Notes: {venue['notes']}\n"
                    
                    response += "\n"
                
                return response
            else:
                return f"No venue data found for {school_mentioned.replace('_', ' ').title()}."
        else:
            return f"No venue data found for {school_mentioned.replace('_', ' ').title()}."
    
    # Check for scrape request
    if any(term in query_lower for term in ["scrape", "collect", "gather", "source", "update"]):
        school_to_scrape = None
        
        # Check if a specific school is mentioned
        for school in BIG12_SCHOOLS:
            school_name = school.replace('_', ' ')
            if school in query_lower or school_name in query_lower:
                school_to_scrape = school
                break
        
        if school_to_scrape:
            response = f"[Venue Data Collection: {school_to_scrape.replace('_', ' ').title()}]\n\n"
            response += f"To collect venue data for {school_to_scrape.replace('_', ' ').title()}, I would need to:\n\n"
            response += f"1. Access the athletics website at {SCHOOL_WEBSITES.get(school_to_scrape, 'Unknown URL')}\n"
            response += "2. Extract venue information from the facilities pages\n"
            response += "3. Parse and validate the data against our venue schema\n"
            response += "4. Merge with existing venue data\n\n"
            
            response += "This operation would need to be performed in a live environment with web access.\n\n"
            
            response += "For the most accurate results, consider these approaches:\n"
            response += "- Use the school's athletics API if available\n"
            response += "- Contact the athletics department directly for official facility information\n"
            response += "- Verify scraped data against official publications\n"
            
            return response
        else:
            response = "[Venue Data Collection]\n\n"
            response += "To collect venue data for all Big 12 schools, I would:\n\n"
            
            response += "1. Access each school's athletics website\n"
            response += "2. Extract venue information from facilities pages\n"
            response += "3. Parse and validate the data against our venue schema\n"
            response += "4. Merge with existing venue data\n\n"
            
            response += "School websites that would be accessed:\n"
            for i, (school, url) in enumerate(sorted(SCHOOL_WEBSITES.items())):
                if i < 5:  # Show first 5 as examples
                    response += f"- {school.replace('_', ' ').title()}: {url}\n"
            response += "- ... and 11 more schools\n\n"
            
            response += "This operation would need to be performed in a live environment with web access."
            
            return response
    
    # Check for validation request
    if any(term in query_lower for term in ["validate", "check", "verify"]):
        venue_data = load_venue_data()
        venue_schema = load_venue_schema()
        
        validation_errors = validate_venue_data(venue_data, venue_schema)
        
        if validation_errors:
            response = "[Venue Data Validation: Failed]\n\n"
            response += f"Found {len(validation_errors)} validation errors:\n\n"
            
            for error in validation_errors[:10]:  # Show first 10 errors
                response += f"- {error}\n"
            
            if len(validation_errors) > 10:
                response += f"... and {len(validation_errors) - 10} more errors\n"
            
            return response
        else:
            response = "[Venue Data Validation: Passed]\n\n"
            response += "The venue data passed validation against the schema.\n\n"
            
            schools_count = len(venue_data.get("schools", {}))
            venues_count = sum(len(s.get("venues", [])) for s in venue_data.get("schools", {}).values())
            
            response += f"Statistics:\n"
            response += f"- Schools: {schools_count}\n"
            response += f"- Total venues: {venues_count}\n"
            
            return response
    
    # Default response with general capabilities
    response = "[Venue Data Agent]\n\n"
    response += "I can help source, validate, and maintain venue data for athletic facilities across the Big 12 Conference.\n\n"
    
    response += "I can assist with:\n"
    response += "1. Collecting venue data from school athletics websites\n"
    response += "2. Validating venue data against our schema\n"
    response += "3. Providing status reports on venue data completeness\n"
    response += "4. Answering questions about specific school venues\n"
    response += "5. Merging newly collected data with existing records\n\n"
    
    response += "What venue data task would you like help with?\n\n"
    response += "- Get a status report on our venue data\n"
    response += "- View venue information for a specific school\n"
    response += "- Collect new venue data from school websites\n"
    response += "- Validate the existing venue data against the schema\n"
    
    return response

def main():
    parser = argparse.ArgumentParser(description='FlexTime Venue Data Agent')
    parser.add_argument('-p', '--prompt', type=str, required=True, help='User prompt/query')
    parser.add_argument('--system-prompt', type=str, help='System prompt for the agent', default="")
    
    args = parser.parse_args()
    
    # Process the query
    response = process_user_query(args.prompt)
    
    # Print the response
    print(response)

if __name__ == "__main__":
    main() 