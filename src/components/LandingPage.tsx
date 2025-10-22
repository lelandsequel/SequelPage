import { Search, Shield, FileText, Users, Calendar, Settings, LogOut } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { useAuth } from '../lib/auth';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const { signOut } = useAuth();

  const tools = [
    {
      id: 'seo',
      title: 'SEO/AEO Audit',
      description: 'Comprehensive website analysis with actionable SEO and Answer Engine Optimization recommendations.',
      icon: Search,
      color: 'from-blue-500 to-blue-600',
      features: ['0-100 Scoring', 'Code Snippets', 'Priority Rankings', 'Export Results'],
    },
    {
      id: 'security',
      title: 'Security Scanner',
      description: 'In-depth cybersecurity audit with CVE tracking and remediation strategies.',
      icon: Shield,
      color: 'from-red-500 to-red-600',
      features: ['Vulnerability Detection', 'Risk Assessment', 'Copy-Paste Fixes', 'Strategic Reports'],
    },
    {
      id: 'content',
      title: 'Content Suite',
      description: 'AI-powered content generation for keywords, press releases, and SEO articles.',
      icon: FileText,
      color: 'from-green-500 to-green-600',
      features: ['Keyword Research', 'Press Releases', 'SEO Articles', 'Multiple Formats'],
    },
    {
      id: 'leads',
      title: 'Lead Generator',
      description: 'Discover and score high-quality business leads with detailed opportunity reports.',
      icon: Users,
      color: 'from-cyan-500 to-cyan-600',
      features: ['Lead Discovery', 'SEO Scoring', 'Opportunity Reports', 'CSV Export'],
    },
    {
      id: 'automated',
      title: 'Automated Discovery',
      description: 'Automated weekly lead generation with industry analysis and email delivery.',
      icon: Calendar,
      color: 'from-amber-500 to-amber-600',
      features: ['Auto Industry ID', 'Weekly Reports', 'Email Delivery', 'Campaign Management'],
    },
    {
      id: 'clients',
      title: 'Client Management',
      description: 'Manage client accounts, assign reports, and control access permissions.',
      icon: Settings,
      color: 'from-purple-500 to-purple-600',
      features: ['Add Clients', 'Manage Users', 'Assign Reports', 'Access Control'],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-blue-100">
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">CandlPage Admin</h1>
            <Button onClick={signOut} variant="secondary" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Admin Dashboard
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Professional Audit & Content Generation Suite for C&L Strategy Clients
          </p>
          <div className="mt-4 inline-flex items-center space-x-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>All systems operational</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Card
                key={tool.id}
                className="p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                glassEffect
              >
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${tool.color} mb-6`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  {tool.title}
                </h2>

                <p className="text-gray-600 mb-6 leading-relaxed">
                  {tool.description}
                </p>

                <div className="space-y-2">
                  {tool.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center text-sm text-gray-700">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => onNavigate(tool.id)}
                  className="mt-6 w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors"
                >
                  Launch Tool
                </button>
              </Card>
            );
          })}
        </div>

        <footer className="mt-16 text-center text-sm text-gray-500">
          <p>Powered by Haiku 4.5 & GPT-5</p>
          <p className="mt-2">© 2025 C&L Strategy. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
