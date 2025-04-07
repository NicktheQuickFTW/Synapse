#!/usr/bin/env python
"""
Simple test script for pydantic-ai
"""

from pydantic_ai import Agent

try:
    print("Initializing pydantic-ai Agent...")
    agent = Agent(
        'openai:gpt-4o',
        system_prompt='Be concise, reply with one sentence.'
    )
    
    print("Running agent...")
    result = agent.run_sync('Where does `hello world` come from?')
    
    print("Result:")
    print(result.data)

except Exception as e:
    print(f"Error occurred: {e}")
    import traceback
    traceback.print_exc() 