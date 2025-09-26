import React, { useState } from 'react';
import { createCheckoutSession, getTenantInfo } from '../services/api';

const CheckoutFlow = ({ planType, planDetails, onSuccess, onError, onCancel }) => {
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);

    const handleCheckout = async () => {
        setProcessing(true);
        setError(null);

        try {
            // Create checkout session with success/cancel URLs
            const baseUrl = window.location.origin;
            const successUrl = `${baseUrl}/dashboard?success=true`;
            const cancelUrl = `${baseUrl}/dashboard?canceled=true`;

            const { data } = await createCheckoutSession(planType, 'subscription', successUrl, cancelUrl);

            if (data.url) {
                // Store upgrade info for success page handling
                localStorage.setItem('pendingUpgrade', JSON.stringify({
                    planType,
                    sessionId: data.id, // Store session ID for verification
                    timestamp: Date.now()
                }));

                // Redirect to Stripe Checkout
                window.location.assign(data.url);
            } else {
                throw new Error('No checkout URL received from server');
            }
        } catch (err) {
            console.error('Checkout failed:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Checkout failed';
            setError(errorMessage);
            if (onError) onError(err);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Plan Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-gray-900">{planDetails.name} Plan</h3>
                        <p className="text-sm text-gray-600">Monthly subscription</p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">${planDetails.price}</div>
                        <div className="text-sm text-gray-500">per month</div>
                    </div>
                </div>
            </div>

            {/* Features List */}
            <div className="space-y-2">
                <h4 className="font-medium text-gray-900">What's included:</h4>
                {planDetails.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-sm">
                        <svg className="h-4 w-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-600">{feature}</span>
                    </div>
                ))}
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex">
                        <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-sm text-red-700">{error}</div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={processing}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    onClick={handleCheckout}
                    disabled={processing}
                    className={`flex-1 bg-gradient-to-r ${planDetails.color} text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {processing ? (
                        <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Redirecting to Checkout...
                        </div>
                    ) : (
                        <>
                            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            Continue to Checkout - ${planDetails.price}/month
                        </>
                    )}
                </button>
            </div>

            {/* Process Info */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h5 className="text-sm font-medium text-gray-900">What happens next:</h5>
                <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex items-center">
                        <span className="w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs mr-2">1</span>
                        Secure payment on Stripe
                    </div>
                    <div className="flex items-center">
                        <span className="w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs mr-2">2</span>
                        Instant plan activation
                    </div>
                    <div className="flex items-center">
                        <span className="w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs mr-2">3</span>
                        Return to dashboard with new features
                    </div>
                </div>
            </div>

            {/* Security Notice */}
            <div className="text-center text-xs text-gray-500">
                <div className="flex items-center justify-center">
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Powered by Stripe - Secure checkout
                </div>
            </div>
        </div>
    );
};

export default CheckoutFlow;