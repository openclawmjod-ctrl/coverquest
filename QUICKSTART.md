# CoverQuest MVP - Quick Start Guide

## 🚀 Get Live in 30 Minutes

### Step 1: Prepare Supabase (10 min)

1. Go to [supabase.com](https://supabase.com)
2. Create new project (any region)
3. Wait for initialization
4. Copy:
   - Project URL → Save as `SUPABASE_URL`
   - Public Anon Key → Save as `SUPABASE_KEY`
   - Service Role Key → Save as `SUPABASE_SERVICE_KEY`
5. Go to **SQL Editor**
6. Create new query
7. Paste entire content of `db/schema.sql`
8. Click **Run**

### Step 2: Generate Secrets (2 min)

```bash
# In terminal:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # JWT_SECRET
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"  # ADMIN_TOKEN
```

Save these values.

### Step 3: Deploy to Vercel (15 min)

1. Push code to GitHub:
```bash
git init
git add .
git commit -m "Initial CoverQuest MVP"
git remote add origin https://github.com/YOU/coverquest.git
git branch -M main
git push -u origin main
```

2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repo
4. Click **Continue**
5. Set Environment Variables:
   - `SUPABASE_URL` = your URL
   - `SUPABASE_KEY` = your anon key
   - `SUPABASE_SERVICE_KEY` = your service role key
   - `JWT_SECRET` = generated secret
   - `ADMIN_TOKEN` = generated admin token
   - `ESPN_BASE_URL` = https://site.api.espn.com/apis/site/v2/sports/football/nfl
6. Click **Deploy**
7. Wait ~5 minutes
8. Visit your domain

### Step 4: Create Admin User (3 min)

1. Go back to Supabase
2. Open **SQL Editor**
3. Create new query:
```sql
UPDATE users 
SET is_admin = true 
WHERE email = 'your@email.com' 
LIMIT 1;
```
4. Click **Run**

### Step 5: Test (Immediately)

✅ Visit your Vercel URL  
✅ Sign up with test email  
✅ Login  
✅ Submit picks (pick any 6 games)  
✅ Check leaderboard  
✅ View profile  
✅ Service worker (DevTools → Application → Service Workers)  

**Done! 🎉**

---

## 📋 Environment Variables

```bash
# Supabase (from dashboard)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIs...

# Auth secrets (generate with crypto)
JWT_SECRET=a1b2c3d4e5f6g7h8...32+ chars
ADMIN_TOKEN=x9y8z7w6v5u4t3s2...

# ESPN (static, no key needed)
ESPN_BASE_URL=https://site.api.espn.com/apis/site/v2/sports/football/nfl
```

---

## 🎯 Key Files

| File | Purpose |
|------|---------|
| `frontend/index.html` | App shell + 4 screens |
| `frontend/app.js` | App logic & routing |
| `api/auth.js` | Login/signup |
| `api/picks.js` | Submit picks |
| `db/schema.sql` | Database setup |
| `README.md` | Full documentation |
| `DEPLOYMENT.md` | Detailed deploy guide |

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Connection refused" | Check Supabase URL is correct |
| "Unauthorized" | Verify JWT_SECRET matches |
| "Table not found" | Run db/schema.sql in Supabase |
| "Service worker error" | Clear browser cache & reload |
| "CORS error" | Check Vercel env vars are set |

---

## 📱 Testing Checklist

- [ ] Can sign up
- [ ] Can login
- [ ] Can submit 6 picks
- [ ] Can toggle Game Changers
- [ ] Leaderboard loads
- [ ] Season stats show
- [ ] Profile displays info
- [ ] Works offline (disable network)
- [ ] Service worker registered

---

## 🌐 Your URLs

After deployment:

```
Frontend: https://your-domain.vercel.app
API:      https://your-domain.vercel.app/api/...
Supabase: https://your-project.supabase.co
```

---

## 🔐 Admin Operations

### Lock a Week (from Supabase SQL Editor)

```sql
INSERT INTO week_locks (week) VALUES (1);
```

### Manual Score Entry (via cURL)

```bash
curl -X POST https://your-domain.vercel.app/api/admin?action=scores-manual \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":"<uuid>","week":1,"gameId":"game123","score":12.5}'
```

---

## 📞 Support

- **Setup Issues?** → See DEPLOYMENT.md
- **Code Questions?** → See DEVELOPMENT.md
- **Feature Details?** → See README.md
- **Errors?** → Check Vercel Logs + Supabase Logs

---

**You're live! Welcome to CoverQuest.** 🏈
