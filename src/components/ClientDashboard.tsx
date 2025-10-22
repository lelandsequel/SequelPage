import { useState, useEffect } from 'react';
import { FileText, Shield, Search, Users, Bell, MessageSquare, LogOut } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

interface ClientDashboardProps {
  onNavigate: (page: string) => void;
}

interface DashboardStats {
  audits: number;
  scans: number;
  leads: number;
  content: number;
  unreadNotifications: number;
}

export function ClientDashboard({ onNavigate }: ClientDashboardProps) {
  const { signOut, clientId } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    audits: 0,
    scans: 0,
    leads: 0,
    content: 0,
    unreadNotifications: 0,
  });
  const [clientInfo, setClientInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [clientId]);

  const loadDashboardData = async () => {
    if (!clientId) return;

    setIsLoading(true);

    const [clientData, auditsData, scansData, leadsData, contentData, notificationsData] = await Promise.all([
      supabase.from('clients').select('*').eq('id', clientId).maybeSingle(),
      supabase.from('seo_audits').select('id', { count: 'exact', head: true }).eq('client_id', clientId),
      supabase.from('security_scans').select('id', { count: 'exact', head: true }).eq('client_id', clientId),
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('client_id', clientId),
      supabase.from('generated_content').select('id', { count: 'exact', head: true }).eq('client_id', clientId),
      supabase.from('client_notifications').select('id', { count: 'exact', head: true }).eq('client_id', clientId).is('read_at', null),
    ]);

    if (clientData.data) {
      setClientInfo(clientData.data);
    }

    setStats({
      audits: auditsData.count || 0,
      scans: scansData.count || 0,
      leads: leadsData.count || 0,
      content: contentData.count || 0,
      unreadNotifications: notificationsData.count || 0,
    });

    setIsLoading(false);
  };

  const features = [
    {
      id: 'audits',
      title: 'SEO Audits',
      description: 'View your comprehensive website analysis reports',
      icon: Search,
      color: 'from-blue-500 to-blue-600',
      count: stats.audits,
    },
    {
      id: 'scans',
      title: 'Security Scans',
      description: 'Access your security vulnerability reports',
      icon: Shield,
      color: 'from-red-500 to-red-600',
      count: stats.scans,
    },
    {
      id: 'leads',
      title: 'Lead Reports',
      description: 'Explore business leads discovered for you',
      icon: Users,
      color: 'from-cyan-500 to-cyan-600',
      count: stats.leads,
    },
    {
      id: 'content',
      title: 'Content',
      description: 'View your content library',
      icon: FileText,
      color: 'from-green-500 to-green-600',
      count: stats.content,
    },
    {
      id: 'messages',
      title: 'Messages',
      description: 'Communicate with your C&L Strategy team',
      icon: MessageSquare,
      color: 'from-purple-500 to-purple-600',
      count: 0,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-blue-100">
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {clientInfo?.company_name || 'Client Portal'}
              </h1>
              <p className="text-sm text-gray-600">
                {clientInfo?.subscription_tier ? `${clientInfo.subscription_tier.charAt(0).toUpperCase() + clientInfo.subscription_tier.slice(1)} Plan` : ''}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onNavigate('notifications')}
                className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Bell className="w-6 h-6" />
                {stats.unreadNotifications > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                    {stats.unreadNotifications}
                  </span>
                )}
              </button>
              <Button onClick={signOut} variant="secondary" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back!
          </h2>
          <p className="text-gray-600">
            Here's an overview of your account and available resources
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="p-6 animate-pulse" glassEffect>
                <div className="h-32 bg-gray-200 rounded"></div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.id}
                  className="p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                  glassEffect
                  onClick={() => onNavigate(feature.id)}
                >
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.color} mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {feature.title}
                  </h3>

                  <p className="text-gray-600 mb-4 text-sm">
                    {feature.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900">
                      {feature.count}
                    </span>
                    <span className="text-sm text-gray-500">
                      {feature.count === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <Card className="mt-8 p-6" glassEffect>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
          <p className="text-gray-600 mb-4">
            Our team is here to support you. If you have any questions about your reports or need assistance, please don't hesitate to reach out.
          </p>
          <Button onClick={() => onNavigate('messages')}>
            <MessageSquare className="w-4 h-4 mr-2" />
            Contact Support
          </Button>
        </Card>

        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>Powered by C&L Strategy</p>
          <p className="mt-2">© 2025 C&L Strategy. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
