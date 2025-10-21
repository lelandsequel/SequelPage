import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { type, url, htmlSource } = await req.json();

    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "seo") {
      systemPrompt = `You are an expert SEO and AEO (Answer Engine Optimization) analyst. Analyze websites comprehensively and provide actionable recommendations with code snippets. Return ONLY valid JSON without any markdown formatting.`;
      
      userPrompt = `Analyze this website for SEO and AEO optimization.

${url ? `URL: ${url}` : ""}
${htmlSource ? `HTML Source: ${htmlSource.substring(0, 5000)}` : ""}

Provide a comprehensive analysis in JSON format with:
1. score (0-100)
2. grade (A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F)
3. seoIssues (array of {title, severity: LOW/MEDIUM/HIGH/CRITICAL, priority: 1-10, description, codeSnippet, implementation, impact})
4. aeoOptimizations (array of {title, description, codeSnippet, implementation, expectedImprovement})
5. technicalSeo (object with {present: [], missing: [], howToAdd: []})
6. contentGaps (array of {gap, whyItMatters, suggestions, recommendedFormat})
7. recommendations (array of {title, description, codeSnippet, expectedImprovement})

Provide specific, production-ready code snippets and quantified improvements. Return ONLY the JSON object, no markdown code fences.`;
    } else if (type === "security") {
      systemPrompt = `You are an expert cybersecurity analyst. Analyze websites for security vulnerabilities, CVEs, and provide remediation steps with code. Return ONLY valid JSON without any markdown formatting.`;
      
      userPrompt = `Perform a security audit on this website.

${url ? `URL: ${url}` : ""}
${htmlSource ? `HTML Source: ${htmlSource.substring(0, 5000)}` : ""}

Provide a comprehensive security analysis in JSON format with:
1. riskScore (0-100, where 0 is most secure)
2. vulnerabilities (array of {title, severity: LOW/MEDIUM/HIGH/CRITICAL, cve, description, riskImpact})
3. fixes (array of {vulnerability, codeFix, configuration, bestPractices})
4. strategicReport (object with {executiveSummary, detailedFindings, remediationRoadmap, expectedImprovements})

Reference specific CVEs where applicable and provide production-ready security patches. Return ONLY the JSON object, no markdown code fences.`;
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 8000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    let analysis;
    try {
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```(?:json)?\n?/, '');
        cleanContent = cleanContent.replace(/\n?```$/, '');
        cleanContent = cleanContent.trim();
      }

      analysis = JSON.parse(cleanContent);

      if (!analysis.score) {
        analysis.score = 0;
      }
      if (!analysis.grade) {
        analysis.grade = 'N/A';
      }
    } catch (e) {
      analysis = {
        score: 0,
        grade: 'F',
        error: "Failed to parse JSON response",
        rawResponse: content.substring(0, 1000),
        seoIssues: [],
        aeoOptimizations: [],
      };
    }

    return new Response(JSON.stringify(analysis), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
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
