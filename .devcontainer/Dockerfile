FROM mcr.microsoft.com/devcontainers/base:bookworm

ARG BUILDARCH
ARG HUGO_VERSION=0.131.0
ARG NODE_VERSION=22

# Install Hugo for Github Releases Page
RUN mkdir -p /tmp/hugo && \
    cd /tmp/hugo && \
    curl -LO  https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_${HUGO_VERSION}_linux-${BUILDARCH}.deb && \
    sudo apt install ./hugo_${HUGO_VERSION}_linux-${BUILDARCH}.deb && \
    cd / && \
    rm -rf /tmp/hugo

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash - && \
    sudo apt-get install -y nodejs && \
    sudo apt-get clean && \
    sudo rm -rf /var/lib/apt/lists/*

# Install html and css linters
RUN sudo npm install -g htmlhint stylelint stylelint-config-standard