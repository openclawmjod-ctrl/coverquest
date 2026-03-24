// API Client for CoverQuest
class API {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || '/api';
    this.token = this.getToken();
  }

  getToken() {
    try {
      const stored = localStorage.getItem('cq_token');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('cq_token', JSON.stringify(token));
      this.token = token;
    } else {
      localStorage.removeItem('cq_token');
      this.token = null;
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.setToken(null);
          window.location.href = '/';
        }
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Auth endpoints
  async signup(email, username, password) {
    const data = await this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, username, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async refreshToken() {
    const data = await this.request('/auth/refresh', {
      method: 'POST',
    });
    this.setToken(data.token);
    return data;
  }

  logout() {
    this.setToken(null);
  }

  // Games endpoints
  async getGames(week) {
    return this.request(`/games/week/${week}`);
  }

  async getLiveGames() {
    return this.request('/games/live');
  }

  async getAllGames() {
    return this.request('/games/all');
  }

  // Picks endpoints
  async submitPicks(week, picks) {
    return this.request('/picks/submit', {
      method: 'POST',
      body: JSON.stringify({ week, picks }),
    });
  }

  async getPicks(week) {
    return this.request(`/picks/week/${week}`);
  }

  async updatePick(pickId, data) {
    return this.request(`/picks/${pickId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getUserPicksForWeek(userId, week) {
    return this.request(`/picks/user/${userId}/week/${week}`);
  }

  // Leaderboard endpoints
  async getOverallLeaderboard(limit = 50) {
    return this.request(`/leaderboard/overall?limit=${limit}`);
  }

  async getDivisionLeaderboard(divisionId, limit = 50) {
    return this.request(`/leaderboard/division/${divisionId}?limit=${limit}`);
  }

  async getConferenceLeaderboard(conferenceId, limit = 50) {
    return this.request(`/leaderboard/conference/${conferenceId}?limit=${limit}`);
  }

  async getWeekLeaderboard(week, limit = 50) {
    return this.request(`/leaderboard/week/${week}?limit=${limit}`);
  }

  // Scores endpoints
  async getUserScore(userId) {
    return this.request(`/scores/user/${userId}`);
  }

  async getUserSeasonStats(userId) {
    return this.request(`/season/user/${userId}`);
  }

  async getDivisionStats() {
    return this.request('/season/divisions');
  }

  async getWeekScores(week) {
    return this.request(`/scores/week/${week}`);
  }

  // Profile endpoints
  async getProfile() {
    return this.request('/auth/profile');
  }

  async updateProfile(data) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Admin endpoints
  async lockWeek(week) {
    return this.request(`/admin/lock-week`, {
      method: 'POST',
      body: JSON.stringify({ week }),
    });
  }

  async calculateWeekScores(week) {
    return this.request(`/admin/calculate-scores`, {
      method: 'POST',
      body: JSON.stringify({ week }),
    });
  }

  async syncESPN() {
    return this.request(`/admin/sync-espn`, {
      method: 'POST',
    });
  }

  async manualScoreEntry(userId, week, gameId, score) {
    return this.request(`/admin/scores/manual`, {
      method: 'POST',
      body: JSON.stringify({ userId, week, gameId, score }),
    });
  }

  async getWeekPicks(week) {
    return this.request(`/admin/picks/week/${week}`);
  }
}

// Export singleton instance
const api = new API();
