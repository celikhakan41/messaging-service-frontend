import React, { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { WS_URL, sendMessage, getMessageHistory, getDailyUsage } from '../services/api';

// Utility function to decode JWT and extract tenantId
const getTenantIdFromToken = (token) => {
    try {
        if (!token) return null;
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(jsonPayload);
        return payload.tenantId || payload.tenant_id || null;
    } catch (error) {
        console.error('Failed to decode JWT token:', error);
        return null;
    }
};

const Chat = ({ username }) => {
    const [messages, setMessages] = useState([]);
    const [receiver, setReceiver] = useState('');
    const [content, setContent] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [dailyUsage, setDailyUsage] = useState(null);
    const [error, setError] = useState(null);
    const [tenantId, setTenantId] = useState(null);
    const stompRef = useRef(null);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const currentSubscription = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Extract tenantId from token
        const extractedTenantId = getTenantIdFromToken(token);
        setTenantId(extractedTenantId);

        const socket = new SockJS(`${WS_URL}/ws?token=${token}`);
        const stompClient = new Client({
            webSocketFactory: () => socket,
            connectHeaders: { Authorization: `Bearer ${token}` },
            onConnect: () => {
                console.log("Connected via WebSocket");
                setIsConnected(true);
                // Store the stomp client for dynamic subscriptions
                stompRef.current = stompClient;
            },
            onStompError: frame => {
                console.error("WebSocket error", frame);
                setIsConnected(false);
            },
            onDisconnect: () => {
                setIsConnected(false);
                if (currentSubscription.current) {
                    currentSubscription.current = null;
                }
            }
        });

        stompClient.activate();

        return () => {
            if (currentSubscription.current) {
                currentSubscription.current.unsubscribe();
                currentSubscription.current = null;
            }
            stompClient.deactivate();
            setIsConnected(false);
        };
    }, [username]);

    // Handle WebSocket subscription changes based on receiver
    useEffect(() => {
        if (!isConnected || !stompRef.current || !tenantId || !receiver.trim()) {
            // Unsubscribe from current subscription if no receiver
            if (currentSubscription.current) {
                currentSubscription.current.unsubscribe();
                currentSubscription.current = null;
            }
            return;
        }

        // Unsubscribe from previous subscription
        if (currentSubscription.current) {
            currentSubscription.current.unsubscribe();
            currentSubscription.current = null;
        }

        // Subscribe to bidirectional topics
        const receiverUser = receiver.trim();
        const topic1 = `/topic/chat.${tenantId}.${username}.${receiverUser}`;
        const topic2 = `/topic/chat.${tenantId}.${receiverUser}.${username}`;

        console.log(`Subscribing to topics: ${topic1} and ${topic2}`);

        const handleMessage = (msg) => {
            try {
                const parsed = JSON.parse(msg.body);
                console.log('Received message via WebSocket:', parsed);

                setMessages(prev => {
                    // Generate a robust key for duplicate detection
                    const keyOf = (m) => {
                        const id = m.id || m.messageId;
                        if (id) return `id:${id}`;
                        return [
                            m.timestamp,
                            (m.from || m.sender),
                            (m.to || m.receiver),
                            m.content
                        ].join('|');
                    };

                    const parsedKey = keyOf(parsed);

                    // Check if this message already exists (prevents duplicates from subscribing to two topics)
                    const alreadyExists = prev.some(m => !m.tempId && keyOf(m) === parsedKey);

                    if (alreadyExists) {
                        console.log('Message already exists, ensuring optimistic copy is removed');
                        // If the real message is already in the list, remove any matching optimistic one
                        const idxToRemove = (() => {
                            for (let i = prev.length - 1; i >= 0; i--) {
                                const m = prev[i];
                                if (
                                    m.tempId &&
                                    m.pending &&
                                    m.content === parsed.content &&
                                    (m.from || m.sender) === (parsed.from || parsed.sender) &&
                                    (m.to || m.receiver) === (parsed.to || parsed.receiver)
                                ) {
                                    return i;
                                }
                            }
                            return -1;
                        })();

                        if (idxToRemove !== -1) {
                            const newMessages = [...prev];
                            newMessages.splice(idxToRemove, 1);
                            return newMessages;
                        }
                        return prev;
                    }

                    // Find matching optimistic message (latest pending with same from/to/content)
                    // We avoid timestamp equality due to timezone differences; use recency vs now instead
                    const optimisticIndex = (() => {
                        for (let i = prev.length - 1; i >= 0; i--) {
                            const m = prev[i];
                            if (
                                m.tempId &&
                                m.pending &&
                                m.content === parsed.content &&
                                (m.from || m.sender) === (parsed.from || parsed.sender) &&
                                (m.to || m.receiver) === (parsed.to || parsed.receiver) &&
                                // created in the last 60s (client time)
                                Date.now() - new Date(m.timestamp).getTime() < 60_000
                            ) {
                                return i;
                            }
                        }
                        return -1;
                    })();

                    if (optimisticIndex !== -1) {
                        // Replace optimistic message with real one
                        console.log('Replacing optimistic message with WebSocket message');
                        const newMessages = [...prev];
                        newMessages[optimisticIndex] = { ...parsed, pending: false };
                        return newMessages;
                    }

                    // Add new message (from other user or no matching optimistic)
                    return [...prev, { ...parsed, pending: false }];
                });
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error);
            }
        };

        // Subscribe to both directions
        const subscription1 = stompRef.current.subscribe(topic1, handleMessage);
        const subscription2 = stompRef.current.subscribe(topic2, handleMessage);

        // Store subscriptions for cleanup
        currentSubscription.current = {
            unsubscribe: () => {
                subscription1.unsubscribe();
                subscription2.unsubscribe();
            }
        };

    }, [isConnected, tenantId, username, receiver]);

    // Load message history when receiver changes
    useEffect(() => {
        const loadMessageHistory = async () => {
            if (!receiver.trim()) {
                setMessages([]);
                return;
            }

            setIsLoadingHistory(true);
            setError(null);

            try {
                const response = await getMessageHistory(receiver.trim());
                setMessages(response.data || []);
            } catch (error) {
                console.error('Failed to load message history:', error);
                setError('Failed to load message history.');
                setMessages([]);
            } finally {
                setIsLoadingHistory(false);
            }
        };

        // Debounce the history loading to avoid too many requests
        const timeoutId = setTimeout(loadMessageHistory, 500);
        return () => clearTimeout(timeoutId);
    }, [receiver]);

    // Load daily usage on component mount
    useEffect(() => {
        const loadDailyUsage = async () => {
            try {
                const response = await getDailyUsage();
                setDailyUsage(response.data);
            } catch (error) {
                console.warn('Failed to load daily usage:', error);
            }
        };

        loadDailyUsage();
    }, []);

    const handleTyping = (value) => {
        setContent(value);
        setIsTyping(true);

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
        }, 1000);
    };

    const send = async () => {
        if (!content.trim()) {
            return;
        }

        if (!receiver.trim()) {
            alert('Please specify a receiver.');
            return;
        }

        setIsSending(true);
        setError(null);

        const messageContent = content.trim();
        const tempId = `temp-${Date.now()}-${Math.random()}`;

        try {
            // Optimistic UI: Add message immediately with temporary ID
            const optimisticMessage = {
                from: username,
                to: receiver.trim(),
                content: messageContent,
                timestamp: new Date().toISOString(),
                pending: true,
                tempId: tempId
            };
            setMessages(prev => [...prev, optimisticMessage]);

            // Clear input immediately for better UX
            setContent('');
            setIsTyping(false);

            // Send via REST API (primary method)
            // REST API already triggers WebSocket broadcast
            // WebSocket handler will replace the optimistic message
            await sendMessage(receiver.trim(), messageContent);

            // Refresh daily usage after successful send
            try {
                const usageResponse = await getDailyUsage();
                setDailyUsage(usageResponse.data);
            } catch (err) {
                console.warn('Failed to refresh daily usage:', err);
            }

        } catch (error) {
            console.error('Failed to send message:', error);

            // Remove optimistic message on error
            setMessages(prev => prev.filter(msg => msg.tempId !== tempId));

            // Handle specific error cases
            if (error.response?.status === 429) {
                setError('Daily message limit reached. Please upgrade your plan or try again tomorrow.');
            } else if (error.response?.status === 404) {
                setError('User not found. Please check the username and try again.');
            } else if (error.response?.status === 400) {
                setError('Invalid message. Please check your input and try again.');
            } else {
                setError('Failed to send message. Please try again.');
            }
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const isMyMessage = (message) => (message.sender || message.from) === username;

    return (
        <div className="flex flex-col h-full">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${
                            isConnected ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Chat Messages</h3>
                        <p className="text-sm text-gray-500">
                            {isConnected ? 'Connected' : 'Disconnected'}
                            {tenantId && ` • Tenant: ${tenantId}`}
                            {receiver && ` • Chatting with: ${receiver}`}
                        </p>
                    </div>
                </div>

                <div className="text-sm text-gray-500">
                    {isLoadingHistory ? 'Loading...' : `${messages.length} message${messages.length !== 1 ? 's' : ''}`}
                    {dailyUsage && (
                        <div className="text-xs mt-1">
                            {dailyUsage.dailyLimit === -1
                                ? `${dailyUsage.dailyUsage} sent today`
                                : `${dailyUsage.dailyUsage}/${dailyUsage.dailyLimit} sent today`
                            }
                        </div>
                    )}
                </div>
            </div>

            {/* Receiver Input */}
            <div className="p-4 bg-blue-50 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <input
                        type="text"
                        value={receiver}
                        onChange={(e) => setReceiver(e.target.value)}
                        placeholder="Enter receiver's username"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-red-50 border-b border-red-200">
                    <div className="flex items-center space-x-2">
                        <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-red-700">{error}</span>
                        <button
                            onClick={() => setError(null)}
                            className="ml-auto text-red-500 hover:text-red-700"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {isLoadingHistory ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <svg className="animate-spin h-8 w-8 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="text-sm text-gray-500 mt-2">Loading conversation...</p>
                        </div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-500 mt-2">
                                {receiver ? `No messages with ${receiver}` : 'No messages yet'}
                            </h3>
                            <p className="text-sm text-gray-400 mt-1">
                                {receiver ? 'Start a conversation by sending a message' : 'Enter a username to start chatting'}
                            </p>
                        </div>
                    </div>
                ) : (
                    messages.map((message, idx) => {
                        const isMe = isMyMessage(message);
                        const isPending = message.pending;
                        return (
                            <div key={(message.tempId || message.id || message.messageId || message.timestamp || idx)} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl relative ${
                                    isMe
                                        ? `${isPending ? 'bg-blue-400' : 'bg-blue-600'} text-white rounded-br-sm`
                                        : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm shadow-sm'
                                } ${isPending ? 'opacity-70' : ''}`}>
                                    {!isMe && (
                                        <div className="text-xs font-medium text-gray-500 mb-1">
                                            {message.sender || message.from}
                                        </div>
                                    )}
                                    <div className="text-sm leading-relaxed">
                                        {message.content}
                                    </div>
                                    <div className={`text-xs mt-1 flex items-center ${
                                        isMe ? 'text-blue-100' : 'text-gray-400'
                                    }`}>
                                        <span>{formatTime(message.timestamp)}</span>
                                        {isPending && isMe && (
                                            <div className="ml-2 flex items-center">
                                                <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-gray-200">
                <div className="flex items-end space-x-3">
                    <div className="flex-1">
                        <textarea
                            value={content}
                            onChange={(e) => handleTyping(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your message..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                            rows="1"
                            style={{ minHeight: '44px', maxHeight: '120px' }}
                        />
                        {isTyping && (
                            <div className="text-xs text-gray-400 mt-1 ml-4">
                                Typing...
                            </div>
                        )}
                    </div>
                    <button
                        onClick={send}
                        disabled={!content.trim() || !receiver.trim() || (dailyUsage && dailyUsage.dailyLimit !== -1 && dailyUsage.dailyUsage >= dailyUsage.dailyLimit)}
                        className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={
                            dailyUsage && dailyUsage.dailyLimit !== -1 && dailyUsage.dailyUsage >= dailyUsage.dailyLimit
                                ? 'Daily message limit reached'
                                : isSending
                                ? 'Sending...'
                                : 'Send message'
                        }
                    >
                        {isSending ? (
                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chat;
