/*
  # Add DataForSEO Metrics to Leads Table

  1. Changes
    - Add `domain_rank` column for domain authority/ranking
    - Add `backlinks_count` column for total backlinks
    - Add `referring_domains` column for unique referring domains
    - Add `organic_traffic` column for estimated organic traffic value

  2. Notes
    - All columns are nullable as not all websites may have these metrics
    - These metrics come from DataForSEO API for real traffic and domain data
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'domain_rank'
  ) THEN
    ALTER TABLE leads ADD COLUMN domain_rank integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'backlinks_count'
  ) THEN
    ALTER TABLE leads ADD COLUMN backlinks_count integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'referring_domains'
  ) THEN
    ALTER TABLE leads ADD COLUMN referring_domains integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'organic_traffic'
  ) THEN
    ALTER TABLE leads ADD COLUMN organic_traffic integer;
  END IF;
END $$;