-- Conferences
CREATE TABLE IF NOT EXISTS conferences (
  id VARCHAR(10) PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Divisions
CREATE TABLE IF NOT EXISTS divisions (
  id VARCHAR(10) PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  conference_id VARCHAR(10) NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  avatar_color VARCHAR(7) DEFAULT '#1F2937',
  division_id VARCHAR(10) REFERENCES divisions(id) ON DELETE SET NULL,
  conference_id VARCHAR(10) REFERENCES conferences(id) ON DELETE SET NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_division_id ON users(division_id);

-- Games
CREATE TABLE IF NOT EXISTS games (
  id VARCHAR(50) PRIMARY KEY,
  week INT NOT NULL,
  away_team VARCHAR(50) NOT NULL,
  home_team VARCHAR(50) NOT NULL,
  away_abbr VARCHAR(3) NOT NULL,
  home_abbr VARCHAR(3) NOT NULL,
  spread DECIMAL(5,1),
  favorite_team VARCHAR(50),
  kickoff_time TIMESTAMP NOT NULL,
  away_final_score INT,
  home_final_score INT,
  status VARCHAR(20) DEFAULT 'scheduled',
  synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(week, away_team, home_team)
);

CREATE INDEX idx_games_week ON games(week);
CREATE INDEX idx_games_status ON games(status);

-- Picks
CREATE TABLE IF NOT EXISTS picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week INT NOT NULL,
  game_id VARCHAR(50) NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  picked_team VARCHAR(50) NOT NULL,
  game_changers JSON DEFAULT '{"castleWall": false, "letItRide": false}',
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, week, game_id)
);

CREATE INDEX idx_picks_user_week ON picks(user_id, week);
CREATE INDEX idx_picks_user_game ON picks(user_id, game_id);

-- Scores (calculated after games finish)
CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week INT NOT NULL,
  game_id VARCHAR(50) NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  picked_team VARCHAR(50) NOT NULL,
  spread DECIMAL(5,1),
  picked_spread DECIMAL(5,1),
  actual_differential DECIMAL(6,1),
  game_changers JSON,
  game_changer_multiplier DECIMAL(3,2) DEFAULT 1.00,
  floor_applied BOOLEAN DEFAULT FALSE,
  final_score DECIMAL(6,1),
  calculated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, week, game_id)
);

CREATE INDEX idx_scores_user_week ON scores(user_id, week);

-- Season stats (denormalized for performance)
CREATE TABLE IF NOT EXISTS season_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_weeks_played INT DEFAULT 0,
  total_picks INT DEFAULT 0,
  total_score DECIMAL(8,2) DEFAULT 0,
  division_rank INT,
  conference_rank INT,
  overall_rank INT,
  best_week INT,
  best_week_score DECIMAL(6,1),
  calculated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_season_stats_total_score ON season_stats(total_score DESC);

-- Week locks (admin control)
CREATE TABLE IF NOT EXISTS week_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week INT NOT NULL UNIQUE,
  locked_at TIMESTAMP NOT NULL DEFAULT NOW(),
  locked_by_admin_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Audit log for admin actions
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  details JSON,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed conferences and divisions
INSERT INTO conferences (id, name) VALUES 
  ('AFC', 'AFC'),
  ('NFC', 'NFC')
ON CONFLICT DO NOTHING;

INSERT INTO divisions (id, name, conference_id) VALUES 
  ('AFCE', 'AFC East', 'AFC'),
  ('AFCN', 'AFC North', 'AFC'),
  ('AFCS', 'AFC South', 'AFC'),
  ('AFCW', 'AFC West', 'AFC'),
  ('NFCE', 'NFC East', 'NFC'),
  ('NFCN', 'NFC North', 'NFC'),
  ('NFCS', 'NFC South', 'NFC'),
  ('NFCW', 'NFC West', 'NFC')
ON CONFLICT DO NOTHING;
