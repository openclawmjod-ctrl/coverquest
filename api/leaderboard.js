import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function getOverallLeaderboard(req, res) {
  const { limit = 50 } = req.query;

  try {
    const { data: stats, error } = await supabase
      .from('season_stats')
      .select(`
        user_id, total_score, division_rank, conference_rank, overall_rank,
        users!inner(username, division_id, conference_id, divisions!inner(name, id), conferences!inner(name, id))
      `)
      .order('total_score', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    const leaderboard = (stats || []).map((entry) => ({
      user_id: entry.user_id,
      username: entry.users?.username,
      division_id: entry.users?.division_id,
      division_name: entry.users?.divisions?.name,
      total_score: entry.total_score,
      rank: entry.overall_rank,
    }));

    return res.status(200).json(leaderboard);
  } catch (error) {
    console.error('Get overall leaderboard error:', error);
    return res.status(500).json({ message: 'Failed to fetch leaderboard' });
  }
}

async function getDivisionLeaderboard(req, res) {
  const { divisionId, limit = 50 } = req.query;

  if (!divisionId) {
    return res.status(400).json({ message: 'Division ID is required' });
  }

  try {
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id, username, division_id,
        season_stats!inner(total_score, division_rank)
      `)
      .eq('division_id', divisionId)
      .order('season_stats.total_score', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    const leaderboard = (users || []).map((user, idx) => ({
      user_id: user.id,
      username: user.username,
      division_id: user.division_id,
      total_score: user.season_stats?.[0]?.total_score || 0,
      rank: idx + 1,
    }));

    return res.status(200).json(leaderboard);
  } catch (error) {
    console.error('Get division leaderboard error:', error);
    return res.status(500).json({ message: 'Failed to fetch division leaderboard' });
  }
}

async function getConferenceLeaderboard(req, res) {
  const { conferenceId, limit = 50 } = req.query;

  if (!conferenceId) {
    return res.status(400).json({ message: 'Conference ID is required' });
  }

  try {
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id, username, conference_id,
        season_stats!inner(total_score)
      `)
      .eq('conference_id', conferenceId)
      .order('season_stats.total_score', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    const leaderboard = (users || []).map((user, idx) => ({
      user_id: user.id,
      username: user.username,
      conference_id: user.conference_id,
      total_score: user.season_stats?.[0]?.total_score || 0,
      rank: idx + 1,
    }));

    return res.status(200).json(leaderboard);
  } catch (error) {
    console.error('Get conference leaderboard error:', error);
    return res.status(500).json({ message: 'Failed to fetch conference leaderboard' });
  }
}

async function getWeekLeaderboard(req, res) {
  const { week, limit = 50 } = req.query;

  if (!week) {
    return res.status(400).json({ message: 'Week is required' });
  }

  try {
    const { data: scores, error } = await supabase
      .from('scores')
      .select(`
        user_id, final_score, calculated_at,
        users!inner(username, division_id)
      `)
      .eq('week', parseInt(week))
      .order('final_score', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    const leaderboard = (scores || []).map((entry, idx) => ({
      user_id: entry.user_id,
      username: entry.users?.username,
      division_id: entry.users?.division_id,
      week: parseInt(week),
      score: entry.final_score,
      rank: idx + 1,
    }));

    return res.status(200).json(leaderboard);
  } catch (error) {
    console.error('Get week leaderboard error:', error);
    return res.status(500).json({ message: 'Failed to fetch week leaderboard' });
  }
}

export default async (req, res) => {
  const { action } = req.query;

  switch (action) {
    case 'overall':
      return getOverallLeaderboard(req, res);
    case 'division':
      return getDivisionLeaderboard(req, res);
    case 'conference':
      return getConferenceLeaderboard(req, res);
    case 'week':
      return getWeekLeaderboard(req, res);
    default:
      return res.status(404).json({ message: 'Not found' });
  }
};
