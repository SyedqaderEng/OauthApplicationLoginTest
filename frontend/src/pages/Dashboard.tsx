import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import {
  Key,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface DashboardProps {
  user: any;
}

export default function Dashboard({ user }: DashboardProps) {
  const [tokens, setTokens] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [showTokenDetails, setShowTokenDetails] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [tokensRes, logsRes] = await Promise.all([
        axios.get('/api/auth/tokens'),
        axios.get('/api/auth/logs?limit=10'),
      ]);
      setTokens(tokensRes.data.tokens);
      setLogs(logsRes.data.logs);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const minutes = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) <= new Date();
  };

  if (loading) {
    return (
      <Layout user={user}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">
            Welcome back, {user?.email || 'User'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Tokens</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {tokens.filter((t) => !isExpired(t.expiresAt)).length}
                </p>
              </div>
              <Key className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Tokens</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {tokens.length}
                </p>
              </div>
              <RefreshCw className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Recent Events</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {logs.length}
                </p>
              </div>
              <Clock className="w-12 h-12 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Tokens Section */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white">Your Tokens</h2>
            <p className="text-gray-400 text-sm mt-1">
              OAuth2 tokens issued and received
            </p>
          </div>
          <div className="p-6">
            {tokens.length === 0 ? (
              <div className="text-center py-8">
                <Key className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No tokens yet</p>
                <p className="text-gray-500 text-sm mt-1">
                  Start by adding an OAuth provider or performing an OAuth login
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {tokens.map((token) => (
                  <div
                    key={token.id}
                    className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-blue-500 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedToken(token);
                      setShowTokenDetails(true);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h3 className="text-white font-semibold">
                            {token.client?.name || 'External Provider'}
                          </h3>
                          {isExpired(token.expiresAt) ? (
                            <span className="ml-2 px-2 py-1 bg-red-900 text-red-300 text-xs rounded">
                              Expired
                            </span>
                          ) : (
                            <span className="ml-2 px-2 py-1 bg-green-900 text-green-300 text-xs rounded">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm mt-1">
                          Scope: {token.scope || 'N/A'}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>
                            Type: {token.tokenType}
                          </span>
                          <span>•</span>
                          <span>
                            Expires: {getTimeRemaining(token.expiresAt)}
                          </span>
                          {token.hasRefreshToken && (
                            <>
                              <span>•</span>
                              <span className="text-blue-400">
                                Has Refresh Token
                              </span>
                            </>
                          )}
                          {token.hasIdToken && (
                            <>
                              <span>•</span>
                              <span className="text-purple-400">
                                Has ID Token
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        {isExpired(token.expiresAt) ? (
                          <AlertCircle className="w-6 h-6 text-red-500" />
                        ) : (
                          <CheckCircle className="w-6 h-6 text-green-500" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white">Recent Activity</h2>
            <p className="text-gray-400 text-sm mt-1">
              Latest OAuth events and operations
            </p>
          </div>
          <div className="p-6">
            {logs.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No activity yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start p-3 bg-gray-700 rounded-lg"
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-2 mr-3 ${
                        log.status === 'success'
                          ? 'bg-green-500'
                          : 'bg-red-500'
                      }`}
                    ></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">
                          {log.eventType.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <p className="text-gray-400 text-sm mt-1">
                          {JSON.stringify(log.details).substring(0, 100)}...
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Token Details Modal */}
      {showTokenDetails && selectedToken && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Token Details</h2>
              <button
                onClick={() => setShowTokenDetails(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-gray-400 text-sm">Access Token</label>
                <pre className="mt-1 p-3 bg-gray-900 rounded text-gray-300 text-xs overflow-x-auto">
                  {selectedToken.accessToken}
                </pre>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Token Type</label>
                <p className="mt-1 text-white">{selectedToken.tokenType}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Scope</label>
                <p className="mt-1 text-white">{selectedToken.scope || 'N/A'}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Expires At</label>
                <p className="mt-1 text-white">
                  {new Date(selectedToken.expiresAt).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Created At</label>
                <p className="mt-1 text-white">
                  {new Date(selectedToken.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
