// CoverQuest Main App
class CoverQuestApp {
  constructor() {
    this.currentScreen = 'auth';
    this.currentUser = null;
    this.currentWeek = 1;
    this.games = [];
    this.picks = {};
    this.leaderboard = [];
    this.seasonStats = null;
    this.loadingState = {};
    this.cache = {};
    
    this.init();
  }

  async init() {
    console.log('Initializing CoverQuest...');
    
    // Register service worker
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/service-worker.js');
        console.log('Service worker registered');
      } catch (error) {
        console.warn('Service worker registration failed:', error);
      }
    }

    // Check if user is logged in
    const token = api.getToken();
    if (token) {
      try {
        const profile = await api.getProfile();
        this.currentUser = profile;
        this.showScreen('picks');
      } catch (error) {
        console.error('Failed to load profile:', error);
        api.logout();
        this.showScreen('auth');
      }
    } else {
      this.showScreen('auth');
    }

    this.attachEventListeners();
  }

  attachEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const screen = item.getAttribute('data-screen');
        if (screen === 'logout') {
          this.logout();
        } else {
          this.showScreen(screen);
        }
      });
    });

    // Auth form tabs
    document.querySelectorAll('.auth-tab').forEach((tab) => {
      tab.addEventListener('click', () => this.switchAuthTab(tab.getAttribute('data-tab')));
    });

    // Auth forms
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
      signupForm.addEventListener('submit', (e) => this.handleSignup(e));
    }
  }

  showScreen(screenName) {
    document.querySelectorAll('.screen').forEach((screen) => {
      screen.classList.remove('active');
    });

    const screenEl = document.getElementById(`screen-${screenName}`);
    if (screenEl) {
      screenEl.classList.add('active');
      this.currentScreen = screenName;

      // Update nav
      document.querySelectorAll('.nav-item').forEach((item) => {
        item.classList.remove('active');
        if (item.getAttribute('data-screen') === screenName) {
          item.classList.add('active');
        }
      });

      // Load screen data
      if (screenName === 'picks') {
        this.loadPicksScreen();
      } else if (screenName === 'standings') {
        this.loadStandingsScreen();
      } else if (screenName === 'season') {
        this.loadSeasonScreen();
      } else if (screenName === 'profile') {
        this.loadProfileScreen();
      }
    }
  }

  switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach((t) => {
      t.classList.remove('active');
    });
    document.querySelectorAll('.auth-form').forEach((f) => {
      f.classList.remove('active');
    });

    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`${tab}-form`).classList.add('active');
  }

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    this.setLoading('auth', true);
    try {
      const user = await api.login(email, password);
      this.currentUser = user;
      this.showScreen('picks');
    } catch (error) {
      this.showAlert('error', error.message);
    } finally {
      this.setLoading('auth', false);
    }
  }

  async handleSignup(e) {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm').value;

    if (password !== confirmPassword) {
      this.showAlert('error', 'Passwords do not match');
      return;
    }

    this.setLoading('auth', true);
    try {
      const user = await api.signup(email, username, password);
      this.currentUser = user;
      this.showScreen('picks');
    } catch (error) {
      this.showAlert('error', error.message);
    } finally {
      this.setLoading('auth', false);
    }
  }

  logout() {
    api.logout();
    this.currentUser = null;
    this.cache = {};
    this.showScreen('auth');
  }

  async loadPicksScreen() {
    this.setLoading('picks', true);
    try {
      // Load games for current week
      this.games = await api.getGames(this.currentWeek);
      this.picks = await api.getPicks(this.currentWeek);
      
      this.renderPicksScreen();
    } catch (error) {
      this.showAlert('error', 'Failed to load games: ' + error.message);
    } finally {
      this.setLoading('picks', false);
    }
  }

  renderPicksScreen() {
    const content = document.getElementById('content');
    const picksScreen = document.getElementById('screen-picks');

    if (!picksScreen) return;

    let html = `
      <div class="header">
        <h1>Weekly Picks</h1>
        <p>Week ${this.currentWeek} of 18</p>
      </div>

      <div class="week-selector">
        ${Array.from({length: 18}, (_, i) => i + 1).map(w => `
          <button class="week-btn ${w === this.currentWeek ? 'active' : ''}" 
                  onclick="app.selectWeek(${w})">
            W${w}
          </button>
        `).join('')}
      </div>
    `;

    // Check if week is locked
    const isLocked = this.picks.locked;
    if (isLocked) {
      html += '<div class="lock-notice">🔒 Picks are locked for this week</div>';
    }

    if (this.games.length === 0) {
      html += '<div class="empty-state"><div class="empty-state-icon">📅</div><div class="empty-state-title">No games scheduled</div></div>';
    } else {
      html += this.games.map((game, idx) => this.renderGameCard(game, idx)).join('');
    }

    html += `
      <div style="margin-bottom: 40px; margin-top: 20px;">
        <button class="btn-primary" style="width: 100%;" onclick="app.submitPicks()" ${this.picks.submitted || isLocked ? 'disabled' : ''}>
          ${this.picks.submitted ? '✓ Picks Submitted' : 'Submit Picks'}
        </button>
      </div>
    `;

    picksScreen.innerHTML = html;

    // Restore previous selections
    Object.entries(this.picks.picks || {}).forEach(([gameId, pick]) => {
      const gameEl = document.querySelector(`[data-game-id="${gameId}"]`);
      if (gameEl) {
        const teamEl = gameEl.querySelector(`[data-team="${pick.team}"]`);
        if (teamEl) {
          teamEl.classList.add('selected');
        }

        if (pick.gameChangers?.castleWall) {
          gameEl.querySelector('[data-changer="castleWall"]')?.classList.add('selected');
        }
        if (pick.gameChangers?.letItRide) {
          gameEl.querySelector('[data-changer="letItRide"]')?.classList.add('selected');
        }
      }
    });
  }

  renderGameCard(game, idx) {
    const pickCount = Object.keys(this.picks.picks || {}).length;
    const maxPicks = 6;
    const isPicked = this.picks.picks?.[game.id];

    return `
      <div class="game-card ${isPicked ? 'selected' : ''}" data-game-id="${game.id}">
        <div class="card">
          <div class="game-header">
            <div class="game-time">${new Date(game.kickoff_time).toLocaleString()}</div>
            ${game.spread ? `<div class="game-spread">${game.favorite_team || 'TBD'} ${Math.abs(game.spread).toFixed(1)}</div>` : ''}
          </div>

          <div class="teams">
            <div class="team" data-team="${game.away_team}" 
                 onclick="app.selectTeam('${game.id}', '${game.away_team}')">
              <div class="team-name">${game.away_abbr}</div>
              <div class="team-record">${game.away_team}</div>
            </div>
            <div class="team" data-team="${game.home_team}" 
                 onclick="app.selectTeam('${game.id}', '${game.home_team}')">
              <div class="team-name">${game.home_abbr}</div>
              <div class="team-record">${game.home_team}</div>
            </div>
          </div>

          ${isPicked ? `
            <div class="game-changers">
              <div class="game-changer" data-changer="castleWall"
                   onclick="app.toggleGameChanger('${game.id}', 'castleWall')"
                   title="Floor at 0 points">
                <div class="game-changer-icon">🛡️</div>
                <div>Castle Wall</div>
              </div>
              <div class="game-changer" data-changer="letItRide"
                   onclick="app.toggleGameChanger('${game.id}', 'letItRide')"
                   title="1.5x multiplier">
                <div class="game-changer-icon">🚀</div>
                <div>Let It Ride</div>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  selectTeam(gameId, team) {
    const currentCount = Object.keys(this.picks.picks || {}).length;
    const isPicked = this.picks.picks?.[gameId];

    if (!isPicked && currentCount >= 6) {
      this.showAlert('warning', 'You can only pick 6 games per week');
      return;
    }

    if (!this.picks.picks) {
      this.picks.picks = {};
    }

    if (this.picks.picks[gameId]?.team === team) {
      delete this.picks.picks[gameId];
    } else {
      this.picks.picks[gameId] = { team, gameChangers: { castleWall: false, letItRide: false } };
    }

    this.renderPicksScreen();
  }

  toggleGameChanger(gameId, changer) {
    if (!this.picks.picks?.[gameId]) return;

    const current = this.picks.picks[gameId].gameChangers[changer];
    this.picks.picks[gameId].gameChangers[changer] = !current;

    this.renderPicksScreen();
  }

  selectWeek(week) {
    this.currentWeek = week;
    this.loadPicksScreen();
  }

  async submitPicks() {
    if (Object.keys(this.picks.picks || {}).length < 6) {
      this.showAlert('warning', 'You must select exactly 6 games');
      return;
    }

    this.setLoading('picks', true);
    try {
      await api.submitPicks(this.currentWeek, this.picks.picks);
      this.showAlert('success', 'Picks submitted successfully!');
      this.loadPicksScreen();
    } catch (error) {
      this.showAlert('error', 'Failed to submit picks: ' + error.message);
    } finally {
      this.setLoading('picks', false);
    }
  }

  async loadStandingsScreen() {
    this.setLoading('standings', true);
    try {
      this.leaderboard = await api.getOverallLeaderboard();
      this.renderStandingsScreen();
    } catch (error) {
      this.showAlert('error', 'Failed to load standings: ' + error.message);
    } finally {
      this.setLoading('standings', false);
    }
  }

  renderStandingsScreen() {
    const standingsScreen = document.getElementById('screen-standings');
    if (!standingsScreen) return;

    let html = `
      <div class="header">
        <h1>Leaderboard</h1>
        <p>Overall Standings</p>
      </div>
    `;

    if (this.leaderboard.length === 0) {
      html += '<div class="empty-state"><div class="empty-state-icon">📊</div><div class="empty-state-title">No standings yet</div></div>';
    } else {
      // Group by division
      const byDivision = {};
      this.leaderboard.forEach((entry) => {
        if (!byDivision[entry.division_id]) {
          byDivision[entry.division_id] = [];
        }
        byDivision[entry.division_id].push(entry);
      });

      Object.entries(byDivision).forEach(([divId, entries]) => {
        html += `<div class="division-header">${entries[0]?.division_name || divId}</div>`;
        html += `
          <div class="card">
            <table class="leaderboard-table">
              <thead>
                <tr>
                  <th style="width: 40px;">Rank</th>
                  <th>Player</th>
                  <th style="text-align: right;">Score</th>
                </tr>
              </thead>
              <tbody>
                ${entries.map((entry, idx) => `
                  <tr ${entry.user_id === this.currentUser?.id ? 'style="background: rgba(16, 185, 129, 0.1);"' : ''}>
                    <td class="rank">${idx + 1}</td>
                    <td class="user-name">${entry.username}</td>
                    <td class="score" style="text-align: right;">${entry.total_score?.toFixed(1) || '0.0'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      });
    }

    standingsScreen.innerHTML = html;
  }

  async loadSeasonScreen() {
    this.setLoading('season', true);
    try {
      this.seasonStats = await api.getUserSeasonStats(this.currentUser.id);
      this.renderSeasonScreen();
    } catch (error) {
      this.showAlert('error', 'Failed to load season stats: ' + error.message);
    } finally {
      this.setLoading('season', false);
    }
  }

  renderSeasonScreen() {
    const seasonScreen = document.getElementById('screen-season');
    if (!seasonScreen) return;

    const stats = this.seasonStats || {};

    let html = `
      <div class="header">
        <h1>My Season</h1>
        <p>2026-27 NFL Regular Season</p>
      </div>

      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-label">Total Score</div>
          <div class="stat-value">${(stats.total_score || 0).toFixed(1)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Division Rank</div>
          <div class="stat-value">#${stats.division_rank || '-'}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Weeks Played</div>
          <div class="stat-value">${stats.total_weeks_played || 0}/18</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Best Week</div>
          <div class="stat-value">${(stats.best_week_score || 0).toFixed(1)}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">Weekly Scores</div>
        </div>
        <div class="chart">
          ${stats.weekly_scores ? stats.weekly_scores.map((score, idx) => `
            <div class="chart-bar">
              <div class="chart-label">W${idx + 1}</div>
              <div class="chart-fill" style="width: ${Math.max(20, (score / 50) * 100)}%"></div>
              <div class="chart-value">${score.toFixed(1)}</div>
            </div>
          `).join('') : '<p style="color: var(--text-light); text-align: center;">No scores yet</p>'}
        </div>
      </div>
    `;

    seasonScreen.innerHTML = html;
  }

  async loadProfileScreen() {
    const profileScreen = document.getElementById('screen-profile');
    if (!profileScreen) return;

    const user = this.currentUser || {};

    let html = `
      <div class="header">
        <h1>Profile</h1>
        <p>${user.username}</p>
      </div>

      <div class="profile-header">
        <div class="avatar" style="background: ${user.avatar_color || '#1F2937'};">
          ${user.username?.charAt(0).toUpperCase() || '?'}
        </div>
      </div>

      <div class="card">
        <div class="profile-info">
          <div class="info-row">
            <div class="info-label">Email</div>
            <div class="info-value">${user.email}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Division</div>
            <div class="info-value">${user.division_name || 'Not assigned'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Conference</div>
            <div class="info-value">${user.conference_name || 'Not assigned'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Member Since</div>
            <div class="info-value">${new Date(user.created_at).toLocaleDateString()}</div>
          </div>
          ${user.is_admin ? `
            <div class="info-row">
              <div class="info-label">Role</div>
              <div class="info-value">Admin <span class="admin-badge">ADMIN</span></div>
            </div>
          ` : ''}
        </div>
      </div>

      <div style="margin-top: 20px;">
        <button class="btn-secondary" style="width: 100%;" onclick="app.logout()">Sign Out</button>
      </div>
    `;

    profileScreen.innerHTML = html;
  }

  showAlert(type, message) {
    const alertEl = document.createElement('div');
    alertEl.className = `alert alert-${type}`;
    alertEl.textContent = message;
    alertEl.style.position = 'fixed';
    alertEl.style.top = '20px';
    alertEl.style.right = '20px';
    alertEl.style.maxWidth = '400px';
    alertEl.style.zIndex = '1000';
    alertEl.style.animation = 'fadeIn 0.2s ease';

    document.body.appendChild(alertEl);

    setTimeout(() => {
      alertEl.remove();
    }, 3000);
  }

  setLoading(screen, isLoading) {
    this.loadingState[screen] = isLoading;
  }
}

// Initialize app when DOM is ready
let app;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    app = new CoverQuestApp();
  });
} else {
  app = new CoverQuestApp();
}
