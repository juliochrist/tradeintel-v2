# TradeIntel

**TradeIntel** is a premium dark-mode trading journal and AI trading intelligence platform for traders who want a cleaner way to track trades, review performance, and turn structured market context into practical AI-assisted trade plans.

Tagline: **Your AI Trading Intelligence**

## Overview

TradeIntel is built as a SaaS-ready web app with authentication, protected user data, a trading journal, dashboard analytics, TradingView charting, AI analysis, Pro-gated features, and backend-enforced AI usage limits.

The app is designed around this workflow:

```txt
Journal trades -> Review dashboard metrics -> Generate AI analysis -> Save AI history -> Create journal drafts
```

## Core Features

- Supabase authentication with persistent sessions
- Protected app routes
- Dark premium SaaS UI using glass panels and blue/purple AI actions
- Trading journal with create, read, update, delete, filter, and search
- Dashboard metrics from real Supabase trade data
- Performance chart, recent trades, win/loss overview, and P/L summaries
- Reusable TradingView chart component
- AI Analysis page with method selection and structured market context
- AI output enforced as structured JSON
- Pro AI access state and AI history saving
- Weekly Analysis page for higher-timeframe Pro analysis
- Backend-only OpenAI calls through Vercel API routes
- Supabase Row Level Security for user-isolated data
- Vercel deployment ready

## Tech Stack

- React
- Vite
- TypeScript
- Tailwind CSS v4
- Supabase Auth + Database + RLS
- OpenAI Responses API
- TradingView widget
- Vercel serverless API routes
- Recharts
- Lucide React icons

## Design System

TradeIntel uses a dark-only premium SaaS visual system.

Required colors:

```txt
Background: #0B0F17
Card:       #111827
Border:     #1F2937
Text:       #E5E7EB
Primary:    #3B82F6
Accent:     #8B5CF6
Success:    #22C55E
Danger:     #EF4444
```

Glass style:

```css
.glass {
  background: rgba(17, 24, 39, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.05);
}
```

## Folder Structure

```txt
api/
  ai/
    analyze.ts              # Backend AI route with plan and usage checks

src/
  assets/                   # Logo assets
  components/               # Shared UI and layout components
  context/                  # Auth provider
  data/                     # Demo data and fallbacks
  lib/                      # Supabase client and utilities
  pages/                    # App pages
  routes/                   # Router and protected routes
  services/                 # Trade, AI, and AI history service layers
  types/                    # Shared TypeScript types

supabase/
  migrations/               # Database schema and RLS migrations

public/
  favicon.png
  apple-touch-icon.png
```

## Environment Variables

Create `.env` or `.env.local` locally:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

Notes:

- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are used by the frontend.
- `SUPABASE_SERVICE_ROLE_KEY` must only be used server-side.
- `OPENAI_API_KEY` must only be used server-side.
- Add the same variables in Vercel project settings before deploying.

## Supabase Setup

Run the migrations in Supabase SQL Editor in order:

```txt
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_ai_analysis_history.sql
```

The database includes:

- `profiles`
  - user plan
  - AI weekly usage
  - AI total usage
  - weekly reset date

- `trades`
  - journal trade records
  - isolated by `user_id`

- `ai_analyses`
  - saved Pro AI analysis history
  - isolated by `user_id`

All user-owned tables have Row Level Security enabled.

## AI Access Control

AI requests are handled by:

```txt
api/ai/analyze.ts
```

Before any OpenAI call, the backend:

1. Validates the logged-in Supabase user.
2. Loads the user profile.
3. Checks the user plan.
4. For Free users:
   - weekly usage must be below 3
   - total usage must be below 12
   - weekly analysis is blocked
   - Pro-only methods are blocked
5. Calls OpenAI only if access is allowed.
6. Increments usage for Free users.
7. Returns structured JSON to the frontend.

Expected AI output:

```json
{
  "bias": "buy",
  "entry": "1945.00 - 1948.00",
  "stop_loss": "1938.00",
  "take_profit": "1960.00",
  "confidence": "high",
  "reason": "Bullish rejection after liquidity sweep near demand."
}
```

## Local Development

Install dependencies:

```bash
npm install
```

Run the Vite frontend:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Vercel Deployment

1. Push the repo to GitHub.
2. Import the repo in Vercel.
3. Use these settings:

```txt
Framework: Vite
Build command: npm run build
Output directory: dist
```

4. Add all environment variables in Vercel.
5. Redeploy after changing environment variables.

## Current Production Notes

- TradingView is embedded as a visual widget. The AI does not automatically read the TradingView chart.
- AI analysis currently uses structured user inputs such as pair, timeframe, method, market structure, liquidity event, key level, session, news risk, and notes.
- For true automatic chart analysis, the next step would be integrating a market data provider for OHLC candles or a chart screenshot/vision workflow.
- OpenAI quota or billing issues will return OpenAI API errors from the backend.

## Roadmap

- Add market data API integration for candle-based analysis
- Add richer trade metadata: session, strategy, tags, screenshots, risk/reward
- Add AI fallback/demo mode when OpenAI quota is unavailable
- Add billing provider integration for real Pro subscriptions
- Add admin dashboard for managing plans
- Add AI analysis templates per trading strategy
- Add export/reporting for weekly and monthly performance
- Add test coverage for service layers and protected route flows

## Repository

GitHub:

```txt
https://github.com/juliochrist/tradeintel-v2
```
