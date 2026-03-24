# CoverQuest Architecture

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER BROWSERS                               │
│  (Desktop, Mobile, Tablet - any device with HTTPS)                 │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │          FRONTEND (Vanilla JS PWA)                         │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │ HTML Shell (index.html)                             │  │   │
│  │  │ ├─ Auth Screen      (login/signup)                  │  │   │
│  │  │ ├─ Picks Screen     (6 games + Game Changers)      │  │   │
│  │  │ ├─ Standings Screen (leaderboard by div/conf)      │  │   │
│  │  │ ├─ Season Screen    (cumulative score + chart)     │  │   │
│  │  │ └─ Profile Screen   (user info)                     │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │ App Logic (app.js)                                  │  │   │
│  │  │ ├─ Screen routing & rendering                       │  │   │
│  │  │ ├─ State management                                 │  │   │
│  │  │ ├─ Event handlers                                   │  │   │
│  │  │ └─ Loading/error states                             │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │ API Client (api.js)                                 │  │   │
│  │  │ ├─ Auth methods                                     │  │   │
│  │  │ ├─ Games/picks methods                              │  │   │
│  │  │ ├─ Leaderboard methods                              │  │   │
│  │  │ ├─ Scores methods                                   │  │   │
│  │  │ ├─ Token management                                 │  │   │
│  │  │ └─ Error handling                                   │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │ Service Worker (service-worker.js)                  │  │   │
│  │  │ ├─ Offline caching                                  │  │   │
│  │  │ ├─ Network-first strategy (API)                     │  │   │
│  │  │ ├─ Cache-first strategy (assets)                    │  │   │
│  │  │ └─ Background sync                                  │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │ PWA Features                                         │  │   │
│  │  │ ├─ Manifest (manifest.json)                         │  │   │
│  │  │ ├─ Install prompt                                   │  │   │
│  │  │ ├─ Offline support                                  │  │   │
│  │  │ └─ Mobile-optimized UI                              │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                          ↓ HTTPS ↓
                     (All traffic encrypted)
┌─────────────────────────────────────────────────────────────────────┐
│                      VERCEL (Edge CDN + Serverless)                 │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ Frontend Static Assets (cached globally)                  │   │
│  │ ├─ index.html       → Edge locations                      │   │
│  │ ├─ styles.css       → Compressed & cached                 │   │
│  │ ├─ app.js           → Minified                            │   │
│  │ ├─ api.js           → Bundled                             │   │
│  │ └─ manifest.json    → PWA metadata                        │   │
│  └────────────────────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ Serverless Functions (Node.js 18.x)                       │   │
│  │                                                             │   │
│  │ /api/auth ──────────────────────────────────────────┐    │   │
│  │  ├─ POST signup       (create account)              │    │   │
│  │  ├─ POST login        (JWT auth)                    │    │   │
│  │  ├─ GET profile       (user info)                   │    │   │
│  │  └─ POST refresh      (renew token)                 │    │   │
│  │                                                      │    │   │
│  │ /api/games ──────────────────────────────────────────┐  │   │
│  │  ├─ GET week          (games for week 1-18)        │    │   │
│  │  ├─ GET live          (games in progress)          │    │   │
│  │  └─ GET all           (all games for season)       │    │   │
│  │                                                      │    │   │
│  │ /api/picks ───────────────────────────────────────────┐ │   │
│  │  ├─ POST submit       (6 picks per week)           │    │   │
│  │  ├─ GET week          (your picks for week)        │    │   │
│  │  ├─ PUT update        (modify a pick)              │    │   │
│  │  └─ GET user          (picks by user/week)         │    │   │
│  │                                                      │    │   │
│  │ /api/leaderboard ───────────────────────────────────┐   │   │
│  │  ├─ GET overall       (all players)                │    │   │
│  │  ├─ GET division      (by division)                │    │   │
│  │  ├─ GET conference    (by conference)             │    │   │
│  │  └─ GET week          (week results)              │    │   │
│  │                                                      │    │   │
│  │ /api/scores ──────────────────────────────────────────┐  │   │
│  │  ├─ GET user          (all user scores)            │    │   │
│  │  ├─ GET season        (season stats)               │    │   │
│  │  ├─ GET divisions     (all divisions)              │    │   │
│  │  └─ GET week          (week scores)                │    │   │
│  │                                                      │    │   │
│  │ /api/admin ────────────────────────────────────────────┐  │   │
│  │  ├─ POST lock-week     (lock picks)                │    │   │
│  │  ├─ POST calculate     (calc scores)               │    │   │
│  │  ├─ POST sync-espn     (fetch games)               │    │   │
│  │  ├─ POST manual-entry  (manual scores)             │    │   │
│  │  └─ GET picks-week     (view all picks)            │    │   │
│  │                                                      │    │   │
│  └────────────────────────────────────────────────────────┘   │   │
│                                                                  │   │
│  ┌────────────────────────────────────────────────────────┐   │   │
│  │ Middleware & Services                                 │   │   │
│  │ ├─ JWT Verification (all protected routes)            │   │   │
│  │ ├─ CORS Headers                                       │   │   │
│  │ ├─ Input Validation                                   │   │   │
│  │ ├─ Error Handling (400/401/500)                       │   │   │
│  │ └─ Request Logging                                    │   │   │
│  └────────────────────────────────────────────────────────┘   │   │
│                                                                  │   │
└─────────────────────────────────────────────────────────────────────┘
                          ↓ TCP/IP ↓
                      (Supabase endpoint)
┌─────────────────────────────────────────────────────────────────────┐
│                      SUPABASE (PostgreSQL)                          │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ Core Tables                                                │   │
│  │                                                             │   │
│  │ users (32 fixed players)                                   │   │
│  │ ├─ id (UUID)                                              │   │
│  │ ├─ email, username (unique)                               │   │
│  │ ├─ password_hash (SHA256)                                 │   │
│  │ ├─ avatar_color, division_id, conference_id              │   │
│  │ ├─ is_admin (boolean)                                     │   │
│  │ └─ created_at, updated_at (timestamps)                    │   │
│  │ Indexes: email, division_id, conference_id                │   │
│  │                                                             │   │
│  │ games (18 weeks × ~16 games = ~288)                       │   │
│  │ ├─ id (ESPN ID)                                           │   │
│  │ ├─ week (1-18)                                            │   │
│  │ ├─ away_team, home_team, spread                           │   │
│  │ ├─ favorite_team, kickoff_time                            │   │
│  │ ├─ away_final_score, home_final_score                     │   │
│  │ ├─ status (scheduled/live/final)                          │   │
│  │ └─ synced_at (ESPN last sync)                             │   │
│  │ Indexes: week, status, synced_at                          │   │
│  │                                                             │   │
│  │ picks (32 users × 6 picks × 18 weeks = 3,456)            │   │
│  │ ├─ id (UUID)                                              │   │
│  │ ├─ user_id, week, game_id (FKs)                           │   │
│  │ ├─ picked_team                                            │   │
│  │ ├─ game_changers (JSON: castleWall, letItRide)            │   │
│  │ └─ submitted_at (timestamp)                               │   │
│  │ Indexes: user_id+week, user_id+game_id                    │   │
│  │                                                             │   │
│  │ scores (calculated after games finish)                    │   │
│  │ ├─ id (UUID)                                              │   │
│  │ ├─ user_id, week, game_id (FKs)                           │   │
│  │ ├─ picked_team, actual_differential                       │   │
│  │ ├─ game_changers (JSON)                                   │   │
│  │ ├─ game_changer_multiplier (1.0 or 1.5)                   │   │
│  │ ├─ floor_applied (Castle Wall used)                       │   │
│  │ ├─ final_score                                            │   │
│  │ └─ calculated_at (timestamp)                              │   │
│  │ Indexes: user_id+week                                     │   │
│  │                                                             │   │
│  │ season_stats (32 users)                                   │   │
│  │ ├─ user_id (FK, unique)                                   │   │
│  │ ├─ total_score, total_weeks_played                        │   │
│  │ ├─ division_rank, conference_rank, overall_rank           │   │
│  │ ├─ best_week, best_week_score                             │   │
│  │ └─ calculated_at (timestamp)                              │   │
│  │ Indexes: total_score DESC                                 │   │
│  │                                                             │   │
│  │ divisions (8: AFC/NFC × E/N/S/W)                           │   │
│  │ ├─ id (VARCHAR)                                           │   │
│  │ ├─ name                                                   │   │
│  │ └─ conference_id (FK)                                     │   │
│  │                                                             │   │
│  │ conferences (2: AFC, NFC)                                 │   │
│  │ ├─ id (VARCHAR)                                           │   │
│  │ └─ name                                                   │   │
│  │                                                             │   │
│  │ week_locks (1 per week when locked)                       │   │
│  │ ├─ week (unique)                                          │   │
│  │ ├─ locked_at (timestamp)                                  │   │
│  │ └─ locked_by_admin_id (FK)                                │   │
│  │                                                             │   │
│  │ audit_logs (admin activity tracking)                      │   │
│  │ ├─ admin_id (FK)                                          │   │
│  │ ├─ action (string)                                        │   │
│  │ ├─ details (JSON)                                         │   │
│  │ └─ created_at (timestamp)                                 │   │
│  │                                                             │   │
│  └────────────────────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ Database Features                                          │   │
│  │ ├─ Foreign key constraints (data integrity)                │   │
│  │ ├─ Transactions (atomic operations)                        │   │
│  │ ├─ Indexes (query optimization)                            │   │
│  │ ├─ Automatic backups                                       │   │
│  │ ├─ Point-in-time recovery                                  │   │
│  │ └─ Real-time subscriptions (optional)                      │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                          ↓ HTTPS ↓
                      (Optional integrations)
┌─────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                              │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ ESPN API (Free - No Key Required)                          │   │
│  │                                                             │   │
│  │ GET /schedule (Monday-Friday)                              │   │
│  │ └─ Returns: games, spreads, kickoff times                 │   │
│  │                                                             │   │
│  │ GET /scoreboard (every 15 mins Sun-Mon)                    │   │
│  │ └─ Returns: live scores, current status                   │   │
│  │                                                             │   │
│  │ GET /summary/:gameId (after games finish)                  │   │
│  │ └─ Returns: final scores, stats, odds                     │   │
│  │                                                             │   │
│  │ Implementation: api/espn.js                                │   │
│  │ ├─ fetchSchedule() - schedule sync                        │   │
│  │ ├─ fetchLiveScores() - live polling                       │   │
│  │ └─ fetchGameScores() - final scores                       │   │
│  │                                                             │   │
│  └────────────────────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ Optional: Cron Service (cron-job.org or similar)           │   │
│  │                                                             │   │
│  │ Mon-Fri 8:00 AM UTC → POST /api/admin?action=sync-espn    │   │
│  │ └─ Sync latest schedule & spreads                         │   │
│  │                                                             │   │
│  │ Every Monday 12:00 PM UTC → POST /api/admin?... (scores)  │   │
│  │ └─ Calculate scores for previous week                     │   │
│  │                                                             │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Examples

### Authentication Flow

```
User enters email/password
         ↓
frontend/app.js → api.signup(email, password)
         ↓
api/auth.js → hashPassword(password)
         ↓
Supabase → INSERT INTO users
         ↓
api/auth.js → generateToken(userId)
         ↓
frontend/app.js → localStorage.setItem('cq_token', token)
         ↓
Navigate to /picks screen
```

### Pick Submission Flow

```
User selects 6 games + Game Changers
         ↓
frontend/app.js → api.submitPicks(week, picks)
         ↓
api/picks.js → verify JWT token
         ↓
api/picks.js → validate 6 picks exactly
         ↓
api/picks.js → check if week is locked
         ↓
Supabase → UPSERT INTO picks
         ↓
frontend/app.js → showAlert('Picks submitted!')
         ↓
Refresh leaderboard
```

### Score Calculation Flow

```
Admin clicks "Calculate Week 1"
         ↓
api/admin.js → verify JWT + is_admin
         ↓
api/admin.js → SELECT games WHERE week=1 AND status='final'
         ↓
api/admin.js → SELECT picks WHERE week=1
         ↓
For each pick:
  - Get game spread
  - Calculate actual differential
  - Apply Game Changers
  - Calculate final score
         ↓
Supabase → UPSERT INTO scores (batch)
         ↓
Supabase → UPDATE season_stats (for each user)
         ↓
audit_logs → INSERT admin action
         ↓
Return success message
```

---

## Technology Stack Details

### Frontend

| Component | Technology | Why |
|-----------|-----------|-----|
| Language | Vanilla JS (ES6+) | No build tools, zero dependencies |
| HTML | HTML5 | Semantic, PWA support |
| CSS | Vanilla CSS3 | Grid, flexbox, variables |
| Network | Fetch API | Native, modern, no jQuery |
| Storage | localStorage | Simple, secure for tokens |
| Offline | Service Worker | W3C standard, works everywhere |
| PWA | Web App Manifest | Install on any device |

### Backend

| Component | Technology | Why |
|-----------|-----------|-----|
| Compute | Vercel Functions | Serverless, auto-scaling, free tier |
| Runtime | Node.js 18.x | JavaScript everywhere, mature |
| Auth | JWT | Stateless, scalable, secure |
| Validation | Manual checks | Simple, explicit, secure |
| Logging | console.log | Free, simple, works in Vercel |

### Database

| Component | Technology | Why |
|-----------|-----------|-----|
| Database | PostgreSQL | ACID, reliable, proven |
| Host | Supabase | Free tier, auto backups, easy setup |
| Client | @supabase/supabase-js | Official SDK, simple API |
| Queries | SQL | Direct queries, full control |
| Transactions | Native | Atomic score calculations |

### Deployment

| Component | Technology | Why |
|-----------|-----------|-----|
| Frontend | Vercel Edge | Fast, global CDN, auto deploy |
| API | Vercel Functions | Serverless, scales to zero |
| Database | Supabase Postgres | Managed, secure, backed up |
| DNS | Vercel | Auto-managed, fast |

---

## Performance Characteristics

### Frontend Load Time
- Initial load: <2 seconds (cached service worker)
- API call: 200-500ms (Vercel edge + Supabase)
- Offline: <1 second (service worker cache)

### Database Query Time
- Simple SELECT: 5-50ms
- Batch upsert (32 users): 50-150ms
- Aggregation (leaderboard): 20-100ms

### Scaling Limits
- Free tier: <100 concurrent users
- Paid tier: Can scale to 1,000+ concurrent

---

## Security Architecture

```
User Browser
      ↓
   HTTPS (encrypted transit)
      ↓
Vercel Edge (DDoS protected)
      ↓
JWT Verification (stateless)
      ↓
Request Validation (input checks)
      ↓
Database Query (parameterized)
      ↓
Supabase Encryption (at rest)
```

---

## Disaster Recovery

| Scenario | Recovery |
|----------|----------|
| Service Worker cache stale | Manual cache clear |
| Supabase down | Show offline message |
| Vercel down | DNS failover (manual setup) |
| Database corrupted | Supabase auto-restore from backup |
| Lost passwords | Email recovery (future feature) |

---

## Cost Model

| Service | Free Tier | Price |
|---------|-----------|-------|
| Vercel | 10GB/month bandwidth | $0.50/extra GB |
| Supabase | 500MB storage, 2GB bandwidth | $5-500/month |
| ESPN | Free | $0 |
| Cron-job.org | 1 job free | $0.09/month per job |
| **Total** | **~$0/month** | **~$0.20/month** |

---

**This architecture supports the full CoverQuest MVP and can scale to production workloads.**
