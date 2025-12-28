"use client";

import dynamic from "next/dynamic";

// Lazy load ChatAssistant - only loads when user opens chat (~45KB savings)
const ChatAssistant = dynamic(
    () => import("@/components/ChatAssistant"),
    {
        ssr: false,
        loading: () => null
    }
);

export function ChatWrapper() {
    return <ChatAssistant />;
}
