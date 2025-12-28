import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
            <Container>
                <div className="max-w-2xl mx-auto text-center">
                    {/* Error Code */}
                    <div className="mb-8">
                        <Typography
                            variant="display"
                            className="text-[120px] font-bold text-neutral-200 leading-none"
                        >
                            404
                        </Typography>
                    </div>

                    {/* Error Message */}
                    <div className="mb-12">
                        <Typography variant="h1" className="mb-4">
                            Page Not Found
                        </Typography>
                        <Typography variant="body" className="text-neutral-600 text-lg">
                            The page you're looking for doesn't exist or has been moved.
                            <br />
                            Let's get you back on track.
                        </Typography>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 justify-center flex-wrap">
                        <Link href="/dashboard">
                            <Button variant="primary" size="lg">
                                <Home className="w-5 h-5 mr-2" />
                                Go to Dashboard
                            </Button>
                        </Link>
                        <Link href="/">
                            <Button variant="secondary" size="lg">
                                <ArrowLeft className="w-5 h-5 mr-2" />
                                Go Home
                            </Button>
                        </Link>
                    </div>

                    {/* Decorative Element */}
                    <div className="mt-16 opacity-20">
                        <svg
                            className="w-full max-w-md mx-auto"
                            viewBox="0 0 400 300"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <circle cx="200" cy="150" r="100" fill="#E5E7EB" />
                            <path
                                d="M150 130 Q200 100 250 130"
                                stroke="#9CA3AF"
                                strokeWidth="8"
                                strokeLinecap="round"
                                fill="none"
                            />
                            <circle cx="170" cy="140" r="8" fill="#9CA3AF" />
                            <circle cx="230" cy="140" r="8" fill="#9CA3AF" />
                        </svg>
                    </div>
                </div>
            </Container>
        </div>
    );
}
