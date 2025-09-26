import React, { useState } from 'react';
import StripePayment from './StripePayment';
import CheckoutFlow from './CheckoutFlow';

const PlanUpgrade = ({ onUpgradeSuccess, currentPlan, loading: parentLoading }) => {
    const [selectedPlan, setSelectedPlan] = useState('');
    const [showPayment, setShowPayment] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('checkout'); // Default to checkout (Option A)
    // currentPlan artık props'tan geliyor, kendi state'imiz yok

    const planDetails = {
        'PRO': {
            name: 'Pro',
            price: 29.99,
            color: 'from-purple-500 to-purple-600',
            textColor: 'text-purple-600',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200',
            features: [
                '1,000 messages/day',
                '100 requests/minute',
                'Advanced WebSocket features',
                'Priority support',
                'Message history'
            ],
            popular: true
        },
        'ENTERPRISE': {
            name: 'Enterprise',
            price: 89.99,
            color: 'from-yellow-500 to-orange-600',
            textColor: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
            borderColor: 'border-yellow-200',
            features: [
                'Unlimited messages',
                'Unlimited requests/minute',
                'Full WebSocket features',
                '24/7 dedicated support',
                'Advanced analytics',
                'Custom integrations'
            ]
        }
    };

    // Artık kendi API çağrısı yapmıyoruz - currentPlan props'tan geliyor

    const availablePlans = Object.keys(planDetails).filter(plan => plan !== currentPlan);

    const handleUpgrade = (event) => {
        event.preventDefault();
        if (!selectedPlan || selectedPlan === currentPlan) {
            alert('Please select a different plan.');
            return;
        }
        setShowPayment(true);
    };

    // Stripe payment success handler
    const handlePaymentSuccess = () => {
        alert(`Payment successful! Welcome to ${planDetails[selectedPlan].name} plan!`);
        setShowPayment(false);
        setSelectedPlan('');
        if (onUpgradeSuccess) onUpgradeSuccess();
    };

    // Stripe payment error handler
    const handlePaymentError = (error) => {
        console.error('Payment failed:', error);
        // Error message zaten StripePayment component'inde gösteriliyor
    };

    // Payment cancel handler
    const handlePaymentCancel = () => {
        setShowPayment(false);
    };

    if (parentLoading || !currentPlan) {
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
                            disabled={parentLoading || !selectedPlan}
                            className={`px-8 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
                                selectedPlan
                                    ? `bg-gradient-to-r ${planDetails[selectedPlan]?.color} hover:shadow-lg transform hover:-translate-y-0.5`
                                    : 'bg-gray-400 cursor-not-allowed'
                            } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                        >
                            {parentLoading ? (
                                <div className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Loading...
                                </div>
                            ) : selectedPlan ? (
                                `Continue with ${planDetails[selectedPlan].name} - $${planDetails[selectedPlan].price}/month`
                            ) : (
                                'Select a Plan to Upgrade'
                            )}
                        </button>
                    </div>

                    {/* Primary Action - Checkout */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center mb-2">
                            <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h4 className="text-sm font-semibold text-blue-900">Secure Stripe Checkout</h4>
                            <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded-full">Recommended</span>
                        </div>
                        <p className="text-sm text-blue-700">
                            Fast, secure payment with saved cards and mobile optimization
                        </p>
                    </div>

                    {/* Alternative Option */}
                    <details className="mt-4">
                        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                            Advanced: Use card form instead
                        </summary>
                        <div className="mt-3 p-3 bg-gray-50 rounded border-l-4 border-gray-300">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="elements"
                                    checked={paymentMethod === 'elements'}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                    Use embedded card form
                                </span>
                            </label>
                        </div>
                    </details>

                    {/* Billing Note */}
                    <div className="text-center text-sm text-gray-500 mt-4">
                        <p>💳 Secure payment powered by Stripe</p>
                    </div>
                </div>
            )}

            {/* Stripe Payment Modal */}
            {showPayment && selectedPlan && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900">Complete Payment</h3>
                                <button
                                    onClick={handlePaymentCancel}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            {paymentMethod === 'checkout' ? (
                                <CheckoutFlow
                                    planType={selectedPlan}
                                    planDetails={planDetails[selectedPlan]}
                                    onSuccess={handlePaymentSuccess}
                                    onError={handlePaymentError}
                                    onCancel={handlePaymentCancel}
                                />
                            ) : (
                                <StripePayment
                                    planType={selectedPlan}
                                    planDetails={planDetails[selectedPlan]}
                                    onSuccess={handlePaymentSuccess}
                                    onError={handlePaymentError}
                                    onCancel={handlePaymentCancel}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlanUpgrade;