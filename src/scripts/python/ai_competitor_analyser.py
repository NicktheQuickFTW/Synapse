import streamlit as st
from exa_py import Exa
import openai
from firecrawl import FirecrawlApp
from pydantic import BaseModel, Field
from typing import List, Optional
import json
import requests
import pandas as pd
from dotenv import load_dotenv
import os
import google.generativeai as genai
import anthropic

# Load environment variables
load_dotenv()

# Initialize Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
gemini_model = genai.GenerativeModel('gemini-pro')

# Initialize Anthropic
anthropic_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

class LLMInterface:
    def __init__(self, model_name="gpt-4"):
        self.model_name = model_name
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.perplexity_api_key = os.getenv("PERPLEXITY_API_KEY")
        self.anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
        self.deepseek_api_key = os.getenv("DEEPSEEK_API_KEY")
        openai.api_key = self.openai_api_key

    def generate_response(self, prompt: str) -> str:
        if self.model_name == "gpt-4":
            try:
                response = openai.ChatCompletion.create(
                    model="gpt-4",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.7,
                    max_tokens=2000
                )
                return response.choices[0].message.content
            except Exception as e:
                st.error(f"Error calling OpenAI API: {str(e)}")
                return None
        elif self.model_name == "gemini-pro":
            try:
                response = gemini_model.generate_content(prompt)
                return response.text
            except Exception as e:
                st.error(f"Error calling Gemini API: {str(e)}")
                return None
        elif self.model_name == "perplexity":
            try:
                response = requests.post(
                    "https://api.perplexity.ai/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.perplexity_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "sonar-pro",
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.7,
                        "max_tokens": 2000
                    }
                )
                response.raise_for_status()
                return response.json()['choices'][0]['message']['content']
            except Exception as e:
                st.error(f"Error calling Perplexity API: {str(e)}")
                return None
        elif self.model_name == "claude-3":
            try:
                response = anthropic_client.messages.create(
                    model="claude-3-sonnet-20240229",
                    max_tokens=2000,
                    temperature=0.7,
                    messages=[{
                        "role": "user",
                        "content": prompt
                    }]
                )
                return response.content[0].text
            except Exception as e:
                st.error(f"Error calling Claude API: {str(e)}")
                return None
        elif self.model_name == "deepseek":
            try:
                response = requests.post(
                    "https://api.deepseek.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.deepseek_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "deepseek-chat",
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.7,
                        "max_tokens": 2000
                    }
                )
                response.raise_for_status()
                return response.json()['choices'][0]['message']['content']
            except Exception as e:
                st.error(f"Error calling DeepSeek API: {str(e)}")
                return None

# Streamlit UI
st.set_page_config(page_title="AI Competitor Intelligence Agent Team", layout="wide")

# Sidebar for API keys and model selection
st.sidebar.title("Configuration")

# Model selection
selected_model = st.sidebar.selectbox(
    "Select Primary LLM",
    options=["gpt-4", "gemini-pro", "perplexity", "claude-3", "deepseek"],
    help="Choose which LLM to use for analysis"
)

# API Keys section
st.sidebar.subheader("API Keys")
openai_api_key = st.sidebar.text_input("OpenAI API Key", value=os.getenv("OPENAI_API_KEY", ""), type="password")
firecrawl_api_key = st.sidebar.text_input("Firecrawl API Key", value=os.getenv("FIRECRAWL_API_KEY", ""), type="password")
perplexity_api_key = st.sidebar.text_input("Perplexity API Key", value=os.getenv("PERPLEXITY_API_KEY", ""), type="password")
gemini_api_key = st.sidebar.text_input("Gemini API Key", value=os.getenv("GEMINI_API_KEY", ""), type="password")
anthropic_api_key = st.sidebar.text_input("Anthropic API Key", value=os.getenv("ANTHROPIC_API_KEY", ""), type="password")
deepseek_api_key = st.sidebar.text_input("DeepSeek API Key", value=os.getenv("DEEPSEEK_API_KEY", ""), type="password")

# Search engine selection
search_engine = st.sidebar.selectbox(
    "Select Search Endpoint",
    options=["Perplexity AI - Sonar Pro", "Exa AI"],
    help="Choose which AI service to use for finding competitor URLs"
)

# Show relevant API key input based on selection
if search_engine == "Perplexity AI - Sonar Pro":
    if openai_api_key and firecrawl_api_key and perplexity_api_key:
        st.session_state.openai_api_key = openai_api_key
        st.session_state.firecrawl_api_key = firecrawl_api_key
        st.session_state.perplexity_api_key = perplexity_api_key
    else:
        st.sidebar.warning("Please enter all required API keys to proceed.")
else:  # Exa AI
    exa_api_key = st.sidebar.text_input("Exa API Key", value=os.getenv("EXA_API_KEY", ""), type="password")
    if openai_api_key and firecrawl_api_key and exa_api_key:
        st.session_state.openai_api_key = openai_api_key
        st.session_state.firecrawl_api_key = firecrawl_api_key
        st.session_state.exa_api_key = exa_api_key
    else:
        st.sidebar.warning("Please enter all required API keys to proceed.")

# Initialize LLM interface
llm = LLMInterface(model_name=selected_model)

# Main UI
st.title("🧲 AI Competitor Intelligence Agent Team")
st.info(
    """
    This app helps businesses analyze their competitors by extracting structured data from competitor websites and generating insights using AI.
    - Provide a **URL** or a **description** of your company.
    - The app will fetch competitor URLs, extract relevant information, and generate a detailed analysis report.
    """
)
st.success("For better results, provide both URL and a 5-6 word description of your company!")

# Input fields for URL and description
url = st.text_input("Enter your company URL :")
description = st.text_area("Enter a description of your company (if URL is not available):")

def get_competitor_urls(url: str = None, description: str = None) -> list[str]:
    if not url and not description:
        raise ValueError("Please provide either a URL or a description.")

    if search_engine == "Perplexity AI - Sonar Pro":
        perplexity_url = "https://api.perplexity.ai/chat/completions"
        
        content = "Find me 3 competitor company URLs similar to the company with "
        if url and description:
            content += f"URL: {url} and description: {description}"
        elif url:
            content += f"URL: {url}"
        else:
            content += f"description: {description}"
        content += ". ONLY RESPOND WITH THE URLS, NO OTHER TEXT."

        payload = {
            "model": "sonar-pro",
            "messages": [
                {
                    "role": "system",
                    "content": "Be precise and only return 3 company URLs ONLY."
                },
                {
                    "role": "user",
                    "content": content
                }
            ],
            "max_tokens": 1000,
            "temperature": 0.2,
        }
        
        headers = {
            "Authorization": f"Bearer {st.session_state.perplexity_api_key}",
            "Content-Type": "application/json"
        }

        try:
            response = requests.post(perplexity_url, json=payload, headers=headers)
            response.raise_for_status()
            urls = response.json()['choices'][0]['message']['content'].strip().split('\n')
            return [url.strip() for url in urls if url.strip()]
        except Exception as e:
            st.error(f"Error fetching competitor URLs from Perplexity: {str(e)}")
            return []

    else:  # Exa AI
        try:
            if url:
                result = exa.find_similar(
                    url=url,
                    num_results=3,
                    exclude_source_domain=True,
                    category="company"
                )
            else:
                result = exa.search(
                    description,
                    type="neural",
                    category="company",
                    use_autoprompt=True,
                    num_results=3
                )
            return [item.url for item in result.results]
        except Exception as e:
            st.error(f"Error fetching competitor URLs from Exa: {str(e)}")
            return []

class CompetitorDataSchema(BaseModel):
    company_name: str = Field(description="Name of the company")
    pricing: str = Field(description="Pricing details, tiers, and plans")
    key_features: List[str] = Field(description="Main features and capabilities of the product/service")
    tech_stack: List[str] = Field(description="Technologies, frameworks, and tools used")
    marketing_focus: str = Field(description="Main marketing angles and target audience")
    customer_feedback: str = Field(description="Customer testimonials, reviews, and feedback")

def extract_competitor_info(competitor_url: str) -> Optional[dict]:
    try:
        # Initialize FirecrawlApp with API key
        app = FirecrawlApp(api_key=st.session_state.firecrawl_api_key)
        
        # Add wildcard to crawl subpages
        url_pattern = f"{competitor_url}/*"
        
        extraction_prompt = """
        Extract detailed information about the company's offerings, including:
        - Company name and basic information
        - Pricing details, plans, and tiers
        - Key features and main capabilities
        - Technology stack and technical details
        - Marketing focus and target audience
        - Customer feedback and testimonials
        
        Analyze the entire website content to provide comprehensive information for each field.
        """
        
        response = app.extract(
            [url_pattern],
            {
                'prompt': extraction_prompt,
                'schema': CompetitorDataSchema.model_json_schema(),
            }
        )
        
        return response.data[0] if response.data else None
    except Exception as e:
        st.error(f"Error extracting competitor info: {str(e)}")
        return None

# Initialize API keys and tools
if "openai_api_key" in st.session_state and "firecrawl_api_key" in st.session_state:
    if (search_engine == "Perplexity AI - Sonar Pro" and "perplexity_api_key" in st.session_state) or \
       (search_engine == "Exa AI" and "exa_api_key" in st.session_state):
        
        # Initialize Exa only if selected
        if search_engine == "Exa AI":
            exa = Exa(api_key=st.session_state.exa_api_key)

        if st.button("Analyze Competitors"):
            if not url and not description:
                st.error("Please provide either a URL or a description of your company.")
            else:
                with st.spinner("Finding competitor URLs..."):
                    competitor_urls = get_competitor_urls(url, description)
                
                if competitor_urls:
                    st.write("### Found Competitors:")
                    for comp_url in competitor_urls:
                        st.write(f"- {comp_url}")
                    
                    competitor_data = []
                    with st.spinner("Analyzing competitors..."):
                        for comp_url in competitor_urls:
                            data = extract_competitor_info(comp_url)
                            if data:
                                competitor_data.append(data)
                    
                    if competitor_data:
                        st.write("### Competitor Analysis")
                        
                        # Create comparison table
                        comparison_df = pd.DataFrame(competitor_data)
                        st.write("#### Feature Comparison")
                        st.dataframe(comparison_df)
                        
                        # Generate insights using the selected LLM
                        analysis_prompt = f"""
                        Analyze the following competitor data and provide strategic insights:
                        {json.dumps(competitor_data, indent=2)}
                        
                        Focus on:
                        1. Market gaps and opportunities
                        2. Competitor weaknesses
                        3. Recommended features or improvements
                        4. Pricing strategy recommendations
                        5. Growth opportunities
                        
                        Provide actionable recommendations based on the analysis.
                        """
                        
                        with st.spinner(f"Generating insights using {selected_model}..."):
                            insights = llm.generate_response(analysis_prompt)
                            if insights:
                                st.write("#### Strategic Insights")
                                st.markdown(insights)
                    else:
                        st.error("Could not extract competitor data. Please try again.")
                else:
                    st.error("Could not find competitor URLs. Please try different input.")