import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit, Users, Mail, Phone, Globe, X, Key, Eye } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { supabase } from '../lib/supabase';

interface AdminClientManagerProps {
  onBack: () => void;
  onViewClientPortal?: (clientId: string, clientName: string) => void;
}

interface Client {
  id: string;
  company_name: string;
  industry?: string;
  website?: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  subscription_tier: string;
  subscription_status: string;
  created_at: string;
}

export function AdminClientManager({ onBack, onViewClientPortal }: AdminClientManagerProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddClient, setShowAddClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [createUserClientId, setCreateUserClientId] = useState<string | null>(null);
  const [userCreationStatus, setUserCreationStatus] = useState('');
  const [formData, setFormData] = useState({
    company_name: '',
    industry: '',
    website: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    subscription_tier: 'professional',
    subscription_status: 'active',
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && !error) {
      setClients(data);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedClient) {
      const { error } = await supabase
        .from('clients')
        .update(formData)
        .eq('id', selectedClient.id);

      if (!error) {
        setSelectedClient(null);
        resetForm();
        loadClients();
      }
    } else {
      const { error } = await supabase
        .from('clients')
        .insert([formData]);

      if (!error) {
        setShowAddClient(false);
        resetForm();
        loadClients();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      company_name: '',
      industry: '',
      website: '',
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      subscription_tier: 'professional',
      subscription_status: 'active',
    });
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setFormData({
      company_name: client.company_name,
      industry: client.industry || '',
      website: client.website || '',
      contact_name: client.contact_name,
      contact_email: client.contact_email,
      contact_phone: client.contact_phone || '',
      subscription_tier: client.subscription_tier,
      subscription_status: client.subscription_status,
    });
    setShowAddClient(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      case 'professional': return 'bg-blue-100 text-blue-800';
      case 'starter': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateUser = (client: Client) => {
    setCreateUserClientId(client.id);
    setUserEmail(client.contact_email);
    setUserPassword('');
    setUserCreationStatus('');
    setShowCreateUser(true);
  };

  const submitCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserCreationStatus('Creating...');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-client-user`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          password: userPassword,
          clientId: createUserClientId,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Failed to create user');
      }

      setUserCreationStatus('User created successfully!');
      setTimeout(() => {
        setShowCreateUser(false);
        setUserEmail('');
        setUserPassword('');
        setCreateUserClientId(null);
        setUserCreationStatus('');
      }, 2000);
    } catch (err) {
      setUserCreationStatus(`Error: ${err instanceof Error ? err.message : 'Failed to create user'}`);
    }
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
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Client Management</h1>
                <p className="text-gray-600">
                  Manage client accounts and access permissions
                </p>
              </div>
            </div>
            <Button onClick={() => { setShowAddClient(true); setSelectedClient(null); resetForm(); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </div>
        </Card>

        {showAddClient && (
          <Card className="p-8 mb-8" glassEffect>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedClient ? 'Edit Client' : 'Add New Client'}
              </h2>
              <button
                onClick={() => { setShowAddClient(false); setSelectedClient(null); resetForm(); }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Company Name"
                  placeholder="Acme Corporation"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  required
                />
                <Input
                  label="Industry"
                  placeholder="Technology, Healthcare, etc."
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                />
                <Input
                  label="Website"
                  type="url"
                  placeholder="https://example.com"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
                <Input
                  label="Contact Name"
                  placeholder="John Doe"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  required
                />
                <Input
                  label="Contact Email"
                  type="email"
                  placeholder="contact@example.com"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  required
                />
                <Input
                  label="Contact Phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subscription Tier
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.subscription_tier}
                    onChange={(e) => setFormData({ ...formData, subscription_tier: e.target.value })}
                  >
                    <option value="starter">Starter</option>
                    <option value="professional">Professional</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.subscription_status}
                    onChange={(e) => setFormData({ ...formData, subscription_status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  {selectedClient ? 'Update Client' : 'Create Client'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => { setShowAddClient(false); setSelectedClient(null); resetForm(); }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-6 animate-pulse" glassEffect>
                <div className="h-24 bg-gray-200 rounded"></div>
              </Card>
            ))}
          </div>
        ) : clients.length === 0 ? (
          <Card className="p-12 text-center" glassEffect>
            <p className="text-gray-600 text-lg">No clients yet</p>
            <p className="text-gray-500 text-sm mt-2">
              Click "Add Client" to create your first client account
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {clients.map((client) => (
              <Card key={client.id} className="p-6" glassEffect>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {client.company_name}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded font-medium ${getTierColor(client.subscription_tier)}`}>
                        {client.subscription_tier.charAt(0).toUpperCase() + client.subscription_tier.slice(1)}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded font-medium ${getStatusColor(client.subscription_status)}`}>
                        {client.subscription_status.charAt(0).toUpperCase() + client.subscription_status.slice(1)}
                      </span>
                    </div>

                    {client.industry && (
                      <p className="text-sm text-gray-600 mb-3">
                        Industry: {client.industry}
                      </p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{client.contact_name}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{client.contact_email}</span>
                      </div>
                      {client.contact_phone && (
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{client.contact_phone}</span>
                        </div>
                      )}
                      {client.website && (
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Globe className="w-4 h-4" />
                          <a
                            href={client.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {client.website}
                          </a>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 mt-3">
                      Created: {new Date(client.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onViewClientPortal?.(client.id, client.company_name)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Portal
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleCreateUser(client)}
                    >
                      <Key className="w-4 h-4 mr-2" />
                      Create User
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEdit(client)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {showCreateUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="p-8 max-w-md w-full mx-4" glassEffect>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create Client User</h2>
                <button
                  onClick={() => setShowCreateUser(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={submitCreateUser} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="client@example.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  required
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="Enter password (min 6 characters)"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  required
                />

                {userCreationStatus && (
                  <div className={`p-4 rounded-lg text-sm ${
                    userCreationStatus.includes('Error')
                      ? 'bg-red-50 border border-red-200 text-red-700'
                      : userCreationStatus.includes('successfully')
                      ? 'bg-green-50 border border-green-200 text-green-700'
                      : 'bg-blue-50 border border-blue-200 text-blue-700'
                  }`}>
                    {userCreationStatus}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1">
                    Create User
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowCreateUser(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
