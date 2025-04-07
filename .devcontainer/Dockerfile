FROM alpine:3.19

# Install Node.js, Python, and other dependencies
RUN apk add --no-cache \
    nodejs \
    npm \
    python3 \
    python3-dev \
    py3-pip \
    postgresql-client \
    postgresql-dev \
    bash \
    git \
    gcc \
    musl-dev \
    linux-headers \
    curl \
    make \
    g++ \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    jpeg-dev \
    zlib-dev \
    libffi-dev \
    && rm -rf /var/cache/apk/*

# Create app directory and set working directory
WORKDIR /workspaces/XII-OS

# Create Python virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Set Playwright browser path
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN mkdir -p /ms-playwright

# Create log directories
RUN mkdir -p logs/{development,production,monitoring}

# Set environment variables
ENV NODE_ENV=development
ENV PYTHONPATH=/workspaces/XII-OS
ENV PYTHONUNBUFFERED=1

# Expose ports
EXPOSE 3000
EXPOSE 5432

# Start command
CMD ["npm", "start"] 