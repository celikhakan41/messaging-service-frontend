import React, { useEffect, useState } from 'react';
import { getInvoices, payInvoice as payInvoiceAPI } from '../services/api';

const InvoicePage = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [payingInvoices, setPayingInvoices] = useState(new Set());
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await getInvoices();
            setInvoices(response.data || []);
        } catch (err) {
            console.error('Failed to fetch invoices:', err);

            // Handle specific error cases
            if (err.response?.status === 403) {
                setError('Access denied. Invoice features may require a premium plan or additional permissions.');
            } else {
                setError(err.response?.data?.message || err.message || 'Failed to fetch invoices');
            }
        } finally {
            setLoading(false);
        }
    };

    const payInvoice = async (invoiceId) => {
        try {
            setPayingInvoices(prev => new Set(prev).add(invoiceId));

            // Use the API service for consistent error handling
            await payInvoiceAPI(invoiceId);

            alert("Payment successful!");
            fetchInvoices(); // Refresh list
        } catch (err) {
            console.error('Payment failed:', err);

            // Better error messaging
            const errorMessage = err.response?.data?.message || err.message || 'Payment failed';
            alert(`Payment failed: ${errorMessage}`);
        } finally {
            setPayingInvoices(prev => {
                const newSet = new Set(prev);
                newSet.delete(invoiceId);
                return newSet;
            });
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PAID':
                return {
                    bg: 'bg-green-100',
                    text: 'text-green-800',
                    border: 'border-green-200',
                    icon: 'M5 13l4 4L19 7'
                };
            case 'PENDING':
                return {
                    bg: 'bg-yellow-100',
                    text: 'text-yellow-800',
                    border: 'border-yellow-200',
                    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                };
            case 'OVERDUE':
                return {
                    bg: 'bg-red-100',
                    text: 'text-red-800',
                    border: 'border-red-200',
                    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.768 0L4.046 16.5c-.77.833.192 2.5 1.732 2.5z'
                };
            default:
                return {
                    bg: 'bg-gray-100',
                    text: 'text-gray-800',
                    border: 'border-gray-200',
                    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                };
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    if (loading) {
        return (
            <div>
                <div className="flex items-center mb-6">
                    <div className="h-8 w-8 bg-gray-300 rounded-lg animate-pulse mr-3"></div>
                    <div className="h-6 bg-gray-300 rounded w-32 animate-pulse"></div>
                </div>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse">
                            <div className="flex justify-between items-center">
                                <div className="space-y-2">
                                    <div className="h-4 bg-gray-300 rounded w-24"></div>
                                    <div className="h-3 bg-gray-300 rounded w-32"></div>
                                </div>
                                <div className="h-8 bg-gray-300 rounded w-20"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <div className="flex items-center mb-6">
                    <div className="h-10 w-10 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Invoices</h2>
                        <p className="text-sm text-gray-500">Manage your billing and payments</p>
                    </div>
                </div>

                <div className="text-center py-8 bg-red-50 rounded-lg border border-red-200">
                    <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.768 0L4.046 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <h3 className="text-lg font-medium text-red-800 mt-2">Error Loading Invoices</h3>
                    <p className="text-sm text-red-600 mt-1">{error}</p>
                    <button
                        onClick={fetchInvoices}
                        className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <div className="h-10 w-10 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Invoices</h2>
                        <p className="text-sm text-gray-500">Manage your billing and payments</p>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <button
                        onClick={fetchInvoices}
                        disabled={loading}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 flex items-center transition-colors"
                    >
                        {loading ? (
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
                    <div className="text-sm text-gray-500">
                        {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
                    </div>
                </div>
            </div>

            {/* Invoices List */}
            {invoices.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mt-4">No invoices found</h3>
                    <p className="text-sm text-gray-500 mt-2">You don't have any invoices yet. Upgrade your plan to get started.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {invoices.map((invoice) => {
                        const statusColors = getStatusColor(invoice.status);
                        const isPaymentLoading = payingInvoices.has(invoice.id);

                        return (
                            <div key={invoice.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-3">
                                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusColors.bg} ${statusColors.text} ${statusColors.border}`}>
                                                <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={statusColors.icon} />
                                                </svg>
                                                {invoice.status}
                                            </div>
                                            <span className="text-sm text-gray-500">#{invoice.id.slice(-8)}</span>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-500 font-medium">Plan</p>
                                                <p className="text-gray-900 font-semibold">{invoice.requestedPlan}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 font-medium">Amount</p>
                                                <p className="text-gray-900 font-semibold text-lg">{formatCurrency(invoice.amount)}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 font-medium">Created</p>
                                                <p className="text-gray-900">{formatDate(invoice.createdAt)}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 font-medium">Due Date</p>
                                                <p className="text-gray-900">{invoice.dueDate ? formatDate(invoice.dueDate) : 'N/A'}</p>
                                            </div>
                                        </div>

                                        {invoice.paidAt && (
                                            <div className="mt-3 text-sm">
                                                <span className="text-gray-500">Paid on: </span>
                                                <span className="text-green-600 font-medium">{formatDate(invoice.paidAt)}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="ml-6 flex flex-col items-end space-y-2">
                                        {invoice.status === 'PENDING' && (
                                            <button
                                                onClick={() => payInvoice(invoice.id)}
                                                disabled={isPaymentLoading}
                                                className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isPaymentLoading ? (
                                                    <div className="flex items-center">
                                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Processing...
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center">
                                                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                                        </svg>
                                                        Pay Now
                                                    </div>
                                                )}
                                            </button>
                                        )}

                                        {invoice.status === 'PAID' && (
                                            <div className="flex items-center text-green-600">
                                                <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span className="text-sm font-medium">Paid</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Summary Stats */}
            {invoices.length > 0 && (
                <div className="mt-8 bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">
                                {invoices.filter(inv => inv.status === 'PAID').length}
                            </div>
                            <div className="text-sm text-gray-500">Paid Invoices</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">
                                {invoices.filter(inv => inv.status === 'PENDING').length}
                            </div>
                            <div className="text-sm text-gray-500">Pending</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {formatCurrency(
                                    invoices
                                        .filter(inv => inv.status === 'PAID')
                                        .reduce((sum, inv) => sum + inv.amount, 0)
                                )}
                            </div>
                            <div className="text-sm text-gray-500">Total Paid</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvoicePage;