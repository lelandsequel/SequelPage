import { useState, useEffect } from 'react';
import { ArrowLeft, Download, Users, TrendingUp, TrendingDown, CheckCircle, XCircle, AlertCircle, Link2, BarChart3, FileText, FileCode, Filter, Upload, Search, X } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { supabase } from '../lib/supabase';
import { downloadReport, downloadBulkReport } from '../utils/reportGenerator';

interface LeadGeneratorProps {
  onBack: () => void;
}

interface Lead {
  id?: string;
  business_name: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  tech_stack?: string[];
  core_web_vitals_lcp?: number;
  has_schema: boolean;
  has_faq: boolean;
  has_org: boolean;
  meta_title_ok: boolean;
  meta_desc_ok: boolean;
  content_fresh_months?: number;
  traffic_trend: string;
  domain_rank?: number;
  backlinks_count?: number;
  referring_domains?: number;
  organic_traffic?: number;
  issues: string[];
  score: number;
  notes?: string;
  source: string;
  status?: string;
  priority?: string;
  assigned_to?: string;
  created_at?: string;
}

export function LeadGenerator({ onBack }: LeadGeneratorProps) {
  const [geography, setGeography] = useState('');
  const [industry, setIndustry] = useState('');
  const [maxResults, setMaxResults] = useState('3');
  const [isSearching, setIsSearching] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [scoreFilter, setScoreFilter] = useState('all');
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [viewMode, setViewMode] = useState<'search' | 'saved'>('search');
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);

  useEffect(() => {
    applyFilters();
  }, [leads, searchQuery, statusFilter, priorityFilter, scoreFilter]);

  const loadSavedLeads = async () => {
    setIsLoadingSaved(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setLeads(data || []);
      setViewMode('saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load saved leads');
    } finally {
      setIsLoadingSaved(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...leads];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (lead) =>
          lead.business_name.toLowerCase().includes(query) ||
          lead.website?.toLowerCase().includes(query) ||
          lead.city?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((lead) => lead.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter((lead) => lead.priority === priorityFilter);
    }

    if (scoreFilter !== 'all') {
      if (scoreFilter === 'high') {
        filtered = filtered.filter((lead) => lead.score < 50);
      } else if (scoreFilter === 'medium') {
        filtered = filtered.filter((lead) => lead.score >= 50 && lead.score < 70);
      } else if (scoreFilter === 'low') {
        filtered = filtered.filter((lead) => lead.score >= 70);
      }
    }

    setFilteredLeads(filtered);
  };

  const handleSearch = async () => {
    if (!geography || !industry) {
      setError('Please provide both geography and industry');
      return;
    }

    setIsSearching(true);
    setError('');
    setLeads([]);
    setViewMode('search');

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/find-leads`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            geography,
            industry,
            maxResults: parseInt(maxResults),
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Lead search failed');
      }

      const data = await response.json();
      const leadsData = data.leads || [];

      setLeads(leadsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lead search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const updateLeadStatus = async (leadId: string, status: string) => {
    const { error: updateError } = await supabase
      .from('leads')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', leadId);

    if (!updateError) {
      await supabase.from('lead_status_history').insert({
        lead_id: leadId,
        status,
        changed_by: 'user',
      });

      setLeads((prev) =>
        prev.map((lead) => (lead.id === leadId ? { ...lead, status } : lead))
      );
    }
  };

  const updateLeadPriority = async (leadId: string, priority: string) => {
    const { error: updateError } = await supabase
      .from('leads')
      .update({ priority, updated_at: new Date().toISOString() })
      .eq('id', leadId);

    if (!updateError) {
      setLeads((prev) =>
        prev.map((lead) => (lead.id === leadId ? { ...lead, priority } : lead))
      );
    }
  };

  const handleBulkImport = async () => {
    if (!csvContent) {
      setError('Please paste CSV content');
      return;
    }

    try {
      const lines = csvContent.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const leadsToImport: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const lead: any = {
          business_name: values[headers.indexOf('businessname')] || values[headers.indexOf('business_name')],
          website: values[headers.indexOf('website')],
          email: values[headers.indexOf('email')],
          phone: values[headers.indexOf('phone')],
          city: values[headers.indexOf('city')],
          geography: geography || 'Imported',
          industry: industry || 'Imported',
          score: parseInt(values[headers.indexOf('score')] || '50'),
          traffic_trend: values[headers.indexOf('traffictrend')] || 'Unknown',
          has_schema: values[headers.indexOf('hasschema')]?.toLowerCase() === 'yes',
          has_faq: values[headers.indexOf('hasfaq')]?.toLowerCase() === 'yes',
          has_org: values[headers.indexOf('hasorg')]?.toLowerCase() === 'yes',
          meta_title_ok: values[headers.indexOf('metatitleok')]?.toLowerCase() === 'yes',
          meta_desc_ok: values[headers.indexOf('metadescok')]?.toLowerCase() === 'yes',
          issues: [],
          source: 'CSV Import',
          status: 'new',
          priority: 'medium',
        };

        if (lead.business_name) {
          leadsToImport.push(lead);
        }
      }

      const { error: insertError } = await supabase.from('leads').insert(leadsToImport);

      if (insertError) throw insertError;

      setShowBulkImport(false);
      setCsvContent('');
      loadSavedLeads();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    }
  };

  const exportToCsv = () => {
    const headers = [
      'RunDate',
      'Geo',
      'Industry',
      'BusinessName',
      'Website',
      'Email',
      'Phone',
      'City',
      'TechStack',
      'CoreWebVitals_LCP',
      'HasSchema',
      'HasFAQ',
      'HasOrg',
      'MetaTitleOK',
      'MetaDescOK',
      'ContentFreshMonths',
      'TrafficTrend_90d',
      'Issues',
      'Score',
      'Status',
      'Priority',
      'Notes',
      'Source'
    ];

    const rows = filteredLeads.map(lead => [
      new Date().toISOString().split('T')[0],
      geography,
      industry,
      lead.business_name,
      lead.website || '',
      lead.email || '',
      lead.phone || '',
      lead.city || '',
      (lead.tech_stack || []).join('; '),
      lead.core_web_vitals_lcp || '',
      lead.has_schema ? 'Yes' : 'No',
      lead.has_faq ? 'Yes' : 'No',
      lead.has_org ? 'Yes' : 'No',
      lead.meta_title_ok ? 'Yes' : 'No',
      lead.meta_desc_ok ? 'Yes' : 'No',
      lead.content_fresh_months || '',
      lead.traffic_trend,
      lead.issues.join('; '),
      lead.score,
      lead.status || 'new',
      lead.priority || 'medium',
      lead.notes || '',
      lead.source,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${geography.replace(/[^a-z0-9]/gi, '_')}-${industry.replace(/[^a-z0-9]/gi, '_')}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
    return 'Poor';
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'converted': return 'bg-purple-100 text-purple-800';
      case 'lost': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const displayLeads = filteredLeads.length > 0 ? filteredLeads : leads;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-green-100 py-8 px-4">
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
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">SEO Lead Finder</h1>
                <p className="text-gray-600 mt-1">Hybrid Deep Research + Agentic Search with comprehensive SEO analysis</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setShowBulkImport(true)} size="sm">
                <Upload className="w-4 h-4 mr-1" />
                Import CSV
              </Button>
              <Button variant="secondary" onClick={loadSavedLeads} isLoading={isLoadingSaved} size="sm">
                <Users className="w-4 h-4 mr-1" />
                View Saved
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Input
              label="Geography"
              placeholder="e.g., Houston, TX"
              value={geography}
              onChange={(e) => setGeography(e.target.value)}
            />
            <Input
              label="Industry"
              placeholder="e.g., landscaping"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />
            <Input
              label="Max Results"
              type="number"
              placeholder="3"
              value={maxResults}
              onChange={(e) => setMaxResults(e.target.value)}
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-4">
              {error}
            </div>
          )}

          <Button
            onClick={handleSearch}
            isLoading={isSearching}
            className="w-full"
            size="lg"
          >
            {isSearching ? 'Analyzing Leads...' : 'Find Leads'}
          </Button>
        </Card>

        {showBulkImport && (
          <Card className="p-8 mb-8" glassEffect>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Bulk Import from CSV</h2>
              <button onClick={() => setShowBulkImport(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Paste CSV content with headers: BusinessName, Website, Email, Phone, City, Score, TrafficTrend, HasSchema, HasFAQ, HasOrg, MetaTitleOK, MetaDescOK
            </p>
            <textarea
              className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm"
              placeholder="Paste CSV content here..."
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
            />
            <div className="flex gap-2 mt-4">
              <Button onClick={handleBulkImport}>Import Leads</Button>
              <Button variant="secondary" onClick={() => setShowBulkImport(false)}>Cancel</Button>
            </div>
          </Card>
        )}

        {displayLeads.length > 0 && (
          <>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {viewMode === 'saved' ? 'Saved Leads' : 'Found'} {displayLeads.length} Lead{displayLeads.length !== 1 ? 's' : ''}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {viewMode === 'saved' ? 'All saved leads from database' : 'Sorted by SEO opportunity score (lowest = best opportunity)'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setShowFilters(!showFilters)} size="sm">
                  <Filter className="w-4 h-4 mr-1" />
                  Filters
                </Button>
                <Button variant="secondary" onClick={exportToCsv} size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  Export CSV
                </Button>
                <Button variant="secondary" onClick={() => downloadBulkReport(displayLeads, geography, industry, 'html')} size="sm">
                  <FileCode className="w-4 h-4 mr-1" />
                  Bulk HTML
                </Button>
                <Button variant="secondary" onClick={() => downloadBulkReport(displayLeads, geography, industry, 'txt')} size="sm">
                  <FileText className="w-4 h-4 mr-1" />
                  Bulk TXT
                </Button>
              </div>
            </div>

            {showFilters && (
              <Card className="p-6 mb-6" glassEffect>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Search leads..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="converted">Converted</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                    >
                      <option value="all">All Priorities</option>
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Score Range</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={scoreFilter}
                      onChange={(e) => setScoreFilter(e.target.value)}
                    >
                      <option value="all">All Scores</option>
                      <option value="high">High Opportunity (0-49)</option>
                      <option value="medium">Medium Opportunity (50-69)</option>
                      <option value="low">Low Opportunity (70+)</option>
                    </select>
                  </div>
                </div>
              </Card>
            )}

            <div className="grid grid-cols-1 gap-6">
              {displayLeads.map((lead, idx) => (
                <Card key={lead.id || idx} className="p-6" glassEffect>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{lead.business_name}</h3>
                        <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded">
                          {lead.source}
                        </span>
                        {lead.status && (
                          <span className={`text-xs px-2 py-1 rounded font-medium ${getStatusColor(lead.status)}`}>
                            {lead.status}
                          </span>
                        )}
                        {lead.priority && (
                          <span className={`text-xs px-2 py-1 rounded font-medium ${getPriorityColor(lead.priority)}`}>
                            {lead.priority}
                          </span>
                        )}
                      </div>
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
                    </div>
                    <div className="text-center">
                      <div className={`px-4 py-2 rounded-lg font-bold text-3xl ${getScoreColor(lead.score)}`}>
                        {lead.score}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">{getScoreLabel(lead.score)}</div>
                    </div>
                  </div>

                  {lead.id && (
                    <div className="flex gap-2 mb-4">
                      <select
                        className="text-xs px-3 py-1 border border-gray-300 rounded"
                        value={lead.status || 'new'}
                        onChange={(e) => updateLeadStatus(lead.id!, e.target.value)}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                        <option value="converted">Converted</option>
                        <option value="lost">Lost</option>
                      </select>
                      <select
                        className="text-xs px-3 py-1 border border-gray-300 rounded"
                        value={lead.priority || 'medium'}
                        onChange={(e) => updateLeadPriority(lead.id!, e.target.value)}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  )}

                  {lead.notes && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-900 font-medium">{lead.notes}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
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
                    {lead.email && (
                      <div>
                        <span className="text-gray-600 font-medium">Email:</span>{' '}
                        <span className="text-gray-900">{lead.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Technical SEO Analysis
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
                        <span className="text-sm">Meta Desc</span>
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

                      {lead.organic_traffic !== undefined && lead.organic_traffic > 0 && (
                        <div className="flex items-center space-x-2">
                          <BarChart3 className="w-4 h-4 text-blue-600" />
                          <span className="text-sm">Est. Traffic Value: ${lead.organic_traffic.toLocaleString()}/mo</span>
                        </div>
                      )}

                      {lead.backlinks_count !== undefined && lead.backlinks_count > 0 && (
                        <div className="flex items-center space-x-2">
                          <Link2 className="w-4 h-4 text-purple-600" />
                          <span className="text-sm">{lead.backlinks_count.toLocaleString()} backlinks from {lead.referring_domains?.toLocaleString() || 0} domains</span>
                        </div>
                      )}

                      {lead.core_web_vitals_lcp && (
                        <div className="flex items-center space-x-2">
                          {lead.core_web_vitals_lcp <= 2500 ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                          <span className="text-sm">LCP: {(lead.core_web_vitals_lcp / 1000).toFixed(1)}s</span>
                        </div>
                      )}
                      {lead.content_fresh_months !== undefined && (
                        <div className="flex items-center space-x-2">
                          {lead.content_fresh_months <= 6 ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                          <span className="text-sm">Content: {lead.content_fresh_months}mo old</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {lead.tech_stack && lead.tech_stack.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm">Tech Stack:</h4>
                      <div className="flex flex-wrap gap-2">
                        {lead.tech_stack.map((tech, techIdx) => (
                          <span
                            key={techIdx}
                            className="px-2 py-1 bg-gray-200 text-gray-800 text-xs font-medium rounded"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {lead.issues.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm">SEO Issues & Opportunities:</h4>
                      <div className="flex flex-wrap gap-2">
                        {lead.issues.map((issue, issueIdx) => (
                          <span
                            key={issueIdx}
                            className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full"
                          >
                            {issue}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex gap-3">
                      <Button
                        onClick={() => downloadReport(lead, 'html')}
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                      >
                        <FileCode className="w-4 h-4 mr-2" />
                        Export HTML Report
                      </Button>
                      <Button
                        onClick={() => downloadReport(lead, 'txt')}
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Export TXT Report
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
