/*
  # Add Authenticated User Policies for Audits and Scans

  1. Policy Updates
    - Add policies for authenticated users on seo_audits
    - Add policies for authenticated users on security_scans
    - Add policies for authenticated users on generated_content

  2. Notes
    - Existing anon policies remain unchanged
    - Authenticated users need full access to create and view audits
*/

-- SEO Audits - Authenticated policies
CREATE POLICY "Allow authenticated read access to seo_audits"
  ON seo_audits FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert to seo_audits"
  ON seo_audits FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Security Scans - Authenticated policies
CREATE POLICY "Allow authenticated read access to security_scans"
  ON security_scans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert to security_scans"
  ON security_scans FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Generated Content - Authenticated policies
CREATE POLICY "Allow authenticated read access to generated_content"
  ON generated_content FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert to generated_content"
  ON generated_content FOR INSERT
  TO authenticated
  WITH CHECK (true);
