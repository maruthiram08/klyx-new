'use client';

import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Bot, User, Loader2, Send, TrendingUp, Sparkles, ArrowRight, Zap, BarChart3 } from 'lucide-react';
import { api } from '../api';
import { Typography } from './ui/Typography';
import { MarkdownRenderer } from './ui/MarkdownRenderer';
import { ChatSidebar } from './ai/ChatSidebar';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    isLoading?: boolean;
}

interface ChatInterfaceProps {
    embedded?: boolean;
    initialMaximized?: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
    embedded = false,
    initialMaximized = true
}) => {
    const [isMaximized, setIsMaximized] = useState(initialMaximized);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [threads, setThreads] = useState<any[]>([]);
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [input]);

    // Initial load: Fetch threads
    useEffect(() => {
        if (isMaximized) {
            fetchThreads();
        }
    }, [isMaximized]);

    // Fetch history when thread changes
    useEffect(() => {
        if (activeThreadId) {
            fetchHistory(activeThreadId);
        } else {
            setMessages([]);
            if (textareaRef.current) textareaRef.current.focus();
        }
    }, [activeThreadId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchThreads = async () => {
        try {
            const res = await api.getChatThreads();
            if (res.status === 'success') {
                setThreads(res.data);
            }
        } catch (error) {
            console.error('Fetch threads error:', error);
        }
    };

    const fetchHistory = async (id: string) => {
        setIsInitialLoading(true);
        try {
            const res = await api.getChatHistory(id);
            if (res.status === 'success') {
                setMessages(res.data.messages);
            }
        } catch (error) {
            console.error('Fetch history error:', error);
        } finally {
            setIsInitialLoading(false);
        }
    };

    const handleNewChat = () => {
        setActiveThreadId(null);
        setMessages([]);
    };

    const handleDeleteThread = async (id: string) => {
        try {
            await api.deleteChatThread(id);
            setThreads(prev => prev.filter(t => t.id !== id));
            if (activeThreadId === id) {
                setActiveThreadId(null);
                setMessages([]);
            }
        } catch (error) {
            console.error('Delete thread error:', error);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || isTyping) return;

        const currentInput = input;
        setInput('');

        const threadId = activeThreadId || uuidv4();

        const userMessage: Message = { id: uuidv4(), role: 'user', content: currentInput };
        const assistantId = uuidv4();
        const assistantMessage: Message = { id: assistantId, role: 'assistant', content: '', isLoading: true };

        setMessages(prev => [...prev, userMessage, assistantMessage]);
        setIsTyping(true);

        try {
            let accumulatedContent = '';
            await api.chatWithAI(currentInput, threadId, (token) => {
                accumulatedContent += token;
                setMessages(prev => prev.map(msg =>
                    msg.id === assistantId
                        ? { ...msg, content: accumulatedContent, isLoading: false }
                        : msg
                ));
            });

            if (!activeThreadId) {
                setActiveThreadId(threadId);
                fetchThreads();
            }
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

    const quickQuestions = [
        { icon: <TrendingUp size={16} />, text: "Price of Reliance?" },
        { icon: <Zap size={16} />, text: "Compare TCS and Infy" },
        { icon: <BarChart3 size={16} />, text: "Analyze HDFC Bank fundamentals" },
        { icon: <Sparkles size={16} />, text: "Is Zomato in an uptrend?" }
    ];

    return (
        <div className={`flex flex-1 min-w-0 font-sans ${embedded ? 'h-full bg-white dark:bg-neutral-900' : ''}`}>
            {/* Sidebar */}
            <ChatSidebar
                threads={threads}
                activeThreadId={activeThreadId}
                onSelectThread={setActiveThreadId}
                onNewChat={handleNewChat}
                onDeleteThread={handleDeleteThread}
                isMaximized={isMaximized}
            />

            {/* Main Chat Container */}
            <div className="flex-1 flex flex-col min-w-0 relative bg-white dark:bg-neutral-950">
                {/* Header for Mobile/Context */}
                {!embedded && (
                    <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md sticky top-0 z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-[#ccf32f] to-[#b0d125] rounded-xl flex items-center justify-center text-black shadow-sm">
                                <Bot size={18} />
                            </div>
                            <div>
                                <Typography variant="body" className="font-bold text-sm shrink-0 truncate max-w-[200px]">
                                    {activeThreadId ? threads.find(t => t.id === activeThreadId)?.title || 'Aura AI' : 'Aura AI'}
                                </Typography>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                    <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">Online</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Messages Area */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-800">
                    <div className="max-w-3xl mx-auto space-y-6">
                        {messages.length === 0 && !isInitialLoading && (
                            <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4 animate-fadeIn">
                                <div className="w-20 h-20 bg-gradient-to-br from-[#ccf32f]/20 to-[#ccf32f]/10 rounded-3xl flex items-center justify-center mb-6 shadow-inner ring-1 ring-[#ccf32f]/20">
                                    <Bot className="text-[#aebf2c]" size={40} />
                                </div>
                                <Typography variant="h2" className="text-2xl font-bold mb-3 tracking-tight">
                                    How can I help you analyze the market?
                                </Typography>
                                <Typography variant="body" className="text-neutral-400 mb-8 max-w-md mx-auto text-base">
                                    I can provide real-time quotes, technical analysis, and fundamental comparisons for Indian stocks.
                                </Typography>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                                    {quickQuestions.map((q) => (
                                        <button
                                            key={q.text}
                                            onClick={() => setInput(q.text)}
                                            className="group flex items-center gap-3 p-4 text-sm text-left bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-2xl transition-all border border-neutral-100 dark:border-neutral-800 hover:border-[#ccf32f]/50 hover:shadow-md"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 group-hover:bg-[#ccf32f] group-hover:text-black flex items-center justify-center text-neutral-400 transition-colors">
                                                {q.icon}
                                            </div>
                                            <span className="font-medium text-neutral-600 dark:text-neutral-300 group-hover:text-black dark:group-hover:text-white transition-colors">{q.text}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {isInitialLoading && (
                            <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
                                <div className="relative">
                                    <div className="w-12 h-12 border-4 border-[#ccf32f]/30 border-t-[#ccf32f] rounded-full animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-2 h-2 bg-[#ccf32f] rounded-full"></div>
                                    </div>
                                </div>
                                <span className="text-sm font-medium text-neutral-400 animate-pulse">Loading conversation...</span>
                            </div>
                        )}

                        {!isInitialLoading && messages.map((m) => (
                            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slideUp`}>
                                <div className={`flex gap-4 max-w-[90%] md:max-w-[80%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    {/* Avatar */}
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${m.role === 'assistant'
                                        ? 'bg-gradient-to-br from-[#ccf32f] to-[#b0d125] text-black'
                                        : 'bg-black dark:bg-neutral-800 text-white'
                                        }`}>
                                        {m.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
                                    </div>

                                    {/* Message Bubble */}
                                    <div className={`rounded-2xl px-5 py-4 shadow-sm text-[15px] leading-relaxed ${m.role === 'assistant'
                                        ? 'bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200'
                                        : 'bg-black text-white dark:bg-white dark:text-black'
                                        }`}>
                                        {m.isLoading ? (
                                            <div className="flex gap-1.5 py-1">
                                                <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                                                <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-75"></div>
                                                <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-150"></div>
                                            </div>
                                        ) : (
                                            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-a:text-[#aebf2c]">
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
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-lg">
                    <div className="max-w-3xl mx-auto relative">
                        <div className={`
                            flex items-end gap-2 p-2 rounded-[1.5rem] border transition-all duration-300
                            ${isTyping
                                ? 'bg-neutral-50 border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 opacity-80 cursor-not-allowed'
                                : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] focus-within:shadow-[0_4px_25px_-4px_rgba(204,243,47,0.2)] focus-within:border-[#ccf32f]'}
                        `}>
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder="Ask about stocks, market trends, or portfolio analysis..."
                                className="flex-1 bg-transparent border-none focus:outline-none px-4 py-3 min-h-[52px] max-h-[200px] text-[15px] placeholder:text-neutral-400 font-medium disabled:cursor-not-allowed resize-none overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-800"
                                disabled={isTyping}
                                rows={1}
                            />
                            <div className="pb-1.5 pr-1.5">
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isTyping}
                                    className={`
                                        w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200
                                        ${!input.trim() || isTyping
                                            ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-300'
                                            : 'bg-[#ccf32f] text-black hover:scale-105 hover:shadow-md active:scale-95'}
                                    `}
                                >
                                    {isTyping ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={20} />}
                                </button>
                            </div>
                        </div>
                        <div className="absolute -bottom-6 left-0 right-0 text-center">
                            <Typography variant="body" className="text-[10px] text-neutral-400">
                                Aura AI can make mistakes. Verify important financial data.
                            </Typography>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
