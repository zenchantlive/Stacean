#!/bin/bash
# Atlas Environment Setup
# Run this when you have sudo access

echo "Installing better CLI utilities..."

# Check and install packages
PACKAGES="ripgrep fd-find bat eza fzf zoxide jq httpie"

for pkg in $PACKAGES; do
    if ! dpkg -l | grep -q "^ii  $pkg "; then
        echo "Installing $pkg..."
        sudo apt-get install -y $pkg 2>/dev/null || echo "  → Could not install $pkg"
    else
        echo "✓ $pkg already installed"
    fi
done

# NPM packages that are useful
NPM_PACKAGES="tldr diff-so-fancy"
for npkg in $NPM_PACKAGES; do
    if ! npm list -g $npkg >/dev/null 2>&1; then
        echo "Installing npm package: $npkg..."
        npm install -g $npkg 2>/dev/null || echo "  → Could not install $npkg"
    else
        echo "✓ $npkg already installed"
    fi
done

echo "Setup complete!"
