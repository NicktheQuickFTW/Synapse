#!/usr/bin/env python3
"""
Head Coach Agent

This agent coordinates specialized agents to deliver the best scheduling
and analysis results for Big 12 sports.

Part of the XII-OS FlexTime module.
"""

import os
import sys
import json
import argparse
import subprocess
import re
from typing import Dict, List, Any, Tuple

# Define paths
FLEXTIME_VERSION = "1.0.0"
FLEXTIME_MODULE_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AGENTS_PATH = os.path.dirname(os.path.abspath(__file__))

# Define agent paths
AGENT_PATHS = {
    "duckdb": os.path.join(AGENTS_PATH, "duckdb_agent.py"),
    "polars": os.path.join(AGENTS_PATH, "polars_agent.py"),
    "jq": os.path.join(AGENTS_PATH, "jq_agent.py"),
    "bash": os.path.join(AGENTS_PATH, "bash_agent.py"),
    "scraper": os.path.join(AGENTS_PATH, "scraper_agent.py"),
    "codebase": os.path.join(AGENTS_PATH, "codebase_agent.py"),
    "compassIntegration": os.path.join(AGENTS_PATH, "compass_integration_agent.py"),
    "historicalPatterns": os.path.join(AGENTS_PATH, "historical_patterns_agent.py"),
    "campusConflicts": os.path.join(AGENTS_PATH, "campus_conflicts_agent.py"),
    "venueData": os.path.join(AGENTS_PATH, "venue_data_agent.py"),
    "game_manager": os.path.join(AGENTS_PATH, "game_manager_agent.py")
}

# Register agents with their capabilities
AGENT_REGISTRY = {
    "historical_patterns": {
        "description": "Analyzes historical scheduling patterns for each sport, identifies traditional parameters, and maintains important scheduling traditions.",
        "best_for": ["historical data analysis", "tradition maintenance", "rivalry scheduling", "pattern identification"],
        "keywords": ["history", "tradition", "pattern", "historical", "rivalry", "past", "previous", "season", "precedent"]
    },
    "campus_conflicts": {
        "description": "Identifies and resolves scheduling conflicts for shared athletic facilities across multiple sports, focusing on venue sharing challenges.",
        "best_for": ["venue conflict detection", "facility scheduling optimization", "doubleheader coordination"],
        "keywords": ["venue", "conflict", "facility", "arena", "stadium", "shared", "doubleheader", "overlap"]
    },
    "compass_integration": {
        "description": "Incorporates geographical, travel, and weather data into scheduling decisions and competitive analysis.",
        "best_for": ["travel optimization", "weather forecasting", "geographic analysis", "travel logistics"],
        "keywords": ["travel", "distance", "geography", "weather", "location", "miles", "trip", "journey", "climate"]
    },
    "venue_data": {
        "description": "Gathers, maintains, and provides data about athletic venues across the Big 12 conference.",
        "best_for": ["venue information retrieval", "facility data management", "venue specification lookup"],
        "keywords": ["venue", "facility", "capacity", "specs", "dimensions", "surface", "location", "address"]
    },
    "game_manager": {
        "description": "Oversees game operations, venue management, weather analysis, venue availability, and venue conflicts.",
        "best_for": ["game operations planning", "weather risk assessment", "venue availability checking", "operational coordination"],
        "keywords": ["operations", "logistics", "game day", "staffing", "setup", "weather", "availability", "personnel"]
    }
}

def load_agent_registry() -> Dict[str, Any]:
    """
    Load the registry of available agents with their descriptions and capabilities.
    This helps in matching tasks to the most appropriate agent.
    """
    return {
        "duckdb": {
            "description": "SQL analysis agent for querying structured scheduling data",
            "best_for": ["data analysis", "querying databases", "schedule analysis", "statistical reporting"]
        },
        "polars": {
            "description": "Data frame processing agent for CSV and tabular data",
            "best_for": ["CSV processing", "data transformation", "schedule optimization", "game data analysis"]
        },
        "jq": {
            "description": "JSON processing agent for working with structured data files",
            "best_for": ["JSON transformation", "config file editing", "data extraction", "schema validation"]
        },
        "bash": {
            "description": "Shell command agent for file system operations and utilities",
            "best_for": ["file manipulation", "system integration", "automation", "data movement"]
        },
        "scraper": {
            "description": "Web scraping agent for collecting online scheduling data",
            "best_for": ["gathering external data", "competitor analysis", "news monitoring", "web research"]
        },
        "codebase": {
            "description": "Code search agent for finding and understanding implementation details",
            "best_for": ["code search", "understanding implementation", "finding examples", "documentation lookup"]
        },
        "compassIntegration": {
            "description": "Geography and travel specialist for optimizing schedules across Big 12 territory",
            "best_for": ["travel optimization", "geographic analysis", "weather forecasting", "distance calculations"]
        },
        "historicalPatterns": {
            "description": "Historical scheduling pattern specialist for maintaining traditions",
            "best_for": ["tradition analysis", "rivalry scheduling", "pattern recognition", "historical validation"]
        },
        "campusConflicts": {
            "description": "Campus venue conflict specialist for shared facility scheduling",
            "best_for": ["venue conflict detection", "facility scheduling", "transition time management", "arena sharing"]
        },
        "venueData": {
            "description": "Venue data specialist for sourcing and maintaining facility information",
            "best_for": ["venue data collection", "facility information", "venue validation", "capacity tracking"]
        },
        "game_manager": {
            "description": "Oversees game operations, venue management, weather analysis, venue availability, and venue conflicts.",
            "best_for": ["game operations planning", "weather risk assessment", "venue availability checking", "operational coordination"],
            "keywords": ["operations", "logistics", "game day", "staffing", "setup", "weather", "availability", "personnel"]
        }
    }

def analyze_task(task: str) -> Dict[str, float]:
    """
    Analyze a task to determine which agent is best suited to handle it
    
    Args:
        task: The task description
        
    Returns:
        Dictionary mapping agent names to confidence scores (0-1)
    """
    task_lower = task.lower()
    confidence_scores = {}
    
    # Analyze for historical patterns agent
    if any(keyword in task_lower for keyword in AGENT_REGISTRY["historical_patterns"]["keywords"]):
        confidence_scores["historical_patterns"] = 0.8
    else:
        confidence_scores["historical_patterns"] = 0.1
    
    # Analyze for campus conflicts agent
    venue_keywords = AGENT_REGISTRY["campus_conflicts"]["keywords"]
    if any(keyword in task_lower for keyword in venue_keywords):
        confidence_scores["campus_conflicts"] = 0.8
        
        # Check for specific schools with known venue sharing challenges
        if any(school in task_lower for school in ["arizona_state", "asu", "iowa_state", "isu", "west_virginia", "wvu"]):
            confidence_scores["campus_conflicts"] = 0.9
    else:
        confidence_scores["campus_conflicts"] = 0.1
    
    # Analyze for COMPASS integration agent
    compass_keywords = AGENT_REGISTRY["compass_integration"]["keywords"]
    if any(keyword in task_lower for keyword in compass_keywords):
        confidence_scores["compass_integration"] = 0.8
    else:
        confidence_scores["compass_integration"] = 0.1
    
    # Analyze for venue data agent
    venue_data_keywords = AGENT_REGISTRY["venue_data"]["keywords"]
    if any(keyword in task_lower for keyword in venue_data_keywords):
        confidence_scores["venue_data"] = 0.8
        
        # Higher confidence for specific venue data requests
        if "capacity" in task_lower or "dimensions" in task_lower or "surface" in task_lower:
            confidence_scores["venue_data"] = 0.9
    else:
        confidence_scores["venue_data"] = 0.1
        
    # Analyze for game manager agent
    game_manager_keywords = AGENT_REGISTRY["game_manager"]["keywords"]
    if any(keyword in task_lower for keyword in game_manager_keywords):
        confidence_scores["game_manager"] = 0.8
        
        # Higher confidence for specific operations and weather requests
        if "operations" in task_lower or "game day" in task_lower or "weather" in task_lower:
            confidence_scores["game_manager"] = 0.9
    else:
        confidence_scores["game_manager"] = 0.1
    
    return confidence_scores

def get_best_agent(task: str) -> str:
    """
    Get the name of the best agent for a task
    
    Args:
        task: The task description
        
    Returns:
        Name of the best agent
    """
    confidence_scores = analyze_task(task)
    return max(confidence_scores.items(), key=lambda x: x[1])[0]

def decompose_task(task: str) -> List[Dict[str, Any]]:
    """
    Decompose a complex scheduling task into subtasks for specialized agents
    
    Args:
        task: The complex task description
        
    Returns:
        List of subtasks with assigned agents
    """
    subtasks = []
    task_lower = task.lower()
    
    # Check for historical pattern analysis needs
    if any(keyword in task_lower for keyword in ["history", "tradition", "pattern", "rivalry"]):
        subtasks.append({
            "description": "Analyze historical scheduling patterns and traditions",
            "agent": "historical_patterns",
            "priority": 1,
            "input": f"Analyze patterns for scheduling related to: {task}"
        })
    
    # Check for venue conflict needs
    if any(keyword in task_lower for keyword in ["venue", "conflict", "facility", "arena", "stadium", "shared"]):
        subtasks.append({
            "description": "Identify and resolve potential venue conflicts",
            "agent": "campus_conflicts",
            "priority": 2,
            "input": f"Identify venue sharing conflicts for: {task}"
        })
        
        # Add specific venue conflict checks for problematic schools
        if any(school in task_lower for school in ["arizona_state", "asu", "iowa_state", "isu", "west_virginia", "wvu"]):
            subtasks.append({
                "description": f"Special venue conflict analysis for shared facilities",
                "agent": "campus_conflicts",
                "priority": 1,  # Higher priority for these schools
                "input": f"Check for venue conflicts at shared facilities for: {task}"
            })
    
    # Check for geographical/travel optimization needs
    if any(keyword in task_lower for keyword in ["travel", "distance", "geography", "weather"]):
        subtasks.append({
            "description": "Optimize for travel and geographical considerations",
            "agent": "compass_integration",
            "priority": 3,
            "input": f"Optimize travel and geography for: {task}"
        })
    
    # Check for venue data needs
    if any(keyword in task_lower for keyword in ["venue", "facility", "capacity", "specs"]):
        subtasks.append({
            "description": "Retrieve venue specifications and data",
            "agent": "venue_data",
            "priority": 2,
            "input": f"Get venue data relevant to: {task}"
        })
        
    # Check for game operations needs
    if any(keyword in task_lower for keyword in ["operations", "logistics", "game day", "staffing", "setup", "weather"]):
        subtasks.append({
            "description": "Plan game operations and logistics",
            "agent": "game_manager",
            "priority": 2,
            "input": f"Create operations plan for: {task}"
        })
        
        # Add specific weather analysis for outdoor sports
        if any(sport in task_lower for sport in ["football", "baseball", "softball", "soccer", "track"]):
            subtasks.append({
                "description": "Analyze weather risks and create contingency plans",
                "agent": "game_manager",
                "priority": 3,
                "input": f"Assess weather risks for: {task}"
            })
    
    # If no specific needs identified, add a general analysis task
    if not subtasks:
        subtasks.append({
            "description": "General scheduling analysis",
            "agent": "historical_patterns",  # Default to historical patterns
            "priority": 1,
            "input": task
        })
    
    # Sort subtasks by priority (lower number = higher priority)
    subtasks.sort(key=lambda x: x["priority"])
    
    return subtasks

def execute_agent(agent_name: str, task: str, system_prompt: str = "") -> str:
    """
    Execute a specialized agent with a task
    
    Args:
        agent_name: Name of the agent to execute
        task: Task description for the agent
        system_prompt: Optional system prompt to provide context
        
    Returns:
        Agent's response
    """
    agent_path = AGENT_PATHS.get(agent_name)
    if not agent_path or not os.path.exists(agent_path):
        return f"Error: Agent '{agent_name}' not found or not available."
    
    try:
        # Run the appropriate agent with the task
        cmd = [
            "python", agent_path,
            "--prompt", task
        ]
        
        if system_prompt:
            cmd.extend(["--system-prompt", system_prompt])
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=True
        )
        
        return result.stdout
    
    except subprocess.CalledProcessError as e:
        return f"Error executing agent: {str(e)}\n{e.stderr}"
    
    except Exception as e:
        return f"Unexpected error: {str(e)}"

def process_query(query: str, system_prompt: str = "") -> str:
    """
    Process a user query by either selecting the best agent or decomposing into subtasks
    
    Args:
        query: User's natural language query
        system_prompt: Optional system prompt to provide context
        
    Returns:
        Response from agent(s)
    """
    # Determine if this is a simple or complex task
    complexity_indicators = [
        "and then", "followed by", "multiple", "complex", "comprehensive", 
        "complete", "end-to-end", "analyze and create", "optimize and generate"
    ]
    
    is_complex = any(indicator in query.lower() for indicator in complexity_indicators)
    
    # For complex tasks, decompose and execute sequentially
    if is_complex:
        subtasks = decompose_task(query)
        
        # Sort subtasks by priority
        subtasks.sort(key=lambda x: x["priority"])
        
        # Execute each subtask and collect results
        results = []
        for i, subtask in enumerate(subtasks, 1):
            agent_name = subtask["agent"]
            task_desc = subtask["description"]
            
            # Add context from previous subtasks if available
            context = system_prompt
            if results:
                context += "\n\nPrevious steps results:\n" + "\n".join(results)
            
            # Execute the agent
            step_result = execute_agent(agent_name, task_desc, context)
            
            # Add to results
            results.append(f"Step {i} ({agent_name}): {step_result}")
        
        # Combine results into a coherent response
        final_response = "I've broken down your request into specialized steps:\n\n"
        final_response += "\n\n".join(results)
        
        return final_response
    
    else:
        # For simple tasks, select the best agent
        best_agent = get_best_agent(query)
        
        # Execute the agent
        return execute_agent(best_agent, query, system_prompt)

def main():
    parser = argparse.ArgumentParser(description='FlexTime Head Coach Agent')
    parser.add_argument('-p', '--prompt', type=str, required=True, help='User prompt/query')
    parser.add_argument('--system-prompt', type=str, help='System prompt for the agent', default="")
    
    args = parser.parse_args()
    
    # Process the query
    response = process_query(args.prompt, args.system_prompt)
    
    # Print the response
    print(response)

if __name__ == "__main__":
    main() 