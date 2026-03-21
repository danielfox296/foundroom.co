-- Radio Player — Full Database Schema
-- Run this in Supabase Dashboard → SQL Editor

-- ============================================
-- TABLES
-- ============================================

-- Users table (one row per listener)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  access_code TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tracks table
CREATE TABLE tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL UNIQUE,
  title TEXT,
  duration_seconds INTEGER,
  flagged BOOLEAN NOT NULL DEFAULT FALSE,
  flag_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES tracks(id),
  user_id UUID NOT NULL REFERENCES users(id),
  reported_at TIMESTAMPTZ DEFAULT now()
);

-- Play events table (lightweight analytics)
CREATE TABLE play_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES tracks(id),
  user_id UUID NOT NULL REFERENCES users(id),
  started_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_tracks_flagged ON tracks(flagged);
CREATE INDEX idx_reports_track_id ON reports(track_id);
CREATE INDEX idx_play_events_user ON play_events(user_id);
CREATE INDEX idx_users_access_code ON users(access_code);
CREATE INDEX idx_users_active ON users(active);

-- ============================================
-- RPC: Atomic flag + increment for track reports
-- ============================================

CREATE OR REPLACE FUNCTION flag_track(track_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE tracks
  SET flagged = TRUE, flag_count = flag_count + 1
  WHERE id = track_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
