import React, { useState, useEffect } from "react";
import Login from "./components/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import { getTenantInfo } from "./services/api.js"; // Token validation için

const LoadingScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4 animate-pulse">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            </div>
            <div className="flex items-center justify-center space-x-2">
                <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-lg text-gray-700 font-medium">Loading application...</span>
            </div>
            <p className="text-gray-500 mt-2 text-sm">Please wait while we set up your workspace</p>
        </div>
    </div>
);

const ErrorBoundary = ({ children }) => {
    const [hasError, setHasError] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const handleError = (error) => {
            setHasError(true);
            setError(error);
        };

        const handleUnhandledRejection = (event) => {
            setHasError(true);
            setError(new Error(event.reason));
        };

        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, []);

    if (hasError) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full text-center">
                    <div className="mx-auto h-16 w-16 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
                        <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
                    <p className="text-gray-600 mb-6">We're sorry, but something unexpected happened.</p>
                    <button
                        onClick={() => {
                            setHasError(false);
                            setError(null);
                            window.location.reload();
                        }}
                        className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                        Reload Application
                    </button>
                    {process.env.NODE_ENV === 'development' && error && (
                        <div className="mt-6 p-4 bg-gray-100 rounded-lg text-left">
                            <h3 className="font-medium text-gray-900 mb-2">Error Details:</h3>
                            <pre className="text-sm text-red-600 overflow-auto">
                                {error.toString()}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return children;
};

const App = () => {
    const [token, setToken] = useState(null);
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(true);
    const [validatingToken, setValidatingToken] = useState(false);

    // Token validation function
    const validateStoredToken = async (storedToken) => {
        try {
            setValidatingToken(true);
            // API çağrısı yaparak token'ın geçerli olup olmadığını kontrol et
            await getTenantInfo();
            return true;
        } catch (error) {
            console.warn('Stored token is invalid:', error);
            // Token geçersizse localStorage'dan temizle
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            return false;
        } finally {
            setValidatingToken(false);
        }
    };

    // Check for token in localStorage on initial load
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const storedToken = localStorage.getItem('token');
                const storedUsername = localStorage.getItem('username');
                
                if (storedToken && storedUsername) {
                    // Token'ı validate et
                    const isValid = await validateStoredToken(storedToken);
                    
                    if (isValid) {
                        setToken(storedToken);
                        setUsername(storedUsername);
                    }
                }
            } catch (error) {
                console.error('Error initializing authentication:', error);
                // Hata durumunda localStorage'ı temizle
                localStorage.removeItem('token');
                localStorage.removeItem('username');
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const handleLogin = (jwt, user) => {
        setToken(jwt);
        setUsername(user);
        localStorage.setItem('token', jwt);
        localStorage.setItem('username', user);
    };

    const handleLogout = () => {
        setToken(null);
        setUsername('');
        localStorage.removeItem('token');
        localStorage.removeItem('username');
    };

    // Loading state - initial app load veya token validation
    if (loading || validatingToken) {
        return <LoadingScreen />;
    }

    return (
        <ErrorBoundary>
            {!token ? (
                <Login onLogin={handleLogin} />
            ) : (
                <Dashboard username={username} onLogout={handleLogout} />
            )}
        </ErrorBoundary>
    );
};

export default App;