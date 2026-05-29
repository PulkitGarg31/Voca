# Voca — Vocabulary Learning Platform

A full-stack vocabulary learning platform to store, organize, and practice English words — with AI-powered word discovery via **LangChain + Gemini**, automated word detail retrieval via the **Dictionary API**, and progress tracking through a **MongoDB + Next.js** backend.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| UI | React 18 + Tailwind CSS |
| Database | MongoDB + Mongoose |
| Auth | NextAuth.js (Credentials) |
| AI Chatbot | LangChain + Google Gemini 1.5 Flash |
| Dictionary | Free Dictionary API (dictionaryapi.dev) |

---

## Features

- **Word Library** — add/edit words with auto-filled definitions, phonetics, audio, synonyms & antonyms; search, filter by category / mastery / favourites, sort, **bulk import** & **CSV export**, plus **AI-generated example sentences & mnemonics** per word
- **Practice** — **Flashcards**, **Quiz** (multiple-choice) and **Spelling**, with **spaced-repetition scheduling**, a **Due-for-review** queue, smart ordering (weak/overdue words first), and keyboard shortcuts. Each session updates mastery, time spent, and streak
- **Statistics Dashboard** — daily-goal progress ring, due-for-review queue, **Word of the Day**, GitHub-style streak heatmap, category breakdown, weekly stats, and time-spent tracking
- **AI Chat** — LangChain-powered Gemini chatbot for word discovery, etymology and usage; words it mentions become one-tap "add to library" chips (rendered safely — no HTML injection)
- **Account & Settings** — edit display name, change password, set a daily goal, light/dark theme toggle, and delete account (full data cascade)
- **Dark mode** — full light/dark theming via CSS variables, persisted, with no flash-of-wrong-theme
- **Auth** — email/password with NextAuth.js + bcrypt, plus **optional Google sign-in** (auto-enabled when configured); rate-limited API endpoints

---

## Project Structure

```
voca/
├── app/
│   ├── (auth)/
│   │   ├── login/page.jsx          # Login page
│   │   └── register/page.jsx       # Register page
│   ├── (dashboard)/
│   │   ├── layout.jsx              # Protected layout with sidebar
│   │   ├── statistics/page.jsx     # Statistics dashboard
│   │   ├── words/page.jsx          # Word library
│   │   ├── practice/page.jsx       # Flashcard practice
│   │   ├── chat/page.jsx           # AI chatbot
│   │   └── settings/page.jsx       # Settings
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.js  # NextAuth handler
│   │   │   └── register/route.js       # Registration
│   │   ├── words/
│   │   │   ├── route.js            # GET (list) + POST (add)
│   │   │   └── [id]/route.js       # GET, PATCH, DELETE
│   │   ├── dictionary/route.js     # Dictionary API proxy
│   │   ├── chat/route.js           # LangChain + Gemini
│   │   └── stats/route.js          # Statistics aggregation
│   ├── layout.jsx                  # Root layout
│   ├── page.jsx                    # Root redirect
│   └── globals.css                 # Global styles
│
├── components/
│   ├── Sidebar.jsx                 # Navigation sidebar
│   ├── Providers.jsx               # SessionProvider wrapper
│   ├── stats/
│   │   ├── StreakHeatmap.jsx        # GitHub-style heatmap
│   │   ├── CategoryBreakdown.jsx   # Category progress bars
│   │   └── RecentActivity.jsx      # Recent words list
│   └── words/
│       ├── WordCard.jsx            # Expandable word card
│       └── AddWordModal.jsx        # Add word modal (with Dictionary API)
│
├── lib/
│   ├── mongodb.js                  # DB connection (singleton)
│   ├── auth.js                     # NextAuth options
│   └── langchain.js                # LangChain + Gemini chain
│
├── models/
│   ├── User.js                     # User schema (with streak logic)
│   ├── Word.js                     # Word schema (with mastery tracking)
│   └── PracticeSession.js          # Practice session schema
│
├── hooks/
│   ├── useWords.js                 # Words CRUD hook
│   ├── useStats.js                 # Statistics hook
│   └── useDictionary.js            # Dictionary lookup hook
│
└── middleware.js                   # Route protection
```

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/voca.git
cd voca
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in:

```env
# MongoDB — https://cloud.mongodb.com
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/voca

# NextAuth — generate with: openssl rand -base64 32
NEXTAUTH_SECRET=your_secret_here
NEXTAUTH_URL=http://localhost:3000

# Gemini — https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_key_here

# Optional: override the Gemini model (defaults to gemini-2.5-flash-lite).
# Set this if the default model name isn't available for your API key/region.
# GEMINI_MODEL=gemini-1.5-flash

# Optional: enable "Continue with Google". Redirect URI: <NEXTAUTH_URL>/api/auth/callback/google
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
```

> See [`.env.example`](.env.example) for the full list. A GitHub Actions workflow
> ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs lint + build on push/PR.

> **Production note:** API rate limiting ([`lib/rateLimit.js`](lib/rateLimit.js)) is
> in-memory (per server instance). On a multi-instance / serverless deploy (e.g.
> Vercel), back it with a shared store like Upstash Redis for it to be effective,
> and ensure the platform sets a trusted `x-forwarded-for`.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to login.

---

## Getting Your API Keys

### MongoDB URI
1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free cluster (M0)
3. Click **Connect → Drivers**
4. Copy the connection string and replace `<password>`

### Gemini API Key
1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Click **Create API Key**
3. Copy and paste into `.env.local`

### NextAuth Secret
Run in terminal:
```bash
openssl rand -base64 32
```

---

## Key Implementation Details

### Dictionary API (Free — no key needed)
Words are auto-filled when you type a word and click **Look up**:
```
GET https://api.dictionaryapi.dev/api/v2/entries/en/{word}
```
Returns: phonetic, audio URL, meanings, synonyms, antonyms.

### LangChain + Gemini Chat
`lib/langchain.js` uses `RunnableWithMessageHistory` to maintain per-user conversation memory (in-memory during session). The Voca system prompt makes the AI act as a vocabulary expert.

### Streak Tracking
`models/User.js` has an `updateStreak()` method called whenever a word is added. It compares today's date with `lastActiveDate` to increment or reset the streak.

### MongoDB Indexes
- `Word`: compound unique index on `{ userId, word }` — prevents duplicate words per user
- Both `Word` and `PracticeSession` are indexed on `userId` for fast per-user queries

---

## Deployment (Vercel)

```bash
npm install -g vercel
vercel
```

Add the same environment variables in your Vercel project settings under **Settings → Environment Variables**.

---

## License

MIT
