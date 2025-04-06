# Universal Agent Migration Plan: Consolidating to Single-File Agents

This document outlines the comprehensive plan to migrate agents from any source directory (`src/agents`, `modules/flextime/agents`, etc.) to the new unified `single-file-agents` structure, ensuring a clean, organized approach while maintaining the single-file agent philosophy.

## Current Agent Landscape

The XII-OS system currently has agents in several locations with different architectures:

1. **FlexTime Module Agents**: Located in `/modules/flextime/agents`
2. **Source Agents**: Located in `/src/agents/`
3. **Existing Single-File Agents**: Some agents may already exist in `/single-file-agents/`

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

## Migration Strategy

The migration will follow these principles:
1. Create specialized agents in the appropriate directory based on their purpose
2. Convert shared code to importable utilities
3. Create stand-alone single-file versions of each agent
4. Update orchestrators to use the new agent structure

## Universal Migration Process

The migration will be executed in phases, focusing on utilities first and then migrating agents by type:

### Phase 1: Setup & Utilities (Week 1)

1. **Create Directory Structure**
   - Set up the full directory hierarchy (done with `setup-single-file-agents.sh`)
   - Create placeholder README files (done)

2. **Extract Common Utilities**
   - Create `agent-utils.py` with shared functionality (done)
   - Create `playwright-setup.py` for browser automation (done)
   - Create `model-converters.py` for data conversion

3. **Create Agent Template**
   - Develop a standard template for single-file agents (done)
   - Include dependency management, CLI structure, and documentation

### Phase 2: Core Agents (Week 2)

For agents that serve as base utilities (e.g., DuckDB, Polars, etc.):

1. **Identify Core Agents in All Source Directories**
   - Find core agent functionality in any source directory
   - Map each core agent to its new location in `/single-file-agents/core/`

2. **Migrate Core Agents**
   - Using the agent template, create a single-file version
   - Ensure proper dependency management with uv
   - Include appropriate system prompts

3. **Test Core Agent Functionality**
   - Verify correct operation
   - Test dependency management
   - Validate system prompt integration

### Phase 3: Transfer Portal Agents (Week 3)

For transfer portal specific agents from `src/agents`:

1. **Migrate Base Transfer Portal Agent**
   - Convert to single-file agent pattern using the template
   - Handle dependencies with uv
   - Place in `/single-file-agents/specialized/transfer-portal/`

2. **Migrate News Monitor Agent**
   - Implement with self-contained functionality
   - Test data gathering and monitoring capabilities
   - Place in `/single-file-agents/specialized/transfer-portal/`

3. **Migrate Source Agents**
   - Rivals, 247sports, on3 agents
   - Add standardized CLI interfaces
   - Place in `/single-file-agents/specialized/transfer-portal/`

### Phase 4: FlexTime Specialized Agents (Week 4)

For FlexTime specific agents from `modules/flextime/agents`:

1. **Migrate Head Coach Agent**
   - Implement with FlexTime system prompt
   - Test agent coordination capabilities
   - Place in `/single-file-agents/specialized/flextime/`

2. **Migrate Other FlexTime Agents**
   - Historical patterns, campus conflicts agents
   - Ensure proper system prompt integration
   - Place in `/single-file-agents/specialized/flextime/`

3. **Create FlexTime Orchestrator**
   - Develop single-file orchestrator for FlexTime agents
   - Test inter-agent communication
   - Place in `/single-file-agents/orchestrators/`

### Phase 5: Any Additional Specialized Agents (Week 5)

For any other specialized agents from any source directory:

1. **Categorize Agents by Purpose**
   - Determine the appropriate specialized subdirectory
   - Create new subdirectories as needed

2. **Migrate Each Agent**
   - Using the agent template, create a single-file version
   - Ensure proper dependency management with uv
   - Include appropriate system prompts

### Phase 6: Orchestrators & Integration (Week 5)

For all orchestrators that coordinate multiple agents:

1. **Migrate Orchestrators**
   - Convert to single-file pattern
   - Update to use new agent paths
   - Place in `/single-file-agents/orchestrators/`

2. **Create Generic Orchestrator Utilities**
   - Process management
   - Agent communication
   - Error handling

3. **Integrate All Orchestrators**
   - Ensure all orchestrators can run in the new structure
   - Test cross-orchestrator communication

### Phase 7: Testing & Documentation (Week 6)

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

## Agent Template

The universal template for all agents is:

```python
#!/usr/bin/env python3
"""
Agent Name: [AGENT_NAME]
Purpose: [BRIEF_DESCRIPTION]
Version: 1.0.0
Source: [ORIGINAL_SOURCE_DIRECTORY]

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

# Import local utilities if available, otherwise define inline
try:
    sys.path.append(os.path.join(os.path.dirname(__file__), "../../utils"))
    from agent_utils import load_system_prompt, format_output, save_output
    from playwright_setup import setup_browser  # If needed
except ImportError:
    # Define minimal versions of needed utilities
    def load_system_prompt(path):
        """Load system prompt from file"""
        try:
            with open(path, 'r') as f:
                return f.read()
        except:
            return None

# Constants
AGENT_NAME = "[AGENT_NAME]"
AGENT_VERSION = "1.0.0"

# System prompt can be embedded or loaded from file
SYSTEM_PROMPT_PATH = os.path.join(os.path.dirname(__file__), "../system-prompts/[PROMPT_FILE].md")
SYSTEM_PROMPT = """
[SYSTEM_PROMPT_TEXT]
"""
# Try to load from file first, fall back to embedded
if os.path.exists(SYSTEM_PROMPT_PATH):
    file_prompt = load_system_prompt(SYSTEM_PROMPT_PATH)
    if file_prompt:
        SYSTEM_PROMPT = file_prompt

def main():
    """Main function that handles argument parsing and execution"""
    parser = argparse.ArgumentParser(description=f'{AGENT_NAME} - {__doc__.split("Purpose:")[1].split("Version:")[0].strip()}')
    # Add common arguments
    parser.add_argument('-p', '--prompt', type=str, help='User input prompt')
    parser.add_argument('--system-prompt', type=str, help='Override default system prompt')
    parser.add_argument('--output', type=str, help='Output file path for results')
    # Add agent-specific arguments
    parser.add_argument('[ARG1]', type=str, help='[ARG1_DESCRIPTION]')
    parser.add_argument('[ARG2]', type=int, help='[ARG2_DESCRIPTION]')
    
    args = parser.parse_args()
    
    # Select system prompt (default or override)
    system_prompt = args.system_prompt if args.system_prompt else SYSTEM_PROMPT
    
    # Agent-specific logic goes here
    result = process_prompt(args.prompt, system_prompt)
    
    # Handle output
    if args.output:
        save_output(result, args.output)
    else:
        # Output result
        if isinstance(result, (dict, list)):
            print(json.dumps(result, indent=2))
        else:
            print(result)

def process_prompt(prompt: str, system_prompt: str) -> Any:
    """Process the user prompt with agent-specific logic"""
    # Implement agent-specific logic here
    return f"Agent response to: {prompt}"

if __name__ == "__main__":
    main()
```

## Migration Patterns by Agent Type

### 1. Base Abstract Classes

For base abstract classes (like `base_agent.py` in `src/agents`):
- Extract functionality into utility modules
- Place in `/single-file-agents/utils/`

### 2. Core Utility Agents

For core utility agents (DuckDB, Polars, JQ, etc.):
- Implement as standalone scripts
- Add dependency management
- Place in `/single-file-agents/core/`

### 3. Domain-Specific Agents

For specialized agents (transfer portal, FlexTime, etc.):
- Determine the appropriate domain (subdirectory under `specialized/`)
- Implement as standalone scripts
- Include domain-specific system prompts
- Place in `/single-file-agents/specialized/{domain}/`

### 4. Orchestrator Agents

For agents that coordinate other agents:
- Update to use the new agent paths
- Implement as standalone scripts
- Place in `/single-file-agents/orchestrators/`

## Configuration Updates

### Configuration File Updates

For any hardcoded paths in configuration files:

1. **FlexTime Configuration**:
   ```javascript
   // modules/flextime/config/config.js
   agents: {
     singleFileAgentsPath: path.join(projectRoot, 'single-file-agents'),
     duckdb: {
       scriptPath: 'core/duckdb-agent.py',
       // ...
     }
   }
   ```

2. **Transfer Portal Configuration**:
   Update any configuration files that reference the old agent paths.

3. **Other Configurations**:
   Any other configuration files that reference agent paths.

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

### 5. Risk: Path References
- **Mitigation**: Use relative imports and path discovery
- **Contingency**: Create compatibility layer for path resolution

## Success Criteria

The migration will be considered successful when:

1. All agents from all source directories have been migrated to the single-file agent structure
2. Each agent can run independently with the same functionality
3. All orchestrators can successfully coordinate their respective agents
4. Complete documentation is provided for each agent
5. All tests pass with 95% or higher coverage
6. Performance is maintained or improved

## Post-Migration Cleanup

After successful migration:

1. **Deprecate Original Agent Directories**
   - Add deprecation notices to original agent directories
   - Don't remove immediately to maintain backward compatibility

2. **Update All References**
   - Update all imports and references to use the new agent paths
   - Create compatibility layer if needed

3. **Version Control**
   - Add semantic versioning to all agents
   - Create an agent update mechanism

4. **Documentation Update**
   - Update all documentation to reference the new structure
   - Provide migration guide for custom agents

## Implementation Timeline

| Week | Phase | Key Deliverables |
|------|-------|------------------|
| 1    | Setup & Utilities | Directory structure, utils, template |
| 2    | Core Agents | Core utility agents from all sources |
| 3    | Transfer Portal | Transfer portal agents from src/agents |
| 4    | FlexTime Agents | FlexTime agents from modules/flextime |
| 5.1  | Additional Agents | Any other specialized agents |
| 5.2  | Orchestrators | All orchestrators and integration |
| 6    | Testing & Docs | Final tests, documentation, validation |

## Getting Started

To begin the migration, run the setup script:

```bash
chmod +x setup-single-file-agents.sh
./setup-single-file-agents.sh
```

This will create the necessary directory structure and utility files. Then follow the phase-by-phase migration process outlined above.

## Conclusion

This comprehensive migration plan will unify all XII-OS agents from any source directory under a consistent, maintainable single-file agent architecture. The phased approach ensures minimal disruption while providing a clear path to a more organized and flexible agent ecosystem. 