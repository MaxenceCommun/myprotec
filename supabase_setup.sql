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

-- ==============================================================================
-- 8. SYSTÈME D'ÉCUSSONS DE COLLECTION & BOURSE AUX ÉCHANGES (TROC INTER-ANTENNES)
-- ==============================================================================

-- A. Table du catalogue officiel des écussons
CREATE TABLE IF NOT EXISTS ecussons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  nom TEXT NOT NULL,
  description TEXT,
  categorie TEXT NOT NULL CHECK (categorie IN ('specialite', 'mission', 'departement', 'renfort')),
  badge_url TEXT,
  rarete TEXT NOT NULL CHECK (rarete IN ('commun', 'rare', 'epique', 'historique')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ecussons_categorie ON ecussons(categorie);
CREATE INDEX IF NOT EXISTS idx_ecussons_code ON ecussons(code);

-- B. Table d'association : écussons possédés par chaque antenne (avec gestion des doublons)
CREATE TABLE IF NOT EXISTS antenne_ecussons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  antenne_id TEXT NOT NULL,
  ecusson_id UUID NOT NULL REFERENCES ecussons(id) ON DELETE CASCADE,
  quantite INT NOT NULL DEFAULT 1 CHECK (quantite >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_antenne_ecusson UNIQUE (antenne_id, ecusson_id)
);

CREATE INDEX IF NOT EXISTS idx_antenne_ecussons_antenne ON antenne_ecussons(antenne_id);
CREATE INDEX IF NOT EXISTS idx_antenne_ecussons_ecusson ON antenne_ecussons(ecusson_id);

-- C. Table des offres de troc / bourse d'échanges
CREATE TABLE IF NOT EXISTS ecusson_echanges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  antenne_offreur_id TEXT NOT NULL,
  ecusson_offert_id UUID NOT NULL REFERENCES ecussons(id) ON DELETE CASCADE,
  ecusson_demande_id UUID NOT NULL REFERENCES ecussons(id) ON DELETE CASCADE,
  statut TEXT NOT NULL DEFAULT 'ouvert' CHECK (statut IN ('ouvert', 'complete', 'annule')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ecusson_echanges_statut ON ecusson_echanges(statut);
CREATE INDEX IF NOT EXISTS idx_ecusson_echanges_offreur ON ecusson_echanges(antenne_offreur_id);

-- ==============================================================================
-- FONCTIONS RPC SÉCURISÉES POUR LE TROC D'ÉCUSSONS
-- ==============================================================================

-- 1. Créer une offre de troc (exige au moins 2 exemplaires, c-à-d un doublon)
CREATE OR REPLACE FUNCTION creer_offre_echange(
  p_ecusson_offert_id UUID,
  p_ecusson_demande_id UUID,
  p_antenne_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_antenne TEXT;
  v_dispo INT;
  v_offre_id UUID;
BEGIN
  v_antenne := COALESCE(p_antenne_id, auth.uid()::text);
  IF v_antenne IS NULL THEN
    RAISE EXCEPTION 'Antenne non authentifiée.';
  END IF;

  IF p_ecusson_offert_id = p_ecusson_demande_id THEN
    RAISE EXCEPTION 'L’écusson offert et l’écusson demandé doivent être distincts.';
  END IF;

  -- Vérifier la présence d'au moins 2 exemplaires (1 gardé dans le tableau + 1 mis en troc)
  SELECT quantite INTO v_dispo
  FROM antenne_ecussons
  WHERE antenne_id = v_antenne AND ecusson_id = p_ecusson_offert_id
  FOR UPDATE;

  IF v_dispo IS NULL OR v_dispo < 2 THEN
    RAISE EXCEPTION 'Vous devez posséder au moins 2 exemplaires de cet écusson (un doublon) pour le proposer à l’échange (actuel: %)', COALESCE(v_dispo, 0);
  END IF;

  -- Décrémenter la quantité pour l'offreur
  UPDATE antenne_ecussons
  SET quantite = quantite - 1, updated_at = NOW()
  WHERE antenne_id = v_antenne AND ecusson_id = p_ecusson_offert_id;

  -- Créer l'offre ouverte
  INSERT INTO ecusson_echanges (antenne_offreur_id, ecusson_offert_id, ecusson_demande_id, statut)
  VALUES (v_antenne, p_ecusson_offert_id, p_ecusson_demande_id, 'ouvert')
  RETURNING id INTO v_offre_id;

  RETURN jsonb_build_object(
    'success', true,
    'offre_id', v_offre_id,
    'message', 'Offre de troc publiée sur la bourse aux écussons.'
  );
END;
$$;

-- 2. Annuler une offre de troc (réintègre l'écusson dans l'antenne offreuse)
CREATE OR REPLACE FUNCTION annuler_offre_echange(
  p_offre_id UUID,
  p_antenne_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_antenne TEXT;
  v_offre RECORD;
BEGIN
  v_antenne := COALESCE(p_antenne_id, auth.uid()::text);
  IF v_antenne IS NULL THEN
    RAISE EXCEPTION 'Antenne non authentifiée.';
  END IF;

  SELECT * INTO v_offre
  FROM ecusson_echanges
  WHERE id = p_offre_id AND statut = 'ouvert'
  FOR UPDATE;

  IF v_offre IS NULL THEN
    RAISE EXCEPTION 'Offre introuvable ou déjà clôturée.';
  END IF;

  IF v_offre.antenne_offreur_id <> v_antenne THEN
    RAISE EXCEPTION 'Seul le propriétaire de l’offre peut l’annuler.';
  END IF;

  -- Clôturer l'offre
  UPDATE ecusson_echanges
  SET statut = 'annule'
  WHERE id = p_offre_id;

  -- Réincrémenter le patch chez l'offreur
  UPDATE antenne_ecussons
  SET quantite = quantite + 1, updated_at = NOW()
  WHERE antenne_id = v_antenne AND ecusson_id = v_offre.ecusson_offert_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Offre de troc annulée. Votre écusson a été réintégré à votre collection.'
  );
END;
$$;

-- 3. Accepter une offre de troc (transaction atomique : échange bilatéral des patchs)
CREATE OR REPLACE FUNCTION accepter_offre_echange(
  p_offre_id UUID,
  p_antenne_demandeur_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_demandeur TEXT;
  v_offre RECORD;
  v_dispo_demandeur INT;
BEGIN
  v_demandeur := COALESCE(p_antenne_demandeur_id, auth.uid()::text);
  IF v_demandeur IS NULL THEN
    RAISE EXCEPTION 'Antenne non authentifiée.';
  END IF;

  -- Verrouillage de l'offre
  SELECT * INTO v_offre
  FROM ecusson_echanges
  WHERE id = p_offre_id AND statut = 'ouvert'
  FOR UPDATE;

  IF v_offre IS NULL THEN
    RAISE EXCEPTION 'Cette offre d’échange n’est plus disponible (déjà conclue ou annulée).';
  END IF;

  IF v_offre.antenne_offreur_id = v_demandeur THEN
    RAISE EXCEPTION 'Vous ne pouvez pas accepter votre propre offre.';
  END IF;

  -- Vérifier que le demandeur possède bien l'écusson demandé (au moins 1 exemplaire)
  SELECT quantite INTO v_dispo_demandeur
  FROM antenne_ecussons
  WHERE antenne_id = v_demandeur AND ecusson_id = v_offre.ecusson_demande_id
  FOR UPDATE;

  IF v_dispo_demandeur IS NULL OR v_dispo_demandeur < 1 THEN
    RAISE EXCEPTION 'Vous ne possédez pas l’écusson requis pour conclure cet échange.';
  END IF;

  -- 1. Décrémenter l'écusson demandé chez le demandeur
  UPDATE antenne_ecussons
  SET quantite = quantite - 1, updated_at = NOW()
  WHERE antenne_id = v_demandeur AND ecusson_id = v_offre.ecusson_demande_id;

  -- 2. Ajouter l'écusson demandé chez l'offreur (UPSERT)
  INSERT INTO antenne_ecussons (antenne_id, ecusson_id, quantite, updated_at)
  VALUES (v_offre.antenne_offreur_id, v_offre.ecusson_demande_id, 1, NOW())
  ON CONFLICT (antenne_id, ecusson_id)
  DO UPDATE SET quantite = antenne_ecussons.quantite + 1, updated_at = NOW();

  -- 3. Ajouter l'écusson offert chez le demandeur (UPSERT)
  INSERT INTO antenne_ecussons (antenne_id, ecusson_id, quantite, updated_at)
  VALUES (v_demandeur, v_offre.ecusson_offert_id, 1, NOW())
  ON CONFLICT (antenne_id, ecusson_id)
  DO UPDATE SET quantite = antenne_ecussons.quantite + 1, updated_at = NOW();

  -- 4. Clôturer l'offre
  UPDATE ecusson_echanges
  SET statut = 'complete'
  WHERE id = p_offre_id;

  -- 5. Notification serveur pour l'offreur
  INSERT INTO server_events_log (player_id, event_type, title, message)
  VALUES (
    v_offre.antenne_offreur_id,
    'ecusson_trade',
    'Échange d’Écusson Conclu ! 🤝',
    'Une antenne alliée a accepté votre offre de troc. Votre nouvel écusson est accroché à votre tableau !'
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Échange réussi ! Le nouvel écusson a été ajouté à votre collection.'
  );
END;
$$;

-- ==============================================================================
-- DÉBLOCAGE RLS ET DROITS POUR LES TABLES D'ÉCUSSONS
-- ==============================================================================
ALTER TABLE ecussons DISABLE ROW LEVEL SECURITY;
ALTER TABLE antenne_ecussons DISABLE ROW LEVEL SECURITY;
ALTER TABLE ecusson_echanges DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE ecussons TO anon, authenticated, service_role;
GRANT ALL ON TABLE antenne_ecussons TO anon, authenticated, service_role;
GRANT ALL ON TABLE ecusson_echanges TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION creer_offre_echange(UUID, UUID, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION annuler_offre_echange(UUID, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION accepter_offre_echange(UUID, TEXT) TO anon, authenticated, service_role;

-- ==============================================================================
-- CATALOGUE INITIAL IDEMPOTENT D'ÉCUSSONS OFFICIELS DE LA PROTECTION CIVILE
-- ==============================================================================
INSERT INTO ecussons (code, nom, description, categorie, badge_url, rarete) VALUES
  -- 1. SPÉCIALITÉS
  ('spec_pse', 'Équipier Secouriste Opérationnel', 'Délivré aux antennes maintenant un équipage PSE complet prêt à intervenir.', 'specialite', 'images/badges/badge_pse.png', 'commun'),
  ('spec_aqua', 'Sauvetage Aquatique & Inondations', 'Reconnaissance des unités de sauvetage côtier, fleuves et zones inondées.', 'specialite', 'images/badges/badge_aquatique.png', 'rare'),
  ('spec_cyno', 'Unité Cynotechnique de Recherche', 'Dédié aux équipes cynotechniques de recherche de personnes disparues.', 'specialite', 'images/badges/badge_cyno.png', 'rare'),
  ('spec_pma', 'Poste Médical Avancé (PMA)', 'Attribué pour la capacité de déploiement d’une chaîne médicale complète de tri.', 'specialite', 'images/badges/badge_pma.png', 'epique'),
  ('spec_formateur', 'Corps National des Formateurs', 'Distinction des antennes disposant d’au moins deux formateurs de sécurité civile certifiés.', 'specialite', 'images/badges/badge_formateur.png', 'rare'),
  ('spec_aep', 'Soutien Psychologique & Urgence Médico-Sociale', 'Délivré aux équipes formées à la prise en charge des chocs émotionnels.', 'specialite', 'images/badges/badge_aep.png', 'rare'),

  -- 2. MISSIONS MAJEURES
  ('miss_grand_froid', 'Plan Grand Froid & Maraudes', 'Remis pour l’engagement solidaire de nuit auprès des personnes sans-abri en période hivernale.', 'mission', 'images/badges/badge_froid.png', 'rare'),
  ('miss_14_juillet', 'Dispositif Fête Nationale 14 Juillet', 'Écusson commémoratif des grands rassemblements républicains et feux d’artifice.', 'mission', 'images/badges/badge_14juillet.png', 'epique'),
  ('miss_marathon', 'Sécurisation Grands Événements Sportifs', 'Délivré lors de la couverture médicale complète de marathons et trails majeurs.', 'mission', 'images/badges/badge_marathon.png', 'commun'),
  ('miss_festival', 'Sécurité Événements Musicaux & Festivals', 'Reconnaît l’encadrement de dispositifs de moyenne et grande envergure.', 'mission', 'images/badges/badge_festival.png', 'rare'),
  ('miss_sncf', 'Convention Catastrophe Ferroviaire & SNCF', 'Attribué lors de la signature et des interventions d’urgence sur réseau ferré.', 'mission', 'images/badges/badge_sncf.png', 'historique'),

  -- 3. DÉPARTEMENTS & ANCRAGE TERRITORIAL
  ('dept_54', 'Protection Civile 54 • Meurthe-et-Moselle', 'Écusson territorial des secouristes lorrains du 54.', 'departement', 'images/badges/badge_54.png', 'commun'),
  ('dept_75', 'Protection Civile de Paris (75)', 'Écusson historique de la capitale et des brigades d’intervention parisiennes.', 'departement', 'images/badges/badge_75.png', 'rare'),
  ('dept_69', 'Protection Civile du Rhône (69)', 'Insigne officiel des unités de secours de la métropole lyonnaise.', 'departement', 'images/badges/badge_69.png', 'commun'),
  ('dept_13', 'Protection Civile des Bouches-du-Rhône (13)', 'Écusson des secouristes méditerranéens et feux de forêt du 13.', 'departement', 'images/badges/badge_13.png', 'rare'),
  ('dept_33', 'Protection Civile de Gironde (33)', 'Distinction territoriale des secouristes du Sud-Ouest.', 'departement', 'images/badges/badge_33.png', 'commun'),
  ('dept_59', 'Protection Civile du Nord (59)', 'Écusson des équipes engagées sur le littoral et les Flandres.', 'departement', 'images/badges/badge_59.png', 'commun'),

  -- 4. RENFORTS & SOLIDARITÉ
  ('renf_dps_ge', 'Grande Envergure • Renfort Inter-Antennes', 'Décerné à toute antenne ayant dépêché un équipage ou VPSP en renfort sur un DPS-GE.', 'renfort', 'images/badges/badge_renfort_ge.png', 'epique'),
  ('renf_colonne_crue', 'Colonne Nationale de Secours Crues', 'Écusson de prestige remis lors des déploiements zonaux de crise hydraulique.', 'renfort', 'images/badges/badge_crue.png', 'historique'),
  ('renf_zonal', 'Solidarité Zonale de Sécurité Civile', 'Attribué pour l’appui logistique ou opérationnel rapide entre départements limitrophes.', 'renfort', 'images/badges/badge_zonal.png', 'rare'),
  ('renf_fondateur', 'Pionnier FNPC • Fondation d’Antenne', 'Écusson commémoratif remis aux directeurs ayant inauguré leur bâtiment d’antenne.', 'renfort', 'images/badges/badge_fondateur.png', 'historique')
ON CONFLICT (code) DO UPDATE SET
  nom = EXCLUDED.nom,
  description = EXCLUDED.description,
  categorie = EXCLUDED.categorie,
  badge_url = EXCLUDED.badge_url,
  rarete = EXCLUDED.rarete;
