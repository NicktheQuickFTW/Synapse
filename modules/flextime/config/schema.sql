-- XII-OS FlexTime Database Schema
-- This schema defines the tables needed for the FlexTime module
-- to store scheduling data in the DuckDB database.

-- Schools table to store school information
CREATE TABLE IF NOT EXISTS schools (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  abbreviation VARCHAR,
  primary_color VARCHAR,
  secondary_color VARCHAR,
  logo_path VARCHAR,
  time_zone VARCHAR
);

-- Sports table to define available sports
CREATE TABLE IF NOT EXISTS sports (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  gender VARCHAR,  -- 'men', 'women', 'coed'
  season VARCHAR,  -- 'fall', 'winter', 'spring'
  start_date DATE,
  end_date DATE,
  max_conference_games INTEGER,
  min_rest_days INTEGER DEFAULT 1,
  home_away_required BOOLEAN DEFAULT TRUE
);

-- Campus conflicts table
CREATE TABLE IF NOT EXISTS campus_conflicts (
  id INTEGER PRIMARY KEY,
  school_id VARCHAR NOT NULL,
  date DATE NOT NULL,
  event_name VARCHAR NOT NULL,
  priority INTEGER DEFAULT 1,  -- 1=low, 5=high
  notes VARCHAR,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Venues table
CREATE TABLE IF NOT EXISTS venues (
  id INTEGER PRIMARY KEY,
  school_id VARCHAR,
  name VARCHAR NOT NULL,
  sport_id VARCHAR,
  capacity INTEGER,
  address VARCHAR,
  city VARCHAR,
  state VARCHAR,
  availability_exceptions VARCHAR  -- JSON array of dates when venue is unavailable
);

-- Travel partners table
CREATE TABLE IF NOT EXISTS travel_partners (
  id INTEGER PRIMARY KEY,
  sport_id VARCHAR,
  season VARCHAR NOT NULL,
  school1_id VARCHAR,
  school2_id VARCHAR,
  notes VARCHAR
);

-- Schedules table - high level scheduling information
CREATE TABLE IF NOT EXISTS schedules (
  id INTEGER PRIMARY KEY,
  sport_id VARCHAR,
  season VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'draft',  -- 'draft', 'approved', 'published'
  created_by VARCHAR,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP,
  notes VARCHAR
);

-- Games table - individual games in schedules
CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY,
  schedule_id INTEGER,
  home_team_id VARCHAR,
  away_team_id VARCHAR,
  venue_id INTEGER,
  game_date DATE,
  game_time TIME,
  is_conference BOOLEAN DEFAULT TRUE,
  tv_network VARCHAR,
  tv_time VARCHAR,
  status VARCHAR DEFAULT 'scheduled',  -- 'scheduled', 'canceled', 'postponed', 'completed'
  notes VARCHAR
);

-- Schedule constraints table
CREATE TABLE IF NOT EXISTS schedule_constraints (
  id INTEGER PRIMARY KEY,
  schedule_id INTEGER,
  constraint_type VARCHAR NOT NULL,  -- 'min_days_rest', 'max_consecutive_away', etc.
  constraint_value VARCHAR NOT NULL,
  applies_to VARCHAR,  -- 'all', or specific school_id
  priority INTEGER DEFAULT 3  -- 1-5, with 5 being highest priority
);

-- Schedule versions table for tracking iterations
CREATE TABLE IF NOT EXISTS schedule_versions (
  id INTEGER PRIMARY KEY,
  schedule_id INTEGER,
  version_number INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR,
  status VARCHAR DEFAULT 'draft',  -- 'draft', 'rejected', 'approved'
  notes VARCHAR,
  data_blob VARCHAR  -- JSON data containing the complete schedule snapshot
);

-- User preferences for FlexTime
CREATE TABLE IF NOT EXISTS flextime_preferences (
  id INTEGER PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  preference_key VARCHAR NOT NULL,
  preference_value VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP
);

-- Import sample data for schools table based on school_info.json
-- Note: To execute this separately - add separate SQL statements for DuckDB compatibility
-- Direct import of JSON data into schools table
-- Uncomment and run this if you want to load school data
-- 
-- INSERT INTO schools (id, name, primary_color, secondary_color, logo_path)
-- SELECT 
--   key as id, 
--   json_extract_string(value, '$.name') as name,
--   json_extract_string(value, '$.primary_color') as primary_color,
--   json_extract_string(value, '$.secondary_color') as secondary_color,
--   json_extract_string(value, '$.logo_svg') as logo_path
-- FROM 
--   read_json_objects('/Users/nickthequick/XII-OS/data/school_branding/school_info.json');


-- Sample sports data
INSERT INTO sports (id, name, gender, season, start_date, end_date, max_conference_games)
VALUES
  ('mbb', 'Basketball', 'men', 'winter', '2025-11-01', '2026-03-31', 18),
  ('wbb', 'Basketball', 'women', 'winter', '2025-11-01', '2026-03-31', 18),
  ('bsbl', 'Baseball', 'men', 'spring', '2026-02-15', '2026-06-15', 24),
  ('sfbl', 'Softball', 'women', 'spring', '2026-02-15', '2026-06-01', 24),
  ('vball', 'Volleyball', 'women', 'fall', '2025-08-15', '2025-12-15', 18),
  ('mten', 'Tennis', 'men', 'spring', '2026-01-15', '2026-05-15', 10),
  ('wten', 'Tennis', 'women', 'spring', '2026-01-15', '2026-05-15', 10),
  ('socc', 'Soccer', 'women', 'fall', '2025-08-01', '2025-11-30', 10),
  ('wres', 'Wrestling', 'men', 'winter', '2025-11-01', '2026-03-15', 9),
  ('gym', 'Gymnastics', 'women', 'winter', '2026-01-05', '2026-04-15', 8); 