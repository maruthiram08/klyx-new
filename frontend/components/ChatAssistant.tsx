'use client';

import React, { useState } from 'react';
import { MessageSquare, X, Maximize2, Minimize2, Bot } from 'lucide-react';
import { ChatInterface } from './ChatInterface';
import { Typography } from './ui/Typography';
import { usePathname } from 'next/navigation';

export default function ChatAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const pathname = usePathname();

    // Hide floating assistant on the dedicated chat page
    if (pathname === '/ask-klyx') return null;

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
      ${isMaximized ? 'w-[1100px] h-[80vh]' : 'w-[450px] h-[650px]'}
    `}>
            {/* Header with Controls */}
            <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#ccf32f] rounded-xl flex items-center justify-center text-black">
                        <Bot size={20} />
                    </div>
                    <Typography variant="body" className="font-bold">Aura AI</Typography>
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

            {/* Reusable Chat Interface */}
            <ChatInterface initialMaximized={isMaximized} embedded={false} />
        </div>
    );
}
