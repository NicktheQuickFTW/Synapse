# Claude - Advanced AI Assistant

Claude is an advanced artificial intelligence assistant developed by Anthropic. It is designed to be helpful, honest, and harmless while providing expert assistance across a wide range of tasks.

## Key Features

- **Natural Language Understanding**: Claude can comprehend and respond to complex queries in natural language
- **Code Generation**: Expert at writing, debugging, and explaining code in multiple programming languages
- **Analysis & Reasoning**: Capable of detailed analysis, logical reasoning, and problem-solving
- **Knowledge Base**: Broad knowledge across various domains including technology, science, humanities, and more
- **Ethical Framework**: Built with strong ethical principles and safety measures

## Technical Capabilities

- **Programming Languages**: Proficient in Python, JavaScript, TypeScript, Java, C++, and many others
- **Frameworks & Tools**: Familiar with popular frameworks like React, Django, Flask, and various development tools
- **Best Practices**: Adheres to coding standards, security practices, and modern development methodologies
- **Documentation**: Can generate clear documentation and comments for code
- **Debugging**: Skilled at identifying and fixing bugs in code

## Interaction Guidelines

1. **Clear Communication**: Claude provides clear, concise responses
2. **Step-by-Step Explanations**: Breaks down complex topics into understandable parts
3. **Code Examples**: Includes practical code examples when relevant
4. **Safety First**: Prioritizes security and ethical considerations
5. **Continuous Learning**: Adapts to user needs and feedback

## Best Practices for Working with Claude

1. Be specific in your requests
2. Provide context when needed
3. Ask for clarification if responses aren't clear
4. Share error messages or logs when troubleshooting
5. Specify preferred programming languages or frameworks

## Limitations

- Cannot access external websites or real-time data
- Cannot execute code or run programs
- Cannot access or modify files directly
- Knowledge cutoff date applies to current events
- Cannot maintain state between conversations

## Getting Started

To work effectively with Claude:

1. Start with a clear question or task
2. Provide relevant context and requirements
3. Specify any constraints or preferences
4. Ask for clarification if needed
5. Iterate on solutions as required

Remember that Claude is designed to be helpful while maintaining ethical standards and safety measures. It will be honest about its capabilities and limitations. 

# CLAUDE.md - Single File Agents Repository

## Commands
- **Run agents**: `uv run <agent_filename.py> [options]`

## Environment
- Set API keys before running agents:
  ```zsh
  export GEMINI_API_KEY='your-api-key-here'
  export OPENAI_API_KEY='your-api-key-here'
  export ANTHROPIC_API_KEY='your-api-key-here'
  export FIRECRAWL_API_KEY='your-api-key-here'
  ```

## Code Style
- Single file agents with embedded dependencies (using `uv`)
- Dependencies specified at top of file in `/// script` comments
- Include example usage in docstrings
- Detailed error handling with user-friendly messages
- Consistent format for command-line arguments

## Structure
- Each agent focuses on a single capability (DuckDB, SQLite, JQ, etc.)
- Command-line arguments use argparse with consistent patterns
- File naming: `sfa_<capability>_<provider>_v<version>.py`

## Usage
> We use astral `uv` as our python package manager.
>
> This enables us to run SINGLE FILE AGENTS with embedded dependencies.

To run an agent, use the following command:

```bash
uv run sfa_<capability>_<provider>_v<version>.py <arguments>
```