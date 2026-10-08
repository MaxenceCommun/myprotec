-- ==============================================================
-- SCRIPT COMPLET D'INITIALISATION ET DÉBLOCAGE SUPABASE MYPROTEC
-- À copier-coller dans l'onglet "SQL Editor" de votre projet Supabase
-- (https://supabase.com/dashboard/project/yrayehhbqcnuiuejqsjz/sql)
-- ==============================================================

-- 1. TABLE DES JOUEURS / DIRECTEURS D'ANTENNE
CREATE TABLE IF NOT EXISTS players (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  station_name TEXT DEFAULT 'Antenne Locale',
  city TEXT DEFAULT 'Nancy',
  department_code TEXT DEFAULT '54',
  role TEXT DEFAULT 'directeur',
  alliance_id TEXT DEFAULT 'alliance-fnpc',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLE DES SAUVEGARDES CLOUD DU JEU
CREATE TABLE IF NOT EXISTS game_saves (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE REFERENCES players(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  save_data JSONB NOT NULL,
  resources JSONB,
  stations_count INT DEFAULT 1,
  volunteers_count INT DEFAULT 0,
  vehicles_count INT DEFAULT 0,
  reputation INT DEFAULT 50,
  funds NUMERIC DEFAULT 15000,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLE DES ANTENNES DE L'ALLIANCE (Affichage multijoueur Leaflet)
CREATE TABLE IF NOT EXISTS alliance_stations (
  id TEXT PRIMARY KEY,
  player_id BIGINT,
  player_name TEXT,
  station_name TEXT,
  city TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  level INT DEFAULT 1,
  vehicles_count INT DEFAULT 0,
  volunteers_count INT DEFAULT 0,
  alliance_id TEXT DEFAULT 'alliance-fnpc',
  last_sync TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLE DES ÉVÉNEMENTS DE SÉCURITÉ DES LOCAUX (Vols, intrusions, tags)
CREATE TABLE IF NOT EXISTS security_events (
  id BIGSERIAL PRIMARY KEY,
  station_id TEXT,
  player_id BIGINT,
  event_type TEXT,
  details TEXT,
  loss_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLE DU TCHAT D'ALLIANCE MULTIJOUEUR
CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGSERIAL PRIMARY KEY,
  player_id BIGINT,
  player_name TEXT,
  station_name TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================
-- DÉBLOCAGE RLS (ROW-LEVEL SECURITY)
-- Permet au client du jeu d'inscrire des joueurs et sauvegarder sans être bloqué
-- ==============================================================

ALTER TABLE players DISABLE ROW LEVEL SECURITY;
ALTER TABLE game_saves DISABLE ROW LEVEL SECURITY;
ALTER TABLE alliance_stations DISABLE ROW LEVEL SECURITY;
ALTER TABLE security_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
