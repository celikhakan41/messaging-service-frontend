import React, { useState, useEffect, useCallback } from 'react';
import { getApiKeys, generateApiKey, deleteApiKey } from '../services/api';

const ApiKeyManager = ({ onApiKeyChange }) => {
    const [apiKeys, setApiKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generatingKey, setGeneratingKey] = useState(false);
    const [deletingKeyId, setDeletingKeyId] = useState(null);
    const [copiedKey, setCopiedKey] = useState(null);
    const [error, setError] = useState(null);

    // API key'leri fetch etme fonksiyonu
    const fetchApiKeys = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await getApiKeys();
            const formattedKeys = response.data.map((key, index) => ({
                id: key.id || `${Date.now()}-${index}`,
                key: key.apiKey,
                createdAt: key.createdAt,
                name: key.name || `API Key ${index + 1}`,
                lastUsed: key.lastUsed || null
            }));

            setApiKeys(formattedKeys);
        } catch (error) {
            console.error('Failed to fetch API keys:', error);
            
            // 400 error için özel mesaj
            if (error.response?.status === 400) {
                setError('API Keys feature is currently unavailable. Please try again later or contact support.');
            } else if (error.response?.status === 403) {
                setError('Access denied. API Keys may require a premium plan.');
            } else {
                setError('Failed to load API keys. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // Component mount'ta API key'leri çek
    useEffect(() => {
        fetchApiKeys();
    }, [fetchApiKeys]);

    // Yeni API key generate etme
    const handleGenerateApiKey = async () => {
        try {
            setGeneratingKey(true);
            setError(null);
            
            const response = await generateApiKey();
            
            if (!response.data?.apiKey) {
                throw new Error('API key not received from server');
            }

            const newKey = {
                id: response.data.id || Date.now().toString(),
                key: response.data.apiKey,
                createdAt: response.data.createdAt || new Date().toISOString(),
                name: `API Key ${apiKeys.length + 1}`,
                lastUsed: null
            };

            setApiKeys(prev => [newKey, ...prev]);

            // Dashboard stats'ını refresh et (backend cache invalidation ile senkronize)
            if (onApiKeyChange) {
                onApiKeyChange();
            }

            // Otomatik olarak yeni key'i kopyala
            await copyToClipboard(response.data.apiKey);
            setCopiedKey(newKey.id);
            setTimeout(() => setCopiedKey(null), 2000);

        } catch (error) {
            console.error('Failed to generate API key:', error);
            setError(`Failed to generate API key: ${error.response?.data?.message || error.message}`);
        } finally {
            setGeneratingKey(false);
        }
    };

    // Clipboard'a kopyalama
    const copyToClipboard = async (text) => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback for browsers that don't support clipboard API
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                return true;
            }
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            throw new Error('Failed to copy to clipboard');
        }
    };

    // Key kopyalama handle
    const handleCopyKey = async (keyId, keyValue) => {
        try {
            await copyToClipboard(keyValue);
            setCopiedKey(keyId);
            setTimeout(() => setCopiedKey(null), 2000);
        } catch (error) {
            setError('Failed to copy to clipboard');
        }
    };

    // API key silme
    const handleRevokeApiKey = async (keyId) => {
        if (!window.confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
            return;
        }

        try {
            setDeletingKeyId(keyId);
            setError(null);
            
            await deleteApiKey(keyId);
            
            setApiKeys(prev => prev.filter(key => key.id !== keyId));
            
            // Dashboard stats'ını refresh et (backend cache invalidation ile senkronize)
            if (onApiKeyChange) {
                onApiKeyChange();
            }
            
        } catch (error) {
            console.error('Failed to revoke API key:', error);
            setError(`Failed to revoke API key: ${error.response?.data?.message || error.message}`);
        } finally {
            setDeletingKeyId(null);
        }
    };

    // API key maskeleme
    const maskApiKey = (key) => {
        if (!key) return '';
        if (key.length <= 16) return key;
        return key.slice(0, 8) + '•'.repeat(Math.max(0, key.length - 16)) + key.slice(-8);
    };

    // Tarih formatı
    const formatDate = (dateString) => {
        if (!dateString) return 'Invalid Date';
        
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    };

    // Error component
    const ErrorMessage = ({ message, onDismiss }) => (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
                <svg className="h-5 w-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{message}</span>
            </div>
            <button
                onClick={onDismiss}
                className="text-red-500 hover:text-red-700"
            >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-lg text-gray-600">Loading API Keys...</span>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Error Message */}
            {error && (
                <ErrorMessage 
                    message={error} 
                    onDismiss={() => setError(null)} 
                />
            )}

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
                    onClick={handleGenerateApiKey}
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
                        onClick={handleGenerateApiKey}
                        disabled={generatingKey}
                        className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
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
                                        onClick={() => handleRevokeApiKey(apiKey.id)}
                                        disabled={deletingKeyId === apiKey.id}
                                        className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                        title="Revoke API Key"
                                    >
                                        {deletingKeyId === apiKey.id ? (
                                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : (
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        )}
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