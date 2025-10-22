import { useState, useEffect } from 'react';
import { ArrowLeft, Download, Calendar, TrendingUp, Shield, Search, Sparkles, AlertCircle, CheckCircle, Clock, Target } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

interface ClientAuditsViewProps {
  onBack: () => void;
  clientId?: string;
}

interface Audit {
  id: string;
  url: string;
  score: number;
  grade: string;
  created_at: string;
  seo_issues: any[];
  aeo_optimizations: any[];
  recommendations: any[];
}

export function ClientAuditsView({ onBack, clientId: propClientId }: ClientAuditsViewProps) {
  const { clientId: authClientId } = useAuth();
  const clientId = propClientId || authClientId;
  const [audits, setAudits] = useState<Audit[]>([]);
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (clientId) {
      loadAudits();
    }
  }, [clientId]);

  const loadAudits = async () => {
    if (!clientId) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from('seo_audits')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (data && !error) {
      setAudits(data);
    }
    setIsLoading(false);
  };

  const exportAsMarkdown = (audit: Audit) => {
    let markdown = `# SEO/AEO Audit Report\n\n`;
    markdown += `**URL:** ${audit.url}\n`;
    markdown += `**Date:** ${new Date(audit.created_at).toLocaleDateString()}\n`;
    markdown += `**Score:** ${audit.score}/100 (${audit.grade})\n\n`;

    if (audit.seo_issues && audit.seo_issues.length > 0) {
      markdown += `## SEO Issues\n\n`;
      audit.seo_issues.forEach((issue: any, idx: number) => {
        markdown += `### ${idx + 1}. ${issue.title}\n`;
        markdown += `- **Severity:** ${issue.severity}\n`;
        markdown += `- **Priority:** ${issue.priority}/10\n`;
        markdown += `- **Description:** ${issue.description}\n\n`;
      });
    }

    if (audit.aeo_optimizations && audit.aeo_optimizations.length > 0) {
      markdown += `## AEO Optimizations\n\n`;
      audit.aeo_optimizations.forEach((opt: any, idx: number) => {
        markdown += `### ${idx + 1}. ${opt.title}\n`;
        markdown += `${opt.description}\n\n`;
      });
    }

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seo-audit-${audit.url.replace(/[^a-z0-9]/gi, '_')}-${new Date(audit.created_at).toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeoScore = (audit: Audit) => {
    const issues = audit.seo_issues || [];
    const critical = issues.filter((i: any) => i.severity === 'CRITICAL').length;
    const high = issues.filter((i: any) => i.severity === 'HIGH').length;
    const medium = issues.filter((i: any) => i.severity === 'MEDIUM').length;

    let score = 100;
    score -= critical * 15;
    score -= high * 10;
    score -= medium * 5;
    return Math.max(0, score);
  };

  const getAeoScore = (audit: Audit) => {
    const optimizations = audit.aeo_optimizations || [];
    const total = optimizations.length;
    if (total === 0) return 75;

    const hasStructuredData = optimizations.some((o: any) =>
      o.title?.toLowerCase().includes('structured') || o.title?.toLowerCase().includes('schema')
    );
    const hasFaq = optimizations.some((o: any) =>
      o.title?.toLowerCase().includes('faq') || o.title?.toLowerCase().includes('question')
    );
    const hasContent = optimizations.some((o: any) =>
      o.title?.toLowerCase().includes('content') || o.title?.toLowerCase().includes('comprehensive')
    );

    let score = 60;
    if (hasStructuredData) score += 15;
    if (hasFaq) score += 15;
    if (hasContent) score += 10;

    return Math.min(100, score);
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-gradient-to-br from-green-500 to-emerald-600';
    if (score >= 60) return 'bg-gradient-to-br from-yellow-500 to-orange-500';
    return 'bg-gradient-to-br from-red-500 to-pink-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Work';
  };

  if (selectedAudit) {
    const seoScore = getSeoScore(selectedAudit);
    const aeoScore = getAeoScore(selectedAudit);
    const overallScore = Math.round((seoScore + aeoScore) / 2);

    const criticalIssues = selectedAudit.seo_issues?.filter((i: any) => i.severity === 'CRITICAL').length || 0;
    const highIssues = selectedAudit.seo_issues?.filter((i: any) => i.severity === 'HIGH').length || 0;
    const mediumIssues = selectedAudit.seo_issues?.filter((i: any) => i.severity === 'MEDIUM').length || 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-blue-100 py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <button
            onClick={() => setSelectedAudit(null)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Audits
          </button>

          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {selectedAudit.url}
              </h2>
              <p className="text-gray-600 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Analyzed on {new Date(selectedAudit.created_at).toLocaleDateString()}
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => exportAsMarkdown(selectedAudit)}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>

          <Card className="p-8 mb-6 text-center" glassEffect>
            <div className="inline-block">
              <div className={`w-40 h-40 rounded-full ${getScoreBgColor(overallScore)} flex items-center justify-center shadow-2xl mx-auto mb-4`}>
                <div className="text-center">
                  <div className="text-6xl font-bold text-white">{overallScore}</div>
                  <div className="text-white text-sm font-medium">Overall</div>
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{getScoreLabel(overallScore)}</div>
              <p className="text-gray-600">Your website health score</p>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card className="p-6" glassEffect>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <Search className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">SEO Health</h3>
                    <p className="text-sm text-gray-600">Search Engine Visibility</p>
                  </div>
                </div>
                <div className={`w-20 h-20 rounded-full ${getScoreBgColor(seoScore)} flex items-center justify-center`}>
                  <div className="text-3xl font-bold text-white">{seoScore}</div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div
                  className={`h-3 rounded-full ${getScoreBgColor(seoScore)}`}
                  style={{ width: `${seoScore}%` }}
                ></div>
              </div>
              <div className="space-y-2">
                {criticalIssues > 0 && (
                  <div className="flex items-center text-red-600">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">{criticalIssues} critical issues to address</span>
                  </div>
                )}
                {highIssues > 0 && (
                  <div className="flex items-center text-orange-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">{highIssues} important improvements</span>
                  </div>
                )}
                {criticalIssues === 0 && highIssues === 0 && (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">No major issues detected</span>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6" glassEffect>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <Sparkles className="w-6 h-6 text-cyan-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">AEO Readiness</h3>
                    <p className="text-sm text-gray-600">AI Search Optimization</p>
                  </div>
                </div>
                <div className={`w-20 h-20 rounded-full ${getScoreBgColor(aeoScore)} flex items-center justify-center`}>
                  <div className="text-3xl font-bold text-white">{aeoScore}</div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div
                  className={`h-3 rounded-full ${getScoreBgColor(aeoScore)}`}
                  style={{ width: `${aeoScore}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">
                {aeoScore >= 80 ? 'Your site is well-optimized for AI-powered search engines like ChatGPT, Perplexity, and Claude.' :
                 aeoScore >= 60 ? 'Good foundation, but room for improvement in AI search visibility.' :
                 'Significant opportunities to improve visibility in AI search results.'}
              </p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="p-6 text-center" glassEffect>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{selectedAudit.recommendations?.length || 0}</div>
              <p className="text-gray-600 text-sm">Opportunities</p>
            </Card>

            <Card className="p-6 text-center" glassEffect>
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-8 h-8 text-orange-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{criticalIssues + highIssues}</div>
              <p className="text-gray-600 text-sm">Priority Items</p>
            </Card>

            <Card className="p-6 text-center" glassEffect>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {Math.round((100 - overallScore) * 0.3)}%
              </div>
              <p className="text-gray-600 text-sm">Potential Growth</p>
            </Card>
          </div>

          <Card className="p-6" glassEffect>
            <h3 className="text-xl font-bold text-gray-900 mb-4">What This Means For Your Business</h3>
            <div className="space-y-4">
              {criticalIssues > 0 && (
                <div className="flex items-start p-4 bg-red-50 rounded-lg border border-red-200">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Immediate Attention Needed</h4>
                    <p className="text-gray-700 text-sm">
                      We've identified {criticalIssues} critical issue{criticalIssues > 1 ? 's' : ''} that could be significantly impacting your online visibility and customer reach. Our team is ready to address these first.
                    </p>
                  </div>
                </div>
              )}

              {aeoScore < 70 && (
                <div className="flex items-start p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                  <Sparkles className="w-5 h-5 text-cyan-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">AEO Opportunity</h4>
                    <p className="text-gray-700 text-sm">
                      AI-powered search engines like ChatGPT and Perplexity are changing how customers find businesses. We've identified opportunities to position your business in these emerging channels.
                    </p>
                  </div>
                </div>
              )}

              {seoScore >= 80 && aeoScore >= 80 && (
                <div className="flex items-start p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Strong Foundation</h4>
                    <p className="text-gray-700 text-sm">
                      Your website is performing well in both traditional and AI-powered search. We'll focus on maintaining this position and exploring growth opportunities.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Shield className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Next Steps</h4>
                  <p className="text-gray-700 text-sm">
                    Our team has prepared a detailed action plan to improve your scores. We'll reach out to discuss the strategy and timeline for implementation.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SEO Audits</h1>
          <p className="text-gray-600">
            View comprehensive website analysis reports prepared for you
          </p>
        </Card>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-6 animate-pulse" glassEffect>
                <div className="h-24 bg-gray-200 rounded"></div>
              </Card>
            ))}
          </div>
        ) : audits.length === 0 ? (
          <Card className="p-12 text-center" glassEffect>
            <p className="text-gray-600 text-lg mb-4">No audits available yet</p>
            <p className="text-gray-500 text-sm">
              Your C&L Strategy team will provide audits as they become available
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {audits.map((audit) => (
              <Card
                key={audit.id}
                className="p-6 hover:shadow-lg transition-all cursor-pointer"
                glassEffect
                onClick={() => setSelectedAudit(audit)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {audit.url}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      {new Date(audit.created_at).toLocaleDateString()}
                    </p>
                    <div className="mt-3 flex items-center space-x-4">
                      <span className="text-sm text-gray-600">
                        {audit.seo_issues?.length || 0} Issues
                      </span>
                      <span className="text-sm text-gray-600">
                        {audit.aeo_optimizations?.length || 0} Optimizations
                      </span>
                      <span className="text-sm text-gray-600">
                        {audit.recommendations?.length || 0} Recommendations
                      </span>
                    </div>
                  </div>
                  <div className="text-center ml-6">
                    <div className={`text-4xl font-bold ${getScoreColor(audit.score)}`}>
                      {audit.score}
                    </div>
                    <div className="text-sm font-semibold text-gray-700 mt-1">
                      {audit.grade}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
