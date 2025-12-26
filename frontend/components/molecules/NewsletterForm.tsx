import React from 'react';
import { Button } from '../ui/Button';
import { Typography } from '../ui/Typography';

export const NewsletterForm: React.FC = () => {
    return (
        <div className="w-full max-w-sm">
            <Typography variant="body" className="mb-4 text-neutral-400">
                Subscribe to our newsletter to keep up to date with the latest news.
            </Typography>

            <form className="relative group" onSubmit={(e) => e.preventDefault()}>
                <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full h-14 pl-6 pr-32 rounded-full bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-lime-400 focus:border-lime-400 transition-all"
                />
                <div className="absolute top-1.5 right-1.5">
                    <Button variant="primary" size="sm" className="h-11 px-6">
                        Subscribe
                    </Button>
                </div>
            </form>
        </div>
    );
};
