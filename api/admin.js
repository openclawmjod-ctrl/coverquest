import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

async function isAdmin(userId) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (error) return false;
    return user?.is_admin || false;
  } catch (error) {
    return false;
  }
}

async function lockWeek(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const isAdminUser = await isAdmin(decoded.userId);
  if (!isAdminUser) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const { week } = req.body;

  if (!week || isNaN(week) || week < 1 || week > 18) {
    return res.status(400).json({ message: 'Invalid week' });
  }

  try {
    const { data, error } = await supabase
      .from('week_locks')
      .upsert(
        {
          week,
          locked_by_admin_id: decoded.userId,
        },
        { onConflict: 'week' }
      )
      .select();

    if (error) throw error;

    // Log audit
    await supabase.from('audit_logs').insert({
      admin_id: decoded.userId,
      action: 'lock_week',
      details: { week },
    });

    return res.status(200).json({
      message: `Week ${week} locked`,
      data: data[0],
    });
  } catch (error) {
    console.error('Lock week error:', error);
    return res.status(500).json({ message: 'Failed to lock week' });
  }
}

async function calculateWeekScores(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const isAdminUser = await isAdmin(decoded.userId);
  if (!isAdminUser) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const { week } = req.body;

  if (!week || isNaN(week) || week < 1 || week > 18) {
    return res.status(400).json({ message: 'Invalid week' });
  }

  try {
    // Get all games for the week
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('*')
      .eq('week', week)
      .eq('status', 'final');

    if (gamesError) throw gamesError;

    if (!games || games.length === 0) {
      return res.status(400).json({ message: 'No final scores available for this week' });
    }

    // Get all picks for the week
    const { data: picks, error: picksError } = await supabase
      .from('picks')
      .select('*')
      .eq('week', week);

    if (picksError) throw picksError;

    // Calculate scores
    const scoreMap = {};

    (picks || []).forEach((pick) => {
      const game = games.find((g) => g.id === pick.game_id);
      if (!game) return;

      const pickedTeam = pick.picked_team;
      const spread = game.spread || 0;

      // Determine favorite and underdog
      const isFavorite = game.favorite_team === pickedTeam;
      const adjustedSpread = isFavorite ? spread : -spread;

      // Calculate actual differential
      let actualDiff = 0;
      if (pickedTeam === game.away_team) {
        actualDiff = game.away_final_score - game.home_final_score;
      } else {
        actualDiff = game.home_final_score - game.away_final_score;
      }

      // Calculate how much we covered/missed
      const coverageDiff = actualDiff - adjustedSpread;

      // Apply game changers
      let gameChangers = pick.game_changers || {};
      let multiplier = 1.0;
      let floorApplied = false;

      if (gameChangers.letItRide) {
        multiplier = 1.5;
      }

      let finalScore = coverageDiff * multiplier;

      if (gameChangers.castleWall && finalScore < 0) {
        finalScore = 0;
        floorApplied = true;
      }

      // Add to score map
      if (!scoreMap[pick.user_id]) {
        scoreMap[pick.user_id] = [];
      }

      scoreMap[pick.user_id].push({
        user_id: pick.user_id,
        week,
        game_id: pick.game_id,
        picked_team: pickedTeam,
        spread: adjustedSpread,
        picked_spread: adjustedSpread,
        actual_differential: coverageDiff,
        game_changers: gameChangers,
        game_changer_multiplier: multiplier,
        floor_applied: floorApplied,
        final_score: finalScore,
      });
    });

    // Insert scores
    const allScores = Object.values(scoreMap).flat();

    const { error: insertError } = await supabase
      .from('scores')
      .upsert(allScores, { onConflict: 'user_id,week,game_id' });

    if (insertError) throw insertError;

    // Update season stats for all users
    const userIds = Object.keys(scoreMap);

    for (const userId of userIds) {
      const { data: userScores } = await supabase
        .from('scores')
        .select('final_score, week')
        .eq('user_id', userId);

      if (userScores && userScores.length > 0) {
        const totalScore = userScores.reduce((sum, s) => sum + (s.final_score || 0), 0);
        const bestWeekScore = Math.max(...userScores.map((s) => s.final_score || 0));
        const bestWeek = userScores.find((s) => s.final_score === bestWeekScore)?.week;

        await supabase
          .from('season_stats')
          .upsert(
            {
              user_id: userId,
              total_score: totalScore,
              best_week: bestWeek,
              best_week_score: bestWeekScore,
              total_weeks_played: userScores.length,
            },
            { onConflict: 'user_id' }
          );
      }
    }

    // Log audit
    await supabase.from('audit_logs').insert({
      admin_id: decoded.userId,
      action: 'calculate_scores',
      details: { week, scoresCalculated: allScores.length },
    });

    return res.status(200).json({
      message: `Scores calculated for week ${week}`,
      scoresCalculated: allScores.length,
    });
  } catch (error) {
    console.error('Calculate scores error:', error);
    return res.status(500).json({ message: 'Failed to calculate scores' });
  }
}

async function syncESPN(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Check admin token from header
  const adminToken = req.headers['x-admin-token'];
  if (adminToken !== ADMIN_TOKEN) {
    return res.status(403).json({ message: 'Invalid admin token' });
  }

  try {
    // This would fetch from ESPN API and sync games
    // For MVP, just return success
    await supabase.from('audit_logs').insert({
      action: 'sync_espn',
      details: { timestamp: new Date().toISOString() },
    });

    return res.status(200).json({
      message: 'ESPN sync completed',
    });
  } catch (error) {
    console.error('Sync ESPN error:', error);
    return res.status(500).json({ message: 'Failed to sync ESPN data' });
  }
}

async function manualScoreEntry(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const isAdminUser = await isAdmin(decoded.userId);
  if (!isAdminUser) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const { userId, week, gameId, score } = req.body;

  if (!userId || !week || !gameId || score === undefined) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const { data, error } = await supabase
      .from('scores')
      .upsert(
        {
          user_id: userId,
          week,
          game_id: gameId,
          final_score: score,
        },
        { onConflict: 'user_id,week,game_id' }
      )
      .select();

    if (error) throw error;

    // Log audit
    await supabase.from('audit_logs').insert({
      admin_id: decoded.userId,
      action: 'manual_score_entry',
      details: { userId, week, gameId, score },
    });

    return res.status(200).json({
      message: 'Score entered manually',
      data: data[0],
    });
  } catch (error) {
    console.error('Manual score entry error:', error);
    return res.status(500).json({ message: 'Failed to enter score' });
  }
}

async function getWeekPicks(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const isAdminUser = await isAdmin(decoded.userId);
  if (!isAdminUser) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const { week } = req.query;

  if (!week) {
    return res.status(400).json({ message: 'Week is required' });
  }

  try {
    const { data: picks, error } = await supabase
      .from('picks')
      .select(`
        id, user_id, week, game_id, picked_team, game_changers, submitted_at,
        users!inner(username)
      `)
      .eq('week', parseInt(week))
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      week: parseInt(week),
      picks: picks || [],
      total: picks?.length || 0,
    });
  } catch (error) {
    console.error('Get week picks error:', error);
    return res.status(500).json({ message: 'Failed to fetch week picks' });
  }
}

export default async (req, res) => {
  const { action } = req.query;

  switch (action) {
    case 'lock-week':
      return lockWeek(req, res);
    case 'calculate-scores':
      return calculateWeekScores(req, res);
    case 'sync-espn':
      return syncESPN(req, res);
    case 'scores-manual':
      return manualScoreEntry(req, res);
    case 'picks-week':
      return getWeekPicks(req, res);
    default:
      return res.status(404).json({ message: 'Not found' });
  }
};
