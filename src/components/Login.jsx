import React, { useState, useRef, useEffect } from 'react';
import { login } from '../services/api.js';
import Register from './Register.jsx';

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showRegister, setShowRegister] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    
    // Refs for focus management
    const usernameRef = useRef(null);
    const passwordRef = useRef(null);

    // Focus username input on mount
    useEffect(() => {
        if (usernameRef.current) {
            usernameRef.current.focus();
        }
    }, []);

    const validateForm = () => {
        const newErrors = {};
        
        // Username validation
        if (!username.trim()) {
            newErrors.username = 'Username is required';
        } else if (username.trim().length < 2) {
            newErrors.username = 'Username must be at least 2 characters';
        }
        
        // Password validation
        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 3) {
            newErrors.password = 'Password must be at least 3 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const clearFieldError = (field) => {
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Clear any previous submit errors
        clearFieldError('submit');
        
        if (!validateForm()) {
            // Focus first invalid field
            if (errors.username && usernameRef.current) {
                usernameRef.current.focus();
            } else if (errors.password && passwordRef.current) {
                passwordRef.current.focus();
            }
            return;
        }

        setLoading(true);
        
        try {
            const response = await login(username.trim(), password);
            
            if (response.data?.token) {
                localStorage.setItem('token', response.data.token);
                onLogin(response.data.token, username.trim());
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            console.error('Login error:', error);
            
            let errorMessage = 'Login failed. Please try again.';
            
            if (error.response?.status === 401) {
                errorMessage = 'Invalid username or password.';
            } else if (error.response?.status === 429) {
                errorMessage = 'Too many login attempts. Please try again later.';
            } else if (error.response?.status >= 500) {
                errorMessage = 'Server error. Please try again later.';
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            
            setErrors({ submit: errorMessage });
            
            // Focus password field for retry
            if (passwordRef.current) {
                passwordRef.current.focus();
                passwordRef.current.select();
            }
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSubmit(e);
        }
    };

    if (showRegister) {
        return (
            <Register 
                onRegisterSuccess={() => {
                    setShowRegister(false);
                    // Clear any existing errors when switching back
                    setErrors({});
                }} 
            />
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Logo/Brand Section */}
                <div className="text-center mb-8">
                    <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
                        <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
                    <p className="text-gray-600 mt-2">Sign in to your messaging account</p>
                </div>

                {/* Login Form */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                        {/* Submit Error */}
                        {errors.submit && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start">
                                <svg className="h-5 w-5 mr-2 mt-0.5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{errors.submit}</span>
                            </div>
                        )}

                        {/* Username Field */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                                Username
                            </label>
                            <input
                                id="username"
                                ref={usernameRef}
                                type="text"
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value);
                                    clearFieldError('username');
                                }}
                                onKeyPress={handleKeyPress}
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                    errors.username ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                                placeholder="Enter your username"
                                autoComplete="username"
                                disabled={loading}
                                aria-invalid={errors.username ? 'true' : 'false'}
                                aria-describedby={errors.username ? 'username-error' : undefined}
                            />
                            {errors.username && (
                                <p id="username-error" className="text-red-600 text-xs mt-1 flex items-center">
                                    <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {errors.username}
                                </p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    ref={passwordRef}
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        clearFieldError('password');
                                    }}
                                    onKeyPress={handleKeyPress}
                                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                        errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                    }`}
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    disabled={loading}
                                    aria-invalid={errors.password ? 'true' : 'false'}
                                    aria-describedby={errors.password ? 'password-error' : undefined}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                    disabled={loading}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? (
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M9.878 9.878a3 3 0 014.242 4.242M6.464 6.464L4.93 4.93M6.464 6.464a10.044 10.044 0 012.343-1.64m-.707-1.597A11.03 11.03 0 0112 2c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-2.132 3.104m-3.53 3.53a3 3 0 11-4.243-4.243" />
                                        </svg>
                                    ) : (
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.274 4.057-5.065 7-9.543 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p id="password-error" className="text-red-600 text-xs mt-1 flex items-center">
                                    <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing in...
                                </div>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Register Link */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-600">
                            Don't have an account?{' '}
                            <button
                                type="button"
                                onClick={() => setShowRegister(true)}
                                disabled={loading}
                                className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors disabled:opacity-50"
                            >
                                Create Account
                            </button>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-8">
                    <p className="text-gray-500 text-sm">
                        Secure messaging platform for teams
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;