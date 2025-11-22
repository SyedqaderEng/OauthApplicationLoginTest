import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import {
  Plus,
  Server,
  Trash2,
  CheckCircle,
  XCircle,
  ExternalLink,
} from 'lucide-react';

export default function OAuthProviders() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    issuer: '',
    clientId: '',
    clientSecret: '',
    scopes: 'openid profile email',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await axios.get('/api/providers');
      setProviders(response.data.providers);
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await axios.post('/api/providers', {
        ...formData,
        scopes: formData.scopes.split(' '),
      });
      setSuccess('Provider added successfully!');
      setShowAddModal(false);
      setFormData({
        name: '',
        issuer: '',
        clientId: '',
        clientSecret: '',
        scopes: 'openid profile email',
      });
      fetchProviders();
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to add provider'
      );
    }
  };

  const handleDeleteProvider = async (id: string) => {
    if (!confirm('Are you sure you want to delete this provider?')) return;

    try {
      await axios.delete(`/api/providers/${id}`);
      fetchProviders();
    } catch (error) {
      console.error('Error deleting provider:', error);
    }
  };

  const handleOAuthLogin = async (providerId: string) => {
    try {
      const response = await axios.post(
        `/api/oauth/login/${providerId}`
      );
      window.location.href = response.data.authUrl;
    } catch (error: any) {
      alert(
        error.response?.data?.message || 'Failed to initiate OAuth login'
      );
    }
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
              OAuth Providers
            </h1>
            <p className="text-gray-400">
              Manage external OAuth/OIDC providers for client mode
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Provider
          </button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="p-4 bg-green-900/50 border border-green-700 rounded-lg text-green-300">
            {success}
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
            {error}
          </div>
        )}

        {/* Providers List */}
        {providers.length === 0 ? (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
            <Server className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No providers configured
            </h3>
            <p className="text-gray-400 mb-6">
              Add an OAuth/OIDC provider to start testing client flows
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Add Your First Provider
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-blue-500 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center">
                      {provider.name}
                      {provider.active ? (
                        <CheckCircle className="w-5 h-5 text-green-500 ml-2" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 ml-2" />
                      )}
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">
                      {provider.issuer}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDeleteProvider(provider.id)}
                      className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-400">Auth Endpoint:</span>
                    <p className="text-gray-300 truncate">
                      {provider.authEndpoint}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Token Endpoint:</span>
                    <p className="text-gray-300 truncate">
                      {provider.tokenEndpoint}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Scopes:</span>
                    <p className="text-gray-300">
                      {Array.isArray(provider.scopes)
                        ? provider.scopes.join(', ')
                        : provider.scopes}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleOAuthLogin(provider.id)}
                  className="mt-4 w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  disabled={!provider.active}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Login with {provider.name}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Provider Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                Add OAuth Provider
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddProvider} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Provider Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Google, Auth0, Keycloak"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Issuer URL (Discovery)
                </label>
                <input
                  type="url"
                  value={formData.issuer}
                  onChange={(e) =>
                    setFormData({ ...formData, issuer: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://accounts.google.com"
                  required
                />
                <p className="text-gray-500 text-xs mt-1">
                  Will auto-fetch .well-known/openid-configuration
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Client ID
                </label>
                <input
                  type="text"
                  value={formData.clientId}
                  onChange={(e) =>
                    setFormData({ ...formData, clientId: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Client Secret
                </label>
                <input
                  type="password"
                  value={formData.clientSecret}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      clientSecret: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  Add Provider
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
          </div>
        </div>
      )}
    </Layout>
  );
}
