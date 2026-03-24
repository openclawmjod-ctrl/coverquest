import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const JWT_SECRET = process.env.JWT_SECRET;

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function signup(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  try {
    // Check if user exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .or(`email.eq.${email},username.eq.${username}`)
      .single();

    if (existing) {
      return res.status(400).json({ message: 'Email or username already exists' });
    }

    // Assign random division
    const { data: divisions } = await supabase
      .from('divisions')
      .select('id');

    const randomDivision = divisions[Math.floor(Math.random() * divisions.length)];

    // Create user
    const passwordHash = hashPassword(password);
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        username,
        password_hash: passwordHash,
        division_id: randomDivision.id,
        conference_id: randomDivision.id.startsWith('AFC') ? 'AFC' : 'NFC',
        avatar_color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      })
      .select()
      .single();

    if (error) throw error;

    const token = generateToken(user.id);

    return res.status(201).json({
      id: user.id,
      email: user.email,
      username: user.username,
      avatar_color: user.avatar_color,
      division_id: user.division_id,
      token,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ message: 'Failed to create account' });
  }
}

export async function login(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }

  try {
    const passwordHash = hashPassword(password);

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user || user.password_hash !== passwordHash) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user.id);

    return res.status(200).json({
      id: user.id,
      email: user.email,
      username: user.username,
      avatar_color: user.avatar_color,
      division_id: user.division_id,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Login failed' });
  }
}

export async function profile(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id, email, username, avatar_color, division_id, conference_id, created_at, is_admin,
        divisions!left(name), conferences!left(name)
      `)
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      id: user.id,
      email: user.email,
      username: user.username,
      avatar_color: user.avatar_color,
      division_id: user.division_id,
      division_name: user.divisions?.name,
      conference_id: user.conference_id,
      conference_name: user.conferences?.name,
      created_at: user.created_at,
      is_admin: user.is_admin,
    });
  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).json({ message: 'Failed to fetch profile' });
  }
}

export async function refresh(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  const newToken = generateToken(decoded.userId);

  return res.status(200).json({
    token: newToken,
  });
}

export default async (req, res) => {
  const { action } = req.query;

  switch (action) {
    case 'signup':
      return signup(req, res);
    case 'login':
      return login(req, res);
    case 'profile':
      return profile(req, res);
    case 'refresh':
      return refresh(req, res);
    default:
      return res.status(404).json({ message: 'Not found' });
  }
};
