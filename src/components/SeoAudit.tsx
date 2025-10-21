import { useState } from 'react';
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
        `${supabaseUrl}/functions/v1/analyze-claude`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            type: 'seo',
            url,
            htmlSource,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setResult(data);

      await supabase.from('seo_audits').insert({
        url: url || 'HTML Source',
        html_source: htmlSource || null,
        score: data.score,
        grade: data.grade,
        seo_issues: data.seoIssues || [],
        aeo_optimizations: data.aeoOptimizations || [],
        technical_seo: data.technicalSeo || {},
        content_gaps: data.contentGaps || [],
        recommendations: data.recommendations || [],
      });
    } catch (err) {
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
    markdown += `**Score:** ${result.score}/100 (${result.grade})\\n\\n`;
    markdown += `## SEO Issues\\n\\n`;
    result.seoIssues?.forEach((issue: any, idx: number) => {
      markdown += `### ${idx + 1}. ${issue.title}\\n`;
      markdown += `- **Severity:** ${issue.severity}\\n`;
      markdown += `- **Priority:** ${issue.priority}/10\\n`;
      markdown += `- **Description:** ${issue.description}\\n\\n`;
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'seo-audit.md';
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
                  <div className="mt-2 flex items-center space-x-4">
                    <div className="text-4xl font-bold text-blue-600">{result.score}/100</div>
                    <div className="text-2xl font-semibold text-gray-700">{result.grade}</div>
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
