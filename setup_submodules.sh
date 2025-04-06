#!/bin/bash

# Remove existing modules
rm -rf modules
git rm -rf modules 2>/dev/null || true
git commit -m "Remove modules directory" || true

# Add submodules
git submodule add ../xii-agents modules/xii-agents
git submodule add ../xii-core-db modules/xii-core-db
git submodule add ../xii-os-core-db modules/xii-os-core-db
git submodule add ../xii-os-supabase-db modules/xii-os-supabase-db

# Initialize and update submodules
git submodule init
git submodule update

# Commit changes
git add .
git commit -m "Add submodules for XII-OS components" 