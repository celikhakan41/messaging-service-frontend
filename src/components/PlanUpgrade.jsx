import React, { useState, useEffect } from 'react';

const PlanUpgrade = ({ token, onUpgradeSuccess }) => {
    const [selectedPlan, setSelectedPlan] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentPlan, setCurrentPlan] = useState('');
    const [loadingCurrentPlan, setLoadingCurrentPlan] = useState(true);

    const planDetails = {
        'BASIC': {
            name: 'Basic',
            price: 9.99,
            color: 'from-blue-500 to-blue-600',
            textColor: 'text-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            features: [
                'Up to 100 messages/month',
                'Basic WebSocket support',
                'Email support',
                '1 API key'
            ]
        },
        'PREMIUM': {
            name: 'Premium',
            price: 29.99,
            color: 'from-purple-500 to-purple-600',
            textColor: 'text-purple-600',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200',
            features: [
                'Up to 10,000 messages/month',
                'Advanced WebSocket features',
                'Priority support',
                '5 API keys',
                'Message history'
            ],
            popular: true
        },
        'ENTERPRISE': {
            name: 'Enterprise',
            price: 99.99,
            color: 'from-yellow-500 to-orange-600',
            textColor: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
            borderColor: 'border-yellow-200',
            features: [
                'Unlimited messages',
                'Full WebSocket features',
                '24/7 dedicated support',
                'Unlimited API keys',
                'Advanced analytics',
                'Custom integrations'
            ]
        }
    };

    useEffect(() => {
        const fetchCurrentPlan = async () => {
            try {
                const response = await fetch('/api/tenant', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await response.json();
                setCurrentPlan(data.planType);
            } catch (error) {
                console.error('Failed to fetch current plan:', error);
            } finally {
                setLoadingCurrentPlan(false);
            }
        };

        if (token) {
            fetchCurrentPlan();
        }
    }, [token]);

    const availablePlans = Object.keys(planDetails).filter(plan => plan !== currentPlan);

    const handleUpgrade = async () => {
        if (!selectedPlan || selectedPlan === currentPlan) {
            alert('Please select a different plan.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/tenant/plan', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ planType: selectedPlan })
            });

            const data = await response.json();

            alert(`Invoice created for ${planDetails[selectedPlan].name} plan! Amount: ${data.amount}`);
            if (onUpgradeSuccess) onUpgradeSuccess();
            setSelectedPlan('');
        } catch (error) {
            console.error('Plan upgrade failed:', error);
            alert('Plan upgrade failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loadingCurrentPlan) {
        return (
            <div className="animate-pulse">
                <div className="h-6 bg-gray-300 rounded w-32 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-20 bg-gray-300 rounded"></div>
                    <div className="h-12 bg-gray-300 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Upgrade Plan</h3>
                    <p className="text-sm text-gray-500 mt-1">Choose a plan that fits your needs</p>
                </div>
                <div className="text-sm text-gray-500">
                    Current: <span className="font-semibold text-gray-900">{planDetails[currentPlan]?.name}</span>
                </div>
            </div>

            {availablePlans.length === 0 ? (
                <div className="text-center py-8 bg-green-50 rounded-lg border border-green-200">
                    <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <h3 className="text-lg font-medium text-green-800 mt-2">You're on the highest plan!</h3>
                    <p className="text-sm text-green-600 mt-1">You have access to all our premium features.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Plan Selection */}
                    <div className="grid gap-4">
                        {availablePlans.map((planType) => {
                            const plan = planDetails[planType];
                            const isSelected = selectedPlan === planType;

                            return (
                                <div
                                    key={planType}
                                    className={`relative rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                                        isSelected
                                            ? `${plan.borderColor} bg-white shadow-lg`
                                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                                    }`}
                                    onClick={() => setSelectedPlan(planType)}
                                >
                                    {plan.popular && (
                                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                            <span className="bg-purple-600 text-white px-3 py-1 text-xs font-semibold rounded-full">
                                                Most Popular
                                            </span>
                                        </div>
                                    )}

                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center">
                                                <div className={`h-10 w-10 rounded-lg bg-gradient-to-r ${plan.color} flex items-center justify-center mr-4`}>
                                                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-semibold text-gray-900">{plan.name}</h4>
                                                    <p className="text-sm text-gray-500">Perfect for growing teams</p>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-gray-900">
                                                    ${plan.price}
                                                </div>
                                                <div className="text-sm text-gray-500">per month</div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            {plan.features.map((feature, index) => (
                                                <div key={index} className="flex items-center text-sm">
                                                    <svg className="h-4 w-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    <span className="text-gray-600">{feature}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {isSelected && (
                                        <div className="absolute inset-0 rounded-xl border-2 border-blue-500 pointer-events-none">
                                            <div className="absolute top-2 right-2">
                                                <div className="bg-blue-500 text-white rounded-full p-1">
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Upgrade Button */}
                    <div className="flex justify-center pt-4">
                        <button
                            onClick={handleUpgrade}
                            disabled={loading || !selectedPlan}
                            className={`px-8 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
                                selectedPlan
                                    ? `bg-gradient-to-r ${planDetails[selectedPlan]?.color} hover:shadow-lg transform hover:-translate-y-0.5`
                                    : 'bg-gray-400 cursor-not-allowed'
                            } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating Invoice...
                                </div>
                            ) : selectedPlan ? (
                                `Upgrade to ${planDetails[selectedPlan].name} - $${planDetails[selectedPlan].price}/month`
                            ) : (
                                'Select a Plan to Upgrade'
                            )}
                        </button>
                    </div>

                    {/* Billing Note */}
                    <div className="text-center text-sm text-gray-500 mt-4">
                        <p>💡 You'll receive an invoice to complete the upgrade process</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlanUpgrade;