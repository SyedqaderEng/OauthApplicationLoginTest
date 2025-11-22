import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { Key, Eye, EyeOff, Copy, CheckCircle } from 'lucide-react';

export default function TokenViewer() {
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [showFullToken, setShowFullToken] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      const response = await axios.get('/api/auth/tokens');
      setTokens(response.data.tokens);
      if (response.data.tokens.length > 0) {
        setSelectedToken(response.data.tokens[0]);
      }
    } catch (error) {
      console.error('Error fetching tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Token Viewer</h1>
          <p className="text-gray-400">
            Inspect and decode OAuth2 tokens and ID tokens
          </p>
        </div>

        {tokens.length === 0 ? (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
            <Key className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No tokens available
            </h3>
            <p className="text-gray-400">
              Perform an OAuth login to view and decode tokens
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Token List */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
              <h2 className="text-lg font-bold text-white mb-4">
                Your Tokens
              </h2>
              <div className="space-y-2">
                {tokens.map((token) => (
                  <button
                    key={token.id}
                    onClick={() => setSelectedToken(token)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedToken?.id === token.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div className="font-semibold">
                      {token.client?.name || 'External Provider'}
                    </div>
                    <div className="text-xs opacity-75 mt-1">
                      {new Date(token.createdAt).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Token Details */}
            <div className="lg:col-span-2 space-y-6">
              {selectedToken && (
                <>
                  {/* Access Token */}
                  <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-white">
                        Access Token
                      </h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setShowFullToken(!showFullToken)}
                          className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                        >
                          {showFullToken ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() =>
                            copyToClipboard(selectedToken.accessToken)
                          }
                          className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                        >
                          {copied ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <pre className="p-4 bg-gray-900 rounded-lg text-gray-300 text-xs overflow-x-auto break-all whitespace-pre-wrap">
                      {showFullToken
                        ? selectedToken.accessToken
                        : selectedToken.accessToken}
                    </pre>
                  </div>

                  {/* Token Metadata */}
                  <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                    <h3 className="text-lg font-bold text-white mb-4">
                      Token Metadata
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-gray-400 text-sm">
                          Token Type
                        </label>
                        <p className="text-white">{selectedToken.tokenType}</p>
                      </div>
                      <div>
                        <label className="text-gray-400 text-sm">Scope</label>
                        <p className="text-white">
                          {selectedToken.scope || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-gray-400 text-sm">
                          Expires At
                        </label>
                        <p className="text-white">
                          {new Date(
                            selectedToken.expiresAt
                          ).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <label className="text-gray-400 text-sm">
                          Created At
                        </label>
                        <p className="text-white">
                          {new Date(
                            selectedToken.createdAt
                          ).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <label className="text-gray-400 text-sm">
                          Has Refresh Token
                        </label>
                        <p className="text-white">
                          {selectedToken.hasRefreshToken ? 'Yes' : 'No'}
                        </p>
                      </div>
                      <div>
                        <label className="text-gray-400 text-sm">
                          Has ID Token
                        </label>
                        <p className="text-white">
                          {selectedToken.hasIdToken ? 'Yes' : 'No'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ID Token Claims */}
                  {selectedToken.hasIdToken && (
                    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                      <h3 className="text-lg font-bold text-white mb-4">
                        ID Token Claims
                      </h3>
                      <div className="p-4 bg-gray-900 rounded-lg">
                        <pre className="text-gray-300 text-xs overflow-x-auto">
                          {JSON.stringify(
                            { note: 'Full token needed to decode' },
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
