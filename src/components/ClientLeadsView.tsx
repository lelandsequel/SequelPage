import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, AlertCircle, CheckCircle, XCircle, Users } from 'lucide-react';
import { Card } from './Card';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

interface ClientLeadsViewProps {
  onBack: () => void;
}

interface Lead {
  id: string;
  business_name: string;
  website?: string;
  phone?: string;
  city?: string;
  score: number;
  traffic_trend: string;
  has_schema: boolean;
  has_faq: boolean;
  has_org: boolean;
  meta_title_ok: boolean;
  meta_desc_ok: boolean;
  issues: string[];
  notes?: string;
  created_at: string;
}

export function ClientLeadsView({ onBack }: ClientLeadsViewProps) {
  const { clientId } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLeads();
  }, [clientId]);

  const loadLeads = async () => {
    if (!clientId) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (data && !error) {
      setLeads(data);
    }
    setIsLoading(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-100';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Opportunity';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-blue-100 py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>

        <Card className="p-8 mb-8" glassEffect>
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-cyan-100 rounded-lg">
              <Users className="w-8 h-8 text-cyan-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Business Leads</h1>
              <p className="text-gray-600">
                High-quality business leads discovered and analyzed for your market
              </p>
            </div>
          </div>
        </Card>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-6 animate-pulse" glassEffect>
                <div className="h-32 bg-gray-200 rounded"></div>
              </Card>
            ))}
          </div>
        ) : leads.length === 0 ? (
          <Card className="p-12 text-center" glassEffect>
            <p className="text-gray-600 text-lg mb-4">No leads available yet</p>
            <p className="text-gray-500 text-sm">
              Your C&L Strategy team is working on discovering quality leads for your business
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {leads.map((lead) => (
              <Card key={lead.id} className="p-6" glassEffect>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {lead.business_name}
                    </h3>
                    {lead.website && (
                      <a
                        href={lead.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {lead.website}
                      </a>
                    )}
                    {lead.notes && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-900 font-medium">{lead.notes}</p>
                      </div>
                    )}
                  </div>
                  <div className="text-center ml-6">
                    <div className={`px-4 py-2 rounded-lg font-bold text-3xl ${getScoreColor(lead.score)}`}>
                      {lead.score}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">{getScoreLabel(lead.score)}</div>
                  </div>
                </div>

                {(lead.phone || lead.city) && (
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    {lead.phone && (
                      <div>
                        <span className="text-gray-600 font-medium">Phone:</span>{' '}
                        <span className="text-gray-900">{lead.phone}</span>
                      </div>
                    )}
                    {lead.city && (
                      <div>
                        <span className="text-gray-600 font-medium">City:</span>{' '}
                        <span className="text-gray-900">{lead.city}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="border-t border-gray-200 pt-4 mb-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    SEO Analysis
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="flex items-center space-x-2">
                      {lead.has_schema ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm">Schema Markup</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {lead.has_faq ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm">FAQ Schema</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {lead.has_org ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm">Org Schema</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {lead.meta_title_ok ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm">Meta Title</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {lead.meta_desc_ok ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm">Meta Description</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {lead.traffic_trend === 'Growing' ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : lead.traffic_trend === 'Declining' ? (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-gray-600" />
                      )}
                      <span className="text-sm font-semibold">Traffic: {lead.traffic_trend}</span>
                    </div>
                  </div>
                </div>

                {lead.issues && lead.issues.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">
                      SEO Opportunities:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {lead.issues.map((issue, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full"
                        >
                          {issue}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
