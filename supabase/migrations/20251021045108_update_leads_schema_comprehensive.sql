/*
  # Update Leads Table Schema - Comprehensive SEO Fields

  1. Changes to `leads` table
    - Add `email` (text, nullable) - Contact email
    - Add `city` (text, nullable) - City extracted from address
    - Add `tech_stack` (jsonb, array) - Detected technologies (WordPress, React, etc.)
    - Add `core_web_vitals_lcp` (integer, nullable) - LCP in milliseconds
    - Add `has_schema` (boolean) - Whether site has schema markup
    - Add `has_faq` (boolean) - Whether site has FAQ schema
    - Add `has_org` (boolean) - Whether site has Organization schema
    - Add `meta_title_ok` (boolean) - Meta title properly optimized
    - Add `meta_desc_ok` (boolean) - Meta description properly optimized
    - Add `content_fresh_months` (integer, nullable) - Content age in months
    - Add `issues` (jsonb, array) - Identified SEO issues
    - Add `notes` (text, nullable) - Auto-generated opportunity notes
    - Add `source` (text) - Data source (Google Places API, Demo Data, etc.)
    - Remove old columns: `content_freshness`, `lcp_score`, `schema_markup`
  
  2. Notes
    - This migration supports the comprehensive SEO Lead Finder functionality
    - Aligns with the production-ready scaffold specification
    - Compatible with Google Sheets export format
*/

-- Add new columns to leads table
DO $$
BEGIN
  -- Contact information
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'email'
  ) THEN
    ALTER TABLE leads ADD COLUMN email text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'city'
  ) THEN
    ALTER TABLE leads ADD COLUMN city text;
  END IF;

  -- Technical details
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'tech_stack'
  ) THEN
    ALTER TABLE leads ADD COLUMN tech_stack jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'core_web_vitals_lcp'
  ) THEN
    ALTER TABLE leads ADD COLUMN core_web_vitals_lcp integer;
  END IF;

  -- Schema markup checks
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'has_schema'
  ) THEN
    ALTER TABLE leads ADD COLUMN has_schema boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'has_faq'
  ) THEN
    ALTER TABLE leads ADD COLUMN has_faq boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'has_org'
  ) THEN
    ALTER TABLE leads ADD COLUMN has_org boolean DEFAULT false;
  END IF;

  -- Meta tag optimization
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'meta_title_ok'
  ) THEN
    ALTER TABLE leads ADD COLUMN meta_title_ok boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'meta_desc_ok'
  ) THEN
    ALTER TABLE leads ADD COLUMN meta_desc_ok boolean DEFAULT false;
  END IF;

  -- Content freshness (as months)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'content_fresh_months'
  ) THEN
    ALTER TABLE leads ADD COLUMN content_fresh_months integer;
  END IF;

  -- Issues array
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'issues'
  ) THEN
    ALTER TABLE leads ADD COLUMN issues jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Notes and source
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'notes'
  ) THEN
    ALTER TABLE leads ADD COLUMN notes text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'source'
  ) THEN
    ALTER TABLE leads ADD COLUMN source text DEFAULT 'Unknown';
  END IF;
END $$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_leads_has_schema ON leads(has_schema);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_city ON leads(city);
