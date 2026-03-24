# CoverQuest Deployment Guide

Complete step-by-step guide to deploy CoverQuest to production.

## Prerequisites

- GitHub account (optional but recommended)
- Vercel account (free)
- Supabase account (free)
- Node.js 18+ installed locally

## Step 1: Set Up Supabase Database

### Create Project

1. Go to [supabase.com](https://supabase.com/dashboard)
2. Click **New Project**
3. Choose a name, database password, and region (closest to users)
4. Wait 5-10 minutes for initialization

### Initialize Schema

1. Open **SQL Editor** in Supabase dashboard
2. Create new query
3. Paste the entire contents of `db/schema.sql`
4. Click **Run**

### Get Connection Credentials

1. Go to **Settings → Database**
2. Copy:
   - Project URL → `SUPABASE_URL`
   - Public Anon Key → `SUPABASE_KEY`
   - Service Role Key → `SUPABASE_SERVICE_KEY`

**⚠️ Keep these secret!** Never commit them to GitHub.

## Step 2: Generate Secrets

### JWT Secret (for auth tokens)

```bash
# Generate a random 32+ character string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Save this as `JWT_SECRET`

### Admin Token (for batch operations)

```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

Save this as `ADMIN_TOKEN`

## Step 3: Push Code to GitHub (Optional but Recommended)

```bash
# Initialize git repo
git init
git add .
git commit -m "Initial CoverQuest MVP"

# Create GitHub repo at github.com/new
git remote add origin https://github.com/yourusername/coverquest.git
git branch -M main
git push -u origin main
```

## Step 4: Deploy to Vercel

### Option A: Using GitHub (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Select **root** as base directory
4. Click **Continue**

### Option B: Using Vercel CLI

```bash
npm i -g vercel
vercel login
vercel deploy --prod
```

## Step 5: Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. **Settings → Environment Variables**
3. Add each variable (select "Production" for all):

```
SUPABASE_URL = https://your-project.supabase.co
SUPABASE_KEY = your-anon-key
SUPABASE_SERVICE_KEY = your-service-role-key
JWT_SECRET = your-generated-jwt-secret
ADMIN_TOKEN = your-generated-admin-token
ESPN_BASE_URL = https://site.api.espn.com/apis/site/v2/sports/football/nfl
```

4. Click **Save**
5. Redeploy: Go to **Deployments** → click latest → **Redeploy**

## Step 6: Create First Admin User

1. Open Supabase SQL Editor
2. Run:

```sql
UPDATE users SET is_admin = true WHERE email = 'your@email.com' LIMIT 1;
```

(Replace with the email you used to sign up)

## Step 7: Verify Deployment

1. Visit your Vercel URL
2. Sign in with test account
3. Check all screens:
   - ✅ Weekly Picks loads
   - ✅ Leaderboard displays
   - ✅ Profile shows user info
   - ✅ Service worker registered (DevTools → Application → Service Workers)

## Step 8: Set Up Cron Jobs (Optional)

For automatic game syncing and scoring, use external cron service:

### Sync Games (Monday-Friday, 8 AM)

Using [cron-job.org](https://cron-job.org):

1. Create new cron job
2. URL: `https://your-domain.com/api/admin?action=sync-espn`
3. Add header: `X-Admin-Token: your-admin-token`
4. Schedule: Monday-Friday 8:00 AM UTC
5. Save

### Calculate Scores (Monday, 12 PM UTC)

1. Create new cron job
2. URL: `https://your-domain.com/api/admin?action=calculate-scores`
3. Method: POST
4. Body: `{"week": 1}` (update week number)
5. Add header: `X-Admin-Token: your-admin-token`
6. Schedule: Every Monday noon
7. Save

**Note:** You'll need to manually update the week number each week, or create a more sophisticated system that determines the current week.

## Step 9: Manual Admin Tasks

### Lock a Week (prevent new picks)

Use Vercel Function logs or curl:

```bash
curl -X POST https://your-domain.com/api/admin?action=lock-week \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"week": 1}'
```

### Calculate Scores for a Week

```bash
curl -X POST https://your-domain.com/api/admin?action=calculate-scores \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"week": 1}'
```

### Sync ESPN Games

```bash
curl -X POST https://your-domain.com/api/admin?action=sync-espn \
  -H "X-Admin-Token: YOUR_ADMIN_TOKEN"
```

## Verification Checklist

- [ ] Supabase project created and schema loaded
- [ ] All environment variables set in Vercel
- [ ] Vercel deployment successful
- [ ] Frontend loads without errors
- [ ] Auth works (signup/login)
- [ ] API endpoints respond
- [ ] Database queries work
- [ ] Service worker registered
- [ ] First admin user created
- [ ] Cron jobs configured (optional)

## Monitoring & Logs

### Vercel Logs

1. Dashboard → Deployments → select deployment
2. Click **View Logs**
3. Watch for errors in real-time

### Supabase Logs

1. Go to Supabase dashboard
2. **Database → Logs** to see query history
3. **Auth → Users** to monitor signups

## Troubleshooting

### "Unauthorized" errors
- Check JWT_SECRET is set correctly
- Verify token in localStorage isn't expired
- Try refreshing token with `/api/auth?action=refresh`

### "Connection failed" errors
- Verify SUPABASE_URL and SUPABASE_KEY are correct
- Check Supabase project is running
- Look at database logs for connection errors

### CORS errors
- Ensure `Access-Control-Allow-Origin` headers are set
- Check `vercel.json` routes are correct

### Games not loading
- Verify ESPN API is accessible: `curl https://site.api.espn.com/apis/site/v2/sports/football/nfl/schedule`
- Check Supabase games table for data

### Scores not calculating
- Check admin token is set in environment
- Verify game status is "final" in database
- Look at Vercel logs for calculation errors

## Database Backups

Supabase automatically backs up your database. To restore:

1. Supabase dashboard → **Settings → Backups**
2. Select backup date
3. Click **Restore**

## Scaling Tips

For >100 concurrent users:

- Enable **Supabase Read Replicas** for leaderboard queries
- Add caching layer (Vercel Edge Cache for static data)
- Batch score calculations instead of real-time
- Implement rate limiting on sensitive endpoints

## Cost Optimization

- Use Vercel free tier for <5GB bandwidth/month
- Supabase free tier: 500MB storage, 2GB bandwidth
- Monitor real-time connections; disconnect after use
- Archive old season data after season ends

---

**Your CoverQuest is live! 🚀**
