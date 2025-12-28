import { useEffect, useState, useRef, useCallback } from 'react';

export interface TaskProgress {
    current: number;
    total: number;
    percent: number;
    message: string;
}

export interface TaskStatus {
    status: 'PENDING' | 'PROGRESS' | 'SUCCESS' | 'FAILURE' | 'UNKNOWN';
    progress?: TaskProgress;
    result?: any;
    error?: string;
    message?: string;
}

interface UseTaskStatusOptions {
    pollInterval?: number;  // ms between polls (default: 2000)
    onSuccess?: (result: any) => void;
    onFailure?: (error: string) => void;
}

/**
 * Hook to poll background task status
 * 
 * Usage:
 *   const { status, progress, isPolling, stopPolling } = useTaskStatus(taskId);
 */
export function useTaskStatus(
    taskId: string | null,
    options: UseTaskStatusOptions = {}
) {
    const { pollInterval = 2000, onSuccess, onFailure } = options;

    const [taskStatus, setTaskStatus] = useState<TaskStatus>({
        status: 'UNKNOWN',
    });
    const [isPolling, setIsPolling] = useState(false);
    const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

    const stopPolling = useCallback(() => {
        if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
        }
        setIsPolling(false);
    }, []);

    const fetchStatus = useCallback(async () => {
        if (!taskId) return;

        try {
            const token = localStorage.getItem('klyx_access_token');
            const headers: HeadersInit = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`/api/process/status/${taskId}`, { headers });
            const data = await response.json();
            setTaskStatus(data);

            // Stop polling if task completed or failed
            if (data.status === 'SUCCESS') {
                stopPolling();
                onSuccess?.(data.result);
            } else if (data.status === 'FAILURE') {
                stopPolling();
                onFailure?.(data.error);
            }
        } catch (error) {
            console.error('Failed to fetch task status:', error);
        }
    }, [taskId, stopPolling, onSuccess, onFailure]);

    // Start polling when taskId is provided
    useEffect(() => {
        if (!taskId) {
            stopPolling();
            return;
        }

        setIsPolling(true);

        // Fetch immediately
        fetchStatus();

        // Then poll at intervals
        pollTimerRef.current = setInterval(fetchStatus, pollInterval);

        return () => {
            stopPolling();
        };
    }, [taskId, pollInterval, fetchStatus, stopPolling]);

    return {
        status: taskStatus.status,
        progress: taskStatus.progress,
        result: taskStatus.result,
        error: taskStatus.error,
        message: taskStatus.message,
        isPolling,
        stopPolling,
    };
}
