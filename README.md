# EVKR2 - Personal Dashboard

A dark futuristic personal dashboard built with Nuxt.js featuring gamification, habit tracking, news aggregation, and progress monitoring.

## Features

### 🏠 Dashboard (Free Access)
- **Rank System**: XP-based progression through 19 ranks (H to X)
- **Daily Quests**: 5 daily tasks (Working, Studying, Reading, Working-out, Learning Korean) - 5 XP each
- **Objectives**: Display of personal goals and targets

### 📰 News (Free Access)
- Real-time news from GNews API
- Three regions: USA, Europe (UK, FR, DE, IT), Korea
- Korean news from English-language sources (Korea Herald, Korea Times, etc.)
- Clickable cards with images

### 🚀 DevOps Improvement (Free Access)
- Intelligent digest from 9 RSS sources (AWS, Azure, GCP, HashiCorp, Kubernetes, Docker, CNCF, DevOps.com, The New Stack)
- Categories: Cloud, Infrastructure, Containers, General
- Smart topic analysis and trending keywords detection
- Horizontal scrollable article cards per category
- Weekly refresh with 7-day caching
- No API key required

### 🔒 Premium Features (Access Code Required)

#### 📊 Finn 2025
Coming soon...

#### 🔮 Sanity Tracker
- **Alcohol Free Counter**: 30-day milestones
- **Clean Streak Counter**: 90-day milestones  
- **Consecutive Sports Days**: 21-day milestones
- Level system with progress bars
- Persistent tracking via localStorage

## Authentication

The application has two access levels:

1. **Free Access**: Home and News pages
2. **Premium Access**: All pages including Finn 2025 and Sanity

### Access Code

**Premium Access Code**: `EVKR2025`

Sessions last for 24 hours before re-authentication is required.

### Usage
- Click "Connect" in the sidebar to enter the access code
- Enter the code to unlock premium features
- Click "Continue with Free Access" for free pages only
- Click "Disconnect" to clear the session

## Setup

Install dependencies:

```bash
npm install
```

Create a `.env` file with your API key:

```bash
GNEWS_API_KEY=your_gnews_api_key_here
```

### Getting API Keys

**GNews API** (required for News page):
1. Visit https://gnews.io/
2. Sign up for a free account
3. Copy your API key
4. Add it to your `.env` file

**DevOps Page**: No API key required - works out of the box!

## Development Server

Start the development server:

```bash
npm run dev
```

Access at `http://localhost:3000`

## Production

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Tech Stack

- **Framework**: Nuxt.js 3.20.1
- **Language**: Vue 3.5.25 with TypeScript
- **Build Tool**: Vite 7.2.7
- **Server**: Nitro 2.12.9
- **APIs**: 
  - GNews API (news aggregation)
  - MyMemory Translation API (Korean to English)
- **Storage**: localStorage for client-side persistence
- **Styling**: CSS with custom properties and neon gradients

## Project Structure

```
evkr2/
├── components/
│   ├── AuthModal.vue          # Authentication modal
│   ├── DailyQuests.vue         # Daily quest tracker
│   ├── Objectives.vue          # Goals display
│   └── RankCard.vue            # XP and rank system
├── layouts/
│   └── default.vue             # Main layout with sidebar
├── middleware/
│   └── auth.ts                 # Protected route middleware
├── pages/
│   ├── index.vue               # Dashboard (free)
│   ├── news.vue                # News page (free)
│   ├── devops.vue              # DevOps digest (free)
│   ├── finn-2025.vue           # Premium page
│   └── sanity.vue              # Sanity tracker (premium)
├── server/
│   └── api/
│       ├── news.get.ts              # News API proxy
│       ├── translate.post.ts        # Translation endpoint
│       └── devops-digest.post.ts    # DevOps RSS + AI filtering
├── public/
├── rank_point.json             # Rank system configuration
└── nuxt.config.ts
```

## Color Scheme

The application uses a neon futuristic color palette:
- Cyan: `#00ffff`
- Magenta: `#ff00ff`
- Yellow: `#ffff00`
- Green: `#00ff88`
- Purple: `#9d00ff`
- Red: `#ff0055`
- Gold: `#ffd700`

## Security Notes

⚠️ **Important**: Never commit your `.env` file to GitHub!
- The `.env` file contains sensitive API keys
- Always use `.env.example` as a template
- Add real keys only to your local `.env` file
- The `.gitignore` file is configured to exclude `.env` automatically

## License

MIT License - Feel free to use this project as you like!
Personal project - All rights reserved
