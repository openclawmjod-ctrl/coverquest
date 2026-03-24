# CoverQuest Development Guide

Local development setup and contributing guidelines.

## Local Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create `.env.local`

Copy `.env.example` and fill in test values:

```bash
cp .env.example .env.local
```

For local development, you can use dummy values:

```
SUPABASE_URL=https://test.supabase.co
SUPABASE_KEY=test-key
SUPABASE_SERVICE_KEY=test-service-key

JWT_SECRET=test-secret-key-must-be-32-chars-minimum-long

ESPN_BASE_URL=https://site.api.espn.com/apis/site/v2/sports/football/nfl
ADMIN_TOKEN=test-admin-token
```

### 3. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Project Structure

```
frontend/
├── index.html          # App shell, 4 screens, nav
├── app.js             # App logic, state, screen routing
├── api.js             # API client methods
├── styles.css         # PWA-optimized styles
├── service-worker.js  # Offline support, caching
└── manifest.json      # PWA metadata

api/
├── index.js           # Router
├── auth.js            # Login, signup, profile
├── games.js           # Fetch games, live scores
├── picks.js           # Submit picks, fetch picks
├── leaderboard.js     # Overall, division, conference
├── scores.js          # Calculate scores, stats
├── admin.js           # Admin operations
└── espn.js            # ESPN API integration

db/
├── schema.sql         # Complete database schema
└── migrations/        # Version control (optional)
```

## Development Workflow

### Adding a New Endpoint

1. **Create handler** in `api/[name].js`:

```javascript
export async function myAction(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Do something
    return res.status(200).json({ data });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Failed' });
  }
}

export default async (req, res) => {
  const { action } = req.query;

  switch (action) {
    case 'my-action':
      return myAction(req, res);
    default:
      return res.status(404).json({ message: 'Not found' });
  }
};
```

2. **Add to router** in `api/index.js`:

```javascript
import myHandler from './my.js';

// In handler function:
else if (parts[1] === 'my') {
  return myHandler(req, res);
}
```

3. **Add client method** in `frontend/api.js`:

```javascript
async myAction(param) {
  return this.request('/my/endpoint', {
    method: 'POST',
    body: JSON.stringify({ param }),
  });
}
```

4. **Use in app** in `frontend/app.js`:

```javascript
const result = await api.myAction(value);
```

### Adding a New Screen

1. **Add HTML in index.html**:

```html
<div id="screen-myscreen" class="screen">
  <div class="loading">
    <div class="spinner"></div>
    <p>Loading...</p>
  </div>
</div>
```

2. **Add method to app.js**:

```javascript
async loadMyScreen() {
  this.setLoading('myscreen', true);
  try {
    const data = await api.getData();
    this.renderMyScreen(data);
  } finally {
    this.setLoading('myscreen', false);
  }
}

renderMyScreen(data) {
  const screen = document.getElementById('screen-myscreen');
  screen.innerHTML = `
    <div class="header">
      <h1>My Screen</h1>
    </div>
    <!-- content -->
  `;
}
```

3. **Add nav item link** in index.html bottom nav:

```html
<a href="#" class="nav-item" data-screen="myscreen">
  <div class="nav-icon">🎯</div>
  <div>MyScreen</div>
</a>
```

4. **Trigger load in showScreen**:

```javascript
showScreen(screenName) {
  // ... existing code ...
  if (screenName === 'myscreen') {
    this.loadMyScreen();
  }
}
```

### Database Migrations

For schema changes in development:

1. Make change in `db/schema.sql`
2. Run in Supabase SQL editor to test
3. Test with local Vercel dev server
4. Commit to git with migration notes

## Testing Checklist

Before deploying:

- [ ] Auth works (signup, login, logout)
- [ ] Can submit 6 picks for a week
- [ ] Game Changers can be toggled
- [ ] Picks persist after page refresh
- [ ] Leaderboard loads and sorts correctly
- [ ] Season stats show cumulative score
- [ ] Profile displays user info
- [ ] Service worker installed (DevTools → Application)
- [ ] Works offline (disable network, try picking)
- [ ] No console errors

## Common Issues

### "Module not found" errors

```bash
npm install  # Reinstall dependencies
```

### API 401 Unauthorized

- Check token is being sent in headers
- Verify JWT_SECRET matches what's in auth.js
- Try logging out and back in

### Database not connected

- Verify SUPABASE_URL and SUPABASE_KEY in `.env.local`
- Check Supabase project is running
- Test connection: `curl -H "Authorization: Bearer $SUPABASE_KEY" $SUPABASE_URL`

### Service Worker not registering

- Check `/service-worker.js` path is correct
- Verify site is served over HTTPS (or localhost)
- Check DevTools → Application → Service Workers

### Styles not loading

- Clear browser cache (Cmd+Shift+Delete)
- Check `styles.css` is in frontend folder
- Verify manifest.json references styles.css

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes, test locally
npm run dev

# Commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/my-feature
```

## Code Style

- Use consistent indentation (2 spaces)
- Comment complex logic
- Use descriptive variable names
- Keep functions small and focused
- Error messages should be user-friendly

## Performance Tips

- Lazy load images (use data URLs for small assets)
- Cache API responses where appropriate
- Minimize re-renders (update only changed elements)
- Use service worker to cache static assets
- Batch database queries when possible

## Security Checklist

- ✅ Never log sensitive data (tokens, passwords)
- ✅ Always validate user input
- ✅ Check auth token before admin operations
- ✅ Use parameterized queries (Supabase does this)
- ✅ Don't expose API secrets in frontend code
- ✅ Rate limit login/signup endpoints

## Debugging Tips

### Frontend

- Use DevTools Console (F12)
- Check `localStorage.getItem('cq_token')` for auth token
- Use `app` global to inspect app state

### Backend

- Check Vercel logs: Dashboard → Deployments → View Logs
- Check Supabase logs: Database → Logs
- Add `console.log()` for debugging

### Network

- DevTools → Network tab to see API calls
- Check request/response headers and body
- Look for CORS errors or 401/403

## Performance Profiling

```javascript
// Time an operation
console.time('operation');
await api.getData();
console.timeEnd('operation');
```

Check Network tab for slow API calls and optimize queries.

---

Happy coding! 🚀
