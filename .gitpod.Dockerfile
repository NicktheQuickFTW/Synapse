FROM gitpod/workspace-full

# Install Jekyll
RUN sudo apt-get update && sudo apt-get install -y \
    ruby-full \
    build-essential \
    zlib1g-dev

# Install Jekyll and Bundler
RUN gem install jekyll bundler

# Install Node.js (already included in gitpod/workspace-full)
# Update npm to latest version
RUN npm install -g npm@latest 