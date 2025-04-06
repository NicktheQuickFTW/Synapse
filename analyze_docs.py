#!/usr/bin/env python
"""
Script to analyze crawled Pydantic AI documentation
"""

import os
import sys
import glob
import json
from collections import Counter
from pathlib import Path
from datetime import datetime

def get_all_docs():
    """Get all crawled documents."""
    base_dir = Path("pydantic_ai_docs")
    
    if not base_dir.exists():
        print("Error: pydantic_ai_docs directory not found")
        return []
    
    files = list(base_dir.glob("*.md"))
    
    if not files:
        print("No documentation files found")
        return []
    
    docs = []
    for filepath in files:
        with open(filepath, 'r', encoding='utf-8') as f:
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
        
        # Extract content
        doc_content = "\n".join(lines[content_start:])
        
        # Add to documents list
        docs.append({
            "filename": filepath.name,
            "title": metadata.get("title", "Untitled"),
            "url": metadata.get("url", ""),
            "crawled_at": metadata.get("crawled_at", ""),
            "content": doc_content
        })
    
    return docs

def analyze_docs(docs):
    """Analyze the crawled documentation."""
    if not docs:
        return
    
    # Basic statistics
    print(f"Total documents: {len(docs)}")
    
    # Calculate sizes
    total_size = sum(len(doc["content"]) for doc in docs)
    avg_size = total_size / len(docs) if docs else 0
    print(f"Total content size: {total_size} characters")
    print(f"Average document size: {avg_size:.2f} characters")
    
    # Find most common words
    word_counter = Counter()
    for doc in docs:
        # Simple word tokenization (could be improved)
        words = doc["content"].lower().split()
        # Remove punctuation
        words = [word.strip('.,()[]{}:;"\'') for word in words]
        # Remove empty strings
        words = [word for word in words if word]
        # Update counter
        word_counter.update(words)
    
    # Remove common stop words
    stop_words = {"the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "with", "by"}
    for word in stop_words:
        if word in word_counter:
            del word_counter[word]
    
    # Print most common words
    print("\nMost common words:")
    for word, count in word_counter.most_common(20):
        print(f"  {word}: {count}")
    
    # Find sections/topics
    topics = set()
    for doc in docs:
        # Look for section headers in markdown
        lines = doc["content"].split("\n")
        for line in lines:
            if line.startswith("## "):
                topic = line[3:].strip()
                topics.add(topic)
    
    print("\nCommon topics/sections:")
    for topic in sorted(topics)[:20]:  # Show at most 20 topics
        print(f"  - {topic}")
    
    # Generate summary report
    summary = {
        "total_docs": len(docs),
        "total_size": total_size,
        "avg_size": avg_size,
        "most_common_words": dict(word_counter.most_common(20)),
        "topics": list(sorted(topics)[:20]),
        "analyzed_at": datetime.now().isoformat()
    }
    
    # Save summary to file
    with open("docs_analysis_summary.json", "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    
    print("\nAnalysis summary saved to docs_analysis_summary.json")

def main():
    """Main function."""
    print("Analyzing Pydantic AI documentation...")
    docs = get_all_docs()
    if docs:
        analyze_docs(docs)
    else:
        print("No documents to analyze")

if __name__ == "__main__":
    main() 