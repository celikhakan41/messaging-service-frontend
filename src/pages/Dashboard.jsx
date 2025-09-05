import React, { useState, useEffect, useCallback, useRef } from 'react';
import Chat from '../components/Chat.jsx';
import InvoicePage from './InvoicePage.jsx';
import PlanInfo from './PlanInfo.jsx';
import PlanUpgrade from '../components/PlanUpgrade.jsx';
import ApiKeyManager from '../components/ApiKeyManager.jsx';
import { getTenantInfo, getMessageCount, getApiKeyCount } from '../services/api.js';

const Dashboard = ({ username, onLogout }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [refreshKey, setRefreshKey] = useState(0);
    const isMountedRef = useRef(true);
    
    // Simplified stats state
    const [stats, setStats] = useState({
        messages: 0,
        planType: 'FREE',
        tenantInfo: null, // Tenant info eksikti
        apiKeys: 0,
        loading: true,
        error: null,
        lastRefresh: null
    });

    // Mount/unmount tracking
    useEffect(() => {
        isMountedRef.current = true;
        
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Optimized stats fetching function
    const fetchStats = useCallback(async () => {
        if (!isMountedRef.current) return;

        try {
            setStats(prev => ({ ...prev, loading: true, error: null }));

            // Use Promise.all instead of Promise.allSettled for simpler error handling
            // Individual failures won't break the entire operation
            const [messagesResult, tenantResult, apiKeysResult] = await Promise.allSettled([
                getMessageCount().catch(err => ({ data: 0, error: err })),
                getTenantInfo().catch(err => ({ data: { planType: 'FREE' }, error: err })),
                getApiKeyCount().catch(err => ({ data: 0, error: err }))
            ]);

            if (!isMountedRef.current) return;

            // Extract data with proper error handling
            const messageCount = messagesResult.status === 'fulfilled' 
                ? (messagesResult.value?.data || 0) 
                : 0;

            const tenantInfo = tenantResult.status === 'fulfilled' 
                ? tenantResult.value?.data 
                : { planType: 'FREE' };

            const apiKeyCount = apiKeysResult.status === 'fulfilled' 
                ? (apiKeysResult.value?.data || 0) 
                : 0;

            setStats({
                messages: typeof messageCount === 'number' ? messageCount : 0,
                planType: tenantInfo?.planType || 'FREE',
                tenantInfo: tenantInfo, // Tenant info'yu state'e ekliyoruz
                apiKeys: typeof apiKeyCount === 'number' ? apiKeyCount : 0,
                loading: false,
                error: null,
                lastRefresh: new Date()
            });

        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
            
            if (isMountedRef.current) {
                setStats(prev => ({ 
                    ...prev, 
                    loading: false, 
                    error: 'Failed to load dashboard data' 
                }));
            }
        }
    }, []);

    // Initial data fetch
    useEffect(() => {
        fetchStats();
    }, [refreshKey]);

    // Handle upgrade success
    const handleUpgradeSuccess = useCallback(() => {
        setRefreshKey(prev => prev + 1);
    }, []);

    // Auto-refresh every 30 seconds to sync with backend cache
    useEffect(() => {
        const interval = setInterval(() => {
            if (!stats.loading && activeTab === 'overview') {
                setRefreshKey(prev => prev + 1);
            }
        }, 30000); // 30 saniyede bir

        return () => clearInterval(interval);
    }, [stats.loading, activeTab]);

    // Get display name for plan
    const getPlanDisplayName = (planType) => {
        const planNames = {
            'FREE': 'Free',
            'BASIC': 'Basic',
            'PREMIUM': 'Premium',
            'ENTERPRISE': 'Enterprise'
        };
        return planNames[planType] || planType;
    };

    // Navigation tabs configuration
    const tabs = [
        { id: 'overview', name: 'Overview', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z' },
        { id: 'chat', name: 'Messages', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
        { id: 'billing', name: 'Billing', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
        { id: 'api', name: 'API Keys', icon: 'M15 7a2 2 0 012 2m0 0a2 2 0 012 2 2 2 0 11-4 0c0-1.1.9-2 2-2zM7 7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V9a2 2 0 00-2-2H7z' }
    ];

    // Loading skeleton component
    const StatSkeleton = () => (
        <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
    );

    // Error message component
    const ErrorMessage = ({ message, onRetry }) => (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <svg className="h-5 w-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-red-700">{message}</span>
                </div>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="text-sm text-red-600 hover:text-red-800 font-medium"
                    >
                        Retry
                    </button>
                )}
            </div>
        </div>
    );

    // Render tab content
    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <PlanInfo key={`plan-${refreshKey}`} tenantInfo={stats.tenantInfo} loading={stats.loading} />
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <PlanUpgrade onUpgradeSuccess={handleUpgradeSuccess} currentPlan={stats.planType} loading={stats.loading} />
                            </div>
                        </div>

                        {/* Stats Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
                                <button
                                    onClick={() => setRefreshKey(prev => prev + 1)}
                                    disabled={stats.loading}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 flex items-center transition-colors"
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
                            
                            {stats.error ? (
                                <ErrorMessage message={stats.error} onRetry={fetchStats} />
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Messages Stats */}
                                        <div className="bg-blue-50 rounded-lg p-4">
                                            <div className="flex items-center">
                                                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                </svg>
                                                <div className="ml-4 flex-1">
                                                    <p className="text-sm font-medium text-gray-600">Messages</p>
                                                    {stats.loading ? (
                                                        <StatSkeleton />
                                                    ) : (
                                                        <p className="text-2xl font-bold text-gray-900">
                                                            {stats.messages.toLocaleString()}
                                                        </p>
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
                                                        <StatSkeleton />
                                                    ) : (
                                                        <p className="text-2xl font-bold text-gray-900">
                                                            {getPlanDisplayName(stats.planType)}
                                                        </p>
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
                                                        <StatSkeleton />
                                                    ) : (
                                                        <p className="text-2xl font-bold text-gray-900">
                                                            {stats.apiKeys}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Info */}
                                    <div className="mt-6 pt-4 border-t border-gray-200">
                                        <div className="flex items-center justify-between text-sm text-gray-500">
                                            <span>
                                                Last updated: {stats.lastRefresh 
                                                    ? stats.lastRefresh.toLocaleTimeString() 
                                                    : 'Loading...'}
                                            </span>
                                            <div className="flex items-center">
                                                {!stats.loading && (
                                                    <span className="flex items-center text-green-500">
                                                        <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                                                        Data loaded successfully
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                );
            case 'chat':
                return (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[600px]">
                        <Chat username={username} />
                    </div>
                );
            case 'billing':
                return (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <InvoicePage key={`invoice-${refreshKey}`} />
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <PlanUpgrade onUpgradeSuccess={handleUpgradeSuccess} currentPlan={stats.planType} loading={stats.loading} />
                        </div>
                    </div>
                );
            case 'api':
                return (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <ApiKeyManager onApiKeyChange={() => setRefreshKey(prev => prev + 1)} />
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
                                        {username?.charAt(0)?.toUpperCase() || 'U'}
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