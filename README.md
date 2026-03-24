# CoverQuest - 32-Player NFL Pick'em Game

A full-stack, production-ready MVP for a 32-player NFL pick'em game with weekly spreads, Game Changers, and season-long scoring.

## Overview

**CoverQuest** is a competitive NFL pick'em platform where 32 fixed players compete across 2 conferences, 4 divisions per conference, and 4 players per division. Players pick 6 games against the spread each week and accumulate points based on how accurately they cover/miss the spread.

### Key Features

- ✅ **Weekly Picks**: Select 6 NFL games per week against the spread
- ✅ **Game Changers**: 
  - Castle Wall 🛡️ — Floor your score at 0 (no negatives)
  - Let It Ride 🚀 — 1.5x multiplier on your score
- ✅ **Scoring**: Point differential (how much you covered/missed the spread)
- ✅ **Leaderboards**: Overall, Conference, Division, and Weekly standings
- ✅ **Season Stats**: Cumulative scoring, division rank, best week tracking
- ✅ **PWA**: Offline support, installable on any device
- ✅ **Admin Panel**: Lock weeks, calculate scores, manual entry fallback

## Tech Stack

- **Frontend**: Vanilla JS PWA (no build tools, single HTML file)
- **Backend**: Vercel serverless functions (Node.js)
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth (email/password)
- **Hosting**: Vercel (frontend + API)
- **Sports Data**: ESPN free public API

## Project Structure

```
coverquest/
├── frontend/
│   ├── index.html (main app shell)
│   ├── app.js (app logic, screen routing)
│   ├── api.js (API client)
│   ├── styles.css (PWA-optimized styles)
│   ├── service-worker.js (offline support)
│   └── manifest.json (PWA manifest)
├── api/
│   ├── auth.js (signup, login, refresh)
│   ├── games.js (fetch games, live scores)
│   ├── picks.js (submit, update, fetch picks)
│   ├── leaderboard.js (standings)
│   ├── scores.js (calculate scores, season stats)
│   └── admin.js (week locks, batch operations)
├── db/
│   └── schema.sql (database setup)
├── vercel.json (deployment config)
├── package.json (dependencies)
└── README.md (this file)
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier works)
- Vercel account (optional, for hosting)

### 1. Clone and Setup

```bash
git clone https://github.com/yourusername/coverquest.git
cd coverquest

npm install
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Settings → Database** and copy your connection details
4. Run migrations:

```bash
psql postgresql://user:password@host:5432/postgres -f db/schema.sql
```

Or use Supabase Studio SQL editor to paste the schema.

### 3. Configure Environment

Create `.env.local`:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

JWT_SECRET=your-secret-key-min-32-chars-long
ADMIN_TOKEN=your-admin-token

ESPN_BASE_URL=https://site.api.espn.com/apis/site/v2/sports/football/nfl
```

### 4. Run Locally

```bash
npm run dev
```

Visit `http://localhost:3000`

### 5. Deploy to Vercel

```bash
npm run build
vercel deploy
```

Or connect your GitHub repo to Vercel for automatic deployments.

## API Endpoints

### Auth

- `POST /api/auth?action=signup` — Create account
- `POST /api/auth?action=login` — Sign in
- `GET /api/auth?action=profile` — Get user profile
- `POST /api/auth?action=refresh` — Refresh JWT token

### Games

- `GET /api/games?action=week&week=1` — Get games for week
- `GET /api/games?action=live` — Get live games
- `GET /api/games?action=all` — Get all games

### Picks

- `POST /api/picks?action=submit` — Submit weekly picks (6 games)
- `GET /api/picks?action=week&week=1` — Get your picks for week
- `PUT /api/picks?action=update&pickId=<id>` — Update a pick
- `GET /api/picks?action=user&userId=<id>&week=1` — Get user's picks

### Leaderboard

- `GET /api/leaderboard?action=overall` — Overall standings
- `GET /api/leaderboard?action=division&divisionId=AFCE` — Division standings
- `GET /api/leaderboard?action=conference&conferenceId=AFC` — Conference standings
- `GET /api/leaderboard?action=week&week=1` — Week standings

### Scores

- `GET /api/scores?action=user&userId=<id>` — User's all scores
- `GET /api/scores?action=season&userId=<id>` — Season stats
- `GET /api/scores?action=divisions` — All division stats
- `GET /api/scores?action=week&week=1` — Week scores

### Admin (requires admin JWT or token)

- `POST /api/admin?action=lock-week` — Lock week (prevent new picks)
- `POST /api/admin?action=calculate-scores` — Calculate scores for week
- `POST /api/admin?action=sync-espn` — Sync games from ESPN
- `POST /api/admin?action=scores-manual` — Manual score entry
- `GET /api/admin?action=picks-week&week=1` — View all picks for week

## Database Schema

### users
- `id` (UUID) — Primary key
- `email` (VARCHAR) — Unique email
- `username` (VARCHAR) — Unique username
- `password_hash` (VARCHAR) — Hashed password
- `avatar_color` (VARCHAR) — Hex color for avatar
- `division_id` (FK) — Assigned division
- `conference_id` (FK) — Assigned conference
- `is_admin` (BOOLEAN) — Admin flag
- `created_at` (TIMESTAMP) — Account creation

### games
- `id` (VARCHAR) — Game ID (ESPN ID)
- `week` (INT) — Week 1-18
- `away_team`, `home_team` (VARCHAR) — Team names
- `away_abbr`, `home_abbr` (VARCHAR) — 3-letter codes
- `spread` (DECIMAL) — Spread (positive = favorite)
- `favorite_team` (VARCHAR) — Which team is favored
- `kickoff_time` (TIMESTAMP) — Game start time (UTC)
- `away_final_score`, `home_final_score` (INT) — Final scores
- `status` (VARCHAR) — scheduled, live, final
- `synced_at` (TIMESTAMP) — Last ESPN sync

### picks
- `id` (UUID) — Primary key
- `user_id` (FK) — User who made pick
- `week` (INT) — Week 1-18
- `game_id` (FK) — Game ID
- `picked_team` (VARCHAR) — Which team picked
- `game_changers` (JSON) — {castleWall, letItRide} flags
- `submitted_at` (TIMESTAMP) — When submitted

### scores
- `id` (UUID) — Primary key
- `user_id` (FK) — User
- `week` (INT) — Week 1-18
- `game_id` (FK) — Game
- `picked_team` (VARCHAR) — Team picked
- `spread` (DECIMAL) — Spread at time of pick
- `actual_differential` (DECIMAL) — How much covered/missed
- `game_changers` (JSON) — Applied changers
- `game_changer_multiplier` (DECIMAL) — 1.0 or 1.5
- `floor_applied` (BOOLEAN) — Castle Wall floor applied
- `final_score` (DECIMAL) — Final score for this game
- `calculated_at` (TIMESTAMP) — When calculated

### season_stats
- `id` (UUID) — Primary key
- `user_id` (FK) — User
- `total_score` (DECIMAL) — Sum of all weeks
- `total_weeks_played` (INT) — Weeks with picks
- `division_rank` (INT) — Rank within division
- `conference_rank` (INT) — Rank within conference
- `overall_rank` (INT) — Overall rank
- `best_week` (INT) — Best scoring week
- `best_week_score` (DECIMAL) — Best week's score

### divisions
- `id` (VARCHAR) — AFC/NFC East/North/South/West
- `name` (VARCHAR) — Full name
- `conference_id` (FK) — Parent conference

### conferences
- `id` (VARCHAR) — AFC or NFC
- `name` (VARCHAR) — Full name

## Scoring Example

**Setup:**
- Game: Cowboys (favored -7) vs Eagles
- Actual result: Cowboys 24, Eagles 17 (Cowboys -7, covered perfectly)
- You picked Cowboys with Let It Ride 🚀

**Calculation:**
1. Spread: -7 (favored)
2. Actual differential: +7 (coverage match)
3. Base score: 7 points
4. Let It Ride (1.5x): 7 × 1.5 = **10.5 points**

**With Castle Wall 🛡️ (instead of Let It Ride):**
- If you had picked Eagles and missed by 8 points (negative)
- Base score: -8
- Castle Wall floor: 0 (no negatives)
- Final: **0 points** (protected from loss)

## Frontend Screens

### 1. Weekly Picks
- Display 6-9 NFL games for selected week
- Show spread and team info
- Select 1 team per game (max 6 picks)
- Apply Game Changers to each pick
- Submit button (disabled if < 6 picks or week locked)

### 2. Leaderboard
- Overall standings (top 50)
- Grouped by division
- Show rank, username, total score
- Highlight current user
- Toggle between Overall/Conference/Division/Week views

### 3. My Season
- Total score for season
- Division rank
- Conference rank
- Best week and score
- Weekly score chart (bar graph)
- 18-week breakdown

### 4. Profile
- User info (email, username)
- Avatar with color
- Division and conference
- Admin badge (if applicable)
- Sign out button

### Bottom Navigation
- 4 tabs: Picks, Standings, Season, Profile
- Sticky at bottom
- Highlight active screen

## Deployment Checklist

- [ ] Create Supabase project
- [ ] Run `db/schema.sql` to set up tables
- [ ] Create `.env.local` with all secrets
- [ ] Create GitHub repo (optional but recommended)
- [ ] Link repo to Vercel
- [ ] Set environment variables in Vercel dashboard
- [ ] Deploy with `vercel deploy`
- [ ] Test all screens in production
- [ ] Configure ESPN data sync (cron job)
- [ ] Create first admin user manually in DB
- [ ] Test week locking and score calculation

## Cost Estimate (Monthly)

- **Vercel**: Free tier (unless >5GB bandwidth)
- **Supabase**: Free tier (500MB storage, 2GB bandwidth)
- **ESPN API**: Free (no key required)
- **Total**: ~$0/month for small scale (<100 active users)

## Future Enhancements

- [ ] Real ESPN API integration (fetch schedule, live scores)
- [ ] Notifications (game starting, picks closing, scores calculated)
- [ ] Player stats dashboard (pick accuracy, best picks)
- [ ] Chat/trash talk between players
- [ ] Custom league creation
- [ ] Mobile app (React Native or Flutter)
- [ ] Dark mode
- [ ] Data export (CSV, PDF season recap)

## Support & Issues

For issues or questions, open a GitHub issue or contact the maintainers.

## License

MIT

---

**Built with ❤️ by Michael**
# coverquest
