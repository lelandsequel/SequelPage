/*
  # CandlPage Application Schema

  1. New Tables
    - `seo_audits`
      - `id` (uuid, primary key)
      - `url` (text)
      - `html_source` (text, nullable)
      - `score` (integer, 0-100)
      - `grade` (text, A+ to F)
      - `seo_issues` (jsonb, array of issues with severity/fixes)
      - `aeo_optimizations` (jsonb, optimization recommendations)
      - `technical_seo` (jsonb, checklist of present/missing features)
      - `content_gaps` (jsonb, missing content opportunities)
      - `recommendations` (jsonb, strategic improvements)
      - `created_at` (timestamptz)
    
    - `security_scans`
      - `id` (uuid, primary key)
      - `url` (text)
      - `html_source` (text, nullable)
      - `risk_score` (integer, 0-100)
      - `vulnerabilities` (jsonb, array of CVEs and issues)
      - `fixes` (jsonb, copy-paste security patches)
      - `strategic_report` (jsonb, executive summary and roadmap)
      - `created_at` (timestamptz)
    
    - `generated_content`
      - `id` (uuid, primary key)
      - `content_type` (text, 'keywords'/'press_release'/'article')
      - `input_params` (jsonb, parameters used for generation)
      - `output_content` (text, generated content)
      - `metadata` (jsonb, additional data like word count, etc.)
      - `created_at` (timestamptz)
    
    - `leads`
      - `id` (uuid, primary key)
      - `business_name` (text)
      - `website` (text)
      - `phone` (text, nullable)
      - `address` (text, nullable)
      - `geography` (text)
      - `industry` (text)
      - `score` (integer, 0-100)
      - `traffic_trend` (text)
      - `schema_markup` (boolean)
      - `content_freshness` (text)
      - `lcp_score` (text)
      - `opportunities` (jsonb, array of identified opportunities)
      - `report` (text, nullable)
      - `created_at` (timestamptz)
    
    - `user_sessions`
      - `id` (uuid, primary key)
      - `session_token` (text, unique)
      - `authenticated` (boolean, default false)
      - `last_activity` (timestamptz, default now())
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (since using simple password gate)
    
  3. Indexes
    - Add indexes for common query patterns
*/

-- SEO Audits Table
CREATE TABLE IF NOT EXISTS seo_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  html_source text,
  score integer CHECK (score >= 0 AND score <= 100),
  grade text,
  seo_issues jsonb DEFAULT '[]'::jsonb,
  aeo_optimizations jsonb DEFAULT '[]'::jsonb,
  technical_seo jsonb DEFAULT '{}'::jsonb,
  content_gaps jsonb DEFAULT '[]'::jsonb,
  recommendations jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seo_audits_created_at ON seo_audits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_audits_url ON seo_audits(url);

ALTER TABLE seo_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to seo_audits"
  ON seo_audits FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to seo_audits"
  ON seo_audits FOR INSERT
  TO anon
  WITH CHECK (true);

-- Security Scans Table
CREATE TABLE IF NOT EXISTS security_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  html_source text,
  risk_score integer CHECK (risk_score >= 0 AND risk_score <= 100),
  vulnerabilities jsonb DEFAULT '[]'::jsonb,
  fixes jsonb DEFAULT '[]'::jsonb,
  strategic_report jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_scans_created_at ON security_scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_scans_url ON security_scans(url);

ALTER TABLE security_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to security_scans"
  ON security_scans FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to security_scans"
  ON security_scans FOR INSERT
  TO anon
  WITH CHECK (true);

-- Generated Content Table
CREATE TABLE IF NOT EXISTS generated_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL CHECK (content_type IN ('keywords', 'press_release', 'article')),
  input_params jsonb DEFAULT '{}'::jsonb,
  output_content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_generated_content_created_at ON generated_content(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_content_type ON generated_content(content_type);

ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to generated_content"
  ON generated_content FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to generated_content"
  ON generated_content FOR INSERT
  TO anon
  WITH CHECK (true);

-- Leads Table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  website text,
  phone text,
  address text,
  geography text NOT NULL,
  industry text NOT NULL,
  score integer CHECK (score >= 0 AND score <= 100),
  traffic_trend text,
  schema_markup boolean DEFAULT false,
  content_freshness text,
  lcp_score text,
  opportunities jsonb DEFAULT '[]'::jsonb,
  report text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_geography ON leads(geography);
CREATE INDEX IF NOT EXISTS idx_leads_industry ON leads(industry);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to leads"
  ON leads FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to leads"
  ON leads FOR INSERT
  TO anon
  WITH CHECK (true);

-- User Sessions Table
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token text UNIQUE NOT NULL,
  authenticated boolean DEFAULT false,
  last_activity timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to user_sessions"
  ON user_sessions FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);