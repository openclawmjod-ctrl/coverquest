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

async function submitPicks(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { week, picks } = req.body;

  if (!week || !picks || typeof picks !== 'object') {
    return res.status(400).json({ message: 'Invalid picks data' });
  }

  if (Object.keys(picks).length !== 6) {
    return res.status(400).json({ message: 'You must submit exactly 6 picks' });
  }

  // Check if week is locked
  const { data: weekLock } = await supabase
    .from('week_locks')
    .select('id')
    .eq('week', week)
    .single();

  if (weekLock) {
    return res.status(400).json({ message: 'Picks are locked for this week' });
  }

  try {
    // Insert picks
    const pickRows = Object.entries(picks).map(([gameId, pick]) => ({
      user_id: decoded.userId,
      week,
      game_id: gameId,
      picked_team: pick.team,
      game_changers: pick.gameChangers,
    }));

    const { data, error } = await supabase
      .from('picks')
      .upsert(pickRows, { onConflict: 'user_id,week,game_id' })
      .select();

    if (error) throw error;

    return res.status(201).json({
      message: 'Picks submitted successfully',
      count: data.length,
    });
  } catch (error) {
    console.error('Submit picks error:', error);
    return res.status(500).json({ message: 'Failed to submit picks' });
  }
}

async function getPicks(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { week } = req.query;

  if (!week) {
    return res.status(400).json({ message: 'Week is required' });
  }

  try {
    const { data: picks, error } = await supabase
      .from('picks')
      .select('*')
      .eq('user_id', decoded.userId)
      .eq('week', parseInt(week));

    if (error) throw error;

    // Check if week is locked
    const { data: weekLock } = await supabase
      .from('week_locks')
      .select('id')
      .eq('week', parseInt(week))
      .single();

    // Convert to pick object
    const pickObj = {};
    (picks || []).forEach((pick) => {
      pickObj[pick.game_id] = {
        team: pick.picked_team,
        gameChangers: pick.game_changers,
      };
    });

    return res.status(200).json({
      week: parseInt(week),
      picks: pickObj,
      submitted: picks.length > 0,
      locked: !!weekLock,
    });
  } catch (error) {
    console.error('Get picks error:', error);
    return res.status(500).json({ message: 'Failed to fetch picks' });
  }
}

async function updatePick(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { pickId } = req.query;
  const { picked_team, game_changers } = req.body;

  try {
    const { data: pick, error: fetchError } = await supabase
      .from('picks')
      .select('*')
      .eq('id', pickId)
      .single();

    if (fetchError || !pick) {
      return res.status(404).json({ message: 'Pick not found' });
    }

    if (pick.user_id !== decoded.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Check if week is locked
    const { data: weekLock } = await supabase
      .from('week_locks')
      .select('id')
      .eq('week', pick.week)
      .single();

    if (weekLock) {
      return res.status(400).json({ message: 'Picks are locked for this week' });
    }

    const { data, error } = await supabase
      .from('picks')
      .update({
        picked_team: picked_team || pick.picked_team,
        game_changers: game_changers || pick.game_changers,
      })
      .eq('id', pickId)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    console.error('Update pick error:', error);
    return res.status(500).json({ message: 'Failed to update pick' });
  }
}

async function getUserPicks(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { userId, week } = req.query;

  try {
    const { data: picks, error } = await supabase
      .from('picks')
      .select('*')
      .eq('user_id', userId)
      .eq('week', parseInt(week));

    if (error) throw error;

    return res.status(200).json(picks || []);
  } catch (error) {
    console.error('Get user picks error:', error);
    return res.status(500).json({ message: 'Failed to fetch picks' });
  }
}

export default async (req, res) => {
  const { action } = req.query;

  switch (action) {
    case 'submit':
      return submitPicks(req, res);
    case 'week':
      return getPicks(req, res);
    case 'update':
      return updatePick(req, res);
    case 'user':
      return getUserPicks(req, res);
    default:
      return res.status(404).json({ message: 'Not found' });
  }
};
