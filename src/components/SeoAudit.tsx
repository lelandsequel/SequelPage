import { useState, useEffect } from 'react';
import { ArrowLeft, Download, Copy, Check } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { TextArea } from './TextArea';
import { supabase } from '../lib/supabase';

interface SeoAuditProps {
  onBack: () => void;
}

export function SeoAudit({ onBack }: SeoAuditProps) {
  const [url, setUrl] = useState('');
  const [htmlSource, setHtmlSource] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
  const [clients, setClients] = useState<Array<{ id: string; company_name: string }>>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('id, company_name')
      .order('company_name');

    if (data) {
      setClients(data);
    }
  };

  const handleAnalyze = async () => {
    if (!url && !htmlSource) {
      setError('Please provide a URL or HTML source');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setResult(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/comprehensive-seo-audit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            url,
            htmlSource,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error('API Error:', errorData);
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('SEO Audit Response:', data);

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);

      try {
        await supabase.from('seo_audits').insert({
          url: url || 'HTML Source',
          html_source: htmlSource || null,
          score: data.score,
          seo_score: data.seoScore,
          aeo_score: data.aeoScore,
          grade: data.grade,
          seo_issues: data.seoIssues || [],
          aeo_optimizations: data.aeoOptimizations || [],
          technical_seo: data.technicalSeo || {},
          content_gaps: data.contentGaps || [],
          recommendations: data.recommendations || [],
          client_id: selectedClientId || null,
        });
      } catch (dbError) {
        console.warn('Failed to save audit to database:', dbError);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItems(prev => new Set(prev).add(id));
    setTimeout(() => {
      setCopiedItems(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 2000);
  };

  const exportAsJson = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'seo-audit.json';
    a.click();
  };

  const exportAsMarkdown = () => {
    let markdown = `# SEO/AEO Audit Report\\n\\n`;
    markdown += `**Website:** ${url || 'HTML Source'}\\n`;
    markdown += `**Date:** ${new Date().toLocaleDateString()}\\n\\n`;
    markdown += `---\\n\\n`;

    markdown += `## Executive Summary\\n\\n`;
    markdown += `| Metric | Score |\\n`;
    markdown += `|--------|-------|\\n`;
    markdown += `| Overall Score | **${result.score}/100** (${result.grade}) |\\n`;
    if (result.seoScore !== undefined) {
      markdown += `| SEO Score | **${result.seoScore}/100** |\\n`;
    }
    if (result.aeoScore !== undefined) {
      markdown += `| AEO Score | **${result.aeoScore}/100** |\\n`;
    }
    markdown += `\\n`;

    if (result.realMetrics?.dataForSeo?.performance) {
      markdown += `### Performance Metrics\\n\\n`;
      markdown += `| Metric | Value |\\n`;
      markdown += `|--------|-------|\\n`;
      markdown += `| Performance Score | ${Math.round(result.realMetrics.dataForSeo.performance.score)} |\\n`;
      markdown += `| Largest Contentful Paint (LCP) | ${(result.realMetrics.dataForSeo.performance.lcp / 1000).toFixed(2)}s |\\n`;
      markdown += `| Cumulative Layout Shift (CLS) | ${result.realMetrics.dataForSeo.performance.cls.toFixed(3)} |\\n`;
      markdown += `| First Contentful Paint (FCP) | ${(result.realMetrics.dataForSeo.performance.fcp / 1000).toFixed(2)}s |\\n`;
      markdown += `\\n`;
    }

    if (result.realMetrics?.dataForSeo?.backlinks) {
      markdown += `### Backlink Profile\\n\\n`;
      markdown += `| Metric | Count |\\n`;
      markdown += `|--------|-------|\\n`;
      markdown += `| Total Backlinks | ${result.realMetrics.dataForSeo.backlinks.total.toLocaleString()} |\\n`;
      markdown += `| Referring Domains | ${result.realMetrics.dataForSeo.backlinks.referringDomains.toLocaleString()} |\\n`;
      markdown += `| Follow Links | ${result.realMetrics.dataForSeo.backlinks.followLinks.toLocaleString()} |\\n`;
      markdown += `\\n`;
    }

    markdown += `---\\n\\n`;

    if (result.seoIssues && result.seoIssues.length > 0) {
      markdown += `## SEO Issues & Fixes\\n\\n`;
      markdown += `This section identifies traditional search engine optimization problems and provides detailed solutions.\\n\\n`;

      result.seoIssues.forEach((issue: any, idx: number) => {
        markdown += `### ${idx + 1}. ${issue.title}\\n\\n`;
        markdown += `**Severity:** ${issue.severity} | **Priority:** ${issue.priority}/10\\n\\n`;
        markdown += `#### Problem Description\\n\\n`;
        markdown += `${issue.description}\\n\\n`;

        if (issue.impact) {
          markdown += `#### Expected Impact\\n\\n`;
          markdown += `${issue.impact}\\n\\n`;
        }

        if (issue.implementation) {
          markdown += `#### Implementation Guide\\n\\n`;
          markdown += `${issue.implementation}\\n\\n`;
        }

        if (issue.codeSnippet) {
          markdown += `#### Code Solution\\n\\n`;
          markdown += `\\\`\\\`\\\`html\\n${issue.codeSnippet}\\n\\\`\\\`\\\`\\n\\n`;
        }

        markdown += `---\\n\\n`;
      });
    }

    if (result.aeoOptimizations && result.aeoOptimizations.length > 0) {
      markdown += `## Answer Engine Optimization (AEO)\\n\\n`;
      markdown += `These optimizations help your content appear in AI-powered search results and answer engines.\\n\\n`;

      result.aeoOptimizations.forEach((opt: any, idx: number) => {
        markdown += `### ${idx + 1}. ${opt.title}\\n\\n`;
        markdown += `#### Description\\n\\n`;
        markdown += `${opt.description}\\n\\n`;

        if (opt.expectedImprovement) {
          markdown += `#### Expected Improvement\\n\\n`;
          markdown += `${opt.expectedImprovement}\\n\\n`;
        }

        if (opt.implementation) {
          markdown += `#### Implementation Steps\\n\\n`;
          markdown += `${opt.implementation}\\n\\n`;
        }

        if (opt.codeSnippet) {
          markdown += `#### Code Example\\n\\n`;
          markdown += `\\\`\\\`\\\`html\\n${opt.codeSnippet}\\n\\\`\\\`\\\`\\n\\n`;
        }

        markdown += `---\\n\\n`;
      });
    }

    if (result.technicalSeo) {
      markdown += `## Technical SEO Audit\\n\\n`;

      if (result.technicalSeo.present && result.technicalSeo.present.length > 0) {
        markdown += `### ✅ Implemented Features\\n\\n`;
        result.technicalSeo.present.forEach((feature: string) => {
          markdown += `- ${feature}\\n`;
        });
        markdown += `\\n`;
      }

      if (result.technicalSeo.missing && result.technicalSeo.missing.length > 0) {
        markdown += `### ❌ Missing Features\\n\\n`;
        result.technicalSeo.missing.forEach((feature: string) => {
          markdown += `- ${feature}\\n`;
        });
        markdown += `\\n`;
      }

      if (result.technicalSeo.howToAdd && result.technicalSeo.howToAdd.length > 0) {
        markdown += `### 📋 Implementation Guides\\n\\n`;
        result.technicalSeo.howToAdd.forEach((guide: string, idx: number) => {
          markdown += `${idx + 1}. ${guide}\\n\\n`;
        });
      }

      markdown += `---\\n\\n`;
    }

    if (result.contentGaps && result.contentGaps.length > 0) {
      markdown += `## Content Gaps Analysis\\n\\n`;
      markdown += `These content opportunities can improve your site's authority and rankings.\\n\\n`;

      result.contentGaps.forEach((gap: any, idx: number) => {
        markdown += `### ${idx + 1}. ${gap.gap}\\n\\n`;
        markdown += `**Why It Matters:** ${gap.whyItMatters}\\n\\n`;

        if (gap.recommendedFormat) {
          markdown += `**Recommended Format:** ${gap.recommendedFormat}\\n\\n`;
        }

        if (gap.suggestions && gap.suggestions.length > 0) {
          markdown += `**Suggestions:**\\n\\n`;
          gap.suggestions.forEach((suggestion: string) => {
            markdown += `- ${suggestion}\\n`;
          });
          markdown += `\\n`;
        }

        markdown += `---\\n\\n`;
      });
    }

    if (result.keywordOpportunities && result.keywordOpportunities.length > 0) {
      markdown += `## Keyword Opportunities\\n\\n`;
      markdown += `| Keyword | Current Position | Difficulty | Search Volume | Recommendation |\\n`;
      markdown += `|---------|------------------|------------|---------------|----------------|\\n`;

      result.keywordOpportunities.forEach((kw: any) => {
        markdown += `| ${kw.keyword} | ${kw.currentPosition || 'Not Ranking'} | ${kw.difficulty} | ${kw.searchVolume?.toLocaleString() || 'N/A'} | ${kw.recommendation} |\\n`;
      });

      markdown += `\\n---\\n\\n`;
    }

    if (result.recommendations && result.recommendations.length > 0) {
      markdown += `## Additional Recommendations\\n\\n`;

      result.recommendations.forEach((rec: any, idx: number) => {
        markdown += `### ${idx + 1}. ${rec.title}\\n\\n`;
        markdown += `${rec.description}\\n\\n`;

        if (rec.expectedImprovement) {
          markdown += `**Expected Improvement:** ${rec.expectedImprovement}\\n\\n`;
        }

        if (rec.codeSnippet) {
          markdown += `**Implementation:**\\n\\n`;
          markdown += `\\\`\\\`\\\`html\\n${rec.codeSnippet}\\n\\\`\\\`\\\`\\n\\n`;
        }

        markdown += `---\\n\\n`;
      });
    }

    if (result.competitorInsights) {
      markdown += `## Competitive Analysis\\n\\n`;

      if (result.competitorInsights.summary) {
        markdown += `### Summary\\n\\n`;
        markdown += `${result.competitorInsights.summary}\\n\\n`;
      }

      if (result.competitorInsights.gaps && result.competitorInsights.gaps.length > 0) {
        markdown += `### Competitive Gaps\\n\\n`;
        result.competitorInsights.gaps.forEach((gap: string) => {
          markdown += `- ${gap}\\n`;
        });
        markdown += `\\n`;
      }

      if (result.competitorInsights.opportunities && result.competitorInsights.opportunities.length > 0) {
        markdown += `### Opportunities\\n\\n`;
        result.competitorInsights.opportunities.forEach((opp: string) => {
          markdown += `- ${opp}\\n`;
        });
        markdown += `\\n`;
      }
    }

    markdown += `---\\n\\n`;
    markdown += `*Report generated on ${new Date().toLocaleString()}*\\n`;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seo-audit-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-300';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'LOW': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-blue-100 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>

        <Card className="p-8 mb-8" glassEffect>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SEO/AEO Audit</h1>
          <p className="text-gray-600 mb-6">Comprehensive website analysis with actionable recommendations</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign to Client (Optional)
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">No client (Admin only)</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.company_name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Select a client to share this audit in their portal
              </p>
            </div>

            <Input
              label="Website URL"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />

            <div className="text-center text-gray-500 text-sm">OR</div>

            <TextArea
              label="HTML Source Code"
              placeholder="Paste your HTML here..."
              rows={4}
              value={htmlSource}
              onChange={(e) => setHtmlSource(e.target.value)}
            />

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            <Button
              onClick={handleAnalyze}
              isLoading={isAnalyzing}
              className="w-full"
              size="lg"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Website'}
            </Button>
          </div>
        </Card>

        {result && (
          <>
            <Card className="p-8 mb-8" glassEffect>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Analysis Results</h2>
                  <div className="mt-2 flex items-center space-x-6">
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Overall</div>
                      <div className="flex items-center space-x-2">
                        <div className="text-4xl font-bold text-blue-600">{result.score}/100</div>
                        <div className="text-2xl font-semibold text-gray-700">{result.grade}</div>
                      </div>
                    </div>
                    {result.seoScore !== undefined && (
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">SEO Score</div>
                        <div className="text-3xl font-bold text-green-600">{result.seoScore}/100</div>
                      </div>
                    )}
                    {result.aeoScore !== undefined && (
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">AEO Score</div>
                        <div className="text-3xl font-bold text-purple-600">{result.aeoScore}/100</div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="secondary" onClick={exportAsJson} size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    JSON
                  </Button>
                  <Button variant="secondary" onClick={exportAsMarkdown} size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    Markdown
                  </Button>
                </div>
              </div>

              {result.realMetrics && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Real Performance Metrics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {result.realMetrics.dataForSeo?.performance && (
                      <>
                        <div>
                          <div className="text-sm text-gray-600">Performance Score</div>
                          <div className="text-2xl font-bold text-gray-900">{Math.round(result.realMetrics.dataForSeo.performance.score)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">LCP</div>
                          <div className="text-2xl font-bold text-gray-900">{(result.realMetrics.dataForSeo.performance.lcp / 1000).toFixed(2)}s</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">CLS</div>
                          <div className="text-2xl font-bold text-gray-900">{result.realMetrics.dataForSeo.performance.cls.toFixed(3)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">FCP</div>
                          <div className="text-2xl font-bold text-gray-900">{(result.realMetrics.dataForSeo.performance.fcp / 1000).toFixed(2)}s</div>
                        </div>
                      </>
                    )}
                  </div>
                  {result.realMetrics.dataForSeo?.backlinks && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Total Backlinks</div>
                        <div className="text-xl font-bold text-gray-900">{result.realMetrics.dataForSeo.backlinks.total.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Referring Domains</div>
                        <div className="text-xl font-bold text-gray-900">{result.realMetrics.dataForSeo.backlinks.referringDomains.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Follow Links</div>
                        <div className="text-xl font-bold text-gray-900">{result.realMetrics.dataForSeo.backlinks.followLinks.toLocaleString()}</div>
                      </div>
                    </div>
                  )}
                  {result.realMetrics.dataForSeo?.rankings && result.realMetrics.dataForSeo.rankings.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Top Ranking Keywords</h4>
                      <div className="space-y-1">
                        {result.realMetrics.dataForSeo.rankings.slice(0, 5).map((rank: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-700">{rank.keyword}</span>
                            <span className="text-gray-600">#{rank.position} ({rank.searchVolume.toLocaleString()} searches/mo)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 gap-6">
                {result.seoIssues && result.seoIssues.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">SEO Issues</h3>
                    <div className="space-y-4">
                      {result.seoIssues.map((issue: any, idx: number) => (
                        <div key={idx} className="p-4 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{issue.title}</h4>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded border ${getSeverityColor(issue.severity)}`}>
                                {issue.severity}
                              </span>
                              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                                Priority: {issue.priority}/10
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm mb-3">{issue.description}</p>
                          {issue.codeSnippet && (
                            <div className="relative">
                              <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto border border-gray-200">
                                <code>{issue.codeSnippet}</code>
                              </pre>
                              <button
                                onClick={() => copyToClipboard(issue.codeSnippet, `issue-${idx}`)}
                                className="absolute top-2 right-2 p-1 bg-white rounded border border-gray-300 hover:bg-gray-50"
                              >
                                {copiedItems.has(`issue-${idx}`) ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Copy className="w-4 h-4 text-gray-600" />
                                )}
                              </button>
                            </div>
                          )}
                          {issue.impact && (
                            <p className="mt-2 text-sm text-green-600 font-medium">
                              Expected Impact: {issue.impact}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.aeoOptimizations && result.aeoOptimizations.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">AEO Optimizations</h3>
                    <div className="space-y-4">
                      {result.aeoOptimizations.map((opt: any, idx: number) => (
                        <div key={idx} className="p-4 bg-white rounded-lg border border-gray-200">
                          <h4 className="font-semibold text-gray-900 mb-2">{opt.title}</h4>
                          <p className="text-gray-600 text-sm mb-3">{opt.description}</p>
                          {opt.codeSnippet && (
                            <div className="relative">
                              <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto border border-gray-200">
                                <code>{opt.codeSnippet}</code>
                              </pre>
                              <button
                                onClick={() => copyToClipboard(opt.codeSnippet, `aeo-${idx}`)}
                                className="absolute top-2 right-2 p-1 bg-white rounded border border-gray-300 hover:bg-gray-50"
                              >
                                {copiedItems.has(`aeo-${idx}`) ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Copy className="w-4 h-4 text-gray-600" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
