import React, { useState } from 'react';
import Chat from '../components/Chat.jsx';
import InvoicePage from './InvoicePage.jsx';
import PlanInfo from './PlanInfo.jsx';
import PlanUpgrade from '../components/PlanUpgrade.jsx';
import ApiKeyManager from '../components/ApiKeyManager.jsx';

const Dashboard = ({ token, username, onLogout }) => {
    const [refreshKey, setRefreshKey] = useState(0);
    const [activeTab, setActiveTab] = useState('overview');

    const handleUpgradeSuccess = () => {
        setRefreshKey(prev => prev + 1);
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

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <div className="flex items-center">
                                        <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                        <div className="ml-4">
                                            <p className="text-sm font-medium text-gray-600">Messages</p>
                                            <p className="text-2xl font-bold text-gray-900">24</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4">
                                    <div className="flex items-center">
                                        <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                        </svg>
                                        <div className="ml-4">
                                            <p className="text-sm font-medium text-gray-600">Active Plan</p>
                                            <p className="text-2xl font-bold text-gray-900">Basic</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-4">
                                    <div className="flex items-center">
                                        <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2 2 2 0 11-4 0c0-1.1.9-2 2-2zM7 7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V9a2 2 0 00-2-2H7z" />
                                        </svg>
                                        <div className="ml-4">
                                            <p className="text-sm font-medium text-gray-600">API Keys</p>
                                            <p className="text-2xl font-bold text-gray-900">2</p>
                                        </div>
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