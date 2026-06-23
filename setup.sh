#!/bin/bash
set -e

echo "──────────────────────────────────────"
echo "  Jamea Al-Aamal — Setup"
echo "──────────────────────────────────────"

# 1. Install Homebrew if missing
if ! command -v brew &>/dev/null; then
  echo "→ Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  # Add brew to PATH for Apple Silicon Macs
  echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
  eval "$(/opt/homebrew/bin/brew shellenv)"
else
  echo "✓ Homebrew already installed"
fi

# 2. Install Node.js if missing
if ! command -v node &>/dev/null; then
  echo "→ Installing Node.js..."
  brew install node
else
  echo "✓ Node.js already installed ($(node -v))"
fi

# 3. Remove old node_modules if they exist (handles Windows→Mac transfer)
if [ -d "node_modules" ]; then
  echo "→ Removing old node_modules..."
  rm -rf node_modules
fi

# 4. Install dependencies
echo "→ Installing dependencies..."
npm install

# 5. Start the app
echo ""
echo "──────────────────────────────────────"
echo "  All done! Starting the app..."
echo "  Open http://localhost:5173 in your browser"
echo "──────────────────────────────────────"
npm run dev
