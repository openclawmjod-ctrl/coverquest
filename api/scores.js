import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const JWT_SECRET = process.env.JWT_SECRET;

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

async function getUserScore(req, res) {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    const { data: scores, error } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', userId)
      .order('week', { ascending: true });

    if (error) throw error;

    return res.status(200).json({
      user_id: userId,
      scores: scores || [],
    });
  } catch (error) {
    console.error('Get user score error:', error);
    return res.status(500).json({ message: 'Failed to fetch scores' });
  }
}

async function getUserSeasonStats(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    // Get season stats
    const { data: stats, error: statsError } = await supabase
      .from('season_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (statsError && statsError.code !== 'PGRST116') throw statsError;

    // Get weekly scores
    const { data: scores, error: scoresError } = await supabase
      .from('scores')
      .select('week, final_score')
      .eq('user_id', userId)
      .order('week', { ascending: true });

    if (scoresError) throw scoresError;

    const weeklyScores = Array(18).fill(0);
    (scores || []).forEach((score) => {
      weeklyScores[score.week - 1] = score.final_score;
    });

    return res.status(200).json({
      user_id: userId,
      total_score: stats?.total_score || 0,
      total_weeks_played: stats?.total_weeks_played || 0,
      division_rank: stats?.division_rank || null,
      conference_rank: stats?.conference_rank || null,
      overall_rank: stats?.overall_rank || null,
      best_week: stats?.best_week || null,
      best_week_score: stats?.best_week_score || 0,
      weekly_scores: weeklyScores,
    });
  } catch (error) {
    console.error('Get season stats error:', error);
    return res.status(500).json({ message: 'Failed to fetch season stats' });
  }
}

async function getDivisionStats(req, res) {
  try {
    const { data: divisions, error } = await supabase
      .from('divisions')
      .select(`
        id, name, conference_id,
        users!inner(
          id, username, 
          season_stats!inner(total_score, division_rank)
        )
      `)
      .order('id', { ascending: true });

    if (error) throw error;

    const stats = (divisions || []).map((div) => {
      const users = (div.users || [])
        .sort((a, b) => (b.season_stats?.[0]?.total_score || 0) - (a.season_stats?.[0]?.total_score || 0))
        .map((user, idx) => ({
          user_id: user.id,
          username: user.username,
          score: user.season_stats?.[0]?.total_score || 0,
          rank: idx + 1,
        }));

      return {
        division_id: div.id,
        division_name: div.name,
        conference_id: div.conference_id,
        users,
      };
    });

    return res.status(200).json(stats);
  } catch (error) {
    console.error('Get division stats error:', error);
    return res.status(500).json({ message: 'Failed to fetch division stats' });
  }
}

async function getWeekScores(req, res) {
  const { week } = req.query;

  if (!week) {
    return res.status(400).json({ message: 'Week is required' });
  }

  try {
    const { data: scores, error } = await supabase
      .from('scores')
      .select(`
        user_id, week, final_score, game_id, actual_differential,
        users!inner(username)
      `)
      .eq('week', parseInt(week))
      .order('final_score', { ascending: false });

    if (error) throw error;

    const weekScores = (scores || []).map((score) => ({
      user_id: score.user_id,
      username: score.users?.username,
      week: score.week,
      score: score.final_score,
      games: [score.game_id],
    }));

    return res.status(200).json({
      week: parseInt(week),
      scores: weekScores,
    });
  } catch (error) {
    console.error('Get week scores error:', error);
    return res.status(500).json({ message: 'Failed to fetch week scores' });
  }
}

export default async (req, res) => {
  const { action } = req.query;

  switch (action) {
    case 'user':
      return getUserScore(req, res);
    case 'season':
      return getUserSeasonStats(req, res);
    case 'divisions':
      return getDivisionStats(req, res);
    case 'week':
      return getWeekScores(req, res);
    default:
      return res.status(404).json({ message: 'Not found' });
  }
};
