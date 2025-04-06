#!/usr/bin/env python
"""
Simple script to crawl Pydantic AI docs and save to local files
"""

import os
import sys
import json
import asyncio
import requests
from datetime import datetime
from urllib.parse import urlparse
from dotenv import load_dotenv
from pathlib import Path
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode

# Load environment variables
load_dotenv()

async def get_pydantic_ai_docs_urls():
    """Get a list of all URLs from Pydantic AI documentation."""
    base_url = "https://docs.pydantic-ai.com/"
    sitemap_url = "https://docs.pydantic-ai.com/sitemap.xml"
    
    # Create output directory
    os.makedirs("pydantic_ai_docs", exist_ok=True)
    
    try:
        # Fetch sitemap using requests
        print(f"Fetching sitemap from {sitemap_url}")
        response = requests.get(sitemap_url)
        response.raise_for_status()  # Raise exception for 4XX/5XX responses
        sitemap_xml = response.text
        
        # Parse sitemap XML
        from xml.etree import ElementTree
        root = ElementTree.fromstring(sitemap_xml)
        
        # Extract URLs
        urls = []
        for url_element in root.findall(".//{http://www.sitemaps.org/schemas/sitemap/0.9}loc"):
            url = url_element.text
            # Only include docs pages
            if url.startswith(base_url) and "/docs/" in url:
                urls.append(url)
        
        print(f"Found {len(urls)} URLs to crawl")
        return urls
    except Exception as e:
        print(f"Error fetching sitemap: {e}")
        return []

async def crawl_and_save_docs(urls, max_concurrent=5):
    """Crawl pages and save them to files."""
    # Configure browser
    browser_config = BrowserConfig(
        headless=True,
        verbose=False,
        extra_args=["--disable-gpu", "--disable-dev-shm-usage", "--no-sandbox"],
    )
    crawl_config = CrawlerRunConfig(cache_mode=CacheMode.BYPASS)
    
    # Create crawler
    crawler = AsyncWebCrawler(config=browser_config)
    await crawler.start()
    
    try:
        # Create semaphore for concurrency control
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def process_url(url):
            """Process a single URL"""
            async with semaphore:
                try:
                    print(f"Crawling {url}")
                    
                    # Crawl the page
                    result = await crawler.arun(
                        url=url,
                        config=crawl_config,
                        extract_metadata=True,
                        extract_markdown=True
                    )
                    
                    if not result.success:
                        print(f"Failed to crawl {url}: {result.error}")
                        return
                    
                    # Get path components for filename
                    parsed_url = urlparse(url)
                    path_parts = parsed_url.path.strip('/').split('/')
                    
                    # Create filename
                    if len(path_parts) > 0:
                        filename = '_'.join(path_parts) + '.md'
                    else:
                        filename = "index.md"
                    
                    # Save markdown to file
                    filepath = os.path.join("pydantic_ai_docs", filename)
                    with open(filepath, 'w', encoding='utf-8') as f:
                        # Add metadata header
                        f.write(f"---\n")
                        f.write(f"url: {url}\n")
                        f.write(f"title: {result.metadata.get('title', 'Untitled')}\n")
                        f.write(f"crawled_at: {datetime.now().isoformat()}\n")
                        f.write(f"---\n\n")
                        
                        # Write content
                        f.write(result.markdown)
                    
                    print(f"Saved {url} to {filepath}")
                    
                except Exception as e:
                    print(f"Error processing {url}: {e}")
        
        # Process all URLs concurrently
        tasks = [process_url(url) for url in urls]
        await asyncio.gather(*tasks)
        
    finally:
        # Always close the browser
        await crawler.stop()
    
    print(f"Crawling complete! Saved {len(urls)} documents to the pydantic_ai_docs directory.")

async def main():
    # Get URLs to crawl
    urls = await get_pydantic_ai_docs_urls()
    
    if not urls:
        print("No URLs found to crawl")
        return
    
    # Crawl and save docs
    await crawl_and_save_docs(urls, max_concurrent=int(os.getenv("MAX_CONCURRENT_CRAWLS", 5)))

if __name__ == "__main__":
    asyncio.run(main()) 