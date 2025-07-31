import React, { useState, useEffect } from 'react';

const ApiKeyManager = ({ token }) => {
    const [apiKeys, setApiKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generatingKey, setGeneratingKey] = useState(false);
    const [copiedKey, setCopiedKey] = useState(null);

    // Component mount'ta API key'leri çek
    useEffect(() => {
        fetchApiKeys();
    }, [token]);

    const fetchApiKeys = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/keys/list', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch API keys');
            }

            const data = await response.json();
            const formattedKeys = data.map((key, index) => ({
                id: key.id || Date.now().toString() + index, // Backend'ten ID geliyorsa kullan
                key: key.apiKey,
                createdAt: key.createdAt,
                name: `API Key ${index + 1}`,
                lastUsed: null // Bu bilgi backend'te yoksa null
            }));

            setApiKeys(formattedKeys);
        } catch (error) {
            console.error('Failed to fetch API keys:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateApiKey = async () => {
        try {
            setGeneratingKey(true);
            const response = await fetch('/api/keys/generate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to generate API key');
            }

            const data = await response.json();
            console.log('API Key Response:', data); // Debug için

            if (!data.apiKey) {  // Backend'te "apiKey" field adı kullanılıyor
                throw new Error('API key not received from server');
            }

            const newKey = {
                id: data.id || Date.now().toString(), // Backend'ten ID geliyorsa kullan
                key: data.apiKey,  // Backend'ten "apiKey" field'ından alıyoruz
                createdAt: data.createdAt,
                name: `API Key ${apiKeys.length + 1}`,
                lastUsed: null
            };

            setApiKeys(prev => [newKey, ...prev]);

            // Auto-copy the new key to clipboard
            await copyToClipboard(data.apiKey);  // Backend'ten "apiKey" field'ından alıyoruz
            setCopiedKey(newKey.id);

            // 2 saniye sonra copied state'ini temizle
            setTimeout(() => setCopiedKey(null), 2000);

        } catch (error) {
            console.error('Failed to generate API key:', error);
            alert('Failed to generate API key: ' + error.message);
        } finally {
            setGeneratingKey(false);
        }
    };

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // Fallback for browsers that don't support clipboard API
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        }
    };

    const handleCopyKey = async (keyId, keyValue) => {
        try {
            await copyToClipboard(keyValue);
            setCopiedKey(keyId);
            setTimeout(() => setCopiedKey(null), 2000);
        } catch (error) {
            alert('Failed to copy to clipboard');
        }
    };

    const revokeApiKey = async (keyId) => {
        if (!window.confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/keys/${keyId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to revoke API key');
            }

            // API key'i local state'ten kaldır
            setApiKeys(prev => prev.filter(key => key.id !== keyId));
            alert('API key revoked successfully');
        } catch (error) {
            console.error('Failed to revoke API key:', error);
            alert('Failed to revoke API key: ' + error.message);
        }
    };

    const maskApiKey = (key) => {
        if (!key) return '';
        return key.slice(0, 8) + '•'.repeat(Math.max(0, key.length - 16)) + key.slice(-8);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <div className="h-10 w-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mr-4">
                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2 2 2 0 11-4 0c0-1.1.9-2 2-2zM7 7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V9a2 2 0 00-2-2H7z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">API Keys</h2>
                        <p className="text-sm text-gray-500">Manage your API authentication keys</p>
                    </div>
                </div>

                <button
                    onClick={generateApiKey}
                    disabled={generatingKey}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {generatingKey ? (
                        <div className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating...
                        </div>
                    ) : (
                        <div className="flex items-center">
                            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Generate New Key
                        </div>
                    )}
                </button>
            </div>

            {/* API Keys List */}
            {apiKeys.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2 2 2 0 11-4 0c0-1.1.9-2 2-2zM7 7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V9a2 2 0 00-2-2H7z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mt-4">No API Keys</h3>
                    <p className="text-sm text-gray-500 mt-2">Create your first API key to start integrating with our services</p>
                    <button
                        onClick={generateApiKey}
                        disabled={generatingKey}
                        className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        Generate Your First Key
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {apiKeys.map((apiKey) => (
                        <div key={apiKey.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-lg font-semibold text-gray-900">{apiKey.name}</h3>
                                        <div className="flex items-center space-x-2">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Active
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                            <div className="flex items-center space-x-3">
                                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2 2 2 0 11-4 0c0-1.1.9-2 2-2zM7 7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V9a2 2 0 00-2-2H7z" />
                                                </svg>
                                                <code className="text-sm font-mono text-gray-700">
                                                    {maskApiKey(apiKey.key)}
                                                </code>
                                            </div>
                                            <button
                                                onClick={() => handleCopyKey(apiKey.id, apiKey.key)}
                                                className="text-purple-600 hover:text-purple-700 transition-colors"
                                            >
                                                {copiedKey === apiKey.id ? (
                                                    <div className="flex items-center text-green-600">
                                                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        <span className="text-sm">Copied!</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center">
                                                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                        </svg>
                                                        <span className="text-sm">Copy</span>
                                                    </div>
                                                )}
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-500">Created:</span>
                                                <p className="font-medium text-gray-900">{formatDate(apiKey.createdAt)}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Last used:</span>
                                                <p className="font-medium text-gray-900">
                                                    {apiKey.lastUsed ? formatDate(apiKey.lastUsed) : 'Never'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="ml-6">
                                    <button
                                        onClick={() => revokeApiKey(apiKey.id)}
                                        className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Revoke API Key"
                                    >
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Usage Information */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">API Usage Guidelines</h3>
                <div className="space-y-2 text-sm text-blue-800">
                    <div className="flex items-start">
                        <svg className="h-4 w-4 mr-2 mt-0.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Keep your API keys secure and never share them publicly</span>
                    </div>
                    <div className="flex items-start">
                        <svg className="h-4 w-4 mr-2 mt-0.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Include your API key in the Authorization header: <code className="bg-blue-100 px-1 rounded">Bearer YOUR_API_KEY</code></span>
                    </div>
                    <div className="flex items-start">
                        <svg className="h-4 w-4 mr-2 mt-0.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Revoke any keys that are no longer needed or may have been compromised</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApiKeyManager;