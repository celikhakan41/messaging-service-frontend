import React, { useEffect, useState } from 'react';
import axios from 'axios';

const PlanInfo = ({ token }) => {
    const [tenant, setTenant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTenantInfo = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/api/tenant', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTenant(response.data);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch tenant info:', err);
                setError(err.response?.data?.message || 'Failed to load plan information');
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchTenantInfo();
        }
    }, [token]);

    const getPlanColor = (planType) => {
        const colors = {
            'BASIC': 'from-blue-500 to-blue-600',
            'PREMIUM': 'from-purple-500 to-purple-600',
            'ENTERPRISE': 'from-gold-500 to-yellow-600'
        };
        return colors[planType] || 'from-gray-500 to-gray-600';
    };

    const getPlanIcon = (planType) => {
        switch (planType) {
            case 'BASIC':
                return (
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                );
            case 'PREMIUM':
                return (
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
                    </svg>
                );
            case 'ENTERPRISE':
                return (
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                );
            default:
                return (
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
        }
    };

    const getPlanFeatures = (planType) => {
        const features = {
            'BASIC': [
                'Up to 100 messages/month',
                'Basic WebSocket support',
                'Email support',
                '1 API key'
            ],
            'PREMIUM': [
                'Up to 10,000 messages/month',
                'Advanced WebSocket features',
                'Priority support',
                '5 API keys',
                'Message history'
            ],
            'ENTERPRISE': [
                'Unlimited messages',
                'Full WebSocket features',
                '24/7 dedicated support',
                'Unlimited API keys',
                'Advanced analytics',
                'Custom integrations'
            ]
        };
        return features[planType] || [];
    };

    if (loading) {
        return (
            <div className="animate-pulse">
                <div className="flex items-center mb-4">
                    <div className="h-8 w-8 bg-gray-300 rounded-lg mr-3"></div>
                    <div className="h-6 bg-gray-300 rounded w-32"></div>
                </div>
                <div className="space-y-3">
                    <div className="h-4 bg-gray-300 rounded w-full"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-6">
                <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.768 0L4.046 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mt-2">Error Loading Plan</h3>
                <p className="text-sm text-gray-500 mt-1">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-3 text-blue-600 hover:text-blue-500 text-sm font-medium"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (!tenant) {
        return (
            <div className="text-center py-6">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mt-2">No Plan Information</h3>
                <p className="text-sm text-gray-500 mt-1">Unable to load your current plan details</p>
            </div>
        );
    }

    const planFeatures = getPlanFeatures(tenant.planType);

    return (
        <div>
            <div className="flex items-center mb-6">
                <div className={`h-10 w-10 bg-gradient-to-r ${getPlanColor(tenant.planType)} rounded-xl flex items-center justify-center text-white mr-4`}>
                    {getPlanIcon(tenant.planType)}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Current Plan</h2>
                    <p className="text-sm text-gray-500">Your subscription details</p>
                </div>
            </div>

            <div className="space-y-4">
                {/* Plan Badge */}
                <div className={`inline-flex items-center px-4 py-2 rounded-full text-white bg-gradient-to-r ${getPlanColor(tenant.planType)}`}>
                    <span className="text-sm font-semibold uppercase tracking-wide">
                        {tenant.planType} Plan
                    </span>
                </div>

                {/* Plan Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center">
                            <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-600">Tenant ID</span>
                        </div>
                        <p className="text-sm text-gray-900 mt-1 font-mono">{tenant.id}</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center">
                            <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8a2 2 0 11-4 0 2 2 0 014 0zM12 17v4" />
                            </svg>
                            <span className="text-sm font-medium text-gray-600">Created</span>
                        </div>
                        <p className="text-sm text-gray-900 mt-1">
                            {new Date(tenant.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>
                </div>

                {/* Plan Features */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Plan Features</h3>
                    <div className="space-y-2">
                        {planFeatures.map((feature, index) => (
                            <div key={index} className="flex items-center">
                                <svg className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-sm text-gray-600">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Usage Stats (placeholder) */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-800">This Month's Usage</span>
                        <span className="text-xs text-blue-600">Updated daily</span>
                    </div>
                    <div className="flex items-center">
                        <div className="flex-1 bg-blue-200 rounded-full h-2 mr-3">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '23%' }}></div>
                        </div>
                        <span className="text-sm font-semibold text-blue-800">
                            {tenant.planType === 'BASIC' ? '23/100' :
                                tenant.planType === 'PREMIUM' ? '2,340/10,000' :
                                    '∞'} messages
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlanInfo;