import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function getGamesByWeek(req, res) {
  const { week } = req.query;

  if (!week || isNaN(week) || week < 1 || week > 18) {
    return res.status(400).json({ message: 'Invalid week' });
  }

  try {
    const { data: games, error } = await supabase
      .from('games')
      .select('*')
      .eq('week', parseInt(week))
      .order('kickoff_time', { ascending: true });

    if (error) throw error;

    return res.status(200).json({
      week: parseInt(week),
      games: games || [],
      locked: await isWeekLocked(parseInt(week)),
      submitted: await hasUserSubmittedWeek(req, parseInt(week)),
      picks: await getUserWeekPicks(req, parseInt(week)),
    });
  } catch (error) {
    console.error('Get games error:', error);
    return res.status(500).json({ message: 'Failed to fetch games' });
  }
}

async function getLiveGames(req, res) {
  try {
    const { data: games, error } = await supabase
      .from('games')
      .select('*')
      .in('status', ['live', 'in progress'])
      .order('kickoff_time', { ascending: true });

    if (error) throw error;

    return res.status(200).json({
      games: games || [],
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get live games error:', error);
    return res.status(500).json({ message: 'Failed to fetch live games' });
  }
}

async function getAllGames(req, res) {
  try {
    const { data: games, error } = await supabase
      .from('games')
      .select('*')
      .order('week', { ascending: true })
      .order('kickoff_time', { ascending: true });

    if (error) throw error;

    return res.status(200).json({
      games: games || [],
    });
  } catch (error) {
    console.error('Get all games error:', error);
    return res.status(500).json({ message: 'Failed to fetch games' });
  }
}

async function isWeekLocked(week) {
  try {
    const { data } = await supabase
      .from('week_locks')
      .select('id')
      .eq('week', week)
      .single();

    return !!data;
  } catch (error) {
    return false;
  }
}

async function hasUserSubmittedWeek(req, week) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) return false;

  try {
    // TODO: Verify token and get userId
    // For now, return false
    return false;
  } catch (error) {
    return false;
  }
}

async function getUserWeekPicks(req, week) {
  // Return empty for now, filled by picks endpoint
  return {};
}

export default async (req, res) => {
  const { action } = req.query;

  switch (action) {
    case 'week':
      return getGamesByWeek(req, res);
    case 'live':
      return getLiveGames(req, res);
    case 'all':
      return getAllGames(req, res);
    default:
      return res.status(404).json({ message: 'Not found' });
  }
};
