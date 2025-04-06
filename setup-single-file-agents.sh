#!/bin/bash

# setup-single-file-agents.sh
# 
# This script implements Phase 1 of the agent migration plan:
# 1. Create the directory structure
# 2. Set up README files
# 3. Create the agent template

set -e  # Exit on error

echo "==== XII-OS Single-File Agents Setup ===="
echo "Setting up the new agent directory structure..."

# Create base directory if it doesn't exist
if [ ! -d "single-file-agents" ]; then
  mkdir single-file-agents
  echo "Created base single-file-agents directory"
else
  echo "Base single-file-agents directory already exists"
fi

# Create directory structure
mkdir -p single-file-agents/core
mkdir -p single-file-agents/specialized/transfer-portal
mkdir -p single-file-agents/specialized/compass
mkdir -p single-file-agents/specialized/flextime/system-prompts
mkdir -p single-file-agents/utils
mkdir -p single-file-agents/orchestrators
mkdir -p single-file-agents/tests

echo "Directory structure created successfully."

# Create README files
cat > single-file-agents/README.md << 'EOF'
# XII-OS Single-File Agents

This directory contains self-contained, single-file agents that power various aspects of the XII-OS system.

## Organization

- **core/**: Base/utility agents like DuckDB, Polars, JQ
- **specialized/**: Domain-specific agents for different modules
  - **transfer-portal/**: Transfer portal specific agents
  - **compass/**: COMPASS module agents
  - **flextime/**: FlexTime scheduling agents
    - **system-prompts/**: System prompts for FlexTime agents
- **utils/**: Shared utilities for agents
- **orchestrators/**: Agent coordination and management
- **tests/**: Test scripts for agents

## Usage

Most agents can be run directly with:

```bash
python3 core/duckdb-agent.py --help
```

Or made executable:

```bash
chmod +x core/duckdb-agent.py
./core/duckdb-agent.py --help
```

## Dependencies

Agents use the uv package manager to handle dependencies automatically. The first time an agent runs, it will install any required dependencies.

## Adding New Agents

To add a new agent, create a new Python file following the template pattern in the appropriate directory.
EOF

cat > single-file-agents/core/README.md << 'EOF'
# XII-OS Core Agents

This directory contains base utility agents that provide fundamental capabilities used across the XII-OS system.

## Available Agents

- **duckdb-agent.py**: Executes natural language queries against DuckDB databases
- **polars-agent.py**: Analyzes CSV data using the Polars DataFrame library
- **jq-agent.py**: Processes and transforms JSON data
- **bash-agent.py**: Executes shell commands and scripts
- **scraper-agent.py**: Scrapes and extracts data from web pages
- **codebase-agent.py**: Analyzes and interacts with codebases

## Usage

Each agent can be run directly as a Python script:

```bash
python3 duckdb-agent.py --help
```

Or made executable:

```bash
chmod +x duckdb-agent.py
./duckdb-agent.py --help
```
EOF

cat > single-file-agents/specialized/README.md << 'EOF'
# XII-OS Specialized Agents

This directory contains domain-specific agents for different modules within the XII-OS system.

## Subdirectories

- **transfer-portal/**: Agents for the transfer portal functionality
- **compass/**: Agents for geographical and travel data (COMPASS module)
- **flextime/**: Agents for the FlexTime scheduling system

Each subdirectory contains agents specific to that domain or module.
EOF

cat > single-file-agents/specialized/flextime/README.md << 'EOF'
# FlexTime Agents

This directory contains specialized agents for the FlexTime scheduling system. These agents are designed to optimize schedules for Big 12 athletic events.

## Available Agents

- **head-coach-agent.py**: Coordinates the specialized scheduling agents
- **historical-patterns-agent.py**: Analyzes historical scheduling patterns
- **campus-conflicts-agent.py**: Resolves scheduling conflicts on campuses

## System Prompts

The `system-prompts/` directory contains the system prompts that guide the behavior of the FlexTime agents. These prompts define the agent's purpose, capabilities, and execution processes.
EOF

cat > single-file-agents/utils/README.md << 'EOF'
# XII-OS Agent Utilities

This directory contains shared utility modules used by the single-file agents.

## Available Utilities

- **agent-utils.py**: General agent utilities and helper functions
- **base-scraper.py**: Base functionality for web scraping
- **playwright-setup.py**: Browser automation utilities for Playwright
- **model-converters.py**: Data model conversion utilities

## Usage

These utilities can be imported by the agents:

```python
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), "../../utils"))
from agent_utils import some_function
```
EOF

cat > single-file-agents/orchestrators/README.md << 'EOF'
# XII-OS Agent Orchestrators

This directory contains orchestrators that coordinate and manage the execution of multiple agents.

## Available Orchestrators

- **simple-orchestrator.py**: Basic agent coordinator
- **fastapi-orchestrator.py**: API-based agent coordinator with FastAPI
- **transfer-portal-orchestrator.py**: Orchestrator for transfer portal agents
- **flextime-orchestrator.py**: Orchestrator for FlexTime scheduling agents

## Usage

Orchestrators can be run directly:

```bash
python3 transfer-portal-orchestrator.py --start-api
```

Or made executable:

```bash
chmod +x transfer-portal-orchestrator.py
./transfer-portal-orchestrator.py --refresh-all
```
EOF

echo "README files created successfully."

# Create agent template
cat > single-file-agents/agent-template.py << 'EOF'
#!/usr/bin/env python3
"""
Agent Name: [AGENT_NAME]
Purpose: [BRIEF_DESCRIPTION]
Version: 1.0.0

Usage:
  python3 [FILENAME] --help
  python3 [FILENAME] [COMMAND_SPECIFIC_ARGS]

Requirements:
  - Python 3.8+
  - Install deps: uv pip install [DEPENDENCIES]
"""

import os
import sys
import argparse
import json
from typing import Dict, List, Optional, Union, Any

# Import dependencies with automatic installation
try:
    # List dependencies required
    import [DEPENDENCY1]
    import [DEPENDENCY2]
except ImportError:
    print("Installing dependencies...")
    os.system("uv pip install [DEPENDENCY1] [DEPENDENCY2]")
    import [DEPENDENCY1]
    import [DEPENDENCY2]

# Constants
AGENT_NAME = "[AGENT_NAME]"
AGENT_VERSION = "1.0.0"

# System prompt can be embedded or loaded from file
SYSTEM_PROMPT = """
[SYSTEM_PROMPT_TEXT]
"""

def main():
    """Main function that handles argument parsing and execution"""
    parser = argparse.ArgumentParser(description=f'{AGENT_NAME} - {__doc__.split("Purpose:")[1].split("Version:")[0].strip()}')
    # Add common arguments
    parser.add_argument('-p', '--prompt', type=str, help='User input prompt')
    parser.add_argument('--system-prompt', type=str, help='Override default system prompt')
    # Add agent-specific arguments
    parser.add_argument('[ARG1]', type=str, help='[ARG1_DESCRIPTION]')
    parser.add_argument('[ARG2]', type=int, help='[ARG2_DESCRIPTION]')
    
    args = parser.parse_args()
    
    # Select system prompt (default or override)
    system_prompt = args.system_prompt if args.system_prompt else SYSTEM_PROMPT
    
    # Agent-specific logic goes here
    result = process_prompt(args.prompt, system_prompt)
    
    # Output result
    print(result)

def process_prompt(prompt: str, system_prompt: str) -> str:
    """Process the user prompt with agent-specific logic"""
    # Implement agent-specific logic here
    return f"Agent response to: {prompt}"

if __name__ == "__main__":
    main()
EOF
chmod +x single-file-agents/agent-template.py

echo "Agent template created successfully."

# Create basic utility files
cat > single-file-agents/utils/agent-utils.py << 'EOF'
"""
Agent Utilities

Common utility functions for XII-OS single-file agents
"""

import os
import sys
import json
import subprocess
from typing import Dict, List, Any, Optional, Union

def load_system_prompt(prompt_path: str) -> str:
    """Load a system prompt from a file"""
    try:
        with open(prompt_path, 'r') as f:
            return f.read().strip()
    except Exception as e:
        print(f"Error loading system prompt from {prompt_path}: {str(e)}")
        return ""

def run_agent(agent_path: str, *args) -> Dict[str, Any]:
    """Run another agent and capture its output"""
    try:
        cmd = [sys.executable, agent_path] + list(args)
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            return {
                "success": False,
                "error": result.stderr.strip()
            }
        
        try:
            # Try to parse as JSON
            return {
                "success": True,
                "result": json.loads(result.stdout.strip())
            }
        except json.JSONDecodeError:
            # Return as text if not JSON
            return {
                "success": True,
                "result": result.stdout.strip()
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def format_output(data: Any, output_format: str = "json") -> str:
    """Format output data based on requested format"""
    if output_format == "json":
        return json.dumps(data, indent=2)
    elif output_format == "plain":
        if isinstance(data, (dict, list)):
            return json.dumps(data, indent=2)
        return str(data)
    else:
        return str(data)

def save_output(data: Any, output_file: str, output_format: str = "json") -> bool:
    """Save output data to a file"""
    try:
        formatted_data = format_output(data, output_format)
        with open(output_file, 'w') as f:
            f.write(formatted_data)
        return True
    except Exception as e:
        print(f"Error saving output to {output_file}: {str(e)}")
        return False
EOF

cat > single-file-agents/utils/playwright-setup.py << 'EOF'
"""
Playwright Setup Utilities

Common utilities for setting up Playwright browser automation in agents
"""

import os
import asyncio
from typing import Tuple, Dict, Any, Optional

async def setup_browser(headless: bool = True, user_agent: Optional[str] = None):
    """Set up browser and page with common configuration."""
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        print("Installing playwright...")
        os.system("uv pip install playwright")
        os.system("playwright install chromium")
        from playwright.async_api import async_playwright
    
    # Default configuration
    viewport_width = 1280
    viewport_height = 800
    default_user_agent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    browser_args = ['--disable-dev-shm-usage']
    
    # Start playwright and launch browser
    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(
        headless=headless,
        args=browser_args
    )
    
    # Create context with viewport and user agent
    context = await browser.new_context(
        viewport={'width': viewport_width, 'height': viewport_height},
        user_agent=user_agent or default_user_agent,
        ignore_https_errors=True
    )
    
    # Create new page
    page = await context.new_page()
    
    # Set default navigation timeout
    page.set_default_timeout(30000)
    
    return playwright, browser, context, page

async def take_screenshot(page, filename: str = "debug-screenshot.png"):
    """Take a screenshot of the current page"""
    try:
        await page.screenshot(path=filename)
        print(f"Screenshot saved to {filename}")
        return True
    except Exception as e:
        print(f"Error taking screenshot: {str(e)}")
        return False

async def cleanup_browser(playwright, browser):
    """Clean up browser resources"""
    try:
        await browser.close()
        await playwright.stop()
    except Exception as e:
        print(f"Error cleaning up browser: {str(e)}")
EOF

echo "Utility files created successfully."

# Copy the FlexTime system prompt
mkdir -p single-file-agents/specialized/flextime/system-prompts
cat > single-file-agents/specialized/flextime/system-prompts/flextime-prompt.md << 'EOF'
## SYSTEM PROMPT: FlexTime – Dynamic Scheduling Optimization for Big 12 Athletics

## Introduction

- **YOU ARE** FlexTime, the most advanced sports scheduling intelligence system ever developed.
- Your mission is to generate optimized, competition-ready schedules that **balance fairness, revenue, logistics, constraints, and strategic value** for the **Big 12 Conference and its 16 member institutions**.

(Context: "This system will redefine how athletic conferences approach scheduling — setting a new national standard.")

---

## System Purpose

**YOUR TASK IS** to serve as the **scheduling command center** for FlexTime, executing the full lifecycle of schedule generation:

1. **COLLECT** all sport-specific parameters, institutional constraints, and stakeholder priorities
2. **GENERATE** baseline schedules based on each sport's structural rules
3. **APPLY** all hard and soft constraints in correct hierarchy
4. **OPTIMIZE** schedules using multi-factor iteration loops
5. **ANALYZE** outcomes across metrics: competitive balance, travel efficiency, TV windows, and constraint satisfaction
6. **DELIVER** final schedules and rationale in structured formats

(Context: "FlexTime's output must be so advanced that it earns the trust of athletic directors, media partners, and selection committees.")

---

## Execution Process Logic

### ⚙️ Thought Process

- **THINK** step-by-step → from structure → to constraints → to optimization → to validation → to output
- **SUGGEST** best-practice frameworks based on sport type and input data
- **REFORMULATE** vague or incomplete requests → into structured subtasks with placeholders
- **SPLIT** execution into logical phases and subtasks for clarity, reuse, and transparency

---

## Phase-by-Phase Scheduling Workflow

### PHASE 1: Sport Configuration

- **IDENTIFY** target sport and season parameters → {sport_type}, {season_year}
- **IMPORT** participating teams, affiliate programs, and venue data
- **LOAD** conflict files and constraint CSVs (e.g., 2025-26 Women's Tennis, Soccer, etc.)
- **SET** hard vs. soft constraint priority stack

(Context: "Each sport and season has its own ecosystem of requirements—customization is critical.")

---

### PHASE 2: Base Schedule Construction

- **SELECT** appropriate schedule format:
    - Double round-robin (basketball)
    - Travel-pairing pod system (volleyball)
    - Tournament/prelims (track, swim)
    - Dual meets (wrestling, tennis)
- **GENERATE** baseline matchup matrix with home/away splits → respecting {H/A_balance}
- **ENSURE** scheduling framework fits the number of games and duration of the season

---

### PHASE 3: Constraint Processing

- **APPLY** constraints by importance:
    1. Religious/institutional (e.g., BYU no-Sunday)
    2. Academic calendars
    3. Venue conflicts
    4. Contractual obligations
    5. Broadcast requirements
    6. Travel fatigue limits
    7. Recovery windows
    8. Competitive equity preferences
- **FLAG** any unsolvable combinations → explain exactly where constraint failure occurs

---

### PHASE 4: Multi-Factor Optimization Loop

- **RUN** 1,000+ iterations using simulated annealing or Gurobi/OR-Tools logic
- **EVALUATE** each schedule version against weighted scoring criteria:
    - Travel distance
    - TV exposure windows
    - Strength of schedule equity
    - Constraint satisfaction score
- **ACCEPT** occasional suboptimal iterations → to escape local maxima
- **REDUCE** tolerance for compromise over time (annealing temperature decay logic)

---

### PHASE 5: Final Output Generation

- **DELIVER** complete season schedule: matchups, dates, times, venues
- **PRODUCE** analytics report:
    - Travel efficiency per team
    - Constraint satisfaction rate
    - SoS parity
    - Revenue-maximizing game slots
- **EXPORT** formats:
    - 📄 CSV/Excel
    - 📅 iCal/calendar
    - 🧠 API-ready JSON
    - 📊 Visual schedule maps (optional via DALL·E)

---

## Behavior Expectations

- **ASK** user to clarify inputs when vague → especially missing constraints or format specs
- **SUGGEST** multiple valid pathways when ambiguity exists
- **EXPLAIN** trade-offs and optimization priorities
- **ACCEPT** manual overrides
- **VISUALIZE** outputs or comparisons when possible
- **COMPARE** outputs to past versions or external benchmarks (e.g., SEC 2025 schedules)

---

## Advanced Capabilities

- 🔁 Real-time schedule updates (for mid-season or emergency shifts)
- 📊 NCAA selection modeling → analyze impact of schedule on NET, RPI, SoS
- 🧭 Travel clustering by geography and time zone
- 🧠 Machine learning-based rivalry placement & fairness scoring
- 💡 Constraint satisfaction simulation across thousands of schedule permutations

---

## Contextual Edge

(Context: "The mission is clear — deliver unmatched schedule quality and competitive advantage across the entire Big 12. FlexTime must elevate the conference beyond the SEC, Big Ten, and ACC, creating the gold standard for modern athletic scheduling.")

---

## IMPORTANT

- "Your strategic thinking powers the entire Big 12. You're not just a tool—you are the brain of the future of sports scheduling."
- "The world is watching. These schedules will shape championships, travel budgets, and television contracts. Deliver with intelligence and clarity."
- "This project will define my career and give our 16 teams the win they deserve. Let's make history."
EOF

cat > single-file-agents/specialized/flextime/system-prompts/head-coach-prompt.md << 'EOF'
## SYSTEM PROMPT: FlexTime Head Coach Agent

You are the Head Coach agent for FlexTime, the scheduling system of the Big 12 Conference.
    
As the Head Coach, your role is to coordinate and manage the specialized scheduling agents, optimize their use,
and provide high-level strategic guidance on scheduling matters. You're the supervisor who knows how to delegate
tasks to the right specialist agents and synthesize their outputs into coherent recommendations.

Your responsibilities include:
- Determining which specialized agent (DuckDB, Polars, JQ, Bash, Web Scraper) is best suited for a given task
- Decomposing complex scheduling problems into simpler sub-tasks
- Analyzing scheduling conflicts and suggesting resolution strategies
- Providing expert guidance on Big 12 Conference scheduling best practices
- Prioritizing scheduling tasks based on institutional needs and conference requirements
- Tracking progress of scheduling efforts across all sports and schools

School codes you should recognize: arizona, arizona_state, baylor, byu, cincinnati, colorado, houston, iowa_state, kansas, kansas_state, oklahoma_state, tcu, texas_tech, ucf, utah, west_virginia.

You have a comprehensive understanding of the scheduling constraints and requirements for all Big 12 sports:
- Basketball (men's and women's)
- Football
- Baseball
- Softball
- Tennis (men's and women's)
- Volleyball
- Soccer
- Wrestling
- Gymnastics
- Lacrosse

You understand key scheduling concepts like:
- Travel partnerships
- Home/away balance
- Conference vs. non-conference games
- Scheduling windows
- Campus conflicts
- TV scheduling requirements
- Academic calendars
- Rivalry games
- Tournament scheduling

When given a task, think systematically about how to approach it using the specialized agents at your disposal.
EOF

echo "==== Setup Complete ===="
echo ""
echo "Directory structure created at: $(pwd)/single-file-agents/"
echo "You can now start migrating agents according to the migration plan."
echo ""
echo "To create a new agent from the template:"
echo "  cp single-file-agents/agent-template.py single-file-agents/core/your-agent-name.py"
echo "  chmod +x single-file-agents/core/your-agent-name.py"
echo ""
echo "Next steps:"
echo "1. Create core agents (DuckDB, Polars, etc.)"
echo "2. Migrate FlexTime agents"
echo "3. Migrate Transfer Portal agents"
echo "4. Create orchestrators"
echo ""
echo "Happy coding!" 