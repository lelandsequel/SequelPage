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

  const userPrompt = `Analyze this website comprehensively:

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
    "description": "Detailed explanation",
    "codeSnippet": "Fix code",
    "implementation": "How to implement",
    "impact": "Expected improvement"
  }],
  "aeoOptimizations": [{
    "title": "Optimization name",
    "description": "Details",
    "codeSnippet": "Implementation code",
    "implementation": "Steps",
    "expectedImprovement": "Impact"
  }],
  "technicalSeo": {
    "present": ["Features found"],
    "missing": ["Missing features"],
    "howToAdd": ["Implementation guides"]
  },
  "contentGaps": [{
    "gap": "Missing content type",
    "whyItMatters": "Importance",
    "suggestions": ["Ideas"],
    "recommendedFormat": "Format type"
  }],
  "recommendations": [{
    "title": "Recommendation",
    "description": "Details",
    "codeSnippet": "Code",
    "expectedImprovement": "Impact"
  }],
  "keywordOpportunities": [{
    "keyword": "Keyword",
    "currentPosition": 0,
    "difficulty": "Easy/Medium/Hard",
    "searchVolume": 0,
    "recommendation": "Strategy"
  }],
  "competitorInsights": {
    "summary": "Overview",
    "gaps": ["What competitors have that you don't"],
    "opportunities": ["Where you can beat them"]
  }
}

IMPORTANT: Provide separate scores for:
- seoScore: Traditional SEO score (meta tags, backlinks, keywords, technical SEO)
- aeoScore: Answer Engine Optimization score (structured data, schema, AI-friendly content, natural language)
- score: Overall combined score

Return ONLY JSON, no markdown.`;

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