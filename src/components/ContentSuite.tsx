import { useState } from 'react';
import { ArrowLeft, Copy, Check, FileText } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { TextArea } from './TextArea';
import { supabase } from '../lib/supabase';

interface ContentSuiteProps {
  onBack: () => void;
}

type ContentType = 'keywords' | 'press_release' | 'article';

export function ContentSuite({ onBack }: ContentSuiteProps) {
  const [activeTab, setActiveTab] = useState<ContentType>('keywords');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const [keywordParams, setKeywordParams] = useState({
    industry: '',
    geography: '',
    target: '',
  });

  const [pressReleaseParams, setPressReleaseParams] = useState({
    company: '',
    announcement: '',
    style: 'Professional',
    additionalInfo: '',
  });

  const [articleParams, setArticleParams] = useState({
    topic: '',
    keywords: '',
    tone: 'Professional',
    length: '1500',
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    setResult('');

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      let params;
      if (activeTab === 'keywords') {
        if (!keywordParams.industry) {
          setError('Industry is required');
          setIsGenerating(false);
          return;
        }
        params = keywordParams;
      } else if (activeTab === 'press_release') {
        if (!pressReleaseParams.company || !pressReleaseParams.announcement) {
          setError('Company and announcement are required');
          setIsGenerating(false);
          return;
        }
        params = pressReleaseParams;
      } else {
        if (!articleParams.topic) {
          setError('Topic is required');
          setIsGenerating(false);
          return;
        }
        params = articleParams;
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/generate-content`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            type: activeTab,
            params,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Content generation failed');
      }

      const data = await response.json();
      setResult(data.content);

      await supabase.from('generated_content').insert({
        content_type: activeTab,
        input_params: params,
        output_content: data.content,
        metadata: { wordCount: data.content.split(/\\s+/).length },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { id: 'keywords', label: 'Keywords' },
    { id: 'press_release', label: 'Press Release' },
    { id: 'article', label: 'Article' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-gray-50 to-green-100 py-8 px-4">
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
            <div className="p-3 bg-green-100 rounded-lg">
              <FileText className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Content Generation Suite</h1>
              <p className="text-gray-600 mt-1">AI-powered content for SEO and marketing</p>
            </div>
          </div>

          <div className="flex space-x-2 mb-6 border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ContentType)}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {activeTab === 'keywords' && (
              <>
                <Input
                  label="Industry"
                  placeholder="e.g., landscaping, dental, real estate"
                  value={keywordParams.industry}
                  onChange={(e) => setKeywordParams({ ...keywordParams, industry: e.target.value })}
                />
                <Input
                  label="Geography (Optional)"
                  placeholder="e.g., Miami, FL or Global"
                  value={keywordParams.geography}
                  onChange={(e) => setKeywordParams({ ...keywordParams, geography: e.target.value })}
                />
                <Input
                  label="Target (Optional)"
                  placeholder="e.g., residential, commercial"
                  value={keywordParams.target}
                  onChange={(e) => setKeywordParams({ ...keywordParams, target: e.target.value })}
                />
              </>
            )}

            {activeTab === 'press_release' && (
              <>
                <Input
                  label="Company Name"
                  placeholder="Your company name"
                  value={pressReleaseParams.company}
                  onChange={(e) => setPressReleaseParams({ ...pressReleaseParams, company: e.target.value })}
                />
                <TextArea
                  label="Announcement"
                  placeholder="What is being announced?"
                  rows={3}
                  value={pressReleaseParams.announcement}
                  onChange={(e) => setPressReleaseParams({ ...pressReleaseParams, announcement: e.target.value })}
                />
                <Input
                  label="Style"
                  placeholder="e.g., Professional, Casual, Formal"
                  value={pressReleaseParams.style}
                  onChange={(e) => setPressReleaseParams({ ...pressReleaseParams, style: e.target.value })}
                />
                <TextArea
                  label="Additional Information (Optional)"
                  placeholder="Any other details to include"
                  rows={2}
                  value={pressReleaseParams.additionalInfo}
                  onChange={(e) => setPressReleaseParams({ ...pressReleaseParams, additionalInfo: e.target.value })}
                />
              </>
            )}

            {activeTab === 'article' && (
              <>
                <Input
                  label="Topic"
                  placeholder="Article topic or title"
                  value={articleParams.topic}
                  onChange={(e) => setArticleParams({ ...articleParams, topic: e.target.value })}
                />
                <Input
                  label="Target Keywords (Optional)"
                  placeholder="comma, separated, keywords"
                  value={articleParams.keywords}
                  onChange={(e) => setArticleParams({ ...articleParams, keywords: e.target.value })}
                />
                <Input
                  label="Tone"
                  placeholder="e.g., Professional, Conversational, Technical"
                  value={articleParams.tone}
                  onChange={(e) => setArticleParams({ ...articleParams, tone: e.target.value })}
                />
                <Input
                  label="Word Count"
                  type="number"
                  placeholder="1500"
                  value={articleParams.length}
                  onChange={(e) => setArticleParams({ ...articleParams, length: e.target.value })}
                />
              </>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            <Button
              onClick={handleGenerate}
              isLoading={isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? 'Generating...' : 'Generate Content'}
            </Button>
          </div>
        </Card>

        {result && (
          <Card className="p-8" glassEffect>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Generated Content</h2>
              <Button variant="secondary" onClick={copyToClipboard} size="sm">
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                {result}
              </pre>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
