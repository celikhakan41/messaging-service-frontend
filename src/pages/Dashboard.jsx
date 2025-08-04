import React, { useState, useEffect } from 'react';
import Chat from '../components/Chat.jsx';
import InvoicePage from './InvoicePage.jsx';
import PlanInfo from './PlanInfo.jsx';
import PlanUpgrade from '../components/PlanUpgrade.jsx';
import ApiKeyManager from '../components/ApiKeyManager.jsx';
import { BASE_URL } from '../services/api.js';

const Dashboard = ({ token, username, onLogout }) => {
    const [refreshKey, setRefreshKey] = useState(0);
    const [activeTab, setActiveTab] = useState('overview');
    
    // Dynamic stats state
    const [stats, setStats] = useState({
        messages: 0,
        planType: 'FREE',
        apiKeys: 0,
        loading: true,
        error: null,
        lastRefresh: null
    });

    const handleUpgradeSuccess = () => {
        setRefreshKey(prev => prev + 1);
        fetchStats(); // Refresh stats after upgrade
    };

    // Fetch dashboard statistics with cache-aware strategy
    const fetchStats = async (forceRefresh = false) => {
        if (!token) return;

        try {
            setStats(prev => ({ ...prev, loading: true }));

            // Add cache-busting parameter if force refresh is requested
            const cacheParams = forceRefresh ? `?t=${Date.now()}` : '';

            // Parallel API calls for better performance
            const [messagesRes, tenantRes, apiKeysRes] = await Promise.allSettled([
                fetch(`${BASE_URL}/messages/count${cacheParams}`, {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        ...(forceRefresh && { 'Cache-Control': 'no-cache' })
                    }
                }),
                fetch(`${BASE_URL}/tenant${cacheParams}`, {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        ...(forceRefresh && { 'Cache-Control': 'no-cache' })
                    }
                }),
                fetch(`${BASE_URL}/tenant/apikeys/count${cacheParams}`, {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        ...(forceRefresh && { 'Cache-Control': 'no-cache' })
                    }
                })
            ]);

            // Process results
            let messageCount = 0;
            let planType = 'FREE';
            let apiKeyCount = 0;

            // Messages count
            if (messagesRes.status === 'fulfilled' && messagesRes.value.ok) {
                try {
                    messageCount = await messagesRes.value.json();
                } catch (e) {
                    console.error('Error parsing message count:', e);
                    messageCount = 0;
                }
            }

            // Plan type from tenant info
            if (tenantRes.status === 'fulfilled' && tenantRes.value.ok) {
                try {
                    const data = await tenantRes.value.json();
                    planType = data.planType || 'FREE';
                } catch (e) {
                    console.error('Error parsing tenant info:', e);
                    planType = 'FREE';
                }
            }

            // API Keys count
            if (apiKeysRes.status === 'fulfilled' && apiKeysRes.value.ok) {
                try {
                    apiKeyCount = await apiKeysRes.value.json();
                } catch (e) {
                    console.error('Error parsing API key count:', e);
                    apiKeyCount = 0;
                }
            }

            setStats({
                messages: messageCount,
                planType: planType,
                apiKeys: apiKeyCount,
                loading: false,
                lastRefresh: new Date()
            });

        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
            setStats(prev => ({ ...prev, loading: false, error: error.message }));
        }
    };

    // Fetch stats on component mount and when refreshKey changes
    useEffect(() => {
        fetchStats();
    }, [token, refreshKey]);

    const getPlanDisplayName = (planType) => {
        const planNames = {
            'FREE': 'Free',
            'BASIC': 'Basic',
            'PREMIUM': 'Premium',
            'ENTERPRISE': 'Enterprise'
        };
        return planNames[planType] || planType;
    };

    const tabs = [
        { id: 'overview', name: 'Overview', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z' },
        { id: 'chat', name: 'Messages', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
        { id: 'billing', name: 'Billing', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
        { id: 'api', name: 'API Keys', icon: 'M15 7a2 2 0 012 2m0 0a2 2 0 012 2 2 2 0 11-4 0c0-1.1.9-2 2-2zM7 7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V9a2 2 0 00-2-2H7z' }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <PlanInfo key={`plan-${refreshKey}`} token={token} />
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <PlanUpgrade
                                    token={token}
                                    onUpgradeSuccess={handleUpgradeSuccess}
                                />
                            </div>
                        </div>

                        {/* Dynamic Quick Stats */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
                                <button
                                    onClick={() => fetchStats(true)} // Force refresh bypasses cache
                                    disabled={stats.loading}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 flex items-center"
                                    title="Force refresh (bypasses cache)"
                                >
                                    {stats.loading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Refreshing...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            Refresh
                                        </>
                                    )}
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Messages Stats */}
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <div className="flex items-center">
                                        <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                        <div className="ml-4 flex-1">
                                            <p className="text-sm font-medium text-gray-600">Messages</p>
                                            {stats.loading ? (
                                                <div className="h-8 bg-gray-200 rounded animate-pulse mt-1"></div>
                                            ) : (
                                                <p className="text-2xl font-bold text-gray-900">{stats.messages.toLocaleString()}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Plan Stats */}
                                <div className="bg-green-50 rounded-lg p-4">
                                    <div className="flex items-center">
                                        <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                        </svg>
                                        <div className="ml-4 flex-1">
                                            <p className="text-sm font-medium text-gray-600">Active Plan</p>
                                            {stats.loading ? (
                                                <div className="h-8 bg-gray-200 rounded animate-pulse mt-1"></div>
                                            ) : (
                                                <p className="text-2xl font-bold text-gray-900">{getPlanDisplayName(stats.planType)}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* API Keys Stats */}
                                <div className="bg-purple-50 rounded-lg p-4">
                                    <div className="flex items-center">
                                        <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2 2 2 0 11-4 0c0-1.1.9-2 2-2zM7 7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V9a2 2 0 00-2-2H7z" />
                                        </svg>
                                        <div className="ml-4 flex-1">
                                            <p className="text-sm font-medium text-gray-600">API Keys</p>
                                            {stats.loading ? (
                                                <div className="h-8 bg-gray-200 rounded animate-pulse mt-1"></div>
                                            ) : (
                                                <p className="text-2xl font-bold text-gray-900">{stats.apiKeys}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Stats Info with Cache Status */}
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="flex items-center justify-between text-sm text-gray-500">
                                    <span>
                                        Last updated: {stats.lastRefresh ? stats.lastRefresh.toLocaleTimeString() : 'Loading...'}
                                        {stats.lastRefresh && (
                                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                                Cached (2min TTL)
                                            </span>
                                        )}
                                    </span>
                                    <div className="flex items-center space-x-4">
                                        {stats.error && (
                                            <span className="flex items-center text-red-500">
                                                <div className="h-2 w-2 bg-red-500 rounded-full mr-2"></div>
                                                Error loading data
                                            </span>
                                        )}
                                        {!stats.error && !stats.loading && (
                                            <span className="flex items-center text-green-500">
                                                <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                                                All systems operational
                                            </span>
                                        )}
                                        <button
                                            onClick={() => window.open(`${BASE_URL.replace('/api', '')}/api/debug/cache/info`, '_blank')}
                                            className="text-xs text-gray-400 hover:text-gray-600 underline"
                                            title="View cache statistics"
                                        >
                                            Cache Debug
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'chat':
                return (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[600px]">
                        <Chat token={token} username={username} />
                    </div>
                );
            case 'billing':
                return (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <InvoicePage key={`invoice-${refreshKey}`} token={token} />
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <PlanUpgrade
                                token={token}
                                onUpgradeSuccess={handleUpgradeSuccess}
                            />
                        </div>
                    </div>
                );
            case 'api':
                return (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <ApiKeyManager token={token} />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <h1 className="text-xl font-semibold text-gray-900">
                                Welcome back, <span className="text-blue-600">{username}</span>
                            </h1>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="hidden md:flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                                <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-medium text-white">
                                        {username.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <span className="text-sm font-medium text-gray-700 px-2">{username}</span>
                            </div>

                            <button
                                onClick={onLogout}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Navigation Tabs */}
                <div className="mb-8">
                    <nav className="flex space-x-8 overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-600'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                                </svg>
                                {tab.name}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content Area */}
                <main>
                    {renderTabContent()}
                </main>
            </div>
        </div>
    );
};

export default Dashboard;