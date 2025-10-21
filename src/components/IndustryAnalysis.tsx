import { useState } from 'react';
import { TrendingUp, Search, CheckCircle, AlertCircle, Clock, DollarSign, Target } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';

interface IndustryResult {
  industry: string;
  need_score: number;
  confidence_level: 'high' | 'medium' | 'low';
  signals: {
    visibility_gap: number;
    competitor_intensity: number;
    local_pack_presence: number;
    review_health: number;
    content_gap: number;
    aeo_citation_gap: number;
    schema_gap: number;
  };
  evidence: string[];
  top_queries: string[];
  quick_wins_seo: string[];
  quick_wins_aeo: string[];
  estimated_monthly_budget: number;
  time_to_impact_months: number;
  notes: string;
}

interface AnalysisResult {
  id: string;
  geo: string;
  timeframe: string;
  mode: string;
  ranked_industries: IndustryResult[];
  methodology: {
    candidate_set_size: number;
    data_mode: string;
    data_freshness: string;
    limitations: string[];
    next_steps: string[];
  };
}

export function IndustryAnalysis() {
  const [geo, setGeo] = useState('');
  const [mode, setMode] = useState<'web' | 'heuristic'>('heuristic');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryResult | null>(null);

  const handleAnalyze = async () => {
    if (!geo.trim()) {
      setError('Please enter a location');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setSelectedIndustry(null);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-industry`;
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          geo: geo.trim(),
          mode,
          timeframe: 'last 6-12 months',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze industries');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-red-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <TrendingUp className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Industry Opportunity Analysis
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover which industries in your area have the highest SEO and AEO opportunities
          </p>
        </div>

        <Card className="mb-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <Input
                type="text"
                placeholder="e.g., Houston, TX or 77002"
                value={geo}
                onChange={(e) => setGeo(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Analysis Mode
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="heuristic"
                    checked={mode === 'heuristic'}
                    onChange={(e) => setMode(e.target.value as 'heuristic')}
                    disabled={loading}
                    className="mr-2"
                  />
                  <span className="text-sm">Heuristic (Fast)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="web"
                    checked={mode === 'web'}
                    onChange={(e) => setMode(e.target.value as 'web')}
                    disabled={loading}
                    className="mr-2"
                  />
                  <span className="text-sm">Web Research (Detailed)</span>
                </label>
              </div>
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={loading || !geo.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Industries...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Analyze Market Opportunities
                </>
              )}
            </Button>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>
        </Card>

        {result && (
          <>
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Analysis Complete
                  </p>
                  <p className="text-sm text-blue-700">
                    Found {result.ranked_industries.length} industries in {result.geo}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 mb-8">
              {result.ranked_industries.map((industry, index) => (
                <Card
                  key={index}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedIndustry(
                    selectedIndustry?.industry === industry.industry ? null : industry
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl font-bold text-gray-400">
                          #{index + 1}
                        </span>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {industry.industry}
                        </h3>
                        <span className={`text-xs font-medium ${getConfidenceColor(industry.confidence_level)}`}>
                          {industry.confidence_level.toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Opportunity Score</p>
                          <p className={`text-2xl font-bold ${getScoreColor(industry.need_score)}`}>
                            {Math.round(industry.need_score)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Est. Budget</p>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-gray-600" />
                            <p className="text-lg font-semibold text-gray-900">
                              {industry.estimated_monthly_budget.toLocaleString()}/mo
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Time to Impact</p>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-gray-600" />
                            <p className="text-lg font-semibold text-gray-900">
                              {industry.time_to_impact_months} months
                            </p>
                          </div>
                        </div>
                      </div>

                      {selectedIndustry?.industry === industry.industry && (
                        <div className="mt-6 pt-6 border-t space-y-6">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-3">Signal Scores</h4>
                            <div className="grid grid-cols-2 gap-3">
                              {Object.entries(industry.signals).map(([key, value]) => (
                                <div key={key} className="flex items-center justify-between">
                                  <span className="text-xs text-gray-600 capitalize">
                                    {key.replace(/_/g, ' ')}
                                  </span>
                                  <span className={`text-sm font-semibold ${getScoreColor(value)}`}>
                                    {Math.round(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">
                              Quick Wins - SEO
                            </h4>
                            <ul className="space-y-1">
                              {industry.quick_wins_seo.map((win, i) => (
                                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                  <Target className="w-3 h-3 text-blue-600 mt-1 flex-shrink-0" />
                                  {win}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">
                              Quick Wins - AEO
                            </h4>
                            <ul className="space-y-1">
                              {industry.quick_wins_aeo.map((win, i) => (
                                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                  <Target className="w-3 h-3 text-green-600 mt-1 flex-shrink-0" />
                                  {win}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {industry.notes && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-2">Notes</h4>
                              <p className="text-sm text-gray-600">{industry.notes}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {result.methodology && (
              <Card className="bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Methodology</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Analysis Mode:</span>
                    <span className="font-medium text-gray-900">{result.methodology.data_mode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Industries Evaluated:</span>
                    <span className="font-medium text-gray-900">{result.methodology.candidate_set_size}</span>
                  </div>
                  {result.methodology.limitations.length > 0 && (
                    <div>
                      <p className="text-gray-600 mb-1">Limitations:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {result.methodology.limitations.map((limit, i) => (
                          <li key={i} className="text-gray-700">{limit}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
