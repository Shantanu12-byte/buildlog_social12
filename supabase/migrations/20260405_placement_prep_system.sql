-- Supabase Migration: 20260405_placement_prep_system.sql
-- Goal: Comprehensive Placement Prep / Coding Challenge System

-- 1. Problems Table
CREATE TABLE IF NOT EXISTS problems (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  difficulty text CHECK (
    difficulty IN ('Easy','Medium','Hard')
  ),
  type text CHECK (
    type IN ('coding','mcq','bug_fix', 'output_predict')
  ),
  tags text[],           -- ['java','arrays']
  companies text[],      -- ['TCS','Infosys']
  languages text[],      -- supported languages
  starter_code jsonb,    -- {python: '', java: ''}
  solution jsonb,        -- {python: '', java: ''}
  test_cases jsonb,      -- [{input,output}]
  expected_output text,  -- for output_predict
  mcq_options jsonb,     -- for MCQ [{text,correct}]
  explanation text,
  created_at timestamptz DEFAULT now()
);

-- 2. User Progress Table
CREATE TABLE IF NOT EXISTS user_problems (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  problem_id uuid REFERENCES problems(id),
  status text CHECK (
    status IN ('solved','attempted','skipped')
  ),
  language text,
  submitted_code text,
  attempts int DEFAULT 1,
  solved_at timestamptz,
  time_taken_seconds int,
  UNIQUE(user_id, problem_id)
);

-- 3. Daily Challenge Table
CREATE TABLE IF NOT EXISTS daily_challenges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  problem_id uuid REFERENCES problems(id),
  date date UNIQUE DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- 4. Company Tracks Table
CREATE TABLE IF NOT EXISTS company_tracks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,        -- 'TCS NQT'
  company text NOT NULL,     -- 'TCS'
  logo_url text,
  description text,
  problem_ids uuid[],
  difficulty_breakdown jsonb, -- {easy:10,med:15}
  created_at timestamptz DEFAULT now()
);

-- 5. Profile Stats Extension
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS xp int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS problems_solved int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS easy_solved int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS medium_solved int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hard_solved int DEFAULT 0;

-- 6. RLS Policies
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_tracks ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'problems public read') THEN
        CREATE POLICY "problems public read" ON problems FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user own progress') THEN
        CREATE POLICY "user own progress" ON user_problems FOR ALL USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'daily_challenges public read') THEN
        CREATE POLICY "daily_challenges public read" ON daily_challenges FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'company_tracks public read') THEN
        CREATE POLICY "company_tracks public read" ON company_tracks FOR SELECT USING (true);
    END IF;
END $$;
