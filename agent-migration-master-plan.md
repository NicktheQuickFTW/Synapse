# XII-OS Agent Migration Master Plan

This document outlines the comprehensive plan to migrate all agent types in the XII-OS system to a unified, organized single-file agent architecture.

## Current Agent Landscape

The XII-OS system currently has agents in several locations with different architectures:

1. **FlexTime Module Agents**: Located in `/modules/flextime/agents`
2. **Source Agents**: Located in `/src/agents/`
3. **Single-File Agents**: Currently in `/single-file-agents/`

## Migration Goals

1. **Unified Architecture**: All agents will follow the single-file agent pattern
2. **Organized Structure**: Clear organizational structure for different agent types
3. **Consistent Interface**: Standard CLI and API interfaces
4. **Dependency Management**: Simplified dependency management with uv
5. **Testing & Documentation**: Comprehensive testing and documentation

## Unified Directory Structure

```
/XII-OS/single-file-agents/
├── core/                       # Base utility agents
│   ├── duckdb-agent.py
│   ├── polars-agent.py
│   ├── jq-agent.py
│   ├── bash-agent.py
│   ├── scraper-agent.py
│   └── codebase-agent.py
│
├── specialized/                # Domain-specific agents
│   ├── transfer-portal/          # Transfer portal specific agents
│   │   ├── transfer-portal-agent.py
│   │   ├── rivals-agent.py
│   │   ├── sports247-agent.py
│   │   ├── on3-agent.py
│   │   └── news-monitor-agent.py
│   │
│   ├── compass/                 # COMPASS module agents
│   │   └── compass-integration-agent.py
│   │
│   └── flextime/                # FlexTime module agents
│       ├── head-coach-agent.py
│       ├── historical-patterns-agent.py
│       ├── campus-conflicts-agent.py
│       └── system-prompts/      # System prompts for FlexTime agents
│           ├── flextime-prompt.md
│           ├── head-coach-prompt.md
│           └── ...
│
├── utils/                      # Shared utilities
│   ├── agent-utils.py           # General agent utilities
│   ├── base-scraper.py          # Base scraping functionality
│   ├── playwright-setup.py      # Browser automation utilities
│   └── model-converters.py      # Data model conversion utilities
│
└── orchestrators/              # Agent orchestrators
    ├── simple-orchestrator.py
    ├── fastapi-orchestrator.py
    ├── transfer-portal-orchestrator.py
    └── flextime-orchestrator.py
```

## Migration Process

The migration will be executed in phases, focusing on one agent type at a time:

### Phase 1: Setup & Utilities (Week 1)

1. **Create Directory Structure**
   - Set up the full directory hierarchy
   - Create placeholder README files

2. **Extract Common Utilities**
   - Create `agent-utils.py` with shared functionality
   - Create `playwright-setup.py` for browser automation
   - Create `model-converters.py` for data conversion

3. **Create Agent Template**
   - Develop a standard template for single-file agents
   - Include dependency management, CLI structure, and documentation

### Phase 2: Core Agents (Week 2)

1. **Migrate FlexTime Base Agents**
   - DuckDB, Polars, JQ, Bash, Scraper, Codebase agents
   - Ensure they incorporate the FlexTime system prompt

2. **Test Core Agent Functionality**
   - Verify correct operation
   - Test dependency management
   - Validate system prompt integration

### Phase 3: Transfer Portal Agents (Week 3)

1. **Migrate Base Transfer Portal Agent**
   - Convert to single-file agent pattern
   - Handle dependencies with uv

2. **Migrate News Monitor Agent**
   - Implement with self-contained functionality
   - Test data gathering and monitoring capabilities

3. **Migrate Source Agents**
   - Rivals, 247sports, on3 agents
   - Add standardized CLI interfaces

### Phase 4: FlexTime Specialized Agents (Week 4)

1. **Migrate Head Coach Agent**
   - Implement with FlexTime system prompt
   - Test agent coordination capabilities

2. **Migrate Other FlexTime Agents**
   - Historical patterns, campus conflicts agents
   - Ensure proper system prompt integration

3. **Create FlexTime Orchestrator**
   - Develop single-file orchestrator for FlexTime agents
   - Test inter-agent communication

### Phase 5: Orchestrators & Integration (Week 5)

1. **Migrate Transfer Portal Orchestrator**
   - Convert to single-file pattern
   - Update to use new agent paths

2. **Create Generic Orchestrator Utilities**
   - Process management
   - Agent communication
   - Error handling

3. **Integrate All Orchestrators**
   - Ensure all orchestrators can run in the new structure
   - Test cross-orchestrator communication

### Phase 6: Testing & Documentation (Week 6)

1. **Comprehensive Testing**
   - Unit tests for each agent
   - Integration tests for orchestrators
   - End-to-end workflow tests

2. **Documentation**
   - Update README files for each agent
   - Create examples directory
   - Document system prompts and configurations

3. **Validation**
   - Validate against success criteria
   - End-user testing

## Agent Template Structure

Each single-file agent will follow this structure:

```python
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
```

## Configuration Updates

### FlexTime Configuration Update

Update `modules/flextime/config/config.js` to point to the new agent locations:

```javascript
module.exports = {
  // ... other configuration
  
  // Agent configuration
  agents: {
    // Paths to agent directories
    singleFileAgentsPath: path.join(projectRoot, 'single-file-agents'),
    
    // DuckDB agent configuration
    duckdb: {
      scriptPath: 'core/duckdb-agent.py',
      flexTimeScriptPath: 'specialized/flextime/flextime-duckdb-agent.py',
      databasePath: path.join(projectRoot, 'xii-os.duckdb')
    },
    
    // ... other agents
    
    // COMPASS Integration agent configuration
    compassIntegration: {
      flexTimeScriptPath: 'specialized/flextime/compass-integration-agent.py'
    },
    
    // Head Coach agent configuration
    headCoach: {
      flexTimeScriptPath: 'specialized/flextime/head-coach-agent.py'
    }
  },
  
  // ... other configuration
};
```

### Transfer Portal Configuration Update

Update any configuration files that reference the old agent paths.

## Testing Strategy

Each migrated agent will undergo three levels of testing:

1. **Unit Testing**: Verifying the agent's internal functionality
2. **Integration Testing**: Testing interaction with other agents
3. **End-to-End Testing**: Validating complete workflows

Test scripts will be created for each agent and stored in a `tests` directory.

## Risk Management

### 1. Risk: Dependency Conflicts
- **Mitigation**: Use uv for dependency isolation
- **Contingency**: Maintain compatibility with system-wide packages

### 2. Risk: Performance Impact
- **Mitigation**: Benchmark agents before and after migration
- **Contingency**: Optimize critical paths if performance degrades

### 3. Risk: Integration Issues
- **Mitigation**: Create adapters for backward compatibility
- **Contingency**: Maintain dual-path support during transition

### 4. Risk: System Prompt Changes
- **Mitigation**: Store prompts in separate files for easier updates
- **Contingency**: Create version control for prompts

## Success Criteria

The migration will be considered successful when:

1. All agents have been migrated to the single-file agent structure
2. Each agent can run independently with the same functionality
3. All orchestrators can successfully coordinate their respective agents
4. Complete documentation is provided for each agent
5. All tests pass with 95% or higher coverage
6. Performance is maintained or improved

## Post-Migration Maintenance

After successful migration:

1. **Version Control**: Add semantic versioning to all agents
2. **Update Mechanism**: Create a script to update agents to newer versions
3. **Documentation**: Create comprehensive documentation for agent development
4. **Monitoring**: Add logging and performance monitoring to agents

## Implementation Timeline

| Week | Phase | Key Deliverables |
|------|-------|------------------|
| 1    | Setup & Utilities | Directory structure, utils, template |
| 2    | Core Agents | DuckDB, Polars, JQ, Bash, Scraper agents |
| 3    | Transfer Portal | Transfer portal, news monitor, source agents |
| 4    | FlexTime Agents | Head coach, specialized FlexTime agents |
| 5    | Orchestrators | All orchestrators, integration tests |
| 6    | Testing & Docs | Final tests, documentation, validation |

## Conclusion

This comprehensive migration plan will unify all XII-OS agents under a consistent, maintainable single-file agent architecture. The phased approach ensures minimal disruption while providing a clear path to a more organized and flexible agent ecosystem. 