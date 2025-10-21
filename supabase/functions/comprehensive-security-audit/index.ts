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

async function checkSecurityHeaders(url: string) {
  try {
    const response = await fetch(url);
    const headers = response.headers;

    const securityHeaders = {
      'strict-transport-security': headers.get('strict-transport-security'),
      'x-frame-options': headers.get('x-frame-options'),
      'x-content-type-options': headers.get('x-content-type-options'),
      'x-xss-protection': headers.get('x-xss-protection'),
      'content-security-policy': headers.get('content-security-policy'),
      'referrer-policy': headers.get('referrer-policy'),
      'permissions-policy': headers.get('permissions-policy'),
    };

    const missingHeaders = [];
    const presentHeaders = [];

    if (!securityHeaders['strict-transport-security']) {
      missingHeaders.push({
        header: 'Strict-Transport-Security',
        severity: 'HIGH',
        description: 'Missing HSTS header - site vulnerable to protocol downgrade attacks',
        recommendation: 'Add header: Strict-Transport-Security: max-age=31536000; includeSubDomains',
      });
    } else {
      presentHeaders.push('Strict-Transport-Security');
    }

    if (!securityHeaders['x-frame-options']) {
      missingHeaders.push({
        header: 'X-Frame-Options',
        severity: 'MEDIUM',
        description: 'Missing X-Frame-Options - vulnerable to clickjacking attacks',
        recommendation: 'Add header: X-Frame-Options: DENY or SAMEORIGIN',
      });
    } else {
      presentHeaders.push('X-Frame-Options');
    }

    if (!securityHeaders['x-content-type-options']) {
      missingHeaders.push({
        header: 'X-Content-Type-Options',
        severity: 'MEDIUM',
        description: 'Missing X-Content-Type-Options - vulnerable to MIME sniffing attacks',
        recommendation: 'Add header: X-Content-Type-Options: nosniff',
      });
    } else {
      presentHeaders.push('X-Content-Type-Options');
    }

    if (!securityHeaders['content-security-policy']) {
      missingHeaders.push({
        header: 'Content-Security-Policy',
        severity: 'HIGH',
        description: 'Missing CSP - vulnerable to XSS and data injection attacks',
        recommendation: 'Add CSP header with appropriate directives for your application',
      });
    } else {
      presentHeaders.push('Content-Security-Policy');
    }

    if (!securityHeaders['referrer-policy']) {
      missingHeaders.push({
        header: 'Referrer-Policy',
        severity: 'LOW',
        description: 'Missing Referrer-Policy - may leak sensitive information in referer header',
        recommendation: 'Add header: Referrer-Policy: strict-origin-when-cross-origin',
      });
    } else {
      presentHeaders.push('Referrer-Policy');
    }

    return {
      presentHeaders,
      missingHeaders,
      hasHttps: url.startsWith('https://'),
    };
  } catch (error) {
    console.error('Security headers check error:', error);
    return { presentHeaders: [], missingHeaders: [], hasHttps: false };
  }
}

async function scanForCommonVulnerabilities(htmlSource: string, url: string) {
  const vulnerabilities = [];

  if (htmlSource.includes('<script') && !htmlSource.includes('nonce=')) {
    vulnerabilities.push({
      type: 'XSS Risk',
      severity: 'MEDIUM',
      description: 'Inline scripts without CSP nonce detected',
      location: 'Multiple <script> tags',
      cve: 'CWE-79',
    });
  }

  if (htmlSource.match(/eval\s*\(/)) {
    vulnerabilities.push({
      type: 'Code Injection Risk',
      severity: 'HIGH',
      description: 'Use of eval() detected - dangerous function that can execute arbitrary code',
      location: 'JavaScript code',
      cve: 'CWE-95',
    });
  }

  if (htmlSource.includes('document.write')) {
    vulnerabilities.push({
      type: 'DOM-based XSS Risk',
      severity: 'MEDIUM',
      description: 'document.write() usage detected - can lead to XSS vulnerabilities',
      location: 'JavaScript code',
      cve: 'CWE-79',
    });
  }

  if (htmlSource.match(/innerHTML\s*=/)) {
    vulnerabilities.push({
      type: 'XSS Risk',
      severity: 'MEDIUM',
      description: 'innerHTML usage detected - use textContent or sanitize input',
      location: 'JavaScript code',
      cve: 'CWE-79',
    });
  }

  const passwordFields = htmlSource.match(/<input[^>]*type=["']password["'][^>]*>/gi);
  if (passwordFields && !url.startsWith('https://')) {
    vulnerabilities.push({
      type: 'Insecure Data Transmission',
      severity: 'CRITICAL',
      description: 'Password fields on non-HTTPS site - credentials sent in plaintext',
      location: 'Password input fields',
      cve: 'CWE-319',
    });
  }

  const externalScripts = htmlSource.match(/<script[^>]*src=["'](https?:\/\/[^"']+)["'][^>]*>/gi);
  if (externalScripts && externalScripts.some(script => !script.includes('integrity='))) {
    vulnerabilities.push({
      type: 'Subresource Integrity Missing',
      severity: 'MEDIUM',
      description: 'External scripts without SRI - vulnerable to CDN compromise',
      location: 'External script tags',
      cve: 'CWE-353',
    });
  }

  const forms = htmlSource.match(/<form[^>]*>/gi);
  if (forms && forms.some(form => !form.toLowerCase().includes('csrf') && !form.toLowerCase().includes('token'))) {
    vulnerabilities.push({
      type: 'CSRF Protection Missing',
      severity: 'HIGH',
      description: 'Forms without apparent CSRF tokens detected',
      location: 'Form elements',
      cve: 'CWE-352',
    });
  }

  if (htmlSource.match(/api[_-]?key|apikey|access[_-]?token/i)) {
    vulnerabilities.push({
      type: 'Exposed Credentials',
      severity: 'CRITICAL',
      description: 'Potential API keys or tokens in HTML source',
      location: 'HTML/JavaScript source',
      cve: 'CWE-798',
    });
  }

  return vulnerabilities;
}

async function getClaudeSecurityAnalysis(
  url: string,
  htmlSource: string,
  anthropicKey: string,
  securityHeaders: any,
  commonVulns: any[]
) {
  const systemPrompt = `You are an expert cybersecurity analyst. Analyze the provided security data and HTML to provide actionable security recommendations. Return ONLY valid JSON.`;

  const userPrompt = `Perform comprehensive security analysis:

URL: ${url}
HTML Source: ${htmlSource.substring(0, 8000)}

Security Headers Status:
${JSON.stringify(securityHeaders, null, 2)}

Detected Vulnerabilities:
${JSON.stringify(commonVulns, null, 2)}

Provide comprehensive security analysis in JSON:
{
  "riskScore": 0-100,
  "riskLevel": "LOW/MEDIUM/HIGH/CRITICAL",
  "vulnerabilities": [{
    "title": "Vulnerability name",
    "severity": "LOW/MEDIUM/HIGH/CRITICAL",
    "cve": "CVE or CWE identifier",
    "description": "Detailed explanation",
    "riskImpact": "What could happen",
    "exploitComplexity": "Low/Medium/High",
    "affectedComponent": "Where the issue is"
  }],
  "fixes": [{
    "vulnerability": "Vulnerability name",
    "codeFix": "Code to implement",
    "configuration": "Server/framework configuration",
    "bestPractices": "Security best practices",
    "priority": "1-10"
  }],
  "strategicReport": {
    "executiveSummary": "High-level overview for management",
    "detailedFindings": "Technical details",
    "remediationRoadmap": ["Step 1", "Step 2", "Step 3"],
    "estimatedEffort": "Time estimate",
    "complianceImpact": "GDPR, HIPAA, PCI-DSS considerations"
  },
  "securityScore": {
    "authentication": 0-100,
    "dataProtection": 0-100,
    "networkSecurity": 0-100,
    "codeQuality": 0-100
  }
}

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
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 16000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.content[0].text.trim();

    if (content.startsWith('```')) {
      content = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Claude security analysis error:', error);
    return {
      riskScore: 100,
      riskLevel: 'CRITICAL',
      error: 'Failed to analyze with Claude',
      vulnerabilities: [],
      fixes: [],
    };
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

    if (!anthropicKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    console.log(`Starting comprehensive security audit for: ${url}`);

    let htmlSource = providedHtml;
    if (!htmlSource && url) {
      htmlSource = await fetchHTML(url);
    }

    const [securityHeaders, commonVulns] = await Promise.all([
      url ? checkSecurityHeaders(url) : { presentHeaders: [], missingHeaders: [], hasHttps: false },
      scanForCommonVulnerabilities(htmlSource, url || ''),
    ]);

    const claudeAnalysis = await getClaudeSecurityAnalysis(
      url || 'HTML Source',
      htmlSource,
      anthropicKey,
      securityHeaders,
      commonVulns
    );

    const result = {
      ...claudeAnalysis,
      realSecurityData: {
        securityHeaders,
        commonVulnerabilities: commonVulns,
        https: securityHeaders.hasHttps,
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
    console.error('Comprehensive security audit error:', error);
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
