interface Lead {
  business_name: string;
  website?: string;
  phone?: string;
  address?: string;
  city?: string;
  tech_stack?: string[];
  core_web_vitals_lcp?: number;
  has_schema: boolean;
  has_faq: boolean;
  has_org: boolean;
  meta_title_ok: boolean;
  meta_desc_ok: boolean;
  content_fresh_months?: number;
  traffic_trend: string;
  domain_rank?: number;
  backlinks_count?: number;
  referring_domains?: number;
  organic_traffic?: number;
  issues: string[];
  score: number;
  notes?: string;
}

function calculateRevenueImpact(lead: Lead): { min: number; max: number } {
  let baseImpact = 1000;

  if (lead.organic_traffic && lead.organic_traffic > 0) {
    baseImpact = Math.round(lead.organic_traffic * 0.3);
  }

  const issueMultiplier = Math.min(lead.issues.length * 500, 3000);
  baseImpact += issueMultiplier;

  if (lead.traffic_trend === 'Declining') {
    baseImpact += 2000;
  }

  const min = Math.max(1000, baseImpact);
  const max = Math.min(15000, min * 2);

  return { min, max };
}

function generateCriticalIssues(lead: Lead): string[] {
  const criticalIssues: string[] = [];

  if (lead.core_web_vitals_lcp && lead.core_web_vitals_lcp > 2500) {
    const seconds = (lead.core_web_vitals_lcp / 1000).toFixed(1);
    criticalIssues.push(
      `Website Loads in ${seconds} Seconds (Should be under 3s)\n` +
      `   → 53% of mobile users abandon sites that take >3s to load\n` +
      `   → They're losing potential customers every day`
    );
  }

  if (!lead.has_schema) {
    criticalIssues.push(
      `Missing Schema Markup\n` +
      `   → Not showing up in Google's local pack\n` +
      `   → Competitors with schema get 36% more clicks`
    );
  }

  if (lead.content_fresh_months && lead.content_fresh_months > 6) {
    criticalIssues.push(
      `Content Last Updated ${lead.content_fresh_months} Months Ago\n` +
      `   → Google penalizes stale content\n` +
      `   → Ranking below competitors with fresh content`
    );
  }

  if (lead.traffic_trend === 'Declining') {
    criticalIssues.push(
      `Traffic Declining (-20% over 90 days)\n` +
      `   → Losing visibility in search results\n` +
      `   → Competitors are taking their market share`
    );
  }

  if (!lead.meta_title_ok || !lead.meta_desc_ok) {
    criticalIssues.push(
      `Poor Meta Tags and Descriptions\n` +
      `   → Low click-through rates from search results\n` +
      `   → Missing opportunities to attract qualified traffic`
    );
  }

  if (lead.backlinks_count && lead.backlinks_count < 100) {
    criticalIssues.push(
      `Weak Backlink Profile (${lead.backlinks_count} total links)\n` +
      `   → Low domain authority\n` +
      `   → Difficult to rank for competitive keywords`
    );
  }

  return criticalIssues;
}

function generateOpportunities(lead: Lead): string[] {
  const opportunities: string[] = [];

  if (lead.core_web_vitals_lcp && lead.core_web_vitals_lcp > 2500) {
    opportunities.push('Optimize images and other media to improve page speed');
  }

  if (!lead.has_schema) {
    opportunities.push('Implement schema.org markup for local business and services');
  }

  if (!lead.has_faq) {
    opportunities.push('Add FAQ schema on inner pages to showcase expertise');
  }

  if (!lead.meta_title_ok || !lead.meta_desc_ok) {
    opportunities.push('Optimize for voice search and local intent queries');
  }

  opportunities.push('Improve internal linking structure');

  if (lead.content_fresh_months && lead.content_fresh_months > 6) {
    opportunities.push('Update existing content with current information and trends');
  }

  if (lead.backlinks_count && lead.backlinks_count < 200) {
    opportunities.push('Build high-quality local backlinks and citations');
  }

  return opportunities;
}

function generateQuickWins(lead: Lead): string[] {
  const wins: string[] = [];

  if (lead.core_web_vitals_lcp && lead.core_web_vitals_lcp > 2500) {
    wins.push('Week 1: Optimize image sizes and lazy load images to improve page speed');
  }

  if (!lead.has_schema || !lead.has_org) {
    wins.push('Week 1: Implement structured data markup for local business, services, and reviews');
  }

  if (lead.content_fresh_months && lead.content_fresh_months > 6) {
    wins.push('Week 2: Expand content depth on inner pages to showcase expertise and address common customer questions');
  }

  if (!lead.meta_title_ok || !lead.meta_desc_ok) {
    wins.push('Week 2: Optimize title tags and meta descriptions for target keywords');
  }

  return wins;
}

function generatePitchScript(lead: Lead): string {
  const industry = lead.tech_stack && lead.tech_stack.length > 0
    ? lead.tech_stack[0]
    : 'your industry';

  const issues = generateCriticalIssues(lead);
  const mainIssue = issues[0] ? issues[0].split('\n')[0] : 'some technical SEO issues';

  return `"Hi, this is [YOUR NAME]. I was doing some research on ${industry} businesses in ${lead.city || 'your area'} and came across ${lead.business_name}. I noticed a few things on your website that might be costing you customers — specifically ${mainIssue.toLowerCase()}. Do you have a couple minutes to discuss how we could fix this?"`;
}

function detectServices(lead: Lead): string[] {
  const url = lead.website || '';
  const industry = lead.business_name.toLowerCase();

  if (industry.includes('plumb') || url.includes('plumb')) {
    return [
      'Emergency plumbing services',
      'Water heater installation and repair',
      'Drain cleaning and sewer line services',
      'Pipe repair and replacement',
      'Fixture installation'
    ];
  }

  if (industry.includes('hvac') || industry.includes('air') || industry.includes('heating')) {
    return [
      'AC installation and repair',
      'Heating system maintenance',
      'Ductwork services',
      'Indoor air quality solutions',
      'Emergency HVAC services'
    ];
  }

  if (industry.includes('restaurant') || industry.includes('food')) {
    return [
      'Dine-in service',
      'Takeout and delivery',
      'Catering services',
      'Private events and parties',
      'Online ordering'
    ];
  }

  if (industry.includes('law') || industry.includes('attorney') || industry.includes('legal')) {
    return [
      'Legal consultation',
      'Case representation',
      'Document preparation',
      'Court appearances',
      'Legal advisory services'
    ];
  }

  if (industry.includes('dental') || industry.includes('dentist')) {
    return [
      'General dentistry',
      'Cosmetic dentistry',
      'Teeth cleaning and prevention',
      'Dental implants',
      'Emergency dental services'
    ];
  }

  return [
    'Primary services',
    'Consultation and assessment',
    'Custom solutions',
    'Emergency services',
    'Maintenance and support'
  ];
}

function generateContentAssessment(lead: Lead): string {
  const hasGoodContent = !lead.issues.includes('Outdated content') &&
                        lead.meta_title_ok &&
                        lead.meta_desc_ok;

  if (hasGoodContent) {
    return `The website provides a good overview of ${lead.business_name}'s services. However, the content could be expanded to include more detailed information about their qualifications, customer testimonials, and the specific benefits of their services for local customers.`;
  }

  return `The website content needs significant improvement. Key issues include outdated information, poor meta descriptions, and lack of detailed service pages. Adding comprehensive content about services, customer success stories, and local expertise would significantly improve search rankings and customer engagement.`;
}

export function generateTxtReport(lead: Lead): string {
  const priorityLevel = lead.score < 60 ? 'HIGH PRIORITY' : lead.score < 75 ? 'MEDIUM PRIORITY' : 'LOW PRIORITY';
  const priorityEmoji = lead.score < 60 ? '🔴' : lead.score < 75 ? '🟡' : '🟢';

  const revenueImpact = calculateRevenueImpact(lead);
  const criticalIssues = generateCriticalIssues(lead);
  const opportunities = generateOpportunities(lead);
  const quickWins = generateQuickWins(lead);
  const pitchScript = generatePitchScript(lead);
  const services = detectServices(lead);
  const contentAssessment = generateContentAssessment(lead);

  let report = '';

  report += `════════════════════════════════════════════════════════════════\n`;
  report += `#. ${lead.business_name.toUpperCase()}\n`;
  report += `Score: ${lead.score}/100 (${priorityEmoji} ${priorityLevel})\n`;
  report += `════════════════════════════════════════════════════════════════\n\n`;

  report += `📞 Phone: ${lead.phone || 'Not available'}\n`;
  report += `🌐 Website: ${lead.website || 'Not available'}\n`;
  report += `📍 Location: ${lead.city || lead.address || 'Not available'}\n`;
  report += `🏢 Industry: ${lead.tech_stack && lead.tech_stack.length > 0 ? lead.tech_stack.join(', ') : 'General'}\n`;
  report += `⚙️  Tech Stack: ${lead.tech_stack && lead.tech_stack.length > 0 ? lead.tech_stack.join(', ') : 'Custom'}\n\n`;

  if (criticalIssues.length > 0) {
    report += `🔴 CRITICAL ISSUES COSTING THEM CUSTOMERS:\n\n`;
    criticalIssues.forEach((issue, idx) => {
      report += `${idx + 1}. ${issue}\n\n`;
    });
  }

  report += `💰 ESTIMATED REVENUE IMPACT:\n`;
  report += `   Monthly loss from SEO issues: $${revenueImpact.min.toLocaleString()}-$${revenueImpact.max.toLocaleString()} per month\n\n`;

  if (opportunities.length > 0) {
    report += `💡 OPPORTUNITIES:\n\n`;
    opportunities.forEach((opp, idx) => {
      report += `${idx + 1}. ${opp}\n`;
    });
    report += `\n`;
  }

  if (quickWins.length > 0) {
    report += `✅ QUICK WINS (First 2 Weeks):\n\n`;
    quickWins.forEach(win => {
      report += `${win}\n`;
    });
    report += `\n`;
  }

  report += `📞 PITCH ANGLE:\n\n`;
  report += `${pitchScript}\n\n`;

  report += `📋 SERVICES THEY OFFER:\n`;
  services.forEach(service => {
    report += `• ${service}\n`;
  });
  report += `\n`;

  report += `📝 CONTENT ASSESSMENT:\n`;
  report += `${contentAssessment}\n\n`;

  report += `════════════════════════════════════════════════════════════════\n`;
  report += `📊 TECHNICAL METRICS:\n`;
  report += `════════════════════════════════════════════════════════════════\n\n`;

  report += `Performance:\n`;
  report += `  • LCP (Page Load): ${lead.core_web_vitals_lcp ? (lead.core_web_vitals_lcp / 1000).toFixed(1) + 's' : 'Unknown'}\n`;
  report += `  • Traffic Trend: ${lead.traffic_trend}\n`;
  report += `  • Organic Traffic Value: ${lead.organic_traffic ? '$' + lead.organic_traffic.toLocaleString() : 'Unknown'}\n\n`;

  report += `SEO Health:\n`;
  report += `  • Schema Markup: ${lead.has_schema ? '✓ Yes' : '✗ No'}\n`;
  report += `  • FAQ Schema: ${lead.has_faq ? '✓ Yes' : '✗ No'}\n`;
  report += `  • Organization Schema: ${lead.has_org ? '✓ Yes' : '✗ No'}\n`;
  report += `  • Meta Title: ${lead.meta_title_ok ? '✓ Optimized' : '✗ Needs Work'}\n`;
  report += `  • Meta Description: ${lead.meta_desc_ok ? '✓ Optimized' : '✗ Needs Work'}\n`;
  report += `  • Content Freshness: ${lead.content_fresh_months ? lead.content_fresh_months + ' months old' : 'Unknown'}\n\n`;

  report += `Authority:\n`;
  report += `  • Backlinks: ${lead.backlinks_count ? lead.backlinks_count.toLocaleString() : 'Unknown'}\n`;
  report += `  • Referring Domains: ${lead.referring_domains ? lead.referring_domains.toLocaleString() : 'Unknown'}\n`;
  report += `  • Domain Rank: ${lead.domain_rank || 'Unknown'}\n\n`;

  report += `════════════════════════════════════════════════════════════════\n`;
  report += `Report Generated: ${new Date().toLocaleString()}\n`;
  report += `════════════════════════════════════════════════════════════════\n`;

  return report;
}

export function generateHtmlReport(lead: Lead): string {
  const priorityLevel = lead.score < 60 ? 'HIGH PRIORITY' : lead.score < 75 ? 'MEDIUM PRIORITY' : 'LOW PRIORITY';
  const priorityColor = lead.score < 60 ? '#ef4444' : lead.score < 75 ? '#f59e0b' : '#10b981';

  const revenueImpact = calculateRevenueImpact(lead);
  const criticalIssues = generateCriticalIssues(lead);
  const opportunities = generateOpportunities(lead);
  const quickWins = generateQuickWins(lead);
  const pitchScript = generatePitchScript(lead);
  const services = detectServices(lead);
  const contentAssessment = generateContentAssessment(lead);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SEO Report - ${lead.business_name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: #f9fafb;
      padding: 2rem;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 3rem 2rem;
      text-align: center;
    }

    .header h1 {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      font-weight: 700;
    }

    .score-badge {
      display: inline-block;
      padding: 0.5rem 1.5rem;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50px;
      font-size: 1.25rem;
      font-weight: 600;
      margin-top: 1rem;
    }

    .priority {
      display: inline-block;
      padding: 0.25rem 1rem;
      background: ${priorityColor};
      color: white;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 600;
      margin-left: 0.5rem;
    }

    .content {
      padding: 2rem;
    }

    .section {
      margin-bottom: 2.5rem;
    }

    .section-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #667eea;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 3px solid #667eea;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .info-item {
      padding: 1rem;
      background: #f3f4f6;
      border-radius: 8px;
    }

    .info-label {
      font-size: 0.875rem;
      color: #6b7280;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .info-value {
      font-size: 1rem;
      color: #1f2937;
      font-weight: 500;
    }

    .critical-issues {
      background: #fef2f2;
      border-left: 4px solid #ef4444;
      padding: 1.5rem;
      border-radius: 8px;
    }

    .issue-item {
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #fee2e2;
    }

    .issue-item:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }

    .issue-title {
      font-weight: 700;
      color: #dc2626;
      margin-bottom: 0.5rem;
      font-size: 1.1rem;
    }

    .issue-detail {
      color: #7f1d1d;
      margin-left: 1.5rem;
      line-height: 1.8;
    }

    .revenue-box {
      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
      color: white;
      padding: 1.5rem;
      border-radius: 8px;
      text-align: center;
      font-size: 1.25rem;
      font-weight: 700;
    }

    .opportunities-list, .quickwins-list, .services-list {
      list-style: none;
      padding: 0;
    }

    .opportunities-list li, .quickwins-list li, .services-list li {
      padding: 0.75rem 0;
      padding-left: 2rem;
      position: relative;
      border-bottom: 1px solid #e5e7eb;
    }

    .opportunities-list li:before {
      content: "💡";
      position: absolute;
      left: 0;
    }

    .quickwins-list li:before {
      content: "✅";
      position: absolute;
      left: 0;
    }

    .services-list li:before {
      content: "•";
      position: absolute;
      left: 0.5rem;
      color: #667eea;
      font-size: 1.5rem;
    }

    .pitch-box {
      background: #eff6ff;
      border: 2px solid #3b82f6;
      border-radius: 8px;
      padding: 1.5rem;
      font-style: italic;
      color: #1e40af;
      line-height: 1.8;
    }

    .content-assessment {
      background: #f9fafb;
      padding: 1.5rem;
      border-radius: 8px;
      border-left: 4px solid #667eea;
      line-height: 1.8;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .metric-card {
      background: #f9fafb;
      padding: 1rem;
      border-radius: 8px;
      border-left: 3px solid #667eea;
    }

    .metric-label {
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 0.25rem;
    }

    .metric-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1f2937;
    }

    .metric-good {
      color: #10b981;
    }

    .metric-bad {
      color: #ef4444;
    }

    .footer {
      background: #f3f4f6;
      padding: 1.5rem 2rem;
      text-align: center;
      color: #6b7280;
      font-size: 0.875rem;
    }

    @media print {
      body {
        padding: 0;
        background: white;
      }

      .container {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${lead.business_name}</h1>
      <div class="score-badge">
        Score: ${lead.score}/100
        <span class="priority">${priorityLevel}</span>
      </div>
    </div>

    <div class="content">
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Phone</div>
          <div class="info-value">${lead.phone || 'Not available'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Website</div>
          <div class="info-value">${lead.website || 'Not available'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Location</div>
          <div class="info-value">${lead.city || lead.address || 'Not available'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Tech Stack</div>
          <div class="info-value">${lead.tech_stack && lead.tech_stack.length > 0 ? lead.tech_stack.join(', ') : 'Custom'}</div>
        </div>
      </div>

      ${criticalIssues.length > 0 ? `
      <div class="section">
        <h2 class="section-title">🔴 Critical Issues Costing Them Customers</h2>
        <div class="critical-issues">
          ${criticalIssues.map(issue => {
            const lines = issue.split('\n');
            return `
              <div class="issue-item">
                <div class="issue-title">${lines[0]}</div>
                ${lines.slice(1).map(line => `<div class="issue-detail">${line}</div>`).join('')}
              </div>
            `;
          }).join('')}
        </div>
      </div>
      ` : ''}

      <div class="section">
        <h2 class="section-title">💰 Estimated Revenue Impact</h2>
        <div class="revenue-box">
          Monthly Loss from SEO Issues: $${revenueImpact.min.toLocaleString()} - $${revenueImpact.max.toLocaleString()}
        </div>
      </div>

      ${opportunities.length > 0 ? `
      <div class="section">
        <h2 class="section-title">💡 Opportunities</h2>
        <ul class="opportunities-list">
          ${opportunities.map(opp => `<li>${opp}</li>`).join('')}
        </ul>
      </div>
      ` : ''}

      ${quickWins.length > 0 ? `
      <div class="section">
        <h2 class="section-title">✅ Quick Wins (First 2 Weeks)</h2>
        <ul class="quickwins-list">
          ${quickWins.map(win => `<li>${win}</li>`).join('')}
        </ul>
      </div>
      ` : ''}

      <div class="section">
        <h2 class="section-title">📞 Pitch Angle</h2>
        <div class="pitch-box">
          ${pitchScript}
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">📋 Services They Offer</h2>
        <ul class="services-list">
          ${services.map(service => `<li>${service}</li>`).join('')}
        </ul>
      </div>

      <div class="section">
        <h2 class="section-title">📝 Content Assessment</h2>
        <div class="content-assessment">
          ${contentAssessment}
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">📊 Technical Metrics</h2>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">Page Load Speed (LCP)</div>
            <div class="metric-value ${lead.core_web_vitals_lcp && lead.core_web_vitals_lcp <= 2500 ? 'metric-good' : 'metric-bad'}">
              ${lead.core_web_vitals_lcp ? (lead.core_web_vitals_lcp / 1000).toFixed(1) + 's' : 'Unknown'}
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Traffic Trend</div>
            <div class="metric-value">${lead.traffic_trend}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Organic Traffic Value</div>
            <div class="metric-value">${lead.organic_traffic ? '$' + lead.organic_traffic.toLocaleString() : 'Unknown'}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Backlinks</div>
            <div class="metric-value">${lead.backlinks_count ? lead.backlinks_count.toLocaleString() : 'Unknown'}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Referring Domains</div>
            <div class="metric-value">${lead.referring_domains ? lead.referring_domains.toLocaleString() : 'Unknown'}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Schema Markup</div>
            <div class="metric-value ${lead.has_schema ? 'metric-good' : 'metric-bad'}">${lead.has_schema ? '✓ Yes' : '✗ No'}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Meta Tags</div>
            <div class="metric-value ${lead.meta_title_ok && lead.meta_desc_ok ? 'metric-good' : 'metric-bad'}">
              ${lead.meta_title_ok && lead.meta_desc_ok ? '✓ Optimized' : '✗ Needs Work'}
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Content Freshness</div>
            <div class="metric-value ${lead.content_fresh_months && lead.content_fresh_months <= 6 ? 'metric-good' : 'metric-bad'}">
              ${lead.content_fresh_months ? lead.content_fresh_months + ' months' : 'Unknown'}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      Report Generated: ${new Date().toLocaleString()}
    </div>
  </div>
</body>
</html>`;
}

export function downloadReport(lead: Lead, format: 'txt' | 'html') {
  const content = format === 'txt' ? generateTxtReport(lead) : generateHtmlReport(lead);
  const blob = new Blob([content], { type: format === 'txt' ? 'text/plain' : 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${lead.business_name.replace(/[^a-z0-9]/gi, '_')}_SEO_Report.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadBulkReport(leads: Lead[], geography: string, industry: string, format: 'txt' | 'html') {
  if (format === 'txt') {
    let bulkContent = '';
    bulkContent += `════════════════════════════════════════════════════════════════\n`;
    bulkContent += `BULK SEO LEAD REPORT\n`;
    bulkContent += `════════════════════════════════════════════════════════════════\n\n`;
    bulkContent += `Geography: ${geography}\n`;
    bulkContent += `Industry: ${industry}\n`;
    bulkContent += `Total Leads: ${leads.length}\n`;
    bulkContent += `Report Generated: ${new Date().toLocaleString()}\n\n`;
    bulkContent += `════════════════════════════════════════════════════════════════\n\n\n`;

    leads.forEach((lead, idx) => {
      bulkContent += generateTxtReport(lead);
      if (idx < leads.length - 1) {
        bulkContent += `\n\n\n`;
      }
    });

    const blob = new Blob([bulkContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bulk_SEO_Report_${geography.replace(/[^a-z0-9]/gi, '_')}_${industry.replace(/[^a-z0-9]/gi, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } else {
    const bulkHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bulk SEO Lead Report - ${geography} ${industry}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: #f9fafb;
      padding: 2rem;
    }

    .cover-page {
      max-width: 900px;
      margin: 0 auto 3rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 4rem 2rem;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }

    .cover-page h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
      font-weight: 700;
    }

    .cover-page .subtitle {
      font-size: 1.5rem;
      opacity: 0.9;
      margin-bottom: 2rem;
    }

    .cover-page .meta {
      font-size: 1.125rem;
      opacity: 0.8;
    }

    .summary-section {
      max-width: 900px;
      margin: 0 auto 3rem;
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .summary-section h2 {
      font-size: 2rem;
      color: #667eea;
      margin-bottom: 1.5rem;
      border-bottom: 3px solid #667eea;
      padding-bottom: 0.5rem;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-top: 2rem;
    }

    .summary-card {
      background: #f9fafb;
      padding: 1.5rem;
      border-radius: 8px;
      border-left: 4px solid #667eea;
      text-align: center;
    }

    .summary-card .label {
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .summary-card .value {
      font-size: 2rem;
      font-weight: 700;
      color: #1f2937;
    }

    .page-break {
      page-break-after: always;
      margin: 3rem 0;
    }

    .container {
      max-width: 900px;
      margin: 0 auto 3rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 3rem 2rem;
      text-align: center;
    }

    .header h1 {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      font-weight: 700;
    }

    .score-badge {
      display: inline-block;
      padding: 0.5rem 1.5rem;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50px;
      font-size: 1.25rem;
      font-weight: 600;
      margin-top: 1rem;
    }

    .priority {
      display: inline-block;
      padding: 0.25rem 1rem;
      background-color: var(--priority-color);
      color: white;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 600;
      margin-left: 0.5rem;
    }

    .content {
      padding: 2rem;
    }

    .section {
      margin-bottom: 2.5rem;
    }

    .section-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #667eea;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 3px solid #667eea;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .info-item {
      padding: 1rem;
      background: #f3f4f6;
      border-radius: 8px;
    }

    .info-label {
      font-size: 0.875rem;
      color: #6b7280;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .info-value {
      font-size: 1rem;
      color: #1f2937;
      font-weight: 500;
    }

    .critical-issues {
      background: #fef2f2;
      border-left: 4px solid #ef4444;
      padding: 1.5rem;
      border-radius: 8px;
    }

    .issue-item {
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #fee2e2;
    }

    .issue-item:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }

    .issue-title {
      font-weight: 700;
      color: #dc2626;
      margin-bottom: 0.5rem;
      font-size: 1.1rem;
    }

    .issue-detail {
      color: #7f1d1d;
      margin-left: 1.5rem;
      line-height: 1.8;
    }

    .revenue-box {
      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
      color: white;
      padding: 1.5rem;
      border-radius: 8px;
      text-align: center;
      font-size: 1.25rem;
      font-weight: 700;
    }

    .opportunities-list, .quickwins-list, .services-list {
      list-style: none;
      padding: 0;
    }

    .opportunities-list li, .quickwins-list li, .services-list li {
      padding: 0.75rem 0;
      padding-left: 2rem;
      position: relative;
      border-bottom: 1px solid #e5e7eb;
    }

    .opportunities-list li:before {
      content: "💡";
      position: absolute;
      left: 0;
    }

    .quickwins-list li:before {
      content: "✅";
      position: absolute;
      left: 0;
    }

    .services-list li:before {
      content: "•";
      position: absolute;
      left: 0.5rem;
      color: #667eea;
      font-size: 1.5rem;
    }

    .pitch-box {
      background: #eff6ff;
      border: 2px solid #3b82f6;
      border-radius: 8px;
      padding: 1.5rem;
      font-style: italic;
      color: #1e40af;
      line-height: 1.8;
    }

    .content-assessment {
      background: #f9fafb;
      padding: 1.5rem;
      border-radius: 8px;
      border-left: 4px solid #667eea;
      line-height: 1.8;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .metric-card {
      background: #f9fafb;
      padding: 1rem;
      border-radius: 8px;
      border-left: 3px solid #667eea;
    }

    .metric-label {
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 0.25rem;
    }

    .metric-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1f2937;
    }

    .metric-good {
      color: #10b981;
    }

    .metric-bad {
      color: #ef4444;
    }

    .footer {
      background: #f3f4f6;
      padding: 1.5rem 2rem;
      text-align: center;
      color: #6b7280;
      font-size: 0.875rem;
    }

    @media print {
      body {
        padding: 0;
        background: white;
      }

      .container {
        box-shadow: none;
        margin-bottom: 0;
        page-break-after: always;
      }

      .cover-page, .summary-section {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="cover-page">
    <h1>SEO Lead Report</h1>
    <div class="subtitle">${geography} - ${industry}</div>
    <div class="meta">
      <div>${leads.length} Qualified Leads</div>
      <div style="margin-top: 0.5rem;">Generated: ${new Date().toLocaleString()}</div>
    </div>
  </div>

  <div class="summary-section">
    <h2>Executive Summary</h2>
    <p style="margin-bottom: 2rem; line-height: 1.8;">
      This report contains a comprehensive SEO analysis of ${leads.length} businesses in the ${industry} industry
      located in ${geography}. Each business has been evaluated based on technical SEO health, performance metrics,
      and growth potential. Lower scores indicate higher opportunity for SEO improvement services.
    </p>
    <div class="summary-grid">
      <div class="summary-card">
        <div class="label">Total Leads</div>
        <div class="value">${leads.length}</div>
      </div>
      <div class="summary-card">
        <div class="label">Avg Score</div>
        <div class="value">${Math.round(leads.reduce((sum, l) => sum + l.score, 0) / leads.length)}</div>
      </div>
      <div class="summary-card">
        <div class="label">High Priority</div>
        <div class="value">${leads.filter(l => l.score < 60).length}</div>
      </div>
      <div class="summary-card">
        <div class="label">Medium Priority</div>
        <div class="value">${leads.filter(l => l.score >= 60 && l.score < 75).length}</div>
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  ${leads.map((lead, idx) => {
    const priorityColor = lead.score < 60 ? '#ef4444' : lead.score < 75 ? '#f59e0b' : '#10b981';
    return generateHtmlReport(lead).replace(
      '<body>',
      `<body><style>.priority { background-color: ${priorityColor} !important; }</style>`
    ).replace('</body>', '') + (idx < leads.length - 1 ? '<div class="page-break"></div>' : '');
  }).join('\n')}

  <div class="summary-section">
    <h2>End of Report</h2>
    <p style="text-align: center; color: #6b7280; margin-top: 1rem;">
      Generated on ${new Date().toLocaleString()}
    </p>
  </div>
</body>
</html>`;

    const blob = new Blob([bulkHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bulk_SEO_Report_${geography.replace(/[^a-z0-9]/gi, '_')}_${industry.replace(/[^a-z0-9]/gi, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
