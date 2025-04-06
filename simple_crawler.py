#!/usr/bin/env python
"""
Simple script to crawl Pydantic AI docs using requests and BeautifulSoup
"""

import os
import sys
import time
import json
import requests
from datetime import datetime
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Constants
BASE_URL = "https://docs.pydantic-ai.com"
OUTPUT_DIR = "pydantic_ai_docs"
MAX_PAGES = 100  # Limit to prevent excessive crawling

def ensure_output_dir():
    """Create output directory if it doesn't exist."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Output directory: {OUTPUT_DIR}")

def get_soup(url):
    """Get BeautifulSoup object from URL."""
    try:
        print(f"Fetching: {url}")
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        return BeautifulSoup(response.text, 'html.parser')
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def get_docs_links(soup):
    """Extract documentation links from the page."""
    links = []
    if not soup:
        return links
    
    # Find all links
    for a_tag in soup.find_all('a', href=True):
        href = a_tag['href']
        
        # Normalize URL
        if href.startswith('/'):
            full_url = urljoin(BASE_URL, href)
        elif href.startswith('http'):
            full_url = href
        else:
            continue
        
        # Only include links to the docs
        if full_url.startswith(BASE_URL) and "/docs/" in full_url:
            if full_url not in links:
                links.append(full_url)
    
    return links

def extract_content(soup, url):
    """Extract content from the page."""
    if not soup:
        return None
    
    # Try to find the main content area (adjust selectors based on the site structure)
    content_selectors = [
        "main",
        "article",
        ".docs-content",
        ".markdown-body",
        "#main-content"
    ]
    
    content_element = None
    for selector in content_selectors:
        content_element = soup.select_one(selector)
        if content_element:
            break
    
    # If no specific content area found, use the body
    if not content_element:
        content_element = soup.body
    
    # Extract title
    title_element = soup.find('title')
    title = title_element.text if title_element else "Untitled"
    
    # Remove "| Pydantic AI" from title if present
    title = title.replace(" | Pydantic AI", "").strip()
    
    # Extract content
    if content_element:
        # Convert to markdown-like format
        content = content_element.get_text("\n", strip=True)
        return {
            "url": url,
            "title": title,
            "content": content,
            "crawled_at": datetime.now().isoformat()
        }
    
    return None

def save_page(data, url):
    """Save page content to file."""
    if not data:
        return
    
    # Create filename from URL
    parsed_url = urlparse(url)
    path_parts = parsed_url.path.strip('/').split('/')
    
    if len(path_parts) > 0:
        filename = '_'.join(path_parts) + '.md'
    else:
        filename = "index.md"
    
    filepath = os.path.join(OUTPUT_DIR, filename)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        # Write metadata
        f.write("---\n")
        f.write(f"url: {data['url']}\n")
        f.write(f"title: {data['title']}\n")
        f.write(f"crawled_at: {data['crawled_at']}\n")
        f.write("---\n\n")
        
        # Write content
        f.write(data['content'])
    
    print(f"Saved: {filepath}")
    return filepath

def main():
    """Main function to crawl Pydantic AI docs."""
    ensure_output_dir()
    
    # Start with the docs index page
    start_url = f"{BASE_URL}/docs/"
    
    # Get initial soup
    soup = get_soup(start_url)
    if not soup:
        print("Failed to fetch initial page")
        return
    
    # Save the index page
    data = extract_content(soup, start_url)
    if data:
        save_page(data, start_url)
    
    # Get all documentation links
    all_links = get_docs_links(soup)
    print(f"Found {len(all_links)} links to crawl")
    
    # Limit number of pages
    if len(all_links) > MAX_PAGES:
        print(f"Limiting to {MAX_PAGES} pages")
        all_links = all_links[:MAX_PAGES]
    
    # Keep track of crawled URLs
    crawled_urls = [start_url]
    
    # Crawl each link
    for url in all_links:
        if url in crawled_urls:
            continue
        
        # Add a small delay to be nice to the server
        time.sleep(1)
        
        soup = get_soup(url)
        data = extract_content(soup, url)
        if data:
            save_page(data, url)
            
            # Find more links
            new_links = get_docs_links(soup)
            for new_link in new_links:
                if new_link not in all_links and new_link not in crawled_urls:
                    all_links.append(new_link)
        
        # Mark as crawled
        crawled_urls.append(url)
        
        # Check if we've reached the limit
        if len(crawled_urls) >= MAX_PAGES:
            print(f"Reached maximum number of pages ({MAX_PAGES})")
            break
    
    print(f"Crawling complete! Crawled {len(crawled_urls)} pages.")

if __name__ == "__main__":
    main() 