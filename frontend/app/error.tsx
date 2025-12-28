'use client';

import { useEffect } from 'react';
import { Container } from '@/components/ui/Container';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log error to error reporting service
        console.error('Application error:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
            <Container>
                <div className="max-w-2xl mx-auto text-center">
                    {/* Error Icon */}
                    <div className="mb-8 flex justify-center">
                        <div className="w-24 h-24 rounded-full bg-rose-100 flex items-center justify-center">
                            <AlertTriangle className="w-12 h-12 text-rose-600" />
                        </div>
                    </div>

                    {/* Error Message */}
                    <div className="mb-12">
                        <Typography variant="h1" className="mb-4">
                            Something Went Wrong
                        </Typography>
                        <Typography variant="body" className="text-neutral-600 text-lg mb-6">
                            We encountered an unexpected error. Don't worry, our team has been notified.
                            <br />
                            Please try refreshing the page or return to the dashboard.
                        </Typography>

                        {/* Error Details (Development Only) */}
                        {process.env.NODE_ENV === 'development' && (
                            <div className="mt-6 p-4 bg-neutral-100 rounded-xl text-left">
                                <Typography variant="caption" className="font-mono text-xs text-neutral-700 break-all">
                                    {error.message}
                                </Typography>
                                {error.digest && (
                                    <Typography variant="caption" className="font-mono text-xs text-neutral-500 mt-2">
                                        Error ID: {error.digest}
                                    </Typography>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 justify-center flex-wrap">
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={reset}
                        >
                            <RefreshCw className="w-5 h-5 mr-2" />
                            Try Again
                        </Button>
                        <Link href="/dashboard">
                            <Button variant="secondary" size="lg">
                                <Home className="w-5 h-5 mr-2" />
                                Go to Dashboard
                            </Button>
                        </Link>
                    </div>

                    {/* Support Link */}
                    <div className="mt-8">
                        <Typography variant="caption" className="text-neutral-500">
                            Need help? Contact{' '}
                            <a
                                href="mailto:support@klyx.app"
                                className="text-neutral-900 hover:underline font-medium"
                            >
                                support@klyx.app
                            </a>
                        </Typography>
                    </div>
                </div>
            </Container>
        </div>
    );
}
