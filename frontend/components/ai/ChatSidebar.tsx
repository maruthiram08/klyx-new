import React from 'react';
import { MessageSquare, Plus, Trash2, Archive, Settings, Clock, Calendar, Search, MoreHorizontal } from 'lucide-react';
import { Typography } from '../ui/Typography';

interface ChatThread {
    id: string;
    title: string;
    updatedAt: string;
    isArchived: boolean;
}

interface ChatSidebarProps {
    threads: ChatThread[];
    activeThreadId: string | null;
    onSelectThread: (id: string) => void;
    onNewChat: () => void;
    onDeleteThread: (id: string) => void;
    isMaximized: boolean;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
    threads,
    activeThreadId,
    onSelectThread,
    onNewChat,
    onDeleteThread,
    isMaximized
}) => {
    console.log('ChatSidebar threads:', threads);
    if (!isMaximized) return null;

    // Group threads by date (Today, Yesterday, Older)
    const now = new Date();
    const todayStr = now.toDateString();

    // Sort threads by date descending (handle invalid/missing dates safely)
    const sortedThreads = [...threads].sort((a, b) => {
        const getValidTime = (dateStr: string) => {
            if (!dateStr) return 0;
            const d = new Date(dateStr);
            return isNaN(d.getTime()) ? 0 : d.getTime();
        };

        const timeA = getValidTime(a.updatedAt);
        const timeB = getValidTime(b.updatedAt);
        return timeB - timeA;
    });

    const groups = {
        Today: sortedThreads.filter(t => {
            if (!t.updatedAt) return false;
            const d = new Date(t.updatedAt);
            return !isNaN(d.getTime()) && d.toDateString() === todayStr;
        }),
        Recent: sortedThreads.filter(t => {
            // If no date, put in Recent by default so it doesn't disappear
            if (!t.updatedAt) return true;
            const d = new Date(t.updatedAt);
            return isNaN(d.getTime()) || d.toDateString() !== todayStr;
        })
    };

    return (
        <div className="w-80 h-full flex flex-col bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 shrink-0">
            {/* New Chat & Search */}
            <div className="p-4 space-y-4">
                <button
                    onClick={onNewChat}
                    className="w-full py-3 px-4 bg-black dark:bg-white text-white dark:text-black rounded-xl flex items-center justify-center gap-2 font-semibold hover:opacity-90 transition-all shadow-sm active:scale-95 text-sm"
                >
                    <Plus size={18} />
                    <span>New Analysis</span>
                </button>
            </div>

            {/* Thread List */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-6 scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-800">
                {Object.entries(groups).map(([label, items]) => (
                    items.length > 0 && (
                        <div key={label} className="space-y-1">
                            <Typography variant="body" className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest pl-2 mb-2">{label}</Typography>
                            {items.map(thread => (
                                <div
                                    key={thread.id}
                                    className={`
                                        group relative flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200
                                        ${activeThreadId === thread.id
                                            ? 'bg-white dark:bg-neutral-800 shadow-sm border border-neutral-100 dark:border-neutral-700/50'
                                            : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/50 border border-transparent'}
                                    `}
                                    onClick={() => onSelectThread(thread.id)}
                                >
                                    <div className={`p-1.5 rounded-md mr-3 shrink-0 ${activeThreadId === thread.id ? 'bg-[#ccf32f] text-black' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 group-hover:text-black dark:group-hover:text-white transition-colors'}`}>
                                        <MessageSquare size={14} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <Typography variant="body" className={`text-sm font-medium truncate ${activeThreadId === thread.id ? 'text-black dark:text-white' : 'text-neutral-600 dark:text-neutral-400 group-hover:text-black dark:group-hover:text-white'}`}>
                                            {thread.title}
                                        </Typography>
                                    </div>

                                    <div className="absolute right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-neutral-100 dark:from-neutral-800 via-neutral-100 dark:via-neutral-800 to-transparent pl-4">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteThread(thread.id);
                                            }}
                                            className="p-1.5 hover:bg-white dark:hover:bg-neutral-700 rounded-md text-neutral-400 hover:text-red-500 transition-colors shadow-sm"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ))}

                {threads.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center opacity-50 px-4">
                        <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                            <MessageSquare size={20} className="text-neutral-400" />
                        </div>
                        <Typography variant="body" className="text-xs text-neutral-400">No sessions yet</Typography>
                        <p className="text-[10px] text-neutral-300 mt-1">Start a new analysis above</p>
                    </div>
                )}
            </div>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                <div className="flex items-center justify-between text-neutral-500">
                    <button className="flex items-center gap-2 hover:text-black dark:hover:text-white transition-colors text-xs font-medium px-2 py-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800">
                        <Settings size={14} />
                        Settings
                    </button>
                    <div className="text-[10px] text-neutral-300 font-mono">v2.1.0</div>
                </div>
            </div>
        </div>
    );
};
