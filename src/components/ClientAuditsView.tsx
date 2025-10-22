import { useState, useEffect } from 'react';
import { ArrowLeft, Download, Calendar, TrendingUp } from 'lucide-react';
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

  if (selectedAudit) {
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

          <Card className="p-8 mb-6" glassEffect>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedAudit.url}
                </h2>
                <p className="text-gray-600">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  {new Date(selectedAudit.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="text-center">
                <div className={`text-5xl font-bold ${getScoreColor(selectedAudit.score)}`}>
                  {selectedAudit.score}
                </div>
                <div className="text-xl font-semibold text-gray-700 mt-1">
                  {selectedAudit.grade}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => exportAsMarkdown(selectedAudit)}
                  className="mt-4"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
              </div>
            </div>

            {selectedAudit.seo_issues && selectedAudit.seo_issues.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">SEO Issues</h3>
                <div className="space-y-4">
                  {selectedAudit.seo_issues.map((issue: any, idx: number) => (
                    <div key={idx} className="p-4 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{issue.title}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          issue.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                          issue.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                          issue.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {issue.severity}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">{issue.description}</p>
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

            {selectedAudit.aeo_optimizations && selectedAudit.aeo_optimizations.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">AEO Optimizations</h3>
                <div className="space-y-4">
                  {selectedAudit.aeo_optimizations.map((opt: any, idx: number) => (
                    <div key={idx} className="p-4 bg-white rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-2">{opt.title}</h4>
                      <p className="text-gray-600 text-sm">{opt.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedAudit.recommendations && selectedAudit.recommendations.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Recommendations</h3>
                <div className="space-y-4">
                  {selectedAudit.recommendations.map((rec: any, idx: number) => (
                    <div key={idx} className="p-4 bg-white rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-2">{rec.title}</h4>
                      <p className="text-gray-600 text-sm">{rec.description}</p>
                      {rec.expectedImprovement && (
                        <p className="mt-2 text-sm text-green-600 font-medium">
                          <TrendingUp className="w-4 h-4 inline mr-1" />
                          {rec.expectedImprovement}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
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
