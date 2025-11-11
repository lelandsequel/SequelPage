import { useState, useEffect } from 'react';
import { ArrowLeft, Play, Pause, Calendar, Mail, TrendingUp, Users, Clock, Check, X, Loader, RefreshCw } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { supabase } from '../lib/supabase';

interface AutomatedCampaignsProps {
  onBack: () => void;
}

interface Campaign {
  id: string;
  name: string;
  geography: string;
  status: string;
  schedule: string;
  next_run: string;
  last_run: string;
  industries_to_search: number;
  leads_per_industry: number;
  email_recipients: string[];
  created_at: string;
}

interface CampaignRun {
  id: string;
  campaign_id: string;
  geography: string;
  industries_found: any[];
  total_leads_found: number;
  status: string;
  started_at: string;
  completed_at: string;
}

export function AutomatedCampaigns({ onBack }: AutomatedCampaignsProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [recentRuns, setRecentRuns] = useState<CampaignRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    geography: '',
    schedule: 'weekly',
    industries_to_search: 3,
    leads_per_industry: 10,
    email_recipients: 'tj@infinitydigitalsolution.com, leland@candlstrategy.com, lorenzo@infinitydigitalsolution.com, korbin@infinitydigitalsolution.com',
  });

  useEffect(() => {
    loadCampaigns();
    loadRecentRuns();
  }, []);

  const loadCampaigns = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('automated_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setCampaigns(data);
    setIsLoading(false);
  };

  const loadRecentRuns = async () => {
    const { data } = await supabase
      .from('campaign_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) setRecentRuns(data);
  };

  const createCampaign = async () => {
    const emailArray = newCampaign.email_recipients
      .split(',')
      .map(e => e.trim())
      .filter(e => e.length > 0);

    const { error } = await supabase.from('automated_campaigns').insert({
      name: newCampaign.name,
      geography: newCampaign.geography,
      schedule: newCampaign.schedule,
      industries_to_search: newCampaign.industries_to_search,
      leads_per_industry: newCampaign.leads_per_industry,
      email_recipients: emailArray,
      status: 'active',
      next_run: new Date(Date.now() + 604800000).toISOString(),
    });

    if (!error) {
      setShowNewCampaign(false);
      setNewCampaign({
        name: '',
        geography: '',
        schedule: 'weekly',
        industries_to_search: 3,
        leads_per_industry: 10,
        email_recipients: 'tj@infinitydigitalsolution.com, leland@candlstrategy.com, lorenzo@infinitydigitalsolution.com, korbin@infinitydigitalsolution.com',
      });
      loadCampaigns();
    }
  };

  const toggleCampaignStatus = async (campaignId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    await supabase
      .from('automated_campaigns')
      .update({ status: newStatus })
      .eq('id', campaignId);

    loadCampaigns();
  };

  const runManualDiscovery = async (geography: string) => {
    setIsRunning(true);

    const pollInterval = setInterval(() => {
      loadRecentRuns();
    }, 3000);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/automated-lead-discovery`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            geography,
            manualRun: true,
          }),
        }
      );

      if (response.ok) {
        await loadRecentRuns();
      }
    } catch (error) {
      console.error('Manual run error:', error);
    } finally {
      clearInterval(pollInterval);
      setIsRunning(false);
      await loadRecentRuns();
    }
  };

  const runCampaignNow = async (campaignId: string, geography: string) => {
    setIsRunning(true);

    const pollInterval = setInterval(() => {
      loadRecentRuns();
    }, 3000);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/automated-lead-discovery`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            geography,
            campaignId,
            manualRun: true,
          }),
        }
      );

      if (response.ok) {
        await loadRecentRuns();
        await loadCampaigns();
      }
    } catch (error) {
      console.error('Campaign run error:', error);
    } finally {
      clearInterval(pollInterval);
      setIsRunning(false);
      await loadRecentRuns();
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadRecentRuns();
    await loadCampaigns();
    setIsRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'running': return 'bg-purple-100 text-purple-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-gray-50 to-blue-100 py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>

        <Card className="p-8 mb-8" glassEffect>
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Automated Lead Discovery</h1>
                <p className="text-gray-600 mt-1">Configure and manage automated weekly lead generation campaigns</p>
              </div>
            </div>
            <Button onClick={() => setShowNewCampaign(true)}>
              <Calendar className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">Active Campaigns</span>
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-blue-900">
                {campaigns.filter(c => c.status === 'active').length}
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-900">Recent Runs</span>
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-900">
                {recentRuns.filter(r => r.status === 'completed').length}
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-900">Total Leads Found</span>
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-purple-900">
                {recentRuns.reduce((sum, r) => sum + (r.total_leads_found || 0), 0)}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Discovery</h3>
            <div className="flex gap-3">
              <Input
                placeholder="Enter geography (e.g., Houston, TX)"
                className="flex-1"
                id="quick-geography"
              />
              <Button
                onClick={() => {
                  const input = document.getElementById('quick-geography') as HTMLInputElement;
                  if (input?.value) runManualDiscovery(input.value);
                }}
                isLoading={isRunning}
              >
                <Play className="w-4 h-4 mr-2" />
                Run Now
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Instantly discovers top 3 industries and 10 leads per industry
            </p>
          </div>
        </Card>

        {showNewCampaign && (
          <Card className="p-8 mb-8" glassEffect>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create New Campaign</h2>
              <button onClick={() => setShowNewCampaign(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <Input
                label="Campaign Name"
                placeholder="e.g., Weekly Texas Lead Discovery"
                value={newCampaign.name}
                onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
              />
              <Input
                label="Geography"
                placeholder="e.g., Houston, TX or Texas or United States"
                value={newCampaign.geography}
                onChange={(e) => setNewCampaign({ ...newCampaign, geography: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Schedule</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    value={newCampaign.schedule}
                    onChange={(e) => setNewCampaign({ ...newCampaign, schedule: e.target.value })}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <Input
                  label="Industries to Search"
                  type="number"
                  value={newCampaign.industries_to_search.toString()}
                  onChange={(e) => setNewCampaign({ ...newCampaign, industries_to_search: parseInt(e.target.value) })}
                />
              </div>
              <Input
                label="Leads per Industry"
                type="number"
                value={newCampaign.leads_per_industry.toString()}
                onChange={(e) => setNewCampaign({ ...newCampaign, leads_per_industry: parseInt(e.target.value) })}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Recipients (comma-separated)</label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  rows={3}
                  value={newCampaign.email_recipients}
                  onChange={(e) => setNewCampaign({ ...newCampaign, email_recipients: e.target.value })}
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={createCampaign} className="flex-1">
                  Create Campaign
                </Button>
                <Button variant="secondary" onClick={() => setShowNewCampaign(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Active Campaigns</h2>
          {isLoading ? (
            <Card className="p-8 text-center" glassEffect>
              <Loader className="w-8 h-8 animate-spin mx-auto text-purple-600" />
            </Card>
          ) : campaigns.length === 0 ? (
            <Card className="p-8 text-center" glassEffect>
              <p className="text-gray-600">No campaigns yet. Create one to get started!</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <Card key={campaign.id} className="p-6" glassEffect>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{campaign.name}</h3>
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{campaign.geography}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => toggleCampaignStatus(campaign.id, campaign.status)}
                      >
                        {campaign.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => runCampaignNow(campaign.id, campaign.geography)}
                        isLoading={isRunning}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Run Now
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <span className="text-xs text-gray-600">Schedule</span>
                      <p className="font-medium text-gray-900 capitalize">{campaign.schedule}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-600">Industries</span>
                      <p className="font-medium text-gray-900">{campaign.industries_to_search}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-600">Leads per Industry</span>
                      <p className="font-medium text-gray-900">{campaign.leads_per_industry}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-600">Recipients</span>
                      <p className="font-medium text-gray-900">{campaign.email_recipients?.length || 0}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 text-sm">
                    {campaign.last_run && (
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          Last run: {new Date(campaign.last_run).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {campaign.next_run && campaign.status === 'active' && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          Next run: {new Date(campaign.next_run).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {campaign.email_recipients && campaign.email_recipients.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          {campaign.email_recipients.length} recipient{campaign.email_recipients.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Recent Runs</h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              isLoading={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          {recentRuns.length === 0 ? (
            <Card className="p-8 text-center" glassEffect>
              <p className="text-gray-600">No campaign runs yet.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {recentRuns.map((run) => (
                <Card key={run.id} className="p-6" glassEffect>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{run.geography}</h3>
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(run.status)}`}>
                          {run.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{new Date(run.started_at).toLocaleString()}</span>
                        {run.total_leads_found > 0 && (
                          <span className="font-medium text-purple-600">{run.total_leads_found} leads found</span>
                        )}
                      </div>
                    </div>
                    <div>
                      {run.status === 'completed' ? (
                        <Check className="w-6 h-6 text-green-600" />
                      ) : run.status === 'failed' ? (
                        <X className="w-6 h-6 text-red-600" />
                      ) : run.status === 'running' ? (
                        <Loader className="w-6 h-6 animate-spin text-purple-600" />
                      ) : null}
                    </div>
                  </div>
                  {run.industries_found && run.industries_found.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Industries Analyzed</h4>
                      <div className="flex flex-wrap gap-2">
                        {run.industries_found.map((ind: any, idx: number) => (
                          <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                            {ind.industry}
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
    </div>
  );
}
