import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function fetchHTML(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    return await response.text();
  } catch (error) {
    console.error('Failed to fetch HTML:', error);
    return '';
  }
}

async function getDataForSEOMetrics(url: string, dataForSeoKey: string) {
  const cleanDomain = url.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0];

  try {
    const [onPageResponse, backlinkResponse, rankingsResponse] = await Promise.all([
      fetch('https://api.dataforseo.com/v3/on_page/lighthouse/live/json', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${dataForSeoKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{
          url: url,
          categories: ['performance', 'seo', 'accessibility', 'best-practices'],
        }]),
      }),
      fetch('https://api.dataforseo.com/v3/backlinks/summary/live', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${dataForSeoKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{ target: cleanDomain }]),
      }),
      fetch('https://api.dataforseo.com/v3/dataforseo_labs/google/ranked_keywords/live', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${dataForSeoKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{
          target: cleanDomain,
          location_code: 2840,
          language_code: 'en',
          limit: 50,
        }]),
      }),
    ]);

    const onPageData = await onPageResponse.json();
    const backlinkData = await backlinkResponse.json();
    const rankingsData = await rankingsResponse.json();

    const lighthouse = onPageData.tasks?.[0]?.result?.[0] || {};
    const backlinks = backlinkData.tasks?.[0]?.result?.[0] || {};
    const rankings = rankingsData.tasks?.[0]?.result?.[0]?.items || [];

    return {
      performance: {
        score: lighthouse.categories?.performance?.score * 100 || 0,
        lcp: lighthouse.audits?.['largest-contentful-paint']?.numericValue || 0,
        fid: lighthouse.audits?.['max-potential-fid']?.numericValue || 0,
        cls: lighthouse.audits?.['cumulative-layout-shift']?.numericValue || 0,
        fcp: lighthouse.audits?.['first-contentful-paint']?.numericValue || 0,
        ttfb: lighthouse.audits?.['server-response-time']?.numericValue || 0,
      },
      seo: {
        score: lighthouse.categories?.seo?.score * 100 || 0,
        metaDescription: lighthouse.audits?.['meta-description']?.score === 1,
        hreflang: lighthouse.audits?.hreflang?.score === 1,
        canonical: lighthouse.audits?.canonical?.score === 1,
        robotsTxt: lighthouse.audits?.['robots-txt']?.score === 1,
      },
      accessibility: {
        score: lighthouse.categories?.accessibility?.score * 100 || 0,
      },
      bestPractices: {
        score: lighthouse.categories?.['best-practices']?.score * 100 || 0,
      },
      backlinks: {
        total: backlinks.backlinks || 0,
        referringDomains: backlinks.referring_domains || 0,
        followLinks: backlinks.backlinks_follow || 0,
        nofollowLinks: backlinks.backlinks_nofollow || 0,
      },
      rankings: rankings.map((r: any) => ({
        keyword: r.keyword_data?.keyword || '',
        position: r.ranked_serp_element?.serp_item?.rank_absolute || 0,
        searchVolume: r.keyword_data?.keyword_info?.search_volume || 0,
        cpc: r.keyword_data?.keyword_info?.cpc || 0,
      })).slice(0, 20),
    };
  } catch (error) {
    console.error('DataForSEO error:', error);
    return null;
  }
}

async function getGooglePageSpeed(url: string, googleApiKey: string) {
  try {
    const [mobileResponse, desktopResponse] = await Promise.all([
      fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&key=${googleApiKey}`),
      fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=desktop&key=${googleApiKey}`),
    ]);

    const mobile = await mobileResponse.json();
    const desktop = await desktopResponse.json();

    return {
      mobile: {
        score: mobile.lighthouseResult?.categories?.performance?.score * 100 || 0,
        lcp: mobile.lighthouseResult?.audits?.['largest-contentful-paint']?.numericValue || 0,
        fid: mobile.lighthouseResult?.audits?.['max-potential-fid']?.numericValue || 0,
        cls: mobile.lighthouseResult?.audits?.['cumulative-layout-shift']?.numericValue || 0,
      },
      desktop: {
        score: desktop.lighthouseResult?.categories?.performance?.score * 100 || 0,
        lcp: desktop.lighthouseResult?.audits?.['largest-contentful-paint']?.numericValue || 0,
        fid: desktop.lighthouseResult?.audits?.['max-potential-fid']?.numericValue || 0,
        cls: desktop.lighthouseResult?.audits?.['cumulative-layout-shift']?.numericValue || 0,
      },
    };
  } catch (error) {
    console.error('Google PageSpeed error:', error);
    return null;
  }
}

async function getClaudeAnalysis(url: string, htmlSource: string, anthropicKey: string, dataForSeoMetrics: any, googleMetrics: any) {
  const systemPrompt = `You are an expert SEO and AEO analyst. Analyze the provided data and HTML to give actionable recommendations. Return ONLY valid JSON.`;

  const userPrompt = `Analyze this website comprehensively and provide detailed, actionable recommendations:

URL: ${url}
HTML Source: ${htmlSource.substring(0, 8000)}

Real Performance Data:
${JSON.stringify(dataForSeoMetrics?.performance, null, 2)}
${JSON.stringify(googleMetrics, null, 2)}

Real SEO Metrics:
${JSON.stringify(dataForSeoMetrics?.seo, null, 2)}

Backlink Profile:
${JSON.stringify(dataForSeoMetrics?.backlinks, null, 2)}

Current Keyword Rankings:
${JSON.stringify(dataForSeoMetrics?.rankings?.slice(0, 10), null, 2)}

CRITICAL: Provide DETAILED, COMPLETE analysis in JSON. Each issue/optimization must include:
1. A thorough description (3-5 sentences minimum) explaining the problem/opportunity
2. Detailed implementation steps (multiple steps, very specific)
3. Complete, ready-to-use code snippets
4. Clear impact explanation with specific metrics or benefits

Provide comprehensive analysis in JSON:
{
  "score": 0-100,
  "seoScore": 0-100,
  "aeoScore": 0-100,
  "grade": "A+/A/A-/B+/B/B-/C+/C/C-/D+/D/D-/F",
  "seoIssues": [{
    "title": "Issue name",
    "severity": "LOW/MEDIUM/HIGH/CRITICAL",
    "priority": 1-10,
    "description": "DETAILED explanation (3-5 sentences): What is wrong, why it matters, what the consequences are, and why fixing it is important. Include technical context and real-world implications.",
    "codeSnippet": "Complete, ready-to-implement code with proper formatting and all necessary attributes",
    "implementation": "DETAILED step-by-step guide (5+ steps): 1. First specific action... 2. Second specific action... Include file locations, exact changes, and testing steps.",
    "impact": "Specific expected improvements with metrics: e.g., 'Expected to improve organic traffic by 15-20%, increase crawl efficiency, and improve rankings for target keywords within 2-3 months.'"
  }],
  "aeoOptimizations": [{
    "title": "Optimization name",
    "description": "COMPREHENSIVE explanation (3-5 sentences): What this optimization does, why it's important for AI search engines, how it helps answer engines understand your content, and the specific benefits for voice search and featured snippets.",
    "codeSnippet": "Complete, production-ready code with all required schema markup, structured data, or semantic HTML. Include all necessary attributes and proper JSON-LD formatting.",
    "implementation": "DETAILED implementation guide (5+ steps): 1. Exact file to modify... 2. Where to place the code... 3. How to test... 4. How to validate... 5. How to monitor results. Be extremely specific.",
    "expectedImprovement": "Specific measurable improvements: e.g., 'Expected to increase featured snippet appearances by 30%, improve voice search discoverability, and boost AI chatbot citation probability by 40% within 1-2 months.'"
  }],
  "technicalSeo": {
    "present": ["Specific features that are properly implemented with brief explanation of quality"],
    "missing": ["Specific missing features with explanation of why they're needed"],
    "howToAdd": ["DETAILED implementation guides (paragraph format): Explain exactly what to do, where to add it, what tools to use, and how to verify it's working correctly. Each guide should be 3-5 sentences."]
  },
  "contentGaps": [{
    "gap": "Missing content type with specific details",
    "whyItMatters": "DETAILED explanation (3+ sentences): Why this content gap is hurting performance, what opportunities are being missed, and how filling it will improve results.",
    "suggestions": ["Specific, actionable content suggestions with examples and target keywords"],
    "recommendedFormat": "Detailed format recommendation: type, structure, word count, media to include, and best practices"
  }],
  "recommendations": [{
    "title": "Recommendation title",
    "description": "THOROUGH explanation (3-5 sentences): What to do, why it matters, technical details, and business impact.",
    "codeSnippet": "Complete, production-ready code with all necessary elements and proper formatting",
    "expectedImprovement": "Specific, measurable expected improvements with timeframes and metrics"
  }],
  "keywordOpportunities": [{
    "keyword": "Specific keyword phrase",
    "currentPosition": 0,
    "difficulty": "Easy/Medium/Hard",
    "searchVolume": 0,
    "recommendation": "DETAILED strategy (2-3 sentences): Specific actions to rank for this keyword, content to create, on-page optimizations needed, and link building approach."
  }],
  "competitorInsights": {
    "summary": "COMPREHENSIVE overview (4-6 sentences): Analysis of competitor landscape, who the main competitors are, what they're doing well, where they're weak, and the overall competitive difficulty.",
    "gaps": ["SPECIFIC things competitors have that you don't - be detailed about features, content types, technical implementations, backlink sources, etc."],
    "opportunities": ["SPECIFIC opportunities to outperform competitors with actionable strategies and tactics"]
  }
}

CRITICAL REQUIREMENTS:
1. Provide separate scores for:
   - seoScore: Traditional SEO score (meta tags, backlinks, keywords, technical SEO)
   - aeoScore: Answer Engine Optimization score (structured data, schema, AI-friendly content, natural language)
   - score: Overall combined score

2. ALL descriptions must be 3-5 sentences minimum with detailed explanations
3. ALL implementation guides must have 5+ specific steps
4. ALL code snippets must be complete and production-ready
5. ALL impact statements must include specific metrics and timeframes
6. Write as if explaining to someone who will implement these changes themselves

Return ONLY JSON, no markdown or code fences.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 16000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Anthropic API error ${response.status}:`, errorText);
      throw new Error(`Anthropic API error: ${response.status} - ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    let content = data.content[0].text.trim();

    if (content.startsWith('```')) {
      content = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Claude analysis error:', error);
    throw error;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { url, htmlSource: providedHtml } = await req.json();

    if (!url && !providedHtml) {
      throw new Error('URL or HTML source required');
    }

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    const dataForSeoKey = Deno.env.get("DATAFORSEO_API_KEY");
    const googleApiKey = Deno.env.get("GOOGLE_PSI_API_KEY");

    if (!anthropicKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    console.log(`Starting comprehensive SEO audit for: ${url}`);

    let htmlSource = providedHtml;
    if (!htmlSource && url) {
      htmlSource = await fetchHTML(url);
    }

    const [dataForSeoMetrics, googleMetrics] = await Promise.all([
      dataForSeoKey && url ? getDataForSEOMetrics(url, dataForSeoKey) : null,
      googleApiKey && url ? getGooglePageSpeed(url, googleApiKey) : null,
    ]);

    const claudeAnalysis = await getClaudeAnalysis(
      url || 'HTML Source',
      htmlSource,
      anthropicKey,
      dataForSeoMetrics,
      googleMetrics
    );

    const result = {
      ...claudeAnalysis,
      realMetrics: {
        dataForSeo: dataForSeoMetrics,
        googlePageSpeed: googleMetrics,
      },
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error('Comprehensive SEO audit error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Analysis failed' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});