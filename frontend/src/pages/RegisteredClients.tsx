import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { Plus, Users, Trash2, Key, Copy, CheckCircle } from 'lucide-react';

export default function RegisteredClients() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClient, setNewClient] = useState<any>(null);
  const [copied, setCopied] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    redirect_uris: '',
    scopes: 'openid profile email',
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await axios.get('/oauth/clients');
      setClients(response.data.clients);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterClient = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await axios.post('/oauth/register', {
        name: formData.name,
        redirect_uris: formData.redirect_uris
          .split('\n')
          .map((uri) => uri.trim())
          .filter((uri) => uri),
        scopes: formData.scopes.split(' '),
        grant_types: ['authorization_code', 'refresh_token'],
        token_endpoint_auth_method: 'client_secret_basic',
      });

      setNewClient(response.data);
      fetchClients();
      setFormData({
        name: '',
        redirect_uris: '',
        scopes: 'openid profile email',
      });
    } catch (error) {
      console.error('Error registering client:', error);
      alert('Failed to register client');
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return;

    try {
      await axios.delete(`/oauth/clients/${clientId}`);
      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Registered Clients
            </h1>
            <p className="text-gray-400">
              OAuth2 clients that can use this server as IdP
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Register Client
          </button>
        </div>

        {/* Clients List */}
        {clients.length === 0 ? (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No clients registered
            </h3>
            <p className="text-gray-400 mb-6">
              Register your first OAuth2 client application
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Register Your First Client
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {clients.map((client) => (
              <div
                key={client.id}
                className="bg-gray-800 rounded-lg border border-gray-700 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {client.name}
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">
                      Client ID: {client.clientId}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteClient(client.clientId)}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-gray-400">Redirect URIs</label>
                    <div className="mt-1 space-y-1">
                      {Array.isArray(client.redirectUris) &&
                        client.redirectUris.map((uri: string, i: number) => (
                          <div
                            key={i}
                            className="text-gray-300 bg-gray-900 px-2 py-1 rounded"
                          >
                            {uri}
                          </div>
                        ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-400">Grant Types</label>
                    <div className="mt-1 text-gray-300">
                      {Array.isArray(client.grantTypes) &&
                        client.grantTypes.join(', ')}
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-400">Scopes</label>
                    <div className="mt-1 text-gray-300">
                      {Array.isArray(client.scopes) &&
                        client.scopes.join(', ')}
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-400">Status</label>
                    <div className="mt-1">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          client.active
                            ? 'bg-green-900 text-green-300'
                            : 'bg-red-900 text-red-300'
                        }`}
                      >
                        {client.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Register Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                Register OAuth Client
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewClient(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {newClient ? (
              <div className="p-6 space-y-4">
                <div className="p-4 bg-green-900/50 border border-green-700 rounded-lg flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                  <span className="text-green-300 font-semibold">
                    Client registered successfully!
                  </span>
                </div>

                <div className="p-4 bg-yellow-900/50 border border-yellow-700 rounded-lg">
                  <p className="text-yellow-300 text-sm">
                    ⚠️ Save these credentials now. The client secret will not
                    be shown again!
                  </p>
                </div>

                <div>
                  <label className="text-gray-400 text-sm">Client ID</label>
                  <div className="flex items-center mt-1">
                    <pre className="flex-1 p-3 bg-gray-900 rounded-l text-gray-300 text-sm">
                      {newClient.client_id}
                    </pre>
                    <button
                      onClick={() =>
                        copyToClipboard(newClient.client_id, 'client_id')
                      }
                      className="px-3 py-3 bg-gray-700 hover:bg-gray-600 rounded-r"
                    >
                      {copied === 'client_id' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 text-sm">
                    Client Secret
                  </label>
                  <div className="flex items-center mt-1">
                    <pre className="flex-1 p-3 bg-gray-900 rounded-l text-gray-300 text-sm">
                      {newClient.client_secret}
                    </pre>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          newClient.client_secret,
                          'client_secret'
                        )
                      }
                      className="px-3 py-3 bg-gray-700 hover:bg-gray-600 rounded-r"
                    >
                      {copied === 'client_secret' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewClient(null);
                  }}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegisterClient} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Client Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="My Application"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Redirect URIs (one per line)
                  </label>
                  <textarea
                    value={formData.redirect_uris}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        redirect_uris: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    rows={4}
                    placeholder="http://localhost:3000/callback&#10;https://myapp.com/oauth/callback"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Scopes (space-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.scopes}
                    onChange={(e) =>
                      setFormData({ ...formData, scopes: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="openid profile email"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Register Client
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
