#!/usr/bin/env python
"""
Script to read and display crawled Pydantic AI documentation
"""

import os
import sys
import glob
from pathlib import Path

def list_crawled_files():
    """List all crawled documentation files."""
    base_dir = Path("pydantic_ai_docs")
    
    if not base_dir.exists():
        print("Error: pydantic_ai_docs directory not found")
        return
    
    files = list(base_dir.glob("*.md"))
    
    if not files:
        print("No documentation files found")
        return
    
    print(f"Found {len(files)} documentation files:")
    for i, filepath in enumerate(sorted(files)):
        with open(filepath, 'r', encoding='utf-8') as f:
            # Read the YAML-like metadata at the top
            lines = f.readlines()
            
            # Extract title
            title = "Untitled"
            for line in lines[:10]:  # Look in first 10 lines
                if line.startswith("title:"):
                    title = line.split("title:", 1)[1].strip()
                    break
        
        print(f"{i+1}. {filepath.name} - {title}")
    
    return files

def read_file(file_path):
    """Read and display a markdown file."""
    if not os.path.exists(file_path):
        print(f"Error: File {file_path} not found")
        return
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Parse metadata
    lines = content.split("\n")
    metadata = {}
    content_start = 0
    
    if lines[0] == "---":
        for i, line in enumerate(lines[1:], 1):
            if line == "---":
                content_start = i + 1
                break
            
            if ":" in line:
                key, value = line.split(":", 1)
                metadata[key.strip()] = value.strip()
    
    # Print metadata
    print("\n" + "="*50)
    print(f"Title: {metadata.get('title', 'Untitled')}")
    print(f"URL: {metadata.get('url', 'No URL')}")
    print(f"Crawled at: {metadata.get('crawled_at', 'Unknown')}")
    print("="*50 + "\n")
    
    # Print content
    print("\n".join(lines[content_start:]))

def main():
    """Main function."""
    files = list_crawled_files()
    
    if not files:
        return
    
    while True:
        try:
            choice = input("\nEnter file number to view (or 'q' to quit): ")
            
            if choice.lower() == 'q':
                break
            
            try:
                index = int(choice) - 1
                if 0 <= index < len(files):
                    read_file(files[index])
                else:
                    print(f"Invalid selection. Please enter a number between 1 and {len(files)}")
            except ValueError:
                print("Invalid input. Please enter a number or 'q'")
        
        except KeyboardInterrupt:
            break
    
    print("\nGoodbye!")

if __name__ == "__main__":
    main() 