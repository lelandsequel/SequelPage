/*
  # Add Industry Analysis Feature

  1. New Tables
    - `industry_analyses`
      - `id` (uuid, primary key)
      - `geo` (text) - Geographic area analyzed
      - `timeframe` (text) - Time period for analysis
      - `mode` (text) - Analysis mode (web/heuristic)
      - `weights_used` (jsonb) - Scoring weights configuration
      - `ranked_industries` (jsonb) - Array of industry analysis results
      - `methodology` (jsonb) - Analysis methodology and metadata
      - `status` (text) - Processing status
      - `error_message` (text, nullable) - Error details if failed
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `industry_analyses` table
    - Add policies for authenticated users to manage their analyses
*/

CREATE TABLE IF NOT EXISTS industry_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  geo text NOT NULL,
  timeframe text DEFAULT 'last 6-12 months',
  mode text NOT NULL CHECK (mode IN ('web', 'heuristic')),
  weights_used jsonb NOT NULL,
  ranked_industries jsonb DEFAULT '[]'::jsonb,
  methodology jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE industry_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all industry analyses"
  ON industry_analyses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create industry analyses"
  ON industry_analyses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update industry analyses"
  ON industry_analyses
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete industry analyses"
  ON industry_analyses
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_industry_analyses_geo ON industry_analyses(geo);
CREATE INDEX IF NOT EXISTS idx_industry_analyses_status ON industry_analyses(status);
CREATE INDEX IF NOT EXISTS idx_industry_analyses_created_at ON industry_analyses(created_at DESC);
