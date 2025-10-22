import { useState, useEffect } from 'react';
import { ArrowLeft, Download, Copy, Check, Shield } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { TextArea } from './TextArea';
import { supabase } from '../lib/supabase';

interface SecurityScannerProps {
  onBack: () => void;
}

export function SecurityScanner({ onBack }: SecurityScannerProps) {
  const [url, setUrl] = useState('');
  const [htmlSource, setHtmlSource] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
  const [clients, setClients] = useState<Array<{ id: string; company_name: string }>>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('id, company_name')
      .order('company_name');

    if (data) {
      setClients(data);
    }
  };

  const handleScan = async () => {
    if (!url && !htmlSource) {
      setError('Please provide a URL or HTML source');
      return;
    }

    setIsScanning(true);
    setError('');
    setResult(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/comprehensive-security-audit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            url,
            htmlSource,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Security scan failed');
      }

      const data = await response.json();
      setResult(data);

      await supabase.from('security_scans').insert({
        url: url || 'HTML Source',
        html_source: htmlSource || null,
        risk_score: data.riskScore,
        vulnerabilities: data.vulnerabilities || [],
        fixes: data.fixes || [],
        strategic_report: data.strategicReport || {},
        client_id: selectedClientId || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Security scan failed');
    } finally {
      setIsScanning(false);
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
    a.download = 'security-scan.json';
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

  const getRiskColor = (score: number) => {
    if (score >= 75) return 'text-red-600';
    if (score >= 50) return 'text-orange-600';
    if (score >= 25) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-gray-50 to-red-100 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>

        <Card className="p-8 mb-8" glassEffect>
          <div className="flex items-start space-x-4 mb-6">
            <div className="p-3 bg-red-100 rounded-lg">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Security Scanner</h1>
              <p className="text-gray-600 mt-1">Comprehensive cybersecurity audit with CVE tracking</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign to Client (Optional)
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">No client (Admin only)</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.company_name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Select a client to share this security scan in their portal
              </p>
            </div>

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
              onClick={handleScan}
              isLoading={isScanning}
              className="w-full"
              size="lg"
              variant="danger"
            >
              {isScanning ? 'Scanning...' : 'Run Security Scan'}
            </Button>
          </div>
        </Card>

        {result && (
          <>
            <Card className="p-8 mb-8" glassEffect>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Security Report</h2>
                  <div className="mt-2 flex items-center space-x-4">
                    <div className={`text-4xl font-bold ${getRiskColor(result.riskScore)}`}>
                      {result.riskScore}/100
                    </div>
                    <div className="text-lg text-gray-600">Risk Score</div>
                  </div>
                </div>
                <Button variant="secondary" onClick={exportAsJson} size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  Export JSON
                </Button>
              </div>

              {result.realSecurityData && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Security Headers Analysis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-green-700 mb-2">Present Headers ({result.realSecurityData.securityHeaders.presentHeaders?.length || 0})</h4>
                      <ul className="space-y-1">
                        {result.realSecurityData.securityHeaders.presentHeaders?.map((header: string, idx: number) => (
                          <li key={idx} className="text-sm text-gray-700">✓ {header}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-red-700 mb-2">Missing Headers ({result.realSecurityData.securityHeaders.missingHeaders?.length || 0})</h4>
                      <ul className="space-y-1">
                        {result.realSecurityData.securityHeaders.missingHeaders?.map((header: any, idx: number) => (
                          <li key={idx} className="text-sm text-gray-700">✗ {header.header}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center space-x-2">
                    {result.realSecurityData.https ? (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">HTTPS Enabled ✓</span>
                    ) : (
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm font-medium">HTTPS Missing ✗</span>
                    )}
                  </div>
                  {result.realSecurityData.commonVulnerabilities && result.realSecurityData.commonVulnerabilities.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Common Vulnerabilities Detected</h4>
                      <div className="space-y-2">
                        {result.realSecurityData.commonVulnerabilities.map((vuln: any, idx: number) => (
                          <div key={idx} className="p-2 bg-white rounded border border-red-200">
                            <div className="flex justify-between items-start">
                              <span className="text-sm font-medium text-gray-900">{vuln.type}</span>
                              <span className={`px-2 py-0.5 text-xs rounded ${getSeverityColor(vuln.severity)}`}>
                                {vuln.severity}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{vuln.description}</p>
                            {vuln.cve && <span className="text-xs text-blue-600 mt-1 inline-block">{vuln.cve}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {result.vulnerabilities && result.vulnerabilities.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Vulnerabilities Detected</h3>
                  <div className="space-y-4">
                    {result.vulnerabilities.map((vuln: any, idx: number) => (
                      <div key={idx} className="p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{vuln.title}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded border ${getSeverityColor(vuln.severity)}`}>
                            {vuln.severity}
                          </span>
                        </div>
                        {vuln.cve && (
                          <p className="text-sm text-blue-600 font-mono mb-2">{vuln.cve}</p>
                        )}
                        <p className="text-gray-600 text-sm mb-2">{vuln.description}</p>
                        {vuln.riskImpact && (
                          <p className="text-sm text-red-600 font-medium">
                            Risk Impact: {vuln.riskImpact}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.fixes && result.fixes.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Remediation Steps</h3>
                  <div className="space-y-4">
                    {result.fixes.map((fix: any, idx: number) => (
                      <div key={idx} className="p-4 bg-white rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2">{fix.vulnerability}</h4>
                        {fix.codeFix && (
                          <div className="relative mb-3">
                            <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto border border-gray-200">
                              <code>{fix.codeFix}</code>
                            </pre>
                            <button
                              onClick={() => copyToClipboard(fix.codeFix, `fix-${idx}`)}
                              className="absolute top-2 right-2 p-1 bg-white rounded border border-gray-300 hover:bg-gray-50"
                            >
                              {copiedItems.has(`fix-${idx}`) ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-600" />
                              )}
                            </button>
                          </div>
                        )}
                        {fix.bestPractices && (
                          <p className="text-sm text-gray-600">{fix.bestPractices}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.strategicReport && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Strategic Report</h3>
                  <div className="p-6 bg-white rounded-lg border border-gray-200">
                    {result.strategicReport.executiveSummary && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Executive Summary</h4>
                        <p className="text-gray-600 text-sm">{result.strategicReport.executiveSummary}</p>
                      </div>
                    )}
                    {result.strategicReport.remediationRoadmap && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Remediation Roadmap</h4>
                        <p className="text-gray-600 text-sm">{result.strategicReport.remediationRoadmap}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
