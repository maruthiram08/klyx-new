import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Typography } from '../ui/Typography';

interface FeatureCardProps {
    title: string;
    description: string;
    icon?: React.ReactNode;
    illustration?: React.ReactNode;
    variant?: 'white' | 'gray';
    className?: string;
    href?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
    title,
    description,
    icon,
    illustration,
    variant = 'gray',
    className = '',
    href = '#',
}) => {
    const bgClass = variant === 'white' ? 'bg-white' : 'bg-neutral-50';

    return (
        <div className={`group relative rounded-[2rem] p-8 md:p-10 overflow-hidden flex flex-col justify-between h-full ${bgClass} ${className}`}>
            {/* Content */}
            <div className="relative z-10 flex flex-col items-start gap-4">
                {icon && (
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm mb-2">
                        {icon}
                    </div>
                )}

                <div>
                    <Typography variant="h3" className="mb-3">{title}</Typography>
                    <Typography variant="body" className="text-neutral-500 max-w-sm">
                        {description}
                    </Typography>
                </div>

                <a href={href} className="inline-flex items-center gap-2 font-medium mt-4 group/link">
                    Read More
                    <div className="bg-black text-white rounded-full p-1 transition-transform group-hover/link:translate-x-1">
                        <ArrowRight size={14} />
                    </div>
                </a>
            </div>

            {/* Illustration Area */}
            {illustration && (
                <div className="mt-8 md:absolute md:bottom-0 md:right-0 md:mt-0 md:w-1/2 md:translate-x-4 md:translate-y-4 transition-transform group-hover:scale-105 duration-500">
                    {illustration}
                </div>
            )}
        </div>
    );
};
