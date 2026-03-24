/**
 * API Router for CoverQuest
 * 
 * Routes API requests to the appropriate handler based on path.
 * All paths: /api/:endpoint?action=:action
 */

import authHandler from './auth.js';
import gamesHandler from './games.js';
import picksHandler from './picks.js';
import leaderboardHandler from './leaderboard.js';
import scoresHandler from './scores.js';
import adminHandler from './admin.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse path
  const path = req.url.split('?')[0];
  const parts = path.split('/').filter(Boolean);

  // Route to appropriate handler
  if (parts[1] === 'auth') {
    return authHandler(req, res);
  } else if (parts[1] === 'games') {
    return gamesHandler(req, res);
  } else if (parts[1] === 'picks') {
    return picksHandler(req, res);
  } else if (parts[1] === 'leaderboard') {
    return leaderboardHandler(req, res);
  } else if (parts[1] === 'scores') {
    return scoresHandler(req, res);
  } else if (parts[1] === 'admin') {
    return adminHandler(req, res);
  }

  return res.status(404).json({ message: 'Not found' });
}
