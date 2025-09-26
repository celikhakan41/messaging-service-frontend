import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    CardElement,
    useElements,
    useStripe
} from '@stripe/react-stripe-js';
import { createPaymentIntent, createSubscription, createSetupIntent, getTenantInfo, getInvoices } from '../services/api';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Stripe error messages
const STRIPE_ERRORS = {
    'card_declined': 'Your card was declined. Please try a different card.',
    'expired_card': 'Your card has expired. Please use a different card.',
    'insufficient_funds': 'Insufficient funds. Please use a different card.',
    'incorrect_cvc': 'Your card\'s security code is incorrect.',
    'processing_error': 'An error occurred while processing your card.'
};

const CheckoutForm = ({ planType, planDetails, onSuccess, onError, onCancel, paymentType = 'subscription', invoiceId }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setProcessing(true);
        setError(null);

        try {
            const cardElement = elements.getElement(CardElement);
            if (!cardElement) {
                throw new Error('Card element not found');
            }

            if (paymentType === 'subscription') {
                // Elements subscription flow - tenantId is handled by backend from JWT
                // First get setup intent, then create subscription
                const { data: setupIntent } = await createSetupIntent();

                if (!setupIntent.clientSecret) {
                    throw new Error('Setup intent failed');
                }

                // Confirm card setup
                const { error: setupError, setupIntent: confirmedSetup } = await stripe.confirmCardSetup(
                    setupIntent.clientSecret,
                    {
                        payment_method: {
                            card: cardElement,
                            billing_details: {
                                name: 'Customer Name', // TODO: Get from user profile
                                email: 'customer@example.com' // TODO: Get from user profile
                            }
                        }
                    }
                );

                if (setupError) {
                    const errorMessage = STRIPE_ERRORS[setupError.code] || setupError.message;
                    setError(errorMessage);
                    if (onError) onError(setupError);
                    return;
                }

                // Create subscription with confirmed payment method
                const { data: subscription } = await createSubscription(planType);
                
                if (subscription.status === 'active') {
                    // Subscription successful - refresh tenant info
                    try {
                        await getTenantInfo(); // Refresh tenant data in background
                    } catch (refreshError) {
                        console.warn('Failed to refresh tenant info after successful payment:', refreshError);
                    }
                    if (onSuccess) onSuccess({ subscription, planType });
                } else if (subscription.latest_invoice?.payment_intent?.client_secret) {
                    // Additional authentication required
                    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
                        subscription.latest_invoice.payment_intent.client_secret,
                        {
                            payment_method: {
                                card: cardElement,
                                billing_details: {
                                    name: 'Customer Name',
                                    email: 'customer@example.com'
                                }
                            }
                        }
                    );

                    if (stripeError) {
                        const errorMessage = STRIPE_ERRORS[stripeError.code] || stripeError.message;
                        setError(errorMessage);
                        if (onError) onError(stripeError);
                    } else if (paymentIntent.status === 'succeeded') {
                        // Payment successful - refresh tenant info
                        try {
                            await getTenantInfo(); // Refresh tenant data in background
                        } catch (refreshError) {
                            console.warn('Failed to refresh tenant info after successful payment:', refreshError);
                        }
                        if (onSuccess) onSuccess({ paymentIntent, subscription, planType });
                    }
                }
            } else if (paymentType === 'invoice' && invoiceId) {
                // One-time payment for invoice
                const { data } = await createPaymentIntent(invoiceId);
                const { client_secret: clientSecret, amount } = data;

                const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                    payment_method: {
                        card: cardElement,
                        billing_details: {
                            name: 'Customer Name',
                            email: 'customer@example.com'
                        }
                    }
                });

                if (stripeError) {
                    const errorMessage = STRIPE_ERRORS[stripeError.code] || stripeError.message;
                    setError(errorMessage);
                    if (onError) onError(stripeError);
                } else if (paymentIntent.status === 'succeeded') {
                    // Invoice payment successful - refresh invoices list
                    try {
                        await getInvoices(); // Refresh invoices data in background
                    } catch (refreshError) {
                        console.warn('Failed to refresh invoices after successful payment:', refreshError);
                    }
                    if (onSuccess) onSuccess({ paymentIntent, invoiceId, amount });
                }
            }

        } catch (err) {
            console.error('Payment failed:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Payment failed';
            setError(errorMessage);
            if (onError) onError(err);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
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

            {/* Card Input */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Information
                </label>
                <div className="border border-gray-300 rounded-lg p-4 bg-white">
                    <CardElement
                        options={{
                            style: {
                                base: {
                                    fontSize: '16px',
                                    color: '#424770',
                                    '::placeholder': {
                                        color: '#aab7c4',
                                    },
                                },
                                invalid: {
                                    color: '#9e2146',
                                },
                            },
                        }}
                    />
                </div>
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
                    type="submit"
                    disabled={!stripe || processing}
                    className={`flex-1 bg-gradient-to-r ${planDetails.color} text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {processing ? (
                        <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing Payment...
                        </div>
                    ) : (
                        `Pay $${planDetails.price} - Upgrade to ${planDetails.name}`
                    )}
                </button>
            </div>

            {/* Security Notice */}
            <div className="text-center text-xs text-gray-500">
                <div className="flex items-center justify-center">
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Powered by Stripe - Your payment information is secure
                </div>
            </div>
        </form>
    );
};

const StripePayment = ({ planType, planDetails, onSuccess, onError, onCancel, paymentType = 'subscription', invoiceId }) => {
    return (
        <Elements stripe={stripePromise}>
            <CheckoutForm 
                planType={planType}
                planDetails={planDetails}
                onSuccess={onSuccess}
                onError={onError}
                onCancel={onCancel}
                paymentType={paymentType}
                invoiceId={invoiceId}
            />
        </Elements>
    );
};

export default StripePayment;