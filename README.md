<p align="center">
  <img src="client/public/images/DraftSense.png" alt="DraftSense Logo" width="600"/>
</p>

<p align="center">
  <strong>Your AI-powered League of Legends champion draft advisor.</strong><br/>
  Real-time counter picks, team synergy analysis, rune pages & item builds — all in one place.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Stack-MERN-00C48C?style=for-the-badge&logo=mongodb&logoColor=white"/>
  <img src="https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
  <img src="https://img.shields.io/badge/AI-Ollama%20%7C%20llama3.1%3A8b-C89B3C?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Game-League%20of%20Legends-D64045?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Status-In%20Development-F5A623?style=for-the-badge"/>
</p>

---

## What is DraftSense?

DraftSense is a full-stack web application built for League of Legends players who want a competitive edge during champion select. You input the current state of your draft — bans, enemy picks, ally picks, and your role — and DraftSense's AI engine tells you exactly what to pick and how to play it.

> Think of it as your personal analyst whispering in your ear during champion select.

---

## Features

- **Role-Aware Recommendations** — Select your role first, get picks tailored to your position
- **Counter Pick Engine** — AI scores and ranks the best champions to counter your enemy lineup
- **Synergy Analysis** — Finds champions that amplify your teammates' strengths
- **Combined AI Recommendations** — Top 3 picks balancing both counter strength and team synergy
- **Full Build Guides** — Rune pages, item build order, skill order, and matchup-specific tips
- **Local AI via Ollama** — Runs entirely on your machine with `llama3.1:8b`, no API keys needed
- **LoL-Inspired UI** — Dark cinematic design matching League of Legends' in-client aesthetic

---

## Application Flow

```
1. Select your role (Top / Jungle / Mid / Bot / Support)
         ↓
2. Fill in the draft board:
   • 10 ban slots (5 per team)
   • Enemy team picks (by role)
   • Ally team picks (your slot is locked)
         ↓
3. Get AI recommendations:
   • 5 best counter picks
   • 5 best synergy picks
   • 3 best overall picks
         ↓
4. Select your champion → Get full build guide:
   • Runes, items, skill order & tips
```

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| Vite | Build tool |
| React Router v6 | Multi-page navigation |
| Zustand | Global draft state management |
| Tailwind CSS | Styling |
| Framer Motion | Animations & transitions |
| TanStack Query | Server state & API caching |
| Axios | HTTP client |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API |
| TypeScript | Type safety |
| MongoDB + Mongoose | Database & ODM |
| Ollama (`llama3.1:8b`) | Local LLM for AI recommendations |
| Riot Data Dragon API | Champion data & images |
| Zod | Request validation |
| Helmet + Rate Limiter | Security |

### Infrastructure
| Service | Purpose |
|---|---|
| MongoDB Atlas | Cloud database |
| Vercel | Frontend deployment |
| Render / Railway | Backend deployment |
| Ollama (local) | AI in development |
| Claude Haiku API | AI in production (optional) |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB Atlas](https://www.mongodb.com/atlas) account (or local MongoDB)
- [Ollama](https://ollama.com) installed on your machine
- Git

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/draftsense.git
cd draftsense
```

### 2. Install Ollama & pull the AI model

```bash
# Install Ollama (Linux/Mac)
curl -fsSL https://ollama.com/install.sh | sh

# Windows: Download from https://ollama.com/download

# Pull the recommended model (~5GB download)
ollama pull llama3.1:8b
```

> Ollama will run silently in the background at `http://localhost:11434`. No API key needed.

### 3. Setup the server

```bash
cd server
npm install
cp .env.example .env
# Fill in your MONGO_URI in the .env file
```

### 4. Setup the client

```bash
cd ../client
npm install
cp .env.example .env
# VITE_API_BASE_URL is pre-filled for local development
```

### 5. Seed the database

```bash
cd ../server
npm run seed
# This pulls champion data from Riot Data Dragon and populates MongoDB
```

### 6. Run the application

```bash
# Terminal 1 — Start the backend
cd server
npm run dev

# Terminal 2 — Start the frontend
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. 🎮

---

## Environment Variables

### Server (`server/.env`)

```env
PORT=5000
MONGO_URI=mongodb+srv://your-cluster-url
CLIENT_URL=http://localhost:5173
NODE_ENV=development

# AI Provider
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b

# Only for production deployment
ANTHROPIC_API_KEY=
```

### Client (`client/.env`)

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## Project Structure

```
draftsense/
├── client/                      # React frontend
│   └── src/
│       ├── components/
│       │   ├── common/          # ChampionCard, ChampionSearch, RoleIcon
│       │   ├── draft/           # BanRow, TeamColumn, DraftBoard
│       │   └── results/         # RecommendationCard, RuneDisplay, BuildOrder
│       ├── pages/               # RoleSelect, DraftInput, Recommendations, BuildGuide
│       ├── store/               # Zustand draft state
│       ├── hooks/               # useChampions, useRecommendations
│       ├── types/               # Shared TypeScript types
│       └── api/                 # Axios client
│
├── server/                      # Express backend
│   └── src/
│       ├── models/              # Champion, Matchup, Synergy, Build
│       ├── routes/              # /api/champions, /api/recommend, /api/build
│       ├── controllers/         # recommendController, buildController
│       ├── services/            # aiService, statsService, dataDragonService
│       ├── middleware/          # errorHandler
│       └── scripts/             # seedDatabase
│
├── assets/                      # Logo and static assets
└── README.md
```

---

## AI Recommendation Engine

DraftSense uses a two-stage recommendation pipeline:

**Stage 1 — Statistical Scoring (`statsService.ts`)**
```
Counter Score  = avg winrate of candidate vs each enemy pick (weighted by role)
Synergy Score  = avg winrate of candidate alongside each ally pick
Overall Score  = (Counter Score × 0.6) + (Synergy Score × 0.4)
```

**Stage 2 — LLM Explanation (`aiService.ts`)**

The top-scored champions are passed to `llama3.1:8b` via Ollama, which generates:
- Natural language reasoning for each recommendation
- Matchup-specific tips (e.g., *"Gank mid before level 6 — Syndra has no escape pre-6"*)
- Contextual build narration (e.g., *"Rush Sunfire Cape — 3 enemy divers need early armor"*)

---

## Roadmap

- [ ] Project planning & architecture
- [ ] Logo & UI design system
- [ ] Role selection page
- [ ] Draft board UI with champion search
- [ ] Champion database seeding (Riot Data Dragon)
- [ ] Recommendation engine (scoring algorithm)
- [ ] Ollama AI integration
- [ ] Rune & build guide page
- [ ] Responsive mobile layout
- [ ] Production deployment

---

## Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## Disclaimer

DraftSense is not affiliated with, endorsed by, or sponsored by Riot Games. League of Legends and all related assets are property of Riot Games. Champion data is sourced from the [Riot Data Dragon](https://developer.riotgames.com/docs/lol) public API.

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Built with ❤️ for the League of Legends community<br/>
  <sub>DraftSense — Pick smarter. Win more.</sub>
</p>
