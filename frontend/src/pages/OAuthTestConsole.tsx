import { useState } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { Play, Terminal, CheckCircle, XCircle } from 'lucide-react';

export default function OAuthTestConsole() {
  const [testType, setTestType] = useState<
    'discovery' | 'introspect' | 'userinfo'
  >('discovery');
  const [inputValue, setInputValue] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTestDiscovery = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await axios.post('/api/providers/test', {
        issuer: inputValue,
      });
      setResult(response.data.discovery);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Failed to fetch discovery document'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTestIntrospect = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await axios.post('/oauth/introspect', {
        token: inputValue,
      });
      setResult(response.data);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Token introspection failed'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTestUserInfo = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await axios.get('/oauth/userinfo', {
        headers: {
          Authorization: `Bearer ${inputValue}`,
        },
      });
      setResult(response.data);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'UserInfo request failed'
      );
    } finally {
      setLoading(false);
    }
  };

  const runTest = () => {
    switch (testType) {
      case 'discovery':
        handleTestDiscovery();
        break;
      case 'introspect':
        handleTestIntrospect();
        break;
      case 'userinfo':
        handleTestUserInfo();
        break;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            OAuth Test Console
          </h1>
          <p className="text-gray-400">
            Test OAuth2 and OIDC endpoints interactively
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <Terminal className="w-6 h-6 mr-2" />
              Test Configuration
            </h2>

            {/* Test Type Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Test Type
              </label>
              <select
                value={testType}
                onChange={(e: any) => {
                  setTestType(e.target.value);
                  setResult(null);
                  setError('');
                }}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="discovery">
                  OpenID Connect Discovery
                </option>
                <option value="introspect">Token Introspection</option>
                <option value="userinfo">UserInfo Endpoint</option>
              </select>
            </div>

            {/* Input Field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {testType === 'discovery'
                  ? 'Issuer URL'
                  : testType === 'introspect'
                  ? 'Access Token'
                  : 'Access Token'}
              </label>
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                rows={testType === 'discovery' ? 2 : 4}
                placeholder={
                  testType === 'discovery'
                    ? 'https://accounts.google.com'
                    : 'Paste your access token here'
                }
              />
            </div>

            {/* Run Button */}
            <button
              onClick={runTest}
              disabled={loading || !inputValue}
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              <Play className="w-5 h-5 mr-2" />
              {loading ? 'Testing...' : 'Run Test'}
            </button>

            {/* Quick Examples */}
            <div className="mt-6 p-4 bg-gray-900 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">
                Quick Examples:
              </h3>
              <div className="text-xs text-gray-400 space-y-1">
                {testType === 'discovery' && (
                  <>
                    <div>• http://localhost:4000 (This server)</div>
                    <div>• https://accounts.google.com</div>
                    <div>• https://login.microsoftonline.com/common</div>
                  </>
                )}
                {testType === 'introspect' && (
                  <div>Paste an access token from your tokens list</div>
                )}
                {testType === 'userinfo' && (
                  <div>Paste an access token with openid scope</div>
                )}
              </div>
            </div>
          </div>

          {/* Result Panel */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Result</h2>

            {error && (
              <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg flex items-start mb-4">
                <XCircle className="w-5 h-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-300 font-semibold">Error</p>
                  <p className="text-red-400 text-sm mt-1">{error}</p>
                </div>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div className="p-4 bg-green-900/50 border border-green-700 rounded-lg flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                  <span className="text-green-300 font-semibold">
                    Request Successful
                  </span>
                </div>

                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-gray-300 text-xs">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {!result && !error && (
              <div className="text-center py-12 text-gray-500">
                <Terminal className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Run a test to see results here</p>
              </div>
            )}
          </div>
        </div>

        {/* API Reference */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            API Endpoints Reference
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 bg-gray-900 rounded-lg">
              <h3 className="font-semibold text-blue-400 mb-2">
                Authorization Server
              </h3>
              <div className="space-y-1 text-gray-400">
                <div>GET /.well-known/openid-configuration</div>
                <div>GET /jwks</div>
                <div>GET /oauth/authorize</div>
                <div>POST /oauth/token</div>
                <div>GET /oauth/userinfo</div>
                <div>POST /oauth/introspect</div>
              </div>
            </div>
            <div className="p-4 bg-gray-900 rounded-lg">
              <h3 className="font-semibold text-purple-400 mb-2">
                OAuth Client
              </h3>
              <div className="space-y-1 text-gray-400">
                <div>POST /api/providers</div>
                <div>GET /api/providers</div>
                <div>POST /api/oauth/login/:providerId</div>
                <div>GET /api/oauth/callback</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
