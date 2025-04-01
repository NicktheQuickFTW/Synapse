#!/bin/bash

# Get the environment from command line or use development as default
ENV=${1:-development}

# Copy the appropriate .env file
cp .env.$ENV .env

echo "Using $ENV environment configuration" 