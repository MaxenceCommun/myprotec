-- ==============================================================================
-- MYPROTEC - SCRIPT OFFICIEL D'INITIALISATION ET D'ARCHITECTURE SERVEUR (100% ONLINE)
-- Exécuter ce script dans l'éditeur SQL de Supabase (SQL Editor)
-- https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLE DES JOUEURS / COMPTES DIRECTEURS D'ANTENNE
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  station_name TEXT DEFAULT 'Antenne Locale',
  city TEXT DEFAULT 'Nancy',
  department_code TEXT DEFAULT '54',
  role TEXT DEFAULT 'directeur',
  alliance_id TEXT DEFAULT 'alliance-fnpc',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLE DES SAUVEGARDES CLOUD DU MONDE PERSISTANT
CREATE TABLE IF NOT EXISTS game_saves (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  save_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  resources JSONB DEFAULT '{"funds": 15000, "reputation": 50}'::jsonb,
  stations_count INT DEFAULT 1,
  volunteers_count INT DEFAULT 0,
  vehicles_count INT DEFAULT 0,
  reputation INT DEFAULT 50,
  funds NUMERIC DEFAULT 15000,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  server_synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLE DES MISSIONS ACTIVES (PERSISTANTES ET HORODATÉES CÔTÉ SERVEUR)
CREATE TABLE IF NOT EXISTS active_missions (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  mission_type TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ongoing', -- 'ongoing', 'completed', 'cancelled'
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL,
  duration_seconds INT NOT NULL DEFAULT 1800,
  reward_money NUMERIC DEFAULT 0,
  reward_xp INT DEFAULT 0,
  assigned_volunteers JSONB DEFAULT '[]'::jsonb,
  assigned_vehicles JSONB DEFAULT '[]'::jsonb,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_active_missions_status_ends ON active_missions(status, ends_at);
CREATE INDEX IF NOT EXISTS idx_active_missions_player ON active_missions(player_id);

-- 5. TABLE DES FORMATIONS ACTIVES (PERSISTANTES CÔTÉ SERVEUR)
CREATE TABLE IF NOT EXISTS active_formations (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  diploma TEXT NOT NULL,
  station_id TEXT,
  status TEXT NOT NULL DEFAULT 'ongoing', -- 'ongoing', 'completed'
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL,
  trainee_ids JSONB DEFAULT '[]'::jsonb,
  cost NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_active_formations_status_ends ON active_formations(status, ends_at);
CREATE INDEX IF NOT EXISTS idx_active_formations_player ON active_formations(player_id);

-- 6. TABLE DES ÉVÉNEMENTS & NOTIFICATIONS SERVEUR (MAIN COURANTE D'ABSENCE)
CREATE TABLE IF NOT EXISTS server_events_log (
  id BIGSERIAL PRIMARY KEY,
  player_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'mission_completed', 'formation_completed', 'security', 'system'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  reward_money NUMERIC DEFAULT 0,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_server_events_player ON server_events_log(player_id, read);

-- 7. TABLE DES ANTENNES DE L'ALLIANCE (AFFICHAGE CARTE MULTIJOUEUR EN DIRECT)
CREATE TABLE IF NOT EXISTS alliance_stations (
  id TEXT PRIMARY KEY,
  player_id TEXT,
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

-- 8. TABLE DES ÉVÉNEMENTS DE SÉCURITÉ DES LOCAUX (Vols, intrusions, tags)
CREATE TABLE IF NOT EXISTS security_events (
  id BIGSERIAL PRIMARY KEY,
  station_id TEXT,
  player_id TEXT,
  event_type TEXT,
  details TEXT,
  loss_amount NUMERIC DEFAULT 0,
  foiled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABLE DU TCHAT D'ALLIANCE MULTIJOUEUR
CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGSERIAL PRIMARY KEY,
  alliance_id TEXT DEFAULT 'alliance-fnpc',
  author_id TEXT,
  author_name TEXT,
  station_name TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- CŒUR DU MONDE PERSISTANT SERVEUR : FONCTION DE BATTEMENT ET RÉSOLUTION
-- Résout les missions et formations selon l'horloge officielle du serveur NOW()
-- ==============================================================================
CREATE OR REPLACE FUNCTION process_world_heartbeat()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_mission RECORD;
  v_formation RECORD;
  v_resolved_missions_count INT := 0;
  v_resolved_formations_count INT := 0;
  v_save RECORD;
  v_save_data JSONB;
  v_missions_array JSONB;
  v_volunteers_array JSONB;
  v_vehicles_array JSONB;
BEGIN
  -- 1. Résolution des missions dont l'heure de fin serveur est échue
  FOR v_mission IN
    SELECT * FROM active_missions
    WHERE status = 'ongoing' AND ends_at <= v_now
    FOR UPDATE
  LOOP
    -- Clôture de la mission dans active_missions
    UPDATE active_missions
    SET status = 'completed',
        resolved_at = v_now
    WHERE id = v_mission.id;

    -- Ajout dans le journal d'événements serveur du joueur
    INSERT INTO server_events_log (player_id, event_type, title, message, reward_money, created_at)
    VALUES (
      v_mission.player_id,
      'mission_completed',
      'Mission Accomplie : ' || v_mission.title,
      'Dispositif clôturé avec succès par le serveur. Secouristes et véhicules réarmés.',
      COALESCE(v_mission.reward_money, 0),
      v_now
    );

    -- Mise à jour de la sauvegarde cloud du joueur (crédit des fonds et libération des ressources)
    SELECT * INTO v_save FROM game_saves WHERE user_id = v_mission.player_id FOR UPDATE;
    IF FOUND THEN
      v_save_data := v_save.save_data;

      -- Crédit des fonds
      v_save.funds := COALESCE(v_save.funds, 0) + COALESCE(v_mission.reward_money, 0);

      -- Mise à jour de l'objet ressources dans save_data
      IF v_save_data ? 'resources' THEN
        v_save_data := jsonb_set(
          v_save_data,
          '{resources,funds}',
          to_jsonb(COALESCE((v_save_data->'resources'->>'funds')::numeric, 0) + COALESCE(v_mission.reward_money, 0))
        );
      END IF;

      -- Libération des bénévoles assignés
      IF v_save_data ? 'volunteers' AND jsonb_typeof(v_save_data->'volunteers') = 'array' THEN
        SELECT jsonb_agg(
          CASE
            WHEN v_mission.assigned_volunteers @> to_jsonb(v->>'id') THEN
              jsonb_set(v, '{status}', '"disponible"')
            ELSE v
          END
        )
        INTO v_volunteers_array
        FROM jsonb_array_elements(v_save_data->'volunteers') AS v;

        v_save_data := jsonb_set(v_save_data, '{volunteers}', COALESCE(v_volunteers_array, '[]'::jsonb));
      END IF;

      -- Libération des véhicules assignés
      IF v_save_data ? 'vehicles' AND jsonb_typeof(v_save_data->'vehicles') = 'array' THEN
        SELECT jsonb_agg(
          CASE
            WHEN v_mission.assigned_vehicles @> to_jsonb(veh->>'id') THEN
              jsonb_set(veh, '{status}', '"disponible"')
            ELSE veh
          END
        )
        INTO v_vehicles_array
        FROM jsonb_array_elements(v_save_data->'vehicles') AS veh;

        v_save_data := jsonb_set(v_save_data, '{vehicles}', COALESCE(v_vehicles_array, '[]'::jsonb));
      END IF;

      -- Clôture de la mission dans l'historique de sauvegarde
      IF v_save_data ? 'missions' AND jsonb_typeof(v_save_data->'missions') = 'array' THEN
        SELECT jsonb_agg(
          CASE
            WHEN (m->>'id') = v_mission.id THEN
              jsonb_set(m, '{status}', '"completed"')
            ELSE m
          END
        )
        INTO v_missions_array
        FROM jsonb_array_elements(v_save_data->'missions') AS m;

        v_save_data := jsonb_set(v_save_data, '{missions}', COALESCE(v_missions_array, '[]'::jsonb));
      END IF;

      UPDATE game_saves
      SET funds = v_save.funds,
          save_data = v_save_data,
          updated_at = v_now,
          server_synced_at = v_now
      WHERE user_id = v_mission.player_id;
    END IF;

    v_resolved_missions_count := v_resolved_missions_count + 1;
  END LOOP;

  -- 2. Résolution des formations dont l'heure de fin serveur est échue
  FOR v_formation IN
    SELECT * FROM active_formations
    WHERE status = 'ongoing' AND ends_at <= v_now
    FOR UPDATE
  LOOP
    UPDATE active_formations
    SET status = 'completed',
        resolved_at = v_now
    WHERE id = v_formation.id;

    INSERT INTO server_events_log (player_id, event_type, title, message, reward_money, created_at)
    VALUES (
      v_formation.player_id,
      'formation_completed',
      'Session de Formation Terminée (' || v_formation.diploma || ')',
      'Les apprenants ont validé leur diplôme et sont opérationnels.',
      0,
      v_now
    );

    v_resolved_formations_count := v_resolved_formations_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'server_time', v_now,
    'missions_resolved', v_resolved_missions_count,
    'formations_resolved', v_resolved_formations_count
  );
END;
$$;

-- ==============================================================================
-- FONCTION RPC POUR SYNCHRONISATION CLIENT (APPELÉE AU LOGIN & RÉGULIÈREMENT)
-- Permet au client de récupérer l'heure officielle et de déclencher le heartbeat
-- ==============================================================================
CREATE OR REPLACE FUNCTION sync_server_world(p_player_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_heartbeat_result JSONB;
  v_now TIMESTAMPTZ := NOW();
  v_pending_events JSONB;
  v_save_record RECORD;
BEGIN
  -- 1. Exécuter la résolution temporelle serveur
  v_heartbeat_result := process_world_heartbeat();

  -- 2. Récupérer les événements non lus du joueur
  SELECT COALESCE(jsonb_agg(to_jsonb(e)), '[]'::jsonb)
  INTO v_pending_events
  FROM (
    SELECT id, event_type, title, message, reward_money, created_at
    FROM server_events_log
    WHERE player_id = p_player_id AND read = FALSE
    ORDER BY created_at ASC
  ) e;

  -- Marquer ces événements comme lus
  IF v_pending_events <> '[]'::jsonb THEN
    UPDATE server_events_log
    SET read = TRUE
    WHERE player_id = p_player_id AND read = FALSE;
  END IF;

  -- 3. Récupérer la dernière sauvegarde consolidée
  SELECT * INTO v_save_record FROM game_saves WHERE user_id = p_player_id;

  RETURN jsonb_build_object(
    'server_time', v_now,
    'heartbeat', v_heartbeat_result,
    'events', v_pending_events,
    'save', CASE WHEN v_save_record IS NOT NULL THEN to_jsonb(v_save_record) ELSE NULL END
  );
END;
$$;

-- ==============================================================================
-- PROGRAMMATION DU CŒUR SERVEUR VIA PG_CRON (SI DISPONIBLE DANS SUPABASE)
-- Exécute automatiquement la résolution chaque minute même si l'onglet est fermé
-- ==============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('myprotec_world_heartbeat');
    PERFORM cron.schedule('myprotec_world_heartbeat', '* * * * *', 'SELECT process_world_heartbeat();');
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Ignorer si l'extension pg_cron n'est pas activée sur le projet Supabase (la RPC sync_server_world prend le relais)
  RAISE NOTICE 'pg_cron non disponible ou restreint. La RPC sync_server_world assurera la résolution.';
END $$;

-- ==============================================================================
-- DÉBLOCAGE RLS (ROW LEVEL SECURITY)
-- Permet au client de lire/écrire directement les tables opérationnelles
-- ==============================================================================
ALTER TABLE players DISABLE ROW LEVEL SECURITY;
ALTER TABLE game_saves DISABLE ROW LEVEL SECURITY;
ALTER TABLE active_missions DISABLE ROW LEVEL SECURITY;
ALTER TABLE active_formations DISABLE ROW LEVEL SECURITY;
ALTER TABLE server_events_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE alliance_stations DISABLE ROW LEVEL SECURITY;
ALTER TABLE security_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;

-- Autorisations d'exécution des fonctions publiques
GRANT EXECUTE ON FUNCTION process_world_heartbeat() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION sync_server_world(TEXT) TO anon, authenticated, service_role;
