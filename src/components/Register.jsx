// components/Register.jsx
import React, { useState } from 'react';
import { register } from '../services/api.js';

const Register = ({ onRegisterSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};

        if (!username.trim()) {
            newErrors.username = 'Username is required';
        } else if (username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            await register(username, password);
            setErrors({ success: 'Registration successful! You can now log in.' });
            setTimeout(() => {
                onRegisterSuccess();
            }, 2000);
        } catch (error) {
            setErrors({
                submit: error.response?.data?.message || 'Registration failed. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };

    const getPasswordStrength = (password) => {
        if (!password) return { strength: 0, text: '', color: '' };

        let strength = 0;
        if (password.length >= 6) strength++;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;

        const levels = [
            { text: 'Very Weak', color: 'bg-red-500' },
            { text: 'Weak', color: 'bg-orange-500' },
            { text: 'Fair', color: 'bg-yellow-500' },
            { text: 'Good', color: 'bg-blue-500' },
            { text: 'Strong', color: 'bg-green-500' }
        ];

        return { strength, ...levels[strength] };
    };

    const passwordStrength = getPasswordStrength(password);

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Logo/Brand Section */}
                <div className="text-center mb-8">
                    <div className="mx-auto h-16 w-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl flex items-center justify-center mb-4">
                        <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
                    <p className="text-gray-600 mt-2">Join our messaging platform today</p>
                </div>

                {/* Register Form */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
                    <div className="space-y-6">
                        {errors.submit && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {errors.submit}
                            </div>
                        )}

                        {errors.success && (
                            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                                {errors.success}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value);
                                    if (errors.username) setErrors(prev => ({ ...prev, username: '' }));
                                }}
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                                    errors.username ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                                placeholder="Choose a username"
                            />
                            {errors.username && (
                                <p className="text-red-600 text-xs mt-1">{errors.username}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                                }}
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                                    errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                                placeholder="Create a strong password"
                            />
                            {password && (
                                <div className="mt-2">
                                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                        <span>Password strength</span>
                                        <span className="font-medium">{passwordStrength.text}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                                            style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                            {errors.password && (
                                <p className="text-red-600 text-xs mt-1">{errors.password}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
                                }}
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                                    errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                                placeholder="Confirm your password"
                            />
                            {confirmPassword && password === confirmPassword && (
                                <div className="flex items-center mt-1">
                                    <svg className="h-4 w-4 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-green-600 text-xs">Passwords match</span>
                                </div>
                            )}
                            {errors.confirmPassword && (
                                <p className="text-red-600 text-xs mt-1">{errors.confirmPassword}</p>
                            )}
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={loading || errors.success}
                            className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating Account...
                                </div>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </div>

                    <div className="mt-6 text-center">
                        <p className="text-gray-600">
                            Already have an account?{' '}
                            <button
                                type="button"
                                onClick={onRegisterSuccess}
                                className="text-green-600 hover:text-green-700 font-medium hover:underline transition-colors"
                            >
                                Sign In
                            </button>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-8">
                    <p className="text-gray-500 text-sm">
                        By creating an account, you agree to our terms of service
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;