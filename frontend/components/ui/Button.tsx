import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'white';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    className = '',
    children,
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-full font-medium transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        primary: 'bg-[#ccf32f] text-black hover:scale-105 active:scale-95 border border-transparent', // Lime Green
        secondary: 'bg-black text-white hover:bg-neutral-800 hover:scale-105 active:scale-95 border border-transparent',
        white: 'bg-white text-black hover:bg-neutral-100 hover:scale-105 active:scale-95 border border-transparent shadow-sm',
        outline: 'bg-transparent border border-neutral-300 text-neutral-900 hover:bg-neutral-50',
        ghost: 'bg-transparent text-neutral-600 hover:text-black hover:bg-neutral-50/50',
    };

    const sizes = {
        sm: 'px-4 py-1.5 text-sm',
        md: 'px-6 py-2.5 text-base',
        lg: 'px-8 py-4 text-lg',
    };

    const widthClass = fullWidth ? 'w-full' : '';

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};
