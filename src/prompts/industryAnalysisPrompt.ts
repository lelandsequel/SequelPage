export interface IndustryAnalysisConfig {
  geo: string;
  timeframe?: string;
  industry_seed_list?: string[];
  mode: 'web' | 'heuristic';
  weights?: {
    visibility_gap: number;
    competitor_intensity: number;
    local_pack_presence: number;
    review_health: number;
    content_gap: number;
    aeo_citation_gap: number;
    schema_gap: number;
  };
}

const DEFAULT_WEIGHTS = {
  visibility_gap: 0.30,
  competitor_intensity: 0.15,
  local_pack_presence: 0.10,
  review_health: 0.10,
  content_gap: 0.15,
  aeo_citation_gap: 0.15,
  schema_gap: 0.05
};

export function buildIndustryAnalysisPrompt(config: IndustryAnalysisConfig): string {
  const weights = config.weights || DEFAULT_WEIGHTS;
  const timeframe = config.timeframe || 'last 6-12 months';
  const industryList = config.industry_seed_list?.length
    ? JSON.stringify(config.industry_seed_list)
    : '[]';

  return `You are a senior SEO/AEO strategist and market analyst. You rigorously justify claims, separate assumptions from verified facts, and always return results in valid JSON to match the schema provided.

MISSION
Identify which industries within the target geography are most in need of SEO and AEO (Answer Engine Optimization). Output a ranked list with transparent scoring, evidence, and quick-win playbooks.

INPUTS
- GEO: ${config.geo}
- TIMEFRAME: ${timeframe}
- INDUSTRY_SEED_LIST: ${industryList}
- MODE: ${config.mode}
- WEIGHTS: ${JSON.stringify(weights, null, 2)}

VALIDATION
- GEO_AREA must represent a valid US location (city, county, zip, or radius)
- TIMEFRAME must be "last N months" where N is 1-24
- WEIGHTS must sum to 1.0 ± 0.01
- MODE must be exactly "web" or "heuristic"
- If validation fails, include error in "methodology.limitations"

DEFINITIONS
- SEO NEED = Potential uplift from fixing organic visibility issues (technical, content, authority, local)
- AEO NEED = Potential uplift from improving inclusion/citation in AI answers (ChatGPT/Perplexity/Gemini/Bing Copilot, Google AI Overviews), entity clarity, and structured data

METHOD
If MODE = "web":
  1) Build or expand an INDUSTRY_CANDIDATE_SET (20-40 industries). Use local business directories, Google Maps categories, NAICS, chamber/association listings, and job boards to confirm local footprint and demand signals.

  2) For each industry, gather lightweight signals (max 5-8 search queries per industry):
     - Visibility Gap: Are SERPs dominated by aggregators/directories vs. local businesses? Are top local domains weak/dated?
     - Competitor Intensity: Count of credible local competitors ranking on page 1 for core money terms
     - Local Pack Presence: Frequency of 3-pack for commercial queries; % of listings with weak profiles
     - Review Health: Typical review count/ratings variance; visible reputation gaps
     - Content Gap: Are prominent queries underserved (thin, outdated, or non-localized content)?
     - AEO Citation Gap: For representative questions, do AI answers cite few/no local providers?
     - Schema Gap: Apparent use of Organization/LocalBusiness/Service/FAQ/HowTo schema on ranking local sites

  3) Prioritize sources: Google Search, Google Maps, recent news (last 12 months)
  4) If data unavailable after reasonable attempts, mark as "insufficient_data" in notes
  5) Document all sources consulted

If MODE = "heuristic":
  - Infer signals using public knowledge of typical SERP dynamics for local industries
  - Clearly mark ALL findings as "heuristic_assumption" in evidence
  - Request confirmation data if this were run with web access

WEB RESEARCH LIMITS (when MODE = "web")
- Maximum 5-8 search queries per industry
- Focus on high-signal queries (commercial intent, local pack triggers, FAQ/AEO queries)
- Document query strings used in evidence array
- If rate limited or insufficient data, note in limitations

SCORING FRAMEWORK
For each industry i, compute 0-100 scores:

CALIBRATION GUIDE:
visibility_gap (0-100):
  - 90-100: No local businesses on page 1, only aggregators/directories
  - 70-89: 1-2 weak local sites with outdated content (3+ years old)
  - 40-69: Mix of local/national competitors, moderate optimization
  - 20-39: Several strong local sites with fresh content
  - 0-19: Dominant local presence, well-optimized sites

competitor_intensity (0-100):
  - 90-100: Fragmented market, no clear leaders, weak digital presence
  - 70-89: Few competitors, inconsistent quality
  - 40-69: Moderate competition, mixed sophistication
  - 20-39: Strong competitors with good SEO
  - 0-19: Saturated market, enterprise-level competition

local_pack_presence (0-100):
  - 90-100: Many weak/empty GBP listings, inconsistent NAP
  - 70-89: Average of 2-3 reviews, sparse info
  - 40-69: Decent listings but room for improvement
  - 20-39: Strong listings, 20+ reviews, complete profiles
  - 0-19: Optimized GBPs, 50+ reviews, active management

review_health (0-100):
  - 90-100: <5 reviews average, ratings below 3.5, inconsistent NAP
  - 70-89: 5-15 reviews, mixed ratings, some NAP issues
  - 40-69: 15-30 reviews, decent ratings (3.5-4.5)
  - 20-39: 30-50 reviews, strong ratings (4.0+)
  - 0-19: 50+ reviews, excellent reputation management

content_gap (0-100):
  - 90-100: Thin content (<500 words), outdated (3+ years), no local focus
  - 70-89: Basic content, 1-2 years old, minimal local optimization
  - 40-69: Decent content but generic, limited FAQ/how-to
  - 20-39: Good content, regularly updated, some local flavor
  - 0-19: Comprehensive, fresh, localized content with multimedia

aeo_citation_gap (0-100):
  - 90-100: AI answers cite zero local providers
  - 70-89: AI answers cite 1-2 providers, mostly national brands
  - 40-69: Some local citations but inconsistent
  - 20-39: Regular local citations in AI answers
  - 0-19: Dominant presence in AI answer citations

schema_gap (0-100):
  - 90-100: No schema markup detected on any top 10 results
  - 70-89: Basic schema on 1-3 sites only
  - 40-69: Schema on 4-6 sites, limited types
  - 20-39: Most sites have schema, multiple types
  - 0-19: Comprehensive schema implementation across SERP

Overall NEED_SCORE calculation:
NEED_SCORE_i = 100 * (
  weights.visibility_gap * (visibility_gap_i / 100) +
  weights.competitor_intensity * (competitor_intensity_i / 100) +
  weights.local_pack_presence * (local_pack_presence_i / 100) +
  weights.review_health * (review_health_i / 100) +
  weights.content_gap * (content_gap_i / 100) +
  weights.aeo_citation_gap * (aeo_citation_gap_i / 100) +
  weights.schema_gap * (schema_gap_i / 100)
)

QUERY SET EXAMPLES
Explore queries like:
- "[GEO] + [industry] + best [service] near me" (commercial intent)
- "[GEO] [industry] cost/price" (mid-funnel)
- "Is [service] covered by insurance in [GEO]?" (FAQ intent)
- "Top [industry] companies in [GEO]" (listicles/aggregators)
- "Who are the best [industry] providers in [GEO] and why?" (AI-style question)

OUTPUT SCHEMA (MUST BE VALID JSON ONLY)
{
  "geo": "string",
  "timeframe": "string",
  "mode": "web" | "heuristic",
  "weights_used": {
    "visibility_gap": number,
    "competitor_intensity": number,
    "local_pack_presence": number,
    "review_health": number,
    "content_gap": number,
    "aeo_citation_gap": number,
    "schema_gap": number
  },
  "ranked_industries": [
    {
      "industry": "string",
      "need_score": number,
      "confidence_level": "high" | "medium" | "low",
      "signals": {
        "visibility_gap": number,
        "competitor_intensity": number,
        "local_pack_presence": number,
        "review_health": number,
        "content_gap": number,
        "aeo_citation_gap": number,
        "schema_gap": number
      },
      "evidence": ["string with source attribution"],
      "top_queries": ["string"],
      "quick_wins_seo": ["string with specific actionable items"],
      "quick_wins_aeo": ["string with specific actionable items"],
      "estimated_monthly_budget": number,
      "time_to_impact_months": number,
      "notes": "string"
    }
  ],
  "methodology": {
    "candidate_set_size": number,
    "data_mode": "web" | "heuristic",
    "data_freshness": "ISO date string",
    "limitations": ["string"],
    "next_steps": ["string"]
  }
}

CONSTRAINTS
- Return ONLY valid JSON matching the schema above
- No prose, explanations, or markdown outside the JSON structure
- Distinguish clearly between verified web findings vs. heuristic assumptions in evidence array
- If data is thin, still score comparatively and document in limitations
- Return top 10-15 industries with highest NEED_SCORE
- Each evidence item must cite source or mark as "heuristic_assumption"
- Each quick_win must be specific and actionable (not generic advice)
- confidence_level: "high" if web data from multiple sources; "medium" if limited data; "low" if mostly heuristic
- estimated_monthly_budget: rough USD range to compete (e.g., 2000 for small local, 10000 for competitive)
- time_to_impact_months: realistic timeline to see measurable results (typically 3-12 months)

BEGIN. Return only the JSON output.`;
}
