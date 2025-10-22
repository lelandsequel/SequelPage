import { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Shield, Users, Trash2, Sparkles } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { supabase } from '../lib/supabase';
import { ClientAuditsView } from './ClientAuditsView';
import { ClientLeadsView } from './ClientLeadsView';
import { SecurityScanner } from './SecurityScanner';
import { ContentSuite } from './ContentSuite';

interface AdminClientPortalViewProps {
  clientId: string;
  clientName: string;
  onBack: () => void;
}

interface DashboardStats {
  audits: number;
  scans: number;
  leads: number;
  content: number;
}

export function AdminClientPortalView({ clientId, clientName, onBack }: AdminClientPortalViewProps) {
  const [stats, setStats] = useState<DashboardStats>({
    audits: 0,
    scans: 0,
    leads: 0,
    content: 0,
  });
  const [clientInfo, setClientInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<'dashboard' | 'audits' | 'scans' | 'leads' | 'content'>('dashboard');

  useEffect(() => {
    loadClientData();
  }, [clientId]);

  const loadClientData = async () => {
    setIsLoading(true);

    const [clientData, auditsData, scansData, leadsData, contentData] = await Promise.all([
      supabase.from('clients').select('*').eq('id', clientId).maybeSingle(),
      supabase.from('seo_audits').select('id', { count: 'exact', head: true }).eq('client_id', clientId),
      supabase.from('security_scans').select('id', { count: 'exact', head: true }).eq('client_id', clientId),
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('client_id', clientId),
      supabase.from('generated_content').select('id', { count: 'exact', head: true }).eq('client_id', clientId),
    ]);

    if (clientData.data) {
      setClientInfo(clientData.data);
    }

    setStats({
      audits: auditsData.count || 0,
      scans: scansData.count || 0,
      leads: leadsData.count || 0,
      content: contentData.count || 0,
    });

    setIsLoading(false);
  };

  if (activeView === 'audits') {
    return <ClientAuditsView clientId={clientId} onBack={() => setActiveView('dashboard')} />;
  }

  if (activeView === 'scans') {
    return <SecurityScanner onBack={() => setActiveView('dashboard')} />;
  }

  if (activeView === 'leads') {
    return <ClientLeadsView clientId={clientId} onBack={() => setActiveView('dashboard')} />;
  }

  if (activeView === 'content') {
    return <ContentSuite onBack={() => setActiveView('dashboard')} />;
  }

  const features = [
    {
      id: 'audits',
      title: 'SEO Audits',
      description: 'View and manage client audit reports',
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
      count: stats.audits,
    },
    {
      id: 'scans',
      title: 'Security Scans',
      description: 'View and manage security scan reports',
      icon: Shield,
      color: 'from-red-500 to-red-600',
      count: stats.scans,
    },
    {
      id: 'leads',
      title: 'Lead Reports',
      description: 'View and manage discovered leads',
      icon: Users,
      color: 'from-cyan-500 to-cyan-600',
      count: stats.leads,
    },
    {
      id: 'content',
      title: 'Generated Content',
      description: 'View and manage generated content',
      icon: Sparkles,
      color: 'from-purple-500 to-purple-600',
      count: stats.content,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-blue-100 py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Client Management
        </button>

        <Card className="p-8 mb-8" glassEffect>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{clientName}</h1>
            <p className="text-gray-600 mb-4">Admin view of client portal</p>
            {clientInfo && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Industry:</span>
                  <span className="ml-2 font-medium">{clientInfo.industry || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Website:</span>
                  <a href={clientInfo.website} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:underline">
                    {clientInfo.website || 'N/A'}
                  </a>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className="ml-2 font-medium capitalize">{clientInfo.subscription_status}</span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-6 animate-pulse" glassEffect>
                <div className="h-32 bg-gray-200 rounded"></div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card
                key={feature.id}
                className="p-6 hover:shadow-xl transition-shadow cursor-pointer"
                glassEffect
                onClick={() => {
                  if (feature.id === 'audits') setActiveView('audits');
                  if (feature.id === 'scans') setActiveView('scans');
                  if (feature.id === 'leads') setActiveView('leads');
                  if (feature.id === 'content') setActiveView('content');
                }}
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{feature.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900">{feature.count}</span>
                  <Button variant="secondary" size="sm">
                    View All
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
