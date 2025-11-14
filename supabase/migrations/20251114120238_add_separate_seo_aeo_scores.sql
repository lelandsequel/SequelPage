/*
  # Add Separate SEO and AEO Scores

  1. Changes
    - Add `seo_score` column to track traditional SEO score (0-100)
    - Add `aeo_score` column to track Answer Engine Optimization score (0-100)
    - Keep existing `score` column as overall combined score
    - Backfill existing records with score values

  2. Notes
    - Existing `score` represents overall performance
    - New scores allow separate tracking of SEO vs AEO effectiveness
    - All scores are 0-100 range with CHECK constraints
*/

-- Add SEO score column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seo_audits' AND column_name = 'seo_score'
  ) THEN
    ALTER TABLE seo_audits ADD COLUMN seo_score integer CHECK (seo_score >= 0 AND seo_score <= 100);
  END IF;
END $$;

-- Add AEO score column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seo_audits' AND column_name = 'aeo_score'
  ) THEN
    ALTER TABLE seo_audits ADD COLUMN aeo_score integer CHECK (aeo_score >= 0 AND aeo_score <= 100);
  END IF;
END $$;

-- Backfill existing records with score value
UPDATE seo_audits 
SET 
  seo_score = score,
  aeo_score = score
WHERE seo_score IS NULL OR aeo_score IS NULL;
