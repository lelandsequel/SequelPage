import { useState } from 'react';
import { PasswordGate } from './components/PasswordGate';
import { LandingPage } from './components/LandingPage';
import { SeoAudit } from './components/SeoAudit';
import { SecurityScanner } from './components/SecurityScanner';
import { ContentSuite } from './components/ContentSuite';
import { LeadGenerator } from './components/LeadGenerator';
import { AutomatedCampaigns } from './components/AutomatedCampaigns';
type Page = 'landing' | 'seo' | 'security' | 'content' | 'leads' | 'automated';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');

  const renderPage = () => {
    switch (currentPage) {
      case 'seo':
        return <SeoAudit onBack={() => setCurrentPage('landing')} />;
      case 'security':
        return <SecurityScanner onBack={() => setCurrentPage('landing')} />;
      case 'content':
        return <ContentSuite onBack={() => setCurrentPage('landing')} />;
      case 'leads':
        return <LeadGenerator onBack={() => setCurrentPage('landing')} />;
      case 'automated':
        return <AutomatedCampaigns onBack={() => setCurrentPage('landing')} />;
      default:
        return <LandingPage onNavigate={(page) => setCurrentPage(page as Page)} />;
    }
  };

  return (
    <PasswordGate>
      {renderPage()}
    </PasswordGate>
  );
}

export default App;
