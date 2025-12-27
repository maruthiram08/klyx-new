'use client';

import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MessageSquare, X, Send, Bot, User, Loader2, Maximize2, Minimize2, TrendingUp, TrendingDown, Activity, Info } from 'lucide-react';
import { api } from '../api';
import { Typography } from './ui/Typography';
import { Button } from './ui/Button';
import { MarkdownRenderer } from './ui/MarkdownRenderer';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    isLoading?: boolean;
    tools?: { name: string; status: 'starting' | 'completed'; output?: any }[];
}

export default function ChatAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [threadId] = useState(() => uuidv4());
    const [isTyping, setIsTyping] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isTyping) return;

        const userMessage: Message = { id: uuidv4(), role: 'user', content: input };
        const assistantId = uuidv4();
        const assistantMessage: Message = { id: assistantId, role: 'assistant', content: '', isLoading: true };

        setMessages(prev => [...prev, userMessage, assistantMessage]);
        setInput('');
        setIsTyping(true);

        try {
            let accumulatedContent = '';
            await api.chatWithAI(input, threadId, (token) => {
                accumulatedContent += token;
                setMessages(prev => prev.map(msg =>
                    msg.id === assistantId
                        ? { ...msg, content: accumulatedContent, isLoading: false }
                        : msg
                ));
            });
        } catch (error) {
            console.error('Chat Error:', error);
            setMessages(prev => prev.map(msg =>
                msg.id === assistantId
                    ? { ...msg, content: "Sorry, I encountered an error. Please check if the AI service is running.", isLoading: false }
                    : msg
            ));
        } finally {
            setIsTyping(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-[#ccf32f] text-black rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center z-50 border-2 border-white"
            >
                <MessageSquare size={24} />
            </button>
        );
    }

    return (
        <div className={`
      fixed bottom-6 right-6 bg-white dark:bg-neutral-900 shadow-2xl rounded-[2rem] border border-neutral-200 dark:border-neutral-800 flex flex-col z-50 transition-all duration-300 overflow-hidden
      ${isMaximized ? 'w-[800px] h-[80vh]' : 'w-[400px] h-[600px]'}
    `}>
            {/* Header */}
            <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#ccf32f] rounded-xl flex items-center justify-center text-black">
                        <Bot size={20} />
                    </div>
                    <div>
                        <Typography variant="body" className="font-bold">Aura AI</Typography>
                        <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">Online</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsMaximized(!isMaximized)}
                        className="p-2 text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
                    >
                        {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-neutral-950/20">
                {messages.length === 0 && (
                    <div className="text-center py-12 px-6">
                        <div className="w-16 h-16 bg-neutral-50 dark:bg-neutral-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <TrendingUp className="text-[#ccf32f]" size={32} />
                        </div>
                        <Typography variant="h3" className="text-lg font-bold mb-2">How can I help you today?</Typography>
                        <Typography variant="body" className="text-sm text-neutral-400 mb-6">
                            Ask me about market prices, technical analysis, or compare your favorite stocks.
                        </Typography>
                        <div className="grid grid-cols-1 gap-2">
                            {[
                                "Price of Reliance?",
                                "Compare TCS and Infy",
                                "Is Zomato in an uptrend?",
                                "Analyze HDFC Bank fundamentals"
                            ].map(q => (
                                <button
                                    key={q}
                                    onClick={() => setInput(q)}
                                    className="p-3 text-xs text-left bg-neutral-50 dark:bg-neutral-900 hover:bg-[#ccf32f] hover:text-black rounded-xl transition-all border border-neutral-100 dark:border-neutral-800"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${m.role === 'assistant' ? 'bg-neutral-100 dark:bg-neutral-800' : 'bg-[#ccf32f] text-black'
                                }`}>
                                {m.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                            </div>
                            <div className={`p-4 rounded-2xl shadow-sm text-sm ${m.role === 'assistant'
                                ? 'bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800'
                                : 'bg-black text-white'
                                }`}>
                                {m.isLoading ? (
                                    <div className="flex gap-1.5 py-1">
                                        <div className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce delay-75"></div>
                                        <div className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce delay-150"></div>
                                    </div>
                                ) : (
                                    <div className="max-w-none">
                                        {m.role === 'assistant' ? (
                                            <MarkdownRenderer content={m.content} />
                                        ) : (
                                            <div className="whitespace-pre-wrap">{m.content}</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                <div className="flex gap-2 bg-neutral-50 dark:bg-neutral-800 p-2 rounded-2xl border border-neutral-100 dark:border-neutral-700">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask Aura anything..."
                        className="flex-1 bg-transparent border-none focus:outline-none px-2 text-sm"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${!input.trim() || isTyping
                            ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                            : 'bg-[#ccf32f] text-black hover:scale-105 active:scale-95'
                            }`}
                    >
                        {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );
}
