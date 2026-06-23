# Jamea Al-Aamal — جامع الأعمال

Real estate investment portfolio management platform built with React + Vite.

---

## Requirements

- **Node.js** v18 or later — [nodejs.org](https://nodejs.org)
- **npm** v9 or later (comes bundled with Node.js)

---

## Setup on a new machine (macOS)

### 1. Install Node.js

Open **Terminal** and install Node.js via Homebrew (easiest on macOS):

```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node
```

Or download the installer directly from [nodejs.org/en/download](https://nodejs.org/en/download) and run the `.pkg` file.

Verify the install:

```bash
node -v   # should print v18.x or higher
npm -v    # should print 9.x or higher
```

### 2. Copy the project folder

Transfer the `jamea-app` folder to the Mac (USB drive, AirDrop, or any method). Place it anywhere, e.g. your Desktop.

> **Do not copy `node_modules`** — it is large and platform-specific. Delete it before transferring if it exists.

### 3. Install dependencies

```bash
cd ~/Desktop/jamea-app
npm install
```

This reads `package.json` and installs everything automatically. It takes about 30–60 seconds on first run.

### 4. Start the dev server

```bash
npm run dev
```

Open the URL shown in the terminal (usually **http://localhost:5173**) in your browser.

---

## Available commands

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server with hot reload |
| `npm run build` | Build optimised production bundle into `dist/` |
| `npm run preview` | Preview the production build locally |

---

## Dependencies (installed automatically by `npm install`)

| Package | Purpose |
|---|---|
| `react` + `react-dom` | UI framework |
| `vite` | Build tool & dev server |
| `chart.js` + `react-chartjs-2` | Charts |
| `html2canvas` | PDF screenshot rendering |
| `jspdf` | PDF export |
| `xlsx` | Excel export |
| `@anthropic-ai/sdk` | AI document parsing |
| `tailwindcss` | Utility CSS |

All exact versions are pinned in `package.json` — `npm install` will install those exact versions.

---

## Troubleshooting

**`npm: command not found`** — Node.js is not installed. Follow Step 1 above.

**Port 5173 already in use** — Run `npm run dev -- --port 3000` to use a different port.

**`node_modules` errors after copying from Windows** — Delete the `node_modules` folder and run `npm install` again. Some packages compile native binaries per OS.

```bash
rm -rf node_modules
npm install
```
