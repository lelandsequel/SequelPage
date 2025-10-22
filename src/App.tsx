import { useState } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { Login } from './components/Login';
import { LandingPage } from './components/LandingPage';
import { SeoAudit } from './components/SeoAudit';
import { SecurityScanner } from './components/SecurityScanner';
import { ContentSuite } from './components/ContentSuite';
import { LeadGenerator } from './components/LeadGenerator';
import { AutomatedCampaigns } from './components/AutomatedCampaigns';
import { ClientDashboard } from './components/ClientDashboard';
import { ClientAuditsView } from './components/ClientAuditsView';
import { ClientLeadsView } from './components/ClientLeadsView';
import { AdminClientManager } from './components/AdminClientManager';
import { AdminClientPortalView } from './components/AdminClientPortalView';

type AdminPage = 'landing' | 'seo' | 'security' | 'content' | 'leads' | 'automated' | 'clients' | 'client-portal';
type ClientPage = 'dashboard' | 'audits' | 'scans' | 'leads' | 'content' | 'messages' | 'notifications';

function AppContent() {
  const { user, userRole, isLoading } = useAuth();
  const [adminPage, setAdminPage] = useState<AdminPage>('landing');
  const [clientPage, setClientPage] = useState<ClientPage>('dashboard');
  const [viewingClientId, setViewingClientId] = useState<string>('');
  const [viewingClientName, setViewingClientName] = useState<string>('');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (userRole === 'admin') {
    const renderAdminPage = () => {
      switch (adminPage) {
        case 'seo':
          return <SeoAudit onBack={() => setAdminPage('landing')} />;
        case 'security':
          return <SecurityScanner onBack={() => setAdminPage('landing')} />;
        case 'content':
          return <ContentSuite onBack={() => setAdminPage('landing')} />;
        case 'leads':
          return <LeadGenerator onBack={() => setAdminPage('landing')} />;
        case 'automated':
          return <AutomatedCampaigns onBack={() => setAdminPage('landing')} />;
        case 'clients':
          return (
            <AdminClientManager
              onBack={() => setAdminPage('landing')}
              onViewClientPortal={(clientId, clientName) => {
                setViewingClientId(clientId);
                setViewingClientName(clientName);
                setAdminPage('client-portal');
              }}
            />
          );
        case 'client-portal':
          return (
            <AdminClientPortalView
              clientId={viewingClientId}
              clientName={viewingClientName}
              onBack={() => setAdminPage('clients')}
            />
          );
        default:
          return <LandingPage onNavigate={(page) => setAdminPage(page as AdminPage)} />;
      }
    };

    return renderAdminPage();
  }

  if (userRole === 'client') {
    const renderClientPage = () => {
      switch (clientPage) {
        case 'audits':
          return <ClientAuditsView onBack={() => setClientPage('dashboard')} />;
        case 'leads':
          return <ClientLeadsView onBack={() => setClientPage('dashboard')} />;
        case 'scans':
        case 'content':
        case 'messages':
        case 'notifications':
          return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-blue-100 flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-600 text-lg mb-4">Coming Soon</p>
                <button
                  onClick={() => setClientPage('dashboard')}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          );
        default:
          return <ClientDashboard onNavigate={(page) => setClientPage(page as ClientPage)} />;
      }
    };

    return renderClientPage();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-blue-100 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600 text-lg mb-4">
          Your account is not properly configured
        </p>
        <p className="text-gray-500 text-sm">
          Please contact your administrator
        </p>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
