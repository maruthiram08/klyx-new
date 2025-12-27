'use client';

import React from 'react';
import Header from '@/components/Header';
import { ChatInterface } from '@/components/ChatInterface';

export default function AskKlyxPage() {
    return (
        <main className="h-screen flex flex-col bg-white dark:bg-neutral-950 overflow-hidden">
            <Header />
            <div className="flex-1 flex overflow-hidden">
                <ChatInterface initialMaximized={true} embedded={true} />
            </div>
        </main>
    );
}
