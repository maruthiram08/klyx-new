import React from 'react';

interface BadgeProps {
    variant?: 'success' | 'danger' | 'warning' | 'neutral' | 'accent';
    children: React.ReactNode;
    className?: string;
    icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
    variant = 'neutral',
    children,
    className = '',
    icon,
}) => {
    const variants = {
        success: 'bg-green-100 text-green-700',
        danger: 'bg-red-100 text-red-700',
        warning: 'bg-yellow-100 text-yellow-700',
        neutral: 'bg-neutral-100 text-neutral-600',
        accent: 'bg-[#ccf32f] text-black',
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
            {icon && <span className="w-3.5 h-3.5 flex items-center justify-center">{icon}</span>}
            {children}
        </span>
    );
};
