# 🏈 CoverQuest MVP - START HERE

## You have a complete, production-ready NFL pick'em game.

**Everything is built.** No more coding needed. Just deploy.

---

## 🚀 Quick Start (30 minutes)

### 1. Create Supabase Project (10 min)
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Copy: **Project URL**, **Public Anon Key**, **Service Role Key**
4. Open **SQL Editor**
5. Paste `db/schema.sql`
6. Click **Run**

### 2. Generate Secrets (2 min)
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # JWT_SECRET
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"  # ADMIN_TOKEN
```

### 3. Deploy to Vercel (10 min)
1. Push code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import GitHub repo
4. Set 6 environment variables (Supabase URL, keys, secrets)
5. Click **Deploy**

### 4. Create Admin User (3 min)
In Supabase SQL Editor:
```sql
UPDATE users SET is_admin=true WHERE email='your@email.com';
```

### 5. Test (5 min)
✅ Visit your Vercel URL  
✅ Sign up  
✅ Pick 6 games  
✅ Check leaderboard  

**Done!** You're live. 🎉

---

## 📖 Documentation

- **QUICKSTART.md** — This but longer (read next)
- **DEPLOYMENT.md** — Step-by-step production setup
- **ARCHITECTURE.md** — System design & diagrams
- **DEVELOPMENT.md** — How to modify code
- **README.md** — Complete API & feature docs

---

## 🎯 What You Get

✅ 4-screen PWA app (Picks, Leaderboard, Season, Profile)  
✅ 18 API endpoints (auth, games, picks, scoring, admin)  
✅ Full database schema (8 tables, 32 players)  
✅ Offline support (service worker)  
✅ Mobile-responsive design  
✅ Zero build tools (vanilla JS)  
✅ Serverless (Vercel)  
✅ Fully managed DB (Supabase)  
✅ Production-ready auth (JWT)  
✅ ~$0/month cost  

---

## 📦 What's Included

```
coverquest/
├── frontend/          (6 files, single-page app)
├── api/               (8 files, Node.js serverless)
├── db/                (schema.sql, ready to deploy)
├── package.json       (dependencies)
├── vercel.json        (deployment config)
└── *.md               (7 guides, 80+ pages)
```

---

## 🎮 Features

**Player Features:**
- Email/password signup & login
- Pick 6 games per week (against the spread)
- Game Changers (Castle Wall 🛡️, Let It Ride 🚀)
- Overall leaderboard (all 32 players)
- Division standings
- Conference standings
- Week-by-week rankings
- Season cumulative score
- Best week tracking
- Profile with stats
- Offline support
- Mobile app (PWA)

**Admin Features:**
- Lock weeks (prevent picks)
- Calculate scores (batch)
- Manual score entry
- View all picks
- Sync ESPN games
- Audit logging

---

## 🌐 Your URLs (after deploy)

```
Frontend: https://your-domain.vercel.app
API:      https://your-domain.vercel.app/api/...
Database: https://your-project.supabase.co
```

---

## 💰 Cost

- Vercel: Free (< 5GB/month bandwidth)
- Supabase: Free (500MB storage, 2GB bandwidth)
- ESPN API: Free (no key)
- **Total: ~$0/month**

---

## ❓ Need Help?

1. **Setup Issues?** → Read DEPLOYMENT.md
2. **Want to Customize?** → Read DEVELOPMENT.md
3. **How does it work?** → Read ARCHITECTURE.md
4. **API Details?** → Read README.md

---

## ✅ Deployment Checklist

- [ ] Read QUICKSTART.md
- [ ] Create Supabase project
- [ ] Generate JWT_SECRET & ADMIN_TOKEN
- [ ] Push code to GitHub
- [ ] Deploy to Vercel
- [ ] Set 6 environment variables
- [ ] Create admin user
- [ ] Test (signup, picks, leaderboard, offline)
- [ ] Share with your 31 players
- [ ] Watch the games! 🏈

---

**Your CoverQuest is ready to launch!**

👉 **Next:** Read `QUICKSTART.md` for detailed 30-minute setup.
