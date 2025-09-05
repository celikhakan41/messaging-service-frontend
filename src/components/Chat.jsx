import React, { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { WS_URL } from '../services/api';

const Chat = ({ username }) => {
    const [messages, setMessages] = useState([]);
    const [receiver, setReceiver] = useState('');
    const [content, setContent] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const stompRef = useRef(null);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const socket = new SockJS(`${WS_URL}/ws?token=${token}`);
        const stompClient = new Client({
            webSocketFactory: () => socket,
            connectHeaders: { Authorization: `Bearer ${token}` },
            onConnect: () => {
                console.log("Connected via WebSocket");
                setIsConnected(true);
                // Backend'e göre her kullanıcının kendi topic'i var: /topic/public/{userId}
                stompClient.subscribe(`/topic/public/${username}`, msg => {
                    const parsed = JSON.parse(msg.body);
                    setMessages(prev => [...prev, parsed]);
                });
            },
            onStompError: frame => {
                console.error("WebSocket error", frame);
                setIsConnected(false);
            },
            onDisconnect: () => {
                setIsConnected(false);
            }
        });

        stompClient.activate();
        stompRef.current = stompClient;

        return () => {
            stompClient.deactivate();
            setIsConnected(false);
        };
    }, [username]);

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

    const send = () => {
        if (!content.trim()) {
            return;
        }

        if (!receiver.trim()) {
            alert('Please specify a receiver.');
            return;
        }

        if (stompRef.current && stompRef.current.connected) {
            const msg = {
                sender: username,
                receiver: receiver.trim(),
                content: content.trim(),
                timestamp: new Date().toISOString()
            };
            stompRef.current.publish({
                destination: "/app/chat.sendMessage",
                body: JSON.stringify(msg)
            });
            setContent('');
            setIsTyping(false);
        } else {
            alert('WebSocket connection could not be established. Please try again.');
        }
    };

    const handleKeyPress = (e) => {
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

    const isMyMessage = (message) => message.sender === username;

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
                        </p>
                    </div>
                </div>

                <div className="text-sm text-gray-500">
                    {messages.length} message{messages.length !== 1 ? 's' : ''}
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

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-500 mt-2">No messages yet</h3>
                            <p className="text-sm text-gray-400 mt-1">Start a conversation by sending a message</p>
                        </div>
                    </div>
                ) : (
                    messages.map((message, idx) => {
                        const isMe = isMyMessage(message);
                        return (
                            <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                                    isMe
                                        ? 'bg-blue-600 text-white rounded-br-sm'
                                        : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm shadow-sm'
                                }`}>
                                    {!isMe && (
                                        <div className="text-xs font-medium text-gray-500 mb-1">
                                            {message.sender}
                                        </div>
                                    )}
                                    <div className="text-sm leading-relaxed">
                                        {message.content}
                                    </div>
                                    <div className={`text-xs mt-1 ${
                                        isMe ? 'text-blue-100' : 'text-gray-400'
                                    }`}>
                                        {formatTime(message.timestamp)}
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
                            onKeyPress={handleKeyPress}
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
                        disabled={!content.trim() || !receiver.trim() || !isConnected}
                        className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chat;