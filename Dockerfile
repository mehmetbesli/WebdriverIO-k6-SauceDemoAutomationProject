FROM node:20-bookworm-slim

# Set non-interactive debian frontend
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies, Google Chrome, OpenJDK 17 (for Allure), and k6
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    curl \
    gnupg \
    ca-certificates \
    openjdk-17-jre-headless \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    xdg-utils \
    && wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/google-chrome.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends google-chrome-stable \
    && curl -s -L "https://github.com/grafana/k6/releases/download/v0.56.0/k6-v0.56.0-linux-amd64.tar.gz" | tar -xz -C /tmp \
    && mv /tmp/k6-v0.56.0-linux-amd64/k6 /usr/local/bin/k6 \
    && rm -rf /tmp/k6-v0.56.0-linux-amd64 \
    && rm -rf /var/lib/apt/lists/*

# Environment variables for headless container execution
ENV CI=true \
    HEADLESS=true \
    AUTO_OPEN=false \
    CHROME_BIN=/usr/bin/google-chrome \
    JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64

WORKDIR /app

# Copy dependency manifests and install dependencies
COPY package*.json ./
RUN npm ci

# Copy full application codebase
COPY . .

# Ensure reports directory exists for volume mounts
RUN mkdir -p reports

CMD ["npm", "run", "test:all"]
